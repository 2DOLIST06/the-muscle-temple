import type { Metadata } from 'next';
import { CategoryCard } from '@/components/blog/CategoryCard';
import { Container } from '@/components/ui/Container';
import { contentRepository } from '@/lib/content/repository';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Catégories | The Muscle Temple',
  description: 'Explorez les catégories du blog musculation.',
  path: '/categories'
});

export default function CategoriesPage() {
  const categories = contentRepository.getAllCategories();

  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold">Catégories</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </Container>
  );
}
