import { getArticlePath, type Locale } from '@/lib/i18n/routing';

export interface InternalLinkReportPost {
  id: string;
  title: string;
  slug: string;
  locale: Locale;
  status: string;
  contentHtml: string;
  chapoHtml: string;
}

export interface InternalLinkEdge {
  sourceId: string;
  sourceTitle: string;
  sourcePath: string;
  targetPath: string;
  targetId?: string;
  targetTitle?: string;
  anchor: string;
  broken: boolean;
}

export interface InternalLinkPageReport {
  id: string;
  title: string;
  slug: string;
  locale: Locale;
  status: string;
  path: string;
  contentText: string;
  incoming: InternalLinkEdge[];
  outgoing: InternalLinkEdge[];
}

const SITE_HOSTS = new Set(['bodytrainingguide.com', 'www.bodytrainingguide.com']);

const decodeHtml = (value: string) => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));

const cleanText = (html: string) => decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

export const normalizeInternalPath = (href: string): string | undefined => {
  const value = decodeHtml(href).trim();
  if (!value || value.startsWith('#') || /^(?:mailto|tel|javascript|data):/i.test(value)) return undefined;
  try {
    const url = new URL(value, 'https://www.bodytrainingguide.com');
    if (!SITE_HOSTS.has(url.hostname.toLowerCase())) return undefined;
    const pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
    return pathname;
  } catch {
    return undefined;
  }
};

const extractAnchors = (html: string) => {
  const links: Array<{ href: string; anchor: string }> = [];
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorPattern.exec(html)) !== null) {
    const hrefMatch = match[1].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3];
    if (href) links.push({ href, anchor: cleanText(match[2]) || '(ancre vide)' });
  }
  // Legacy articles can still expose Markdown rather than rendered HTML.
  const markdownPattern = /\[([^\]]+)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g;
  while ((match = markdownPattern.exec(html)) !== null) {
    links.push({ href: match[2], anchor: cleanText(match[1]) || '(ancre vide)' });
  }
  return links;
};

export const buildInternalLinkReport = (posts: InternalLinkReportPost[]): InternalLinkPageReport[] => {
  const published = posts.filter((post) => post.slug && post.status.toUpperCase() === 'PUBLISHED');
  const pages = published.map((post) => ({
    id: post.id,
    title: post.title || 'Sans titre',
    slug: post.slug,
    locale: post.locale,
    status: post.status,
    path: getArticlePath(post.locale, post.slug),
    contentText: cleanText(`${post.title}\n${post.chapoHtml}\n${post.contentHtml}`),
    incoming: [] as InternalLinkEdge[],
    outgoing: [] as InternalLinkEdge[]
  }));
  const byPath = new Map(pages.map((page) => [page.path, page]));

  for (const post of published) {
    const source = pages.find((page) => page.id === post.id);
    if (!source) continue;
    for (const link of extractAnchors(`${post.chapoHtml}\n${post.contentHtml}`)) {
      const targetPath = normalizeInternalPath(link.href);
      if (!targetPath) continue;
      const target = byPath.get(targetPath);
      const edge: InternalLinkEdge = {
        sourceId: source.id,
        sourceTitle: source.title,
        sourcePath: source.path,
        targetPath,
        targetId: target?.id,
        targetTitle: target?.title,
        anchor: link.anchor,
        broken: !target
      };
      source.outgoing.push(edge);
      target?.incoming.push(edge);
    }
  }

  return pages.sort((a, b) => a.incoming.length - b.incoming.length || a.outgoing.length - b.outgoing.length || a.title.localeCompare(b.title));
};
