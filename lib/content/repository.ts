import { buildPublicApiUrl } from '@/lib/api/env';
import type { Author, Category, Post, PostSection, RelatedPostSummary } from '@/types/content';

interface ApiMedia {
  url?: string | null;
}

interface ApiSeo {
  description?: string | null;
}

interface ApiPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  contentMarkdown?: string | null;
  contentJson?: {
    sections?: Array<{ heading?: string | null; content?: string | string[] | null }>;
  } | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTimeMinutes?: number | null;
  coverImage?: ApiMedia | null;
  category?: { slug?: string | null } | null;
  author?: { slug?: string | null } | null;
  tags?: Array<{ slug?: string | null; name?: string | null }>;
  seo?: ApiSeo | null;
}

interface ApiCategory {
  id: string;
  slug: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
}

interface ApiAuthor {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  avatar?: ApiMedia | null;
}

const sortByDateDesc = (items: Post[]) =>
  [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

const normalizeParagraphs = (value: string | string[] | null | undefined) => {
  if (Array.isArray(value)) {
    return value.map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  if (typeof value !== 'string') return [];

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const markdownToSections = (markdown: string, fallbackTitle = 'Contenu'): PostSection[] => {
  const chunks = markdown
    .split(/^##\s+/gm)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return [{ heading: fallbackTitle, content: normalizeParagraphs(markdown) }];
  }

  return chunks.map((chunk, index) => {
    if (index === 0 && !markdown.trim().startsWith('## ')) {
      return {
        heading: fallbackTitle,
        content: normalizeParagraphs(chunk)
      };
    }

    const [headingLine, ...rest] = chunk.split('\n');
    return {
      heading: headingLine?.trim() || `${fallbackTitle} ${index + 1}`,
      content: normalizeParagraphs(rest.join('\n').trim())
    };
  });
};

const toPostSections = (apiPost: ApiPost): PostSection[] => {
  const jsonSections =
    apiPost.contentJson?.sections
      ?.map((section, index) => ({
        heading: section.heading?.trim() || `Section ${index + 1}`,
        content: normalizeParagraphs(section.content)
      }))
      .filter((section) => section.content.length > 0) ?? [];

  if (jsonSections.length > 0) return jsonSections;
  if (apiPost.contentMarkdown?.trim()) return markdownToSections(apiPost.contentMarkdown, 'Contenu');

  return [{ heading: 'Contenu', content: [apiPost.excerpt?.trim() || 'Contenu bientôt disponible.'] }];
};

const toPost = (apiPost: ApiPost): Post => ({
  id: apiPost.id,
  slug: apiPost.slug,
  title: apiPost.title,
  excerpt: apiPost.excerpt?.trim() || '',
  description: apiPost.seo?.description?.trim() || apiPost.excerpt?.trim() || '',
  coverImage: apiPost.coverImage?.url?.trim() || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
  publishedAt: apiPost.publishedAt || apiPost.updatedAt || new Date().toISOString(),
  updatedAt: apiPost.updatedAt || undefined,
  readingMinutes: apiPost.readingTimeMinutes ?? 6,
  categorySlug: apiPost.category?.slug?.trim() || 'non-classe',
  authorSlug: apiPost.author?.slug?.trim() || 'auteur-inconnu',
  tags:
    apiPost.tags
      ?.map((tag) => tag.slug?.trim() || tag.name?.trim() || '')
      .filter(Boolean) ?? [],
  sections: toPostSections(apiPost),
  featured: false
});

const toCategory = (category: ApiCategory): Category => ({
  id: category.id,
  slug: category.slug,
  title: category.title?.trim() || category.name?.trim() || 'Catégorie',
  description: category.description?.trim() || 'Découvrez tous les articles de cette catégorie.'
});

const toAuthor = (author: ApiAuthor): Author => ({
  id: author.id,
  slug: author.slug,
  name: author.name,
  role: 'Auteur',
  bio: author.bio?.trim() || 'Auteur The Muscle Temple.',
  avatar: author.avatar?.url?.trim() || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
});

async function fetchCollection<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(buildPublicApiUrl(path), {
      next: { revalidate: 60 }
    });

    if (!response.ok) return [];

    const payload = (await response.json().catch(() => ({}))) as {
      data?: unknown;
      items?: unknown;
      posts?: unknown;
      categories?: unknown;
      authors?: unknown;
    };

    const candidates = [payload.data, payload.items, payload.posts, payload.categories, payload.authors];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as T[];
      if (candidate && typeof candidate === 'object') {
        const nested = candidate as { items?: unknown; posts?: unknown; categories?: unknown; authors?: unknown };
        const nestedCandidates = [nested.items, nested.posts, nested.categories, nested.authors];
        for (const nestedCandidate of nestedCandidates) {
          if (Array.isArray(nestedCandidate)) return nestedCandidate as T[];
        }
      }
    }

    return [];
  } catch {
    return [];
  }
}

