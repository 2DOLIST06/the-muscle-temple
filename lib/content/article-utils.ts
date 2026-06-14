import { getCategoryPath, type Locale } from '@/lib/i18n/routing';
import type { PostSection } from '@/types/content';

export const ARTICLE_FALLBACK_DESCRIPTIONS: Record<Locale, string> = {
  en: 'A simple guide to understand the main muscle groups, their role in strength training and how they fit into a balanced workout plan.',
  fr: 'Guide simple pour comprendre les principaux groupes musculaires, leur rôle en musculation et leur place dans un entraînement équilibré.'
};

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export const getArticleDescription = (description: string | null | undefined, locale: Locale) =>
  description?.trim() || ARTICLE_FALLBACK_DESCRIPTIONS[locale];

export const getPublicAuthorName = (name?: string | null) => {
  const normalized = name?.trim();
  return !normalized || normalized.toLowerCase() === 'admin' ? 'Body Training Guide' : normalized;
};

export const getArticleCategoryLabel = (locale: Locale) => (locale === 'fr' ? 'Musculation' : 'Strength training');
export const getArticleCategoryPath = (locale: Locale) => getCategoryPath(locale, 'musculation');

export const slugifyHeading = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stripTags = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const uniqueId = (base: string, counts: Map<string, number>) => {
  const fallback = base || 'section';
  const current = counts.get(fallback) ?? 0;
  counts.set(fallback, current + 1);
  return current === 0 ? fallback : `${fallback}-${current + 1}`;
};

export const buildTocFromHtml = (html?: string | null): TocItem[] => {
  if (!html?.trim()) return [];

  const counts = new Map<string, number>();
  const items: TocItem[] = [];
  const headingPattern = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(html))) {
    const beforeHeading = html.slice(0, match.index);
    const lastFigureOpen = beforeHeading.lastIndexOf('<figure');
    const lastFigureClose = beforeHeading.lastIndexOf('</figure>');
    if (lastFigureOpen > lastFigureClose) continue;

    const text = stripTags(match[3]);
    if (!text) continue;

    const idMatch = match[2].match(/\sid=["']([^"']+)["']/i);
    const id = idMatch?.[1]?.trim() || uniqueId(slugifyHeading(text), counts);
    items.push({ id, text, level: match[1] === '3' ? 3 : 2 });
  }

  return items;
};

export const buildTocFromSections = (slug: string, sections: PostSection[]): TocItem[] => {
  const counts = new Map<string, number>();
  return sections.flatMap((section) => {
    const text = section.heading?.trim();
    if (!text || text.toLowerCase() === 'contenu') return [];
    return [{ id: uniqueId(`${slug}-${slugifyHeading(text)}`, counts), text, level: 2 as const }];
  });
};

export const addHeadingIds = (html: string) => {
  const counts = new Map<string, number>();
  return html.replace(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs: string, inner: string) => {
    const text = stripTags(inner);
    if (!text || /\sid=["'][^"']+["']/i.test(attrs)) return match;
    return `<h${level}${attrs} id="${uniqueId(slugifyHeading(text), counts)}">${inner}</h${level}>`;
  });
};
