'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Drop-in image uploader for the project form.
 *
 * Behavior:
 * 1. User drops or picks an image (jpg / png / webp / avif, ≤ 5 MB).
 * 2. We make an object URL for **instant preview** (so the user sees the
 *    image before the upload finishes — feels snappy, no spinner waiting).
 * 3. We **compress on the client** with browser-image-compression. Why
 *    client-side?
 *      - Faster perceived upload (smaller payload over the wire).
 *      - Cheaper Storage usage (the bucket is the user's S3 bill).
 *      - No server-side image pipeline to maintain.
 * 4. We upload the compressed file to Supabase Storage at
 *    `{user_id}/{timestamp}_{filename}.{ext}`.
 *      - The user_id prefix is required by Storage RLS for per-user isolation
 *        (admins are the only writers, but the prefix also lets us audit
 *         which admin uploaded what without joining tables).
 * 5. We get the public URL and call `onChange(url)`.
 * 6. The X button just clears the form value. The file in Storage stays
 *    until the (Phase 3) cleanup utility runs — see "Storage cleanup" note
 *    below. This is the standard pattern; deleting orphans synchronously
 *    on every replace is risky (race conditions with concurrent renders).
 *
 * Storage cleanup (Phase 3): a scheduled function will reconcile Storage
 * paths against `projects.{hero_image_url, thumbnail_url, gallery, blocks}`
 * and remove paths that no row references. For Phase 2 we accept the
 * orphans — disk is cheap, code complexity is not.
 */

type Preset = 'hero' | 'thumbnail';

interface PresetSpec {
  /** Compression cap. Slightly larger than the recommended dims so that
   *  retina renders stay crisp. */
  maxWidthOrHeight: number;
  /** Aspect-ratio of the preview frame. Just for layout. */
  aspect: string;
  /** Hint shown next to the dropzone. */
  recommendedHint: string;
}

const PRESETS: Record<Preset, PresetSpec> = {
  hero: {
    maxWidthOrHeight: 2000,
    aspect: 'aspect-[16/9]',
    recommendedHint: '1600 × 900 (16:9) recommended',
  },
  thumbnail: {
    maxWidthOrHeight: 1600,
    aspect: 'aspect-[3/4]',
    recommendedHint: '900 × 1200 (3:4) recommended',
  },
};

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/avif': ['.avif'],
} as const;

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = 'project-images';
const QUALITY = 0.85;

