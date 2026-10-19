'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { adminApi } from '@/lib/admin/api-client';
import type { BannerInput } from '@/lib/content/affiliate';
import { AffiliateBannerFields } from './AffiliateBannerFields';

type Result = { id: string; status: 'modified' | 'unchanged' | 'failed'; message?: string };
export function BulkAffiliateBanner({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const [banner, setBanner] = useState<BannerInput>({ source: '', name: '', mode: 'native' });
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState(0);
  // Capture the exact selection when opening, regardless of later list updates.
  const [targets] = useState(ids);
  const apply = async (selected: string[], retry = false) => {
    if (running.current || !banner.source.trim() || banner.source.length > 100000) return;
    running.current = true;
    setBusy(true); setProgress(0);
    let next: Result[] = retry ? results.filter(result => !selected.includes(result.id)) : [];
    setResults(next);
    try {
      for (let offset = 0; offset < selected.length; offset += 100) {
        const chunk = selected.slice(offset, offset + 100);
        try {
          const payload = await adminApi.post<{ data: { results: Result[] } }>('/admin-api/posts/affiliate-banner', { ...banner, ids: chunk });
          const returned = payload.data?.results;
          if (!Array.isArray(returned)) throw new Error('Réponse de traitement invalide. Réessayez.');
          next = next.concat(chunk.map(id => {
            const matches = returned.filter(result => result.id === id);
            const result = matches[0];
            return matches.length === 1 && ['modified', 'unchanged', 'failed'].includes(result.status)
              ? result
              : { id, status: 'failed' as const, message: 'Résultat absent ou invalide. Réessayez sans risque de doublon.' };
          }));
        } catch (error) {
          next = next.concat(chunk.map(id => ({ id, status: 'failed' as const, message: error instanceof Error ? error.message : 'Réponse inconnue. Réessayez sans risque de doublon.' })));
        }
        setProgress(Math.min(offset + chunk.length, selected.length));
        setResults(next);
      }
    } finally { running.current = false; setBusy(false); }
  };
  const failed = results.filter(r => r.status === 'failed');
  return <div role="dialog" aria-modal="true" aria-label="Ajouter ou remplacer une bannière" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
    <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 text-slate-900 shadow-xl">
      <div className="mb-4 flex justify-between gap-4"><h2 className="text-xl font-bold">Ajouter / remplacer une bannière — {targets.length} articles</h2><button type="button" disabled={busy} onClick={onClose}>Fermer</button></div>
      <p className="mb-4 text-sm">La bannière existante garde sa position. Sans bannière, le bloc est ajouté à la fin. Les articles comportant plusieurs bannières seront signalés sans être modifiés. Seul le rôle ADMIN peut appliquer cette action.</p>
      <fieldset disabled={busy}><AffiliateBannerFields value={banner} onChange={v => { setBanner(v); setResults([]); }} /></fieldset>
      <button type="button" disabled={busy || !banner.source.trim() || banner.source.length > 100000} className="mt-4 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" onClick={() => void apply(targets)}>{busy ? `Traitement : ${progress} articles…` : `Appliquer aux ${targets.length} articles`}</button>
      {results.length > 0 ? <div role="status" className="mt-4">
        <p>{results.filter(r => r.status === 'modified').length} modifiés · {results.filter(r => r.status === 'unchanged').length} inchangés · {failed.length} échecs</p>
        <ul className="mt-2 max-h-64 overflow-auto text-sm">{results.map(r => <li key={r.id}><Link className="underline" href={`/admin/posts/${r.id}`}>{r.id}</Link> : {r.status === 'modified' ? 'modifié' : r.status === 'unchanged' ? 'inchangé' : r.message}</li>)}</ul>
        {failed.length ? <button type="button" disabled={busy} className="mt-3 rounded border p-2" onClick={() => void apply(failed.map(r => r.id), true)}>Réessayer les {failed.length} échecs</button> : null}
      </div> : null}
    </div>
  </div>;
}
