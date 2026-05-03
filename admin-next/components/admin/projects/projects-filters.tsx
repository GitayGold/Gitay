'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CATEGORY_OPTIONS } from '@/lib/constants/categories';

/** Sentinel value used by `<Select/>` for the "All" option. */
const ALL = '__all__';

interface Props {
  /** Distinct years that exist in the data, descending. */
  years: number[];
  /** Initial values from the URL — keeps the form in sync on hard reload. */
  defaultValues: {
    q: string;
    category: string;
    status: string;
    year: string;
  };
}

/**
 * URL-synced filter bar for /admin/projects.
 *
 * Why URL-synced state (vs React state):
 * - The page is a Server Component that reads searchParams server-side and
 *   re-fetches with new filters. Sharing/bookmarking a filtered view "just
 *   works" — the URL is the source of truth.
 *
 * Why useTransition:
 * - The router push triggers a Server Component refetch. Wrapping it in
 *   `startTransition` keeps the *previous* result rendered while the new
 *   one streams in, instead of blanking the grid. We expose the pending
 *   state as a tiny spinner next to the search box.
 *
 * Why a 300ms search debounce:
 * - Typing one character per ~50ms otherwise issues a query per keystroke.
 *   Debouncing waits for the user to pause before navigating.
 */
export function ProjectsFilters({ years, defaultValues }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(defaultValues.q);
  const [isPending, startTransition] = useTransition();

  // Reset local search when the URL is cleared externally (e.g. "Clear all").
  useEffect(() => {
    setQ(defaultValues.q);
  }, [defaultValues.q]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // page is no longer relevant when filters change
    next.delete('page');
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  // Debounce the search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam('q', value.trim());
    }, 300);
  };

  const clearAll = () => {
    setQ('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  const hasFilters =
    !!q ||
    !!defaultValues.category ||
    !!defaultValues.status ||
    !!defaultValues.year;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      {/* Search */}
      <div className="relative flex-1 lg:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search title, client, tags..."
          className="h-9 pl-9 pr-9"
          aria-label="Search projects"
        />
        {isPending ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : q ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Category */}
      <Select
        value={defaultValues.category || ALL}
        onValueChange={(v) => updateParam('category', String(v))}
      >
        <SelectTrigger className="h-9 lg:w-[180px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {CATEGORY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={defaultValues.status || ALL}
        onValueChange={(v) => updateParam('status', String(v))}
      >
        <SelectTrigger className="h-9 lg:w-[140px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="published">Published</SelectItem>
        </SelectContent>
      </Select>

      {/* Year */}
      <Select
        value={defaultValues.year || ALL}
        onValueChange={(v) => updateParam('year', String(v))}
      >
        <SelectTrigger className="h-9 lg:w-[120px]">
          <SelectValue placeholder="All years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 text-muted-foreground"
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
