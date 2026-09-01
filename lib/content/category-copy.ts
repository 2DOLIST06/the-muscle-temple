import type { Locale } from '@/lib/i18n/routing';
import type { Category } from '@/types/content';

const strengthTrainingCopy = {
  en: {
    title: 'Strength training',
    shortDescription: 'Articles about workouts, exercises, muscle groups, muscle gain, cutting and recovery.',
    longDescription:
      'The strength training category brings together articles about workouts, exercises, muscle groups, muscle gain, cutting and recovery. The content is written to help readers organize their training and understand the basics.'
  },
  fr: {
    title: 'Musculation',
    shortDescription:
      'Articles sur l’entraînement, les exercices, les groupes musculaires, la prise de muscle, la sèche et la récupération.',
    longDescription:
      'La catégorie musculation regroupe les articles liés à l’entraînement, aux exercices, aux groupes musculaires, à la prise de muscle, à la sèche et à la récupération. Les contenus sont écrits pour aider à mieux organiser ses séances de musculation et comprendre les bases pour progresser rapidement.'
  }
} satisfies Record<Locale, { title: string; shortDescription: string; longDescription: string }>;

const nutritionCopy = {
  en: {
    title: 'Nutrition',
    shortDescription:
      'Articles about sports nutrition, calories, macros, protein, dietary supplements, whey, creatine and nutrition tailored to strength training.',
    longDescription:
      'Articles about sports nutrition, calories, macros, protein, dietary supplements, whey, creatine and nutrition tailored to strength training.'
  },
  fr: {
    title: 'Nutrition',
    shortDescription:
      'Articles sur la nutrition sportive, les calories, les macros, les protéines, les compléments alimentaires, la whey, la créatine et l’alimentation adaptée à la musculation.',
    longDescription:
      'Articles sur la nutrition sportive, les calories, les macros, les protéines, les compléments alimentaires, la whey, la créatine et l’alimentation adaptée à la musculation.'
  }
} satisfies Record<Locale, { title: string; shortDescription: string; longDescription: string }>;

const strengthTrainingSlugs = new Set(['entrainement', 'musculation']);

export const isStrengthTrainingCategory = (categoryOrSlug: Pick<Category, 'slug'> | string) => {
  const slug = typeof categoryOrSlug === 'string' ? categoryOrSlug : categoryOrSlug.slug;
  return strengthTrainingSlugs.has(slug);
};

export const getStrengthTrainingCategoryCopy = (locale: Locale) => strengthTrainingCopy[locale];

const getCategoryCopy = (category: Category, locale: Locale) => {
  if (isStrengthTrainingCategory(category)) return strengthTrainingCopy[locale];
  if (category.slug === 'nutrition') return nutritionCopy[locale];
  return undefined;
};

export const withLocalizedCategoryShortCopy = (category: Category, locale: Locale): Category => {
  const copy = getCategoryCopy(category, locale);
  if (!copy) return category;
  return {
    ...category,
    title: copy.title,
    description: copy.shortDescription
  };
};

export const withLocalizedCategoryLongCopy = (category: Category, locale: Locale): Category => {
  const copy = getCategoryCopy(category, locale);
  if (!copy) return category;
  return {
    ...category,
    title: copy.title,
    description: copy.longDescription
  };
};
