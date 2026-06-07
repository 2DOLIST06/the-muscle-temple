import type { MetadataRoute } from 'next';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/constants';
import { absoluteUrl, getArticlePath } from '@/lib/i18n/routing';
import type { Post } from '@/types/content';

const postAlternates = (post: Post) => {
  const fromBackend = post.hreflang?.reduce<Record<string, string>>((acc, item) => {
    acc[item.hreflang] = item.href;
    return acc;
  }, {});
  if (fromBackend && Object.keys(fromBackend).length > 0) return { languages: fromBackend };

  const selfUrl = post.canonicalUrl ?? absoluteUrl(post.path ?? getArticlePath(post.locale, post.slug));
  const languages: Record<string, string> = { [post.locale]: selfUrl };
  const englishTranslation = post.locale === 'en' ? undefined : post.translations?.find((item) => item.locale === 'en');
  const frenchTranslation = post.locale === 'fr' ? undefined : post.translations?.find((item) => item.locale === 'fr');
  if (englishTranslation) languages.en = englishTranslation.canonicalUrl ?? absoluteUrl(englishTranslation.path);
  if (frenchTranslation) languages.fr = frenchTranslation.canonicalUrl ?? absoluteUrl(frenchTranslation.path);
  if (languages.en) languages['x-default'] = languages.en;
  return { languages };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteConfig.baseUrl}/`, lastModified: new Date(), alternates: { languages: { en: `${siteConfig.baseUrl}/`, fr: `${siteConfig.baseUrl}/fr`, 'x-default': `${siteConfig.baseUrl}/` } } },
    { url: `${siteConfig.baseUrl}/articles`, lastModified: new Date(), alternates: { languages: { en: `${siteConfig.baseUrl}/articles`, fr: `${siteConfig.baseUrl}/fr/articles`, 'x-default': `${siteConfig.baseUrl}/articles` } } },
    { url: `${siteConfig.baseUrl}/fr`, lastModified: new Date(), alternates: { languages: { en: `${siteConfig.baseUrl}/`, fr: `${siteConfig.baseUrl}/fr`, 'x-default': `${siteConfig.baseUrl}/` } } },
    { url: `${siteConfig.baseUrl}/fr/articles`, lastModified: new Date(), alternates: { languages: { en: `${siteConfig.baseUrl}/articles`, fr: `${siteConfig.baseUrl}/fr/articles`, 'x-default': `${siteConfig.baseUrl}/articles` } } },
    { url: `${siteConfig.baseUrl}/about`, lastModified: new Date() },
    { url: `${siteConfig.baseUrl}/contact`, lastModified: new Date() }
  ];

  const [englishPosts, frenchPosts, allCategories, allAuthors] = await Promise.all([
    contentRepository.getAllPostsByLocale('en'),
    contentRepository.getAllPostsByLocale('fr'),
    contentRepository.getAllCategories(),
    contentRepository.getAllAuthors()
  ]);

  const posts: MetadataRoute.Sitemap = [...englishPosts, ...frenchPosts].map((post) => ({
    url: post.canonicalUrl ?? absoluteUrl(post.path ?? getArticlePath(post.locale, post.slug)),
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    alternates: postAlternates(post)
  }));

  const categories = allCategories.map((category) => ({ url: `${siteConfig.baseUrl}/categories/${category.slug}`, lastModified: new Date() }));
  const authors = allAuthors.map((author) => ({ url: `${siteConfig.baseUrl}/authors/${author.slug}`, lastModified: new Date() }));

  return [...staticPages, ...posts, ...categories, ...authors];
}
