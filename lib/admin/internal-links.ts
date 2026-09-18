import {
  getArticlePath,
  getArticlesPath,
  getAuthorPath,
  getAuthorsPath,
  getCategoryPath,
  getHomePath,
  getMacroCalculatorPath,
  localizePath,
  type Locale
} from '@/lib/i18n/routing';

export type InternalLinkTargetType = 'post' | 'category' | 'static' | 'author';

export interface InternalLinkTarget {
  id: string;
  title: string;
  type: InternalLinkTargetType;
  locale: Locale;
  url: string;
  slug?: string;
}

export type InternalLinkType = 'internal' | 'external' | 'anchor' | 'mailto' | 'other';

export interface LinkOccurrence {
  anchor: string;
  href: string;
  order: number;
  type: InternalLinkType;
}

export interface LinkGroup {
  key: string;
  anchor: string;
  href: string;
  type: InternalLinkType;
  occurrences: LinkOccurrence[];
}

export const internalLinkTypeOrder: InternalLinkTargetType[] = ['post', 'category', 'static', 'author'];

export const normalizeAnchor = (anchor: string) => anchor.replace(/\s+/g, ' ').trim();

export const classifyHref = (href: string): InternalLinkType => {
  const value = href.trim();
  if (value.startsWith('#')) return 'anchor';
  if (/^mailto:/i.test(value)) return 'mailto';
  if (value.startsWith('/')) return 'internal';
  if (/^https?:\/\//i.test(value)) {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname === 'bodytrainingguide.com' || hostname === 'www.bodytrainingguide.com' ? 'internal' : 'external';
    } catch {
      return 'other';
    }
  }
  return 'other';
};

export const extractLinkOccurrences = (root: ParentNode): LinkOccurrence[] =>
  Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]')).flatMap((link, order) => {
    const href = link.getAttribute('href');
    if (href === null || !href.trim()) return [];
    return [{ anchor: link.textContent ?? '', href, order, type: classifyHref(href) }];
  });

export const getLinkGroupKey = (anchor: string, href: string) => JSON.stringify([normalizeAnchor(anchor), href]);

export const groupLinkOccurrences = (occurrences: LinkOccurrence[]): LinkGroup[] => {
  const groups = new Map<string, LinkGroup>();
  for (const occurrence of occurrences) {
    const anchor = normalizeAnchor(occurrence.anchor);
    const key = getLinkGroupKey(anchor, occurrence.href);
    const group = groups.get(key);
    if (group) group.occurrences.push(occurrence);
    else groups.set(key, { key, anchor, href: occurrence.href, type: occurrence.type, occurrences: [occurrence] });
  }
  return Array.from(groups.values());
};

export const getStaticInternalLinkTargets = (locale: Locale): InternalLinkTarget[] => {
  const french = locale === 'fr';
  return [
    { id: `${locale}-home`, title: french ? 'Accueil' : 'Home', type: 'static', locale, url: getHomePath(locale), slug: '' },
    { id: `${locale}-articles`, title: french ? 'Articles' : 'Articles', type: 'static', locale, url: getArticlesPath(locale), slug: 'articles' },
    { id: `${locale}-authors`, title: french ? 'Auteurs' : 'Authors', type: 'static', locale, url: getAuthorsPath(locale), slug: 'authors' },
    { id: `${locale}-about`, title: french ? 'À propos' : 'About', type: 'static', locale, url: localizePath('/about', locale), slug: 'about' },
    { id: `${locale}-contact`, title: 'Contact', type: 'static', locale, url: localizePath('/contact', locale), slug: 'contact' },
    { id: `${locale}-macro-calculator`, title: french ? 'Calculateur de macros' : 'Macro calculator', type: 'static', locale, url: getMacroCalculatorPath(locale), slug: french ? 'calculateur-macros' : 'macro-calculator' }
  ];
};

export const buildDynamicInternalLinkUrl = (type: Exclude<InternalLinkTargetType, 'static'>, locale: Locale, slug: string) => {
  if (type === 'post') return getArticlePath(locale, slug);
  if (type === 'category') return getCategoryPath(locale, slug);
  return getAuthorPath(locale, slug);
};
