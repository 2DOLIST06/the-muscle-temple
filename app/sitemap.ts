import type { MetadataRoute } from 'next';
import { contentRepository } from '@/lib/content/repository';
import { siteConfig } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ['', '/articles', '/about', '/contact'].map((path) => ({
    url: `${siteConfig.baseUrl}${path}`,
    lastModified: new Date()
  }));

  const posts = contentRepository.getAllPosts().map((post) => ({
    url: `${siteConfig.baseUrl}/articles/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt)
  }));

  const categories = contentRepository.getAllCategories().map((category) => ({
    url: `${siteConfig.baseUrl}/categories/${category.slug}`,
    lastModified: new Date()
  }));

  const authors = contentRepository.getAllAuthors().map((author) => ({
    url: `${siteConfig.baseUrl}/authors/${author.slug}`,
    lastModified: new Date()
  }));

  return [...staticPages, ...posts, ...categories, ...authors];
}
