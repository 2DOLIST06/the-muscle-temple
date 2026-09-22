'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';
import type { InternalLinkPageReport } from '@/lib/admin/internal-link-report';
import type { Locale } from '@/lib/i18n/routing';

interface ReportPayload {
  data: InternalLinkPageReport[];
  summary: { pages: number; links: number; orphanPages: number; brokenLinks: number };
  generatedAt: string;
}

type Filter = 'all' | 'orphan' | 'weak-incoming' | 'weak-outgoing' | 'broken';
const countClass = (count: number, warning: number) => count === 0 ? 'bg-red-500/15 text-red-300 ring-red-500/30' : count < warning ? 'bg-amber-500/15 text-amber-200 ring-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30';

function LinkList({ links, direction }: { links: InternalLinkPageReport['incoming']; direction: 'incoming' | 'outgoing' }) {
  if (!links.length) return <p className="text-sm text-slate-500">Aucun lien.</p>;
  return (
    <ul className="space-y-2">
      {links.map((item, index) => (
        <li key={`${item.sourceId}-${item.targetPath}-${item.anchor}-${index}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {item.broken ? <span className="rounded bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-300">Cible inconnue</span> : null}
            <span className="text-sm text-slate-300">{direction === 'incoming' ? 'Depuis' : 'Vers'}</span>
            <a className="break-all text-sm font-medium text-brand-300 hover:underline" href={direction === 'incoming' ? item.sourcePath : item.targetPath} target="_blank" rel="noreferrer">
              {direction === 'incoming' ? item.sourceTitle : item.targetTitle || item.targetPath}
            </a>
          </div>
          <p className="mt-1 text-xs text-slate-500">Ancre : <span className="text-slate-300">{item.anchor}</span></p>
        </li>
      ))}
    </ul>
  );
}

export function InternalLinkDashboard() {
  const router = useRouter();
  const [report, setReport] = useState<ReportPayload>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [locale, setLocale] = useState<'all' | Locale>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<string>();

  const load = () => {
    setLoading(true);
    setError('');
    adminApi.get<ReportPayload>('/admin-api/internal-links/report')
      .then(setReport)
      .catch((err: unknown) => {
        if (err instanceof AdminApiError && err.status === 401) return router.replace('/admin/login?next=/admin/internal-links');
        setError(err instanceof Error ? err.message : 'Impossible de générer le rapport.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = useMemo(() => (report?.data ?? []).filter((page) => {
    const term = search.trim().toLocaleLowerCase();
    if (locale !== 'all' && page.locale !== locale) return false;
    if (term && !`${page.title} ${page.path}`.toLocaleLowerCase().includes(term)) return false;
    if (filter === 'orphan' && page.incoming.length !== 0) return false;
    if (filter === 'weak-incoming' && page.incoming.length >= 3) return false;
    if (filter === 'weak-outgoing' && page.outgoing.length >= 3) return false;
    if (filter === 'broken' && !page.outgoing.some((link) => link.broken)) return false;
    return true;
  }), [filter, locale, report, search]);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-wider text-brand-400">SEO · Audit</p><h1 className="mt-2 text-3xl font-bold">Maillage interne</h1><p className="mt-2 max-w-3xl text-sm text-slate-400">Repérez les pages isolées, contrôlez chaque lien entrant et sortant, ainsi que son ancre.</p></div>
        <button onClick={load} disabled={loading} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{loading ? 'Analyse…' : 'Actualiser l’analyse'}</button>
      </div>

      {error ? <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}
      {loading && !report ? <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">Analyse des contenus et des liens en cours…</div> : null}

      {report ? <>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[['Pages analysées', report.summary.pages, 'text-white'], ['Liens internes', report.summary.links, 'text-brand-300'], ['Pages sans lien entrant', report.summary.orphanPages, report.summary.orphanPages ? 'text-red-300' : 'text-emerald-300'], ['Liens vers cible inconnue', report.summary.brokenLinks, report.summary.brokenLinks ? 'text-amber-300' : 'text-emerald-300']].map(([label, value, color]) => <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p></div>)}
        </div>

        <div className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 lg:grid-cols-[1fr_auto_auto]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une page ou une URL…" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <select value={locale} onChange={(event) => setLocale(event.target.value as 'all' | Locale)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="all">Toutes les langues</option><option value="fr">Français</option><option value="en">Anglais</option></select>
          <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="all">Toutes les pages</option><option value="orphan">Sans lien entrant</option><option value="weak-incoming">Moins de 3 entrants</option><option value="weak-outgoing">Moins de 3 sortants</option><option value="broken">Cibles inconnues</option></select>
        </div>

        <p className="mt-3 text-xs text-slate-500">{pages.length} résultat{pages.length > 1 ? 's' : ''} · Les pages les moins liées apparaissent en premier.</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
          <div className="hidden grid-cols-[minmax(260px,1fr)_120px_120px_120px] bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid"><span>Page</span><span>Entrants</span><span>Sortants</span><span></span></div>
          {pages.map((page) => {
            const open = expanded === page.id;
            return <div key={page.id} className="border-t border-slate-800 first:border-t-0">
              <button onClick={() => setExpanded(open ? undefined : page.id)} className="grid w-full gap-3 bg-slate-950 px-4 py-4 text-left hover:bg-slate-900 md:grid-cols-[minmax(260px,1fr)_120px_120px_120px] md:items-center">
                <span className="min-w-0"><span className="block truncate font-semibold">{page.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{page.path} · {page.locale.toUpperCase()}</span></span>
                <span><span className={`inline-flex min-w-9 justify-center rounded-full px-2 py-1 text-xs font-bold ring-1 ${countClass(page.incoming.length, 3)}`}>{page.incoming.length}</span><span className="ml-2 text-xs text-slate-500 md:hidden">entrants</span></span>
                <span><span className={`inline-flex min-w-9 justify-center rounded-full px-2 py-1 text-xs font-bold ring-1 ${countClass(page.outgoing.length, 3)}`}>{page.outgoing.length}</span><span className="ml-2 text-xs text-slate-500 md:hidden">sortants</span></span>
                <span className="text-sm font-medium text-brand-300">{open ? 'Masquer' : 'Voir les liens'}</span>
              </button>
              {open ? <div className="grid gap-6 bg-slate-900/70 p-4 lg:grid-cols-2"><div><h2 className="mb-3 font-semibold">Liens entrants ({page.incoming.length})</h2><LinkList links={page.incoming} direction="incoming" /></div><div><h2 className="mb-3 font-semibold">Liens sortants ({page.outgoing.length})</h2><LinkList links={page.outgoing} direction="outgoing" /></div><div className="lg:col-span-2 flex gap-3 border-t border-slate-800 pt-4"><a href={page.path} target="_blank" rel="noreferrer" className="text-sm text-brand-300 hover:underline">Voir la page ↗</a><Link href={`/admin/posts/${page.id}`} className="text-sm text-slate-300 hover:underline">Modifier l’article</Link></div></div> : null}
            </div>;
          })}
          {!pages.length ? <p className="bg-slate-950 p-8 text-center text-sm text-slate-500">Aucune page ne correspond à ces filtres.</p> : null}
        </div>
      </> : null}
    </section>
  );
}