interface Props {
  /** Current public URL or empty string. Driven by RHF Controller. */
  value: string;
  /** Setter — called with the public URL after upload, or '' on clear. */
  onChange: (next: string) => void;
  /** Used by RHF for blur tracking. */
  onBlur?: () => void;
  /** Drives compression dimensions and preview aspect ratio. */
  preset: Preset;
  /** Aria-label fragment, e.g., "hero image" or "thumbnail". */
  fieldName?: string;
  /** Disabled state (e.g., while parent form is submitting). */
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onBlur,
  preset,
  fieldName = 'image',
  disabled,
}: Props) {
  const spec = PRESETS[preset];

  /* ── Local state ─────────────────────────────────────────────────── */
  // Object URL for instant preview while uploading. Gets revoked on
  // unmount / when replaced — otherwise it leaks the underlying blob.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'compressing' | 'uploading'>(
    'idle',
  );
  const [progress, setProgress] = useState(0);
  // Before/after byte sizes — shown after compression so the user gets
  // satisfying feedback that we're doing something useful.
  const [sizes, setSizes] = useState<{ original: number; compressed: number } | null>(
    null,
  );

  // The supabase client is recreated per request in the auth flow, but
  // here it can be a module-level singleton's worth of "browser client".
  // Keeping it in a ref avoids re-binding on every render.
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();

  /* ── Cleanup the object URL on unmount or when it changes ────────── */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* ── Drop / pick handler ─────────────────────────────────────────── */
  const handleAccepted = useCallback(
    async (file: File) => {
      const supabase = supabaseRef.current!;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to upload images');
        return;
      }

      // Free any prior preview before we make a new one.
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      try {
        /* 1) Compress on the client. */
        setPhase('compressing');
        setProgress(0);

        const compressed = await imageCompression(file, {
          maxWidthOrHeight: spec.maxWidthOrHeight,
          initialQuality: QUALITY,
          // Modern browsers all support WebP encode; if the source is
          // already smaller than the target, the lib will return as-is.
          fileType: 'image/webp',
          useWebWorker: true,
          onProgress: (p) => setProgress(p),
        });

        setSizes({ original: file.size, compressed: compressed.size });

        /* 2) Upload to Storage. The path is namespaced by user_id so the
              RLS policy (auth.uid() in admins) and our own audits both
              line up. The leading `${ts}_` makes the filename unique in
              the rare case a user uploads two files with the same name. */
        setPhase('uploading');
        setProgress(0); // upload progress isn't exposed by storage-js v2;
                        // we leave the bar indeterminate and just animate.

        const ext = compressed.type.split('/')[1] ?? 'webp';
        const safeBase = sanitizeName(file.name).replace(/\.[^.]*$/, '');
        const path = `${user.id}/${Date.now()}_${safeBase}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, compressed, {
            contentType: compressed.type,
            cacheControl: '31536000', // 1 year — public images are immutable
            upsert: false,
          });

        if (uploadError) throw uploadError;

        /* 3) Get the public URL and report it back to RHF. */
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);

        onChange(publicUrl);
        toast.success('Image uploaded');
      } catch (err) {
        // Roll back: clear preview + form value so we don't leave a
        // half-broken state.
        const message =
          err instanceof Error ? err.message : 'Upload failed — please try again';
        toast.error(message);
        setSizes(null);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setPreviewUrl(null);
      } finally {
        setPhase('idle');
        setProgress(0);
      }
    },
    [onChange, previewUrl, spec.maxWidthOrHeight],
  );

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length) {
        const r = rejections[0];
        const code = r.errors[0]?.code;
        if (code === 'file-too-large') {
          toast.error(`Image is over 5 MB — please pick a smaller one`);
        } else if (code === 'file-invalid-type') {
          toast.error('Use a JPG, PNG, WEBP, or AVIF image');
        } else {
          toast.error(r.errors[0]?.message ?? 'Upload rejected');
        }
        return;
      }
      const file = accepted[0];
      if (!file) return;
      void handleAccepted(file);
    },
    [handleAccepted],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_BYTES,
    disabled: disabled || phase !== 'idle',
    // We render our own UI, so no implicit click handler from <input>.
    noClick: true,
    noKeyboard: true,
  });

  const isWorking = phase !== 'idle';
  const displayUrl = previewUrl ?? value ?? '';
  const hasImage = Boolean(displayUrl);

  /* ── Clear (orphans the Storage object — see file-level note) ────── */
  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSizes(null);
    onChange('');
  };

  return (
    <div className="space-y-2" onBlur={onBlur}>
      <div
        {...getRootProps()}
        className={cn(
          'group relative overflow-hidden rounded-lg border border-dashed border-border bg-muted/20 transition-colors',
          spec.aspect,
          isDragActive &&
            'border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/30',
          !hasImage && !isWorking && 'cursor-pointer hover:bg-muted/30',
          (disabled || isWorking) && 'cursor-default',
        )}
      >
        <input {...getInputProps()} aria-label={`Upload ${fieldName}`} />

        {/* ─── 1) Existing image / preview ─────────────────────────── */}
        {hasImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={`${fieldName} preview`}
              className="absolute inset-0 size-full object-cover"
            />
            {/* Hover overlay with replace + remove buttons */}
            {!isWorking ? (
              <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/50 via-black/0 to-black/0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                  disabled={disabled}
                >
                  <UploadCloud className="size-4" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  disabled={disabled}
                  aria-label={`Remove ${fieldName}`}
                >
                  <X className="size-4" />
                  Remove
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          /* ─── 2) Empty dropzone ─────────────────────────────────── */
          <button
            type="button"
            onClick={open}
            disabled={disabled || isWorking}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ImagePlus className="size-8" aria-hidden />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? 'Drop to upload' : 'Drop image or click to browse'}
              </p>
              <p className="mt-0.5 text-xs">{spec.recommendedHint}</p>
              <p className="text-[11px] text-muted-foreground/80">
                JPG · PNG · WEBP · AVIF · ≤ 5&nbsp;MB
              </p>
            </div>
          </button>
        )}

        {/* ─── 3) Working overlay (compressing or uploading) ───────── */}
        {isWorking ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-orange-500" />
            <div className="w-2/3 max-w-[260px] space-y-1.5">
              <div className="text-center text-xs font-medium">
                {phase === 'compressing'
                  ? `Compressing… ${Math.round(progress)}%`
                  : 'Uploading…'}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full bg-orange-500 transition-[width] duration-200',
                    phase === 'uploading' && 'animate-pulse w-1/3',
                  )}
                  style={
                    phase === 'compressing'
                      ? { width: `${Math.max(4, progress)}%` }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── 4) Footer — size delta + helper text ───────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {sizes ? (
          <span>
            Compressed from{' '}
            <span className="font-mono text-foreground">
              {formatBytes(sizes.original)}
            </span>{' '}
            to{' '}
            <span className="font-mono text-emerald-600 dark:text-emerald-500">
              {formatBytes(sizes.compressed)}
            </span>{' '}
            ({Math.round((1 - sizes.compressed / sizes.original) * 100)}%
            smaller)
          </span>
        ) : (
          <span className="opacity-70">{spec.recommendedHint}</span>
        )}
        {hasImage && !isWorking ? (
          <span className="opacity-60">Hover image to replace</span>
        ) : null}
      </div>
    </div>
  );
}

/* ──────────────────────────── helpers ──────────────────────────── */

/** Strip everything that's not safe in a URL path segment. Keep the
 *  base recognizable so the Storage console stays browseable. */
function sanitizeName(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 80) || 'image'
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
