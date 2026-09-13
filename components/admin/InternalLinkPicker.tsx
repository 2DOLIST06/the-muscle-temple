'use client';

import { useEffect, useRef, useState } from 'react';
import type { InternalLinkTarget, InternalLinkTargetType } from '@/lib/admin/internal-links';
import type { Locale } from '@/lib/i18n/routing';

const typeLabels: Record<'all' | InternalLinkTargetType, string> = {
  all: 'Tous', post: 'Articles', category: 'Catégories', static: 'Pages', author: 'Auteurs'
};

export function InternalLinkPicker({ initialLocale, onClose, onSelect }: {
  initialLocale: Locale;
  onClose: () => void;
  onSelect: (target: InternalLinkTarget) => void;
}) {
  const [query, setQuery] = useState('');
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [type, setType] = useState<'all' | InternalLinkTargetType>('all');
  const [results, setResults] = useState<InternalLinkTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ q: query, locale, type, limit: '20' });
      try {
        const response = await fetch(`/admin-api/internal-links?${params}`, { cache: 'no-store', signal: controller.signal });
        const payload = (await response.json().catch(() => ({}))) as { data?: InternalLinkTarget[]; error?: string; message?: string };
        if (!response.ok) throw new Error(payload.error || payload.message || 'Recherche indisponible.');
        setResults(Array.isArray(payload.data) ? payload.data : []);
      } catch (caught) {
        if ((caught as Error).name !== 'AbortError') {
          setResults([]);
          setError(caught instanceof Error ? caught.message : 'Recherche indisponible.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [locale, query, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="internal-link-title">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <div><h2 id="internal-link-title" className="text-lg font-semibold text-white">Ajouter un lien interne</h2><p className="text-xs text-slate-400">La sélection dans l’éditeur sera conservée.</p></div>
          <button type="button" onClick={onClose} className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-800">Fermer</button>
        </div>
        <div className="space-y-3 p-4">
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par titre, slug ou URL" className="w-full rounded border border-slate-600 bg-white p-2 text-slate-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30" />
          <div className="flex flex-wrap gap-2">
            {(['fr', 'en'] as Locale[]).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={`rounded border px-3 py-1.5 text-xs font-medium ${locale === item ? 'border-brand-400 bg-brand-700 text-white' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}>{item.toUpperCase()}</button>)}
            <span className="mx-1 h-7 w-px bg-slate-700" />
            {(Object.keys(typeLabels) as Array<'all' | InternalLinkTargetType>).map((item) => <button key={item} type="button" onClick={() => setType(item)} className={`rounded border px-3 py-1.5 text-xs font-medium ${type === item ? 'border-brand-400 bg-brand-700 text-white' : 'border-slate-600 text-slate-200 hover:bg-slate-800'}`}>{typeLabels[item]}</button>)}
          </div>
        </div>
        <div className="max-h-[52vh] overflow-y-auto border-t border-slate-800 p-3">
          {loading ? <p className="p-4 text-sm text-slate-300">Recherche…</p> : null}
          {error ? <p className="rounded border border-red-800 bg-red-950/60 p-3 text-sm text-red-100">{error}</p> : null}
          {!loading && !error && results.length === 0 ? <p className="p-4 text-sm text-slate-400">Aucun résultat.</p> : null}
          {!loading && !error ? <ul className="space-y-2">{results.map((target) => (
            <li key={`${target.type}-${target.id}-${target.locale}`}><button type="button" onClick={() => onSelect(target)} className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-left hover:border-brand-500 hover:bg-slate-800"><span className="block font-medium text-white">{target.title}</span><span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>{typeLabels[target.type]}</span><span>·</span><span>{target.locale.toUpperCase()}</span><span className="break-all text-brand-300">{target.url}</span></span></button></li>
          ))}</ul> : null}
        </div>
      </div>
    </div>
  );
}
