import type { NavigationItem } from '@/types/content';

export const siteConfig = {
  name: 'The Muscle Temple',
  description:
    'Blog musculation premium : entraînement, nutrition et récupération pour progresser durablement.',
  baseUrl: 'https://themuscletemple.com',
  defaultOgImage: '/og-default.svg'
};

export const mainNavigation: NavigationItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Catégories', href: '/categories' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' }
];
