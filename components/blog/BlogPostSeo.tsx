import { getArticleCategoryLabel, getArticleDescription, getPublicAuthorName } from '@/lib/content/article-utils';
import { siteConfig } from '@/lib/constants';
import { getCategoryPath, type Locale } from '@/lib/i18n/routing';

export function BlogPostSeo({ post, path, locale = 'en' }: { post: { h1?: string; title: string; metaDescription?: string; chapoHtml?: string; heroImageUrl?: string; createdAt?: string; updatedAt?: string; authorName?: string }; path: string; locale?: Locale }) {
  const description = getArticleDescription(post.metaDescription || post.chapoHtml, locale);
  const auto = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.h1 || post.title, description, image: post.heroImageUrl ? [post.heroImageUrl] : undefined, datePublished: post.createdAt, dateModified: post.updatedAt, articleSection: getArticleCategoryLabel(locale), author: { '@type': 'Organization', name: getPublicAuthorName(post.authorName) }, mainEntityOfPage: `${siteConfig.baseUrl}${path}` };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: locale === 'fr' ? 'Accueil' : 'Home', item: `${siteConfig.baseUrl}${locale === 'fr' ? '/fr' : '/'}` }, { '@type': 'ListItem', position: 2, name: getArticleCategoryLabel(locale), item: `${siteConfig.baseUrl}${getCategoryPath(locale, 'musculation')}` }, { '@type': 'ListItem', position: 3, name: post.title, item: `${siteConfig.baseUrl}${path}` }] };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(auto) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} /></>;
}
