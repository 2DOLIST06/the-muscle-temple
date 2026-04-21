export interface Author {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  socials?: {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
}

export interface Category {
  id: string;
  slug: string;
  title: string;
  description: string;
}

export interface PostSection {
  heading: string;
  content: string[];
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  readingMinutes: number;
  categorySlug: string;
  authorSlug: string;
  tags: string[];
  sections: PostSection[];
  featured?: boolean;
}

export interface RelatedPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
}

export interface NavigationItem {
  label: string;
  href: string;
}
