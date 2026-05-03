'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Info, Loader2, Save, Send, X } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TagsInput } from './tags-input';
import { KpisEditor } from './kpis-editor';
import { ImageUpload } from './image-upload';
import { CATEGORY_OPTIONS } from '@/lib/constants/categories';
import { slugify } from '@/lib/slug';
import {
  PROJECT_FORM_DEFAULTS,
  projectFormSchema,
  type ProjectFormValues,
} from '@/lib/validation/project';
import type { ActionResult } from '@/app/admin/projects/actions';

type TabKey = 'basic' | 'media' | 'story' | 'publishing';

/** Map each tab to the form fields it owns — used to auto-jump to the
 *  first tab containing a validation error after submit. */
const TAB_FIELDS: Record<TabKey, (keyof ProjectFormValues)[]> = {
  basic: [
    'title',
    'slug',
    'client',
    'year',
    'category',
    'live_url',
    'tags',
    'short_description',
  ],
  media: ['hero_image_url', 'thumbnail_url'],
  story: ['the_challenge', 'the_solution', 'results', 'kpis'],
  publishing: [
    'status',
    'featured',
    'display_order',
    'seo_title',
    'seo_description',
  ],
};

type SubmitFn = (values: ProjectFormValues) => Promise<ActionResult>;

interface Props {
  /** Server Action that performs the actual write (create or update). */
  submitAction: SubmitFn;
  /** Pre-fill values for the edit page (Batch E). Defaults to a blank create. */
  defaultValues?: Partial<ProjectFormValues>;
  /** Friendly button labels — different copy on create vs. edit. */
  submitLabels?: {
    saveDraft: string;
    publish: string;
  };
  /** Where to send the user after a successful save.
   *  - Return a string → router.push(string) + refresh.
   *  - Return null → stay on the current page, just refresh server data.
   *  - Omit the prop → default redirect to /admin/projects (create flow). */
  onSaved?: (result: Extract<ActionResult, { ok: true }>) => string | null;
  /** Shown next to the title — "New project" on create, project name on edit. */
  pageTitle: string;
  /** Optional sub-title under the page title. */
  pageEyebrow?: string;
}

/**
 * Reusable project form. The same component powers /admin/projects/new
 * (Batch C) and /admin/projects/[id]/edit (Batch E).
 *
 * Key UX patterns:
 * - Slug auto-generates from title until the user manually edits it
 *   ("dirty bit"). Hands-off behavior afterward.
 * - Validation errors auto-jump the active tab to the first tab with errors.
 * - Sticky bottom save bar with two intent buttons: Save Draft / Publish.
 * - beforeunload warns on unsaved changes.
 */
