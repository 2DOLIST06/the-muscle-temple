import { Container } from '@/components/ui/Container';

export function LegalPageLayout({ title, updatedLabel, children }: Readonly<{ title: string; updatedLabel: string; children: React.ReactNode }>) {
  return (
    <Container>
      <article className="mx-auto max-w-3xl py-10 sm:py-14 lg:py-16">
        <header className="border-b border-slate-200 pb-7">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-slate-500">{updatedLabel}</p>
        </header>
        <div className="legal-content mt-8 space-y-8 text-base leading-7 text-slate-700">{children}</div>
      </article>
    </Container>
  );
}
