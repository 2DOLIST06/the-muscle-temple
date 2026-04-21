import { authors } from '@/data/authors';
import { categories } from '@/data/categories';
import { posts } from '@/data/posts';
import type { Author, Category, Post, RelatedPostSummary } from '@/types/content';

const sortByDateDesc = (items: Post[]) =>
  [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export const contentRepository = {
  getAllPosts(): Post[] {
    return sortByDateDesc(posts);
  },
  getFeaturedPosts(limit = 3): Post[] {
    return sortByDateDesc(posts.filter((post) => post.featured)).slice(0, limit);
  },
  getRecentPosts(limit = 4): Post[] {
    return sortByDateDesc(posts).slice(0, limit);
  },
  getPostBySlug(slug: string): Post | undefined {
    return posts.find((post) => post.slug === slug);
  },
  getAllCategories(): Category[] {
    return categories;
  },
  getCategoryBySlug(slug: string): Category | undefined {
    return categories.find((category) => category.slug === slug);
  },
  getPostsByCategory(slug: string): Post[] {
    return sortByDateDesc(posts.filter((post) => post.categorySlug === slug));
  },
  getAllAuthors(): Author[] {
    return authors;
  },
  getAuthorBySlug(slug: string): Author | undefined {
    return authors.find((author) => author.slug === slug);
  },
  getPostsByAuthor(slug: string): Post[] {
    return sortByDateDesc(posts.filter((post) => post.authorSlug === slug));
  },
  getRelatedPosts(currentPost: Post, limit = 3): RelatedPostSummary[] {
    return sortByDateDesc(
      posts.filter((post) => post.slug !== currentPost.slug && post.categorySlug === currentPost.categorySlug)
    )
      .slice(0, limit)
      .map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt
      }));
  }
};