export function ProjectForm({
  submitAction,
  defaultValues,
  submitLabels = { saveDraft: 'Save as draft', publish: 'Publish' },
  onSaved,
  pageTitle,
  pageEyebrow = 'New project',
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [isPending, startTransition] = useTransition();
  // Tracks whether the user typed in the slug field manually. Once true,
  // we stop overwriting the slug from the title.
  const [slugDirty, setSlugDirty] = useState(
    Boolean(defaultValues?.slug && defaultValues.slug.length > 0),
  );
  // Set immediately before navigating away on a successful save so the
  // beforeunload guard doesn't block the redirect.
  const skipUnloadGuard = useRef(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { ...PROJECT_FORM_DEFAULTS, ...defaultValues },
    mode: 'onBlur',
  });

  /* ── Slug auto-gen (debounced) ───────────────────────────────────── */
  const titleValue = form.watch('title');
  useEffect(() => {
    if (slugDirty || !titleValue) return;
    const handle = setTimeout(() => {
      form.setValue('slug', slugify(titleValue), {
        shouldDirty: true,
        shouldValidate: false,
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [titleValue, slugDirty, form]);

  /* ── Unsaved-changes guard (refresh / tab-close) ─────────────────── */
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (skipUnloadGuard.current) return;
      if (!isDirty) return;
      // Modern browsers ignore the message text but require returnValue
      // to be set (any non-empty string) to show the native prompt.
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ── Submission helpers ──────────────────────────────────────────── */
  const submitWithStatus = (intent: 'draft' | 'published') =>
    form.handleSubmit(
      (values) => {
        const payload: ProjectFormValues = { ...values, status: intent };
        startTransition(async () => {
          const result = await submitAction(payload);
          if (!result.ok) {
            toast.error(result.error);
            // If the server reported a field-specific error, surface it on
            // the matching field and switch to its tab.
            if (result.field) {
              form.setError(result.field as keyof ProjectFormValues, {
                type: 'server',
                message: result.error,
              });
              const tab = (Object.entries(TAB_FIELDS) as [
                TabKey,
                (keyof ProjectFormValues)[],
              ][]).find(([, fields]) =>
                fields.includes(result.field as keyof ProjectFormValues),
              )?.[0];
              if (tab) setActiveTab(tab);
            }
            return;
          }
          // Success — disarm the unload guard, toast, and navigate / refresh.
          skipUnloadGuard.current = true;
          toast.success(
            intent === 'published' ? 'Published 🚀' : 'Draft saved',
          );
          // onSaved contract:
          //   - omitted → default redirect to /admin/projects (create flow)
          //   - returns string → push to that URL
          //   - returns null → stay on this page (edit flow)
          const target =
            onSaved !== undefined ? onSaved(result) : '/admin/projects';
          if (target) {
            router.push(target);
          }
          router.refresh();
          // RHF still thinks the form is dirty (the user just typed). Reset
          // it to the saved values so the unsaved-changes badge clears and
          // navigation away no longer prompts.
          form.reset({ ...form.getValues() });
        });
      },
      (errors) => {
        // Validation failed: jump to the first tab with errors.
        const tab = (Object.keys(TAB_FIELDS) as TabKey[]).find((t) =>
          TAB_FIELDS[t].some((f) => errors[f]),
        );
        if (tab) setActiveTab(tab);
        toast.error('Please fix the highlighted fields');
      },
    );

  /* ── Cancel / discard ────────────────────────────────────────────── */
  const handleCancel = () => {
    if (!isDirty) {
      router.push('/admin/projects');
      return;
    }
    if (window.confirm('Discard unsaved changes?')) {
      skipUnloadGuard.current = true;
      router.push('/admin/projects');
    }
  };

  /* ── Tab badge helper: shows a red dot if a tab has errors ───────── */
  const tabHasError = (key: TabKey) =>
    TAB_FIELDS[key].some((field) => form.formState.errors[field]);

  return (
    <div className="mx-auto w-full max-w-4xl p-4 pb-32 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {pageEyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {pageTitle}
        </h1>
      </div>

      <Form {...form}>
        {/* The <form> is mainly here so that <Enter> in a text input doesn't
            accidentally submit. We trigger submission only via the buttons
            in the sticky bar below. */}
        <form onSubmit={(e) => e.preventDefault()}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabKey)}
          >
            <TabsList>
              <TabsTrigger value="basic">
                <span className="flex items-center gap-2">
                  Basic info
                  {tabHasError('basic') ? <ErrorDot /> : null}
                </span>
              </TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="story">
                <span className="flex items-center gap-2">
                  The Story
                  {tabHasError('story') ? <ErrorDot /> : null}
                </span>
              </TabsTrigger>
              <TabsTrigger value="publishing">
                <span className="flex items-center gap-2">
                  Publishing &amp; SEO
                  {tabHasError('publishing') ? <ErrorDot /> : null}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* ───────────────────────── BASIC INFO ───────────────────────── */}
            <TabsContent value="basic" className="space-y-5 pt-4">
              <Section title="Identity">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Project title <Required />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Luminary — Brand & Web Platform"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Slug <Required />
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="luminary-brand-web"
                          onChange={(e) => {
                            setSlugDirty(true);
                            // Live-normalize what the user types so they
                            // can never enter an invalid slug.
                            field.onChange(slugify(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-muted-foreground/80">URL preview:</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                          /case-study.html#{field.value || 'your-slug'}
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Client <Required />
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Luminary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormLabel>
                          Year <Required />
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1990}
                            max={2100}
                            value={Number.isFinite(value) ? value : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              onChange(v === '' ? '' : Number(v));
                            }}
                            {...rest}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <Required />
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="Discoverability">
                <FormField
                  control={form.control}
                  name="live_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Live URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Public link the case-study page links to. Optional.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagsInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="React, Shopify, Motion…"
                        />
                      </FormControl>
                      <FormDescription>
                        Press Enter or comma to add. Used by the homepage filter
                        and case-study meta.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="short_description"
                  render={({ field }) => {
                    const len = field.value?.length ?? 0;
                    return (
                      <FormItem>
                        <FormLabel>Short description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="One sentence shown on cards and the project's hero meta."
                            rows={3}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription className="flex items-center justify-between">
                          <span>Appears on portfolio cards and case-study hero.</span>
                          <span
                            className={
                              len > 200
                                ? 'text-destructive'
                                : len > 180
                                  ? 'text-amber-500'
                                  : 'text-muted-foreground tabular-nums'
                            }
                          >
                            {len} / 200
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </Section>
            </TabsContent>

            {/* ───────────────────────── MEDIA ───────────────────────── */}
            <TabsContent value="media" className="space-y-5 pt-4">
              <Section title="Hero image">
                <FormField
                  control={form.control}
                  name="hero_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero image</FormLabel>
                      <FormDescription>
                        Full-bleed image at the top of the case-study page.
                      </FormDescription>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          preset="hero"
                          fieldName="hero image"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="Thumbnail">
                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail</FormLabel>
                      <FormDescription>
                        Tall card image used in the homepage / archive grid.
                      </FormDescription>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          preset="thumbnail"
                          fieldName="thumbnail"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                <Info className="mb-1 inline-block size-3.5 align-text-bottom text-orange-500" />{' '}
                Images are compressed to <b>WebP</b> at up to 85% quality,
                client-side, before upload. Replacing an image leaves the
                previous file in Storage as an orphan — a Phase 3 cleanup
                utility will reconcile and remove unreferenced files.
              </p>
            </TabsContent>

            {/* ───────────────────────── STORY ───────────────────────── */}
            <TabsContent value="story" className="space-y-5 pt-4">
              <Section title="Narrative">
                <FormField
                  control={form.control}
                  name="the_challenge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>The Challenge</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          placeholder="What did the client come to us with? What were the constraints, the friction, the opportunity?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="the_solution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>The Solution</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          placeholder="Our response. The strategy, the system, the build."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="results"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Results &amp; outcomes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          placeholder="What changed for the client after launch?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="Numbers">
                <KpisEditor control={form.control} />
              </Section>

              <p className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                <Info className="mb-1 inline-block size-3.5 align-text-bottom text-orange-500" />{' '}
                Rich content blocks (text · image · quote · list) get a
                drag-to-reorder editor in <b>Phase&nbsp;3</b>. Until then the
                static-site cms.js blocks remain in place.
              </p>
            </TabsContent>

            {/* ───────────────────────── PUBLISHING ───────────────────────── */}
            <TabsContent value="publishing" className="space-y-5 pt-4">
              <Section title="Visibility">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                        >
                          <StatusCard
                            value="draft"
                            current={field.value}
                            title="Draft"
                            description="Hidden from the public site. Visible to admins only."
                          />
                          <StatusCard
                            value="published"
                            current={field.value}
                            title="Published"
                            description="Visible on the homepage and case-study pages."
                          />
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>
                        Tip: the <b>Save as draft</b> / <b>Publish</b> buttons at
                        the bottom override this radio on submit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription>
                          Pin to the top of the public Recent Wins grid.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                      <FormLabel>Display order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step={1}
                          value={Number.isFinite(value) ? value : ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            onChange(v === '' ? 0 : Number(v));
                          }}
                          {...rest}
                          className="max-w-[160px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Lower numbers appear first in the public list. Tied
                        values fall back to most-recent-update order.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="Search engine">
                <FormField
                  control={form.control}
                  name="seo_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            form.watch('title') ||
                            'Defaults to the project title'
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank to use the project title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="seo_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="resize-none"
                          placeholder={
                            form.watch('short_description') ||
                            'Defaults to the short description'
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank to use the short description.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      {/* ──────────────────────── Sticky save bar ──────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-amber-500"
                />
                Unsaved changes
              </span>
            ) : (
              <span className="opacity-60">No changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={submitWithStatus('draft')}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {submitLabels.saveDraft}
            </Button>
            <Button
              type="button"
              onClick={submitWithStatus('published')}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {submitLabels.publish}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Small helpers ─────────────────────────── */

function Required() {
  return (
    <span className="text-orange-500" aria-label="required">
      *
    </span>
  );
}

function ErrorDot() {
  return (
    <span
      aria-hidden
      className="size-1.5 rounded-full bg-destructive"
      title="This tab has errors"
    />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-4 sm:p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* Visual radio card used inside the Status RadioGroup. */
function StatusCard({
  value,
  current,
  title,
  description,
}: {
  value: 'draft' | 'published';
  current: string;
  title: string;
  description: string;
}) {
  const selected = current === value;
  return (
    <Label
      htmlFor={`status-${value}`}
      className={
        'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ' +
        (selected
          ? 'border-foreground bg-foreground/5'
          : 'border-border hover:bg-muted/40')
      }
    >
      <RadioGroupItem id={`status-${value}`} value={value} className="mt-0.5" />
      <div className="space-y-0.5">
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Label>
  );
}

