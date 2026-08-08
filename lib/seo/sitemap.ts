import type { MetadataRoute } from 'next';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/constants';
import { absoluteUrl, canonicalSiteUrl, getArticlePath, getCategoryPath, legalPagePaths } from '@/lib/i18n/routing';
import type { Locale } from '@/lib/i18n/routing';

const staticPathsByLocale: Record<Locale, string[]> = {
  en: ['/', '/articles', '/categories', '/about', '/contact', '/macro-calculator'],
  fr: ['/fr', '/fr/articles', '/fr/categories', '/fr/about', '/fr/contact', '/fr/calculateur-macros']
};

const legalPathnames = new Set<string>(Object.values(legalPagePaths).flatMap(({ en, fr }) => [en, fr]));

export const isLegalSitemapUrl = (url: string) => {
  try {
    const pathname = new URL(url, siteConfig.baseUrl).pathname.replace(/\/$/, '') || '/';
    return legalPathnames.has(pathname);
  } catch {
    return false;
  }
};

export const getLocalizedSitemap = async (locale: Locale): Promise<MetadataRoute.Sitemap> => {
  const [posts, categories] = await Promise.all([
    contentRepository.getAllPostsByLocale(locale),
    contentRepository.getAllCategoriesByLocale(locale)
  ]);

  const staticPages: MetadataRoute.Sitemap = staticPathsByLocale[locale].map((path) => ({
    // Static pages do not have a CMS timestamp. A generated timestamp would
    // incorrectly flag them as changed every time this sitemap is requested.
    url: absoluteUrl(path)
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: canonicalSiteUrl(post.canonicalUrl ?? absoluteUrl(post.path ?? getArticlePath(locale, post.slug))),
    lastModified: new Date(post.updatedAt ?? post.publishedAt)
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => {
    const newestPost = posts
      .filter((post) => post.categorySlug === category.slug)
      .map((post) => post.updatedAt ?? post.publishedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return {
      url: absoluteUrl(getCategoryPath(locale, category.slug)),
      ...(newestPost ? { lastModified: new Date(newestPost) } : {})
    };
  });

  return [...staticPages, ...postPages, ...categoryPages].filter((entry) => !isLegalSitemapUrl(entry.url));
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const renderSitemapXml = (entries: MetadataRoute.Sitemap) => {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified ? `\n    <lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(entry.url)}</loc>${lastModified}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

export const sitemapResponse = async (locale: Locale) =>
  new Response(renderSitemapXml(await getLocalizedSitemap(locale)), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600'
    }
  });

export const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${siteConfig.baseUrl}/sitemap.xml\nSitemap: ${siteConfig.baseUrl}/fr/sitemap.xml\n`;
