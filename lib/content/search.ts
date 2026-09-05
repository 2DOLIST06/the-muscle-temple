import { extractHeadingsFromHtml } from '@/lib/content/headings';
import type { Locale } from '@/lib/i18n/routing';
import type { Post } from '@/types/content';

const STOP_WORDS: Record<Locale, ReadonlySet<string>> = {
  en: new Set(['a', 'an', 'the']),
  fr: new Set(['au', 'aux', 'd', 'de', 'des', 'du', 'l', 'la', 'le', 'les', 'un', 'une'])
};

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Turns a search query into meaningful, accent-insensitive terms. */
export function getSearchKeywords(query: string, locale: Locale) {
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter((keyword) => keyword && !STOP_WORDS[locale].has(keyword));
}

/**
 * Header search intentionally targets article titles and H1-H6 headings only.
 * Every meaningful query term must occur in at least one of those headings.
 */
export function postMatchesHeadingSearch(post: Post, query: string, locale: Locale) {
  const keywords = getSearchKeywords(query, locale);
  if (keywords.length === 0) return true;

  const headings = [
    post.title,
    ...post.sections.map((section) => section.heading),
    ...extractHeadingsFromHtml(post.contentHtml).map((heading) => heading.text)
  ];
  const searchableHeadings = normalizeSearchText(headings.join(' '));

  return keywords.every((keyword) => searchableHeadings.includes(keyword));
}
