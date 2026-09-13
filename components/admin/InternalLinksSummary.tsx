'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LinkGroup } from '@/lib/admin/internal-links';

const labels = { internal: 'Interne', external: 'Externe', anchor: 'Ancre', mailto: 'E-mail', other: 'Autre' };

export function InternalLinksSummary({ groups, onGoToLink }: { groups: LinkGroup[]; onGoToLink: (group: LinkGroup, occurrenceIndex: number) => void }) {
  const [indexes, setIndexes] = useState<Record<string, number>>({});
  const total = useMemo(() => groups.reduce((sum, group) => sum + group.occurrences.length, 0), [groups]);
  const destinations = useMemo(() => new Set(groups.map((group) => group.href)).size, [groups]);

  useEffect(() => {
    setIndexes((current) => Object.fromEntries(groups.map((group) => [group.key, Math.min(current[group.key] ?? 0, group.occurrences.length - 1)])));
  }, [groups]);

  const move = (group: LinkGroup, direction: number) => setIndexes((current) => ({ ...current, [group.key]: ((current[group.key] ?? 0) + direction + group.occurrences.length) % group.occurrences.length }));
  const open = (href: string) => {
    if (!/^(?:\/|#|https?:\/\/|mailto:)/i.test(href.trim())) return;
    try { window.open(new URL(href, window.location.origin).toString(), '_blank', 'noopener,noreferrer'); } catch { /* The exact invalid href remains visible in the summary. */ }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-lg shadow-black/10">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold text-slate-100">Liens de l’article</h2><p className="text-xs text-slate-400">{total} lien{total > 1 ? 's' : ''} · {groups.length} groupe{groups.length > 1 ? 's' : ''} · {destinations} destination{destinations > 1 ? 's' : ''}</p></div>
      {groups.length === 0 ? <p className="mt-3 text-sm text-slate-400">Aucun lien dans le contenu.</p> : <div className="mt-3 space-y-3">{groups.map((group) => {
        const index = indexes[group.key] ?? 0;
        return <article key={group.key} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-slate-100">{group.anchor || '(ancre vide)'}</p><p className="break-all text-xs text-brand-300">{group.href}</p></div><span className="shrink-0 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{labels[group.type]}</span></div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {group.occurrences.length > 1 ? <><button type="button" aria-label="Occurrence précédente" onClick={() => move(group, -1)} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">←</button><span className="text-xs text-slate-400">{index + 1}/{group.occurrences.length}</span><button type="button" aria-label="Occurrence suivante" onClick={() => move(group, 1)} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800">→</button></> : null}
            <button type="button" onClick={() => onGoToLink(group, index)} className="rounded border border-brand-500 px-2.5 py-1 text-xs font-medium text-brand-200 hover:bg-brand-950">Aller au lien</button>
            <button type="button" disabled={group.type === 'other'} onClick={() => open(group.href)} className="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Ouvrir</button>
          </div>
        </article>;
      })}</div>}
    </section>
  );
}