async function fetchPostBySlug(slug: string): Promise<ApiPost | null> {
  try {
    const response = await fetch(buildPublicApiUrl(`/api/posts/${slug}`), {
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    const payload = (await response.json().catch(() => ({}))) as {
      data?: unknown;
      post?: unknown;
    };

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      const data = payload.data as { post?: unknown };
      if (data.post && typeof data.post === 'object' && !Array.isArray(data.post)) {
        return data.post as ApiPost;
      }
      return payload.data as ApiPost;
    }

    if (payload.post && typeof payload.post === 'object' && !Array.isArray(payload.post)) {
      return payload.post as ApiPost;
    }

    return null;
  } catch {
    return null;
  }
}

export const contentRepository = {
  async getAllPosts(): Promise<Post[]> {
    const apiPosts = await fetchCollection<ApiPost>('/api/posts?limit=50');
    const publishedPosts = apiPosts.filter((post) => post.status !== 'DRAFT' && post.status !== 'ARCHIVED').map(toPost);
    return sortByDateDesc(publishedPosts);
  },
  async getFeaturedPosts(limit = 3): Promise<Post[]> {
    const posts = await this.getAllPosts();
    return posts.slice(0, limit);
  },
  async getRecentPosts(limit = 4): Promise<Post[]> {
    const posts = await this.getAllPosts();
    return posts.slice(0, limit);
  },
  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const post = await fetchPostBySlug(slug);
    if (!post || post.status === 'DRAFT' || post.status === 'ARCHIVED') return undefined;
    return toPost(post);
  },
  async getAllCategories(): Promise<Category[]> {
    const apiCategories = await fetchCollection<ApiCategory>('/api/categories');
    return apiCategories.map(toCategory);
  },
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const categories = await this.getAllCategories();
    return categories.find((category) => category.slug === slug);
  },
  async getPostsByCategory(slug: string): Promise<Post[]> {
    const apiPosts = await fetchCollection<ApiPost>(`/api/categories/${slug}/posts`);
    return sortByDateDesc(apiPosts.filter((post) => post.status !== 'DRAFT' && post.status !== 'ARCHIVED').map(toPost));
  },
  async getAllAuthors(): Promise<Author[]> {
    const apiAuthors = await fetchCollection<ApiAuthor>('/api/authors');
    return apiAuthors.map(toAuthor);
  },
  async getAuthorBySlug(slug: string): Promise<Author | undefined> {
    const authors = await this.getAllAuthors();
    return authors.find((author) => author.slug === slug);
  },
  async getPostsByAuthor(slug: string): Promise<Post[]> {
    const apiPosts = await fetchCollection<ApiPost>(`/api/authors/${slug}/posts`);
    return sortByDateDesc(apiPosts.filter((post) => post.status !== 'DRAFT' && post.status !== 'ARCHIVED').map(toPost));
  },
  async getRelatedPosts(currentPost: Post, limit = 3): Promise<RelatedPostSummary[]> {
    const posts = await this.getPostsByCategory(currentPost.categorySlug);
    return posts
      .filter((post) => post.slug !== currentPost.slug)
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
