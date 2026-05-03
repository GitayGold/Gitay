'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** Used by RHF to surface errors / focus tracking. */
  onBlur?: () => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  id?: string;
}

/**
 * Chip-style tag input.
 *
 * Behaviors:
 * - Type and press <Enter> or <,> to commit a tag.
 * - <Backspace> with empty input removes the last chip.
 * - Pasting a comma-separated string commits all chunks at once.
 * - De-duplicates (case-insensitive) and trims whitespace.
 *
 * Why custom (vs a library): keeping the dependency surface narrow.
 * The whole interaction is ~70 lines and matches our shadcn input look
 * by reusing its border/focus tokens.
 */
export function TagsInput({
  value,
  onChange,
  onBlur,
  placeholder = 'Type and press Enter…',
  maxTags = 20,
  disabled,
  id,
}: Props) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const incoming = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!incoming.length) return;

    const seen = new Set(value.map((t) => t.toLowerCase()));
    const next = [...value];
    for (const t of incoming) {
      if (next.length >= maxTags) break;
      if (seen.has(t.toLowerCase())) continue;
      seen.add(t.toLowerCase());
      next.push(t);
    }
    onChange(next);
    setDraft('');
  };

  const removeAt = (idx: number) => {
    const next = value.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter would otherwise submit the surrounding form.
      e.preventDefault();
      if (draft.trim()) commit(draft);
      return;
    }
    if (e.key === 'Backspace' && !draft && value.length) {
      e.preventDefault();
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-colors',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        disabled && 'pointer-events-none opacity-50',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label={`Remove ${tag}`}
            tabIndex={-1}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={draft}
        disabled={disabled || value.length >= maxTags}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Commit a half-typed chip on blur so the user doesn't lose it.
          if (draft.trim()) commit(draft);
          onBlur?.();
        }}
        onPaste={(e) => {
          // Comma-separated paste short-circuit (avoids re-render thrash).
          const text = e.clipboardData.getData('text');
          if (text.includes(',')) {
            e.preventDefault();
            commit(text);
          }
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[8ch] bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
