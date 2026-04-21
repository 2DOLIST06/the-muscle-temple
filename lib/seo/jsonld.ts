import { siteConfig } from '@/lib/constants';

export const blogPostingJsonLd = (props: {
  title: string;
  description: string;
  slug: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  category: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: props.title,
  description: props.description,
  image: `${props.image}`,
  datePublished: props.datePublished,
  dateModified: props.dateModified ?? props.datePublished,
  articleSection: props.category,
  author: {
    '@type': 'Person',
    name: props.authorName
  },
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name
  },
  mainEntityOfPage: `${siteConfig.baseUrl}/articles/${props.slug}`
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${siteConfig.baseUrl}${item.path}`
  }))
});
