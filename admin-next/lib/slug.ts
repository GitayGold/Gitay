/**
 * Convert any string into a URL-safe lowercase slug.
 *
 * - Strips diacritics (é → e, ñ → n)
 * - Replaces any run of non-[a-z0-9] with a single hyphen
 * - Trims leading/trailing hyphens
 * - Caps the length at 100 chars (DB allows more, but URLs get ugly)
 *
 * Note: Hebrew/Arabic/CJK characters are dropped because there's no clean
 * Latin transliteration here — the caller should manually enter a slug for
 * non-Latin titles (the form supports manual override via the slug input).
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/** Loose validator used by Zod for the slug column. */
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
