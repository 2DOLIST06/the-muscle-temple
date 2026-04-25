import type { MetadataRoute } from 'next';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ['', '/articles', '/about', '/contact'].map((path) => ({
    url: `${siteConfig.baseUrl}${path}`,
    lastModified: new Date()
  }));

  const [allPosts, allCategories, allAuthors] = await Promise.all([
    contentRepository.getAllPosts(),
    contentRepository.getAllCategories(),
    contentRepository.getAllAuthors()
  ]);

  const posts = allPosts.map((post) => ({
    url: `${siteConfig.baseUrl}/articles/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt)
  }));

  const categories = allCategories.map((category) => ({
    url: `${siteConfig.baseUrl}/categories/${category.slug}`,
    lastModified: new Date()
  }));

  const authors = allAuthors.map((author) => ({
    url: `${siteConfig.baseUrl}/authors/${author.slug}`,
    lastModified: new Date()
  }));

  return [...staticPages, ...posts, ...categories, ...authors];
}
