import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'À propos | The Muscle Temple',
  description: 'Notre mission éditoriale pour vous aider à progresser en musculation.',
  path: '/about'
});

export default function AboutPage() {
  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold">À propos</h1>
        <p className="mt-4 max-w-3xl text-slate-700">
          The Muscle Temple est un média éditorial dédié à la progression durable en musculation. Nous publions des
          contenus pratiques et fiables sur l’entraînement, la nutrition sportive et la récupération.
        </p>
      </section>
    </Container>
  );
}
