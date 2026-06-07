import { siteConfig } from '@/lib/constants';

export type Locale = 'en' | 'fr';
export type Hreflang = 'en' | 'fr' | 'x-default';

export const locales: Locale[] = ['en', 'fr'];

const cleanSlug = (slug: string) => slug.replace(/^\/+|\/+$/g, '');

export const getHomePath = (locale: Locale) => (locale === 'fr' ? '/fr' : '/');
export const getArticlesPath = (locale: Locale) => (locale === 'fr' ? '/fr/articles' : '/articles');
export const getArticlePath = (locale: Locale, slug: string) => `${getArticlesPath(locale)}/${cleanSlug(slug)}`;
export const getCategoryPath = (locale: Locale, slug: string) => `${locale === 'fr' ? '/fr/categories' : '/categories'}/${cleanSlug(slug)}`;
export const getAuthorPath = (locale: Locale, slug: string) => `${locale === 'fr' ? '/fr/authors' : '/authors'}/${cleanSlug(slug)}`;
export const getGymPath = (locale: Locale, slug: string) => `${locale === 'fr' ? '/fr/salles' : '/gyms'}/${cleanSlug(slug)}`;

export const getPathLocale = (pathname: string): Locale => (pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en');

export const absoluteUrl = (pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteConfig.baseUrl}${path}`;
};

export const getNavigation = (locale: Locale) =>
  locale === 'fr'
    ? [
        { label: 'Accueil', href: getHomePath('fr') },
        { label: 'Articles', href: getArticlesPath('fr') },
        { label: 'Catégories', href: '/fr/categories' }
      ]
    : [
        { label: 'Home', href: '/' },
        { label: 'Articles', href: '/articles' },
        { label: 'Categories', href: '/categories' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' }
      ];
