'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';

interface IndexNowPageRow {
  url: string;
  lastModified: string;
  submittedAt: string | null;
  needsSubmission: boolean;
}

const formatDate = (value: string | null) => (value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Jamais');

export default function AdminIndexNowPage() {
  const router = useRouter();
  const [pages, setPages] = useState<IndexNowPageRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selected.size;
  const pendingCount = useMemo(() => pages.filter((page) => page.needsSubmission).length, [pages]);

  const loadPages = () => {
    setLoading(true);
    adminApi
      .get<{ data?: IndexNowPageRow[] }>('/admin-api/indexnow')
      .then((payload) => {
        const rows = payload.data ?? [];
        setPages(rows);
        setSelected(new Set(rows.filter((page) => page.needsSubmission).map((page) => page.url)));
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof AdminApiError && err.status === 401) {
          router.replace('/admin/login?next=/admin/indexnow');
          return;
        }
        setError(err instanceof AdminApiError ? err.message : 'Impossible de charger les URLs IndexNow.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadPages, [router]);

  const toggleUrl = (url: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const submit = (onlyNeeded = false) => {
    setSubmitting(true);
    setMessage(null);
    setError(null);
    adminApi
      .post<{ submitted?: IndexNowPageRow[] }>('/admin-api/indexnow', { urls: [...selected], onlyNeeded })
      .then((payload) => {
        setMessage(`${payload.submitted?.length ?? 0} URL(s) envoyée(s) à Bing IndexNow.`);
        loadPages();
      })
      .catch((err: unknown) => setError(err instanceof AdminApiError ? err.message : 'Envoi IndexNow impossible.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <section>
      <p className="text-xs uppercase tracking-wider text-brand-500">SEO</p>
      <h1 className="mt-2 text-3xl font-bold">Bing IndexNow</h1>
      <p className="mt-3 max-w-3xl text-slate-300">
        Cochez les pages à envoyer à Bing. Les pages jamais envoyées ou modifiées depuis leur dernier envoi sont
        présélectionnées automatiquement.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded bg-brand-700 px-4 py-2 text-white disabled:opacity-50" disabled={submitting || selectedCount === 0} onClick={() => submit(false)}>
          Envoyer la sélection ({selectedCount})
        </button>
        <button className="rounded bg-slate-800 px-4 py-2 text-white disabled:opacity-50" disabled={submitting || pendingCount === 0} onClick={() => submit(true)}>
          Envoyer automatiquement les nouvelles/mises à jour ({pendingCount})
        </button>
        <button className="rounded border border-slate-700 px-4 py-2 text-slate-200" onClick={loadPages} disabled={loading || submitting}>
          Actualiser
        </button>
      </div>

      {message ? <p className="mt-4 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p> : null}
      {error ? <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-400">Chargement des pages…</p> : null}

      {!loading && pages.length > 0 ? (
        <div className="mt-6 overflow-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="px-3 py-3">Envoyer</th>
                <th className="px-3 py-3">URL</th>
                <th className="px-3 py-3">Dernière modification</th>
                <th className="px-3 py-3">Dernier envoi</th>
                <th className="px-3 py-3">État</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.url} className="border-t border-slate-800">
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.has(page.url)} onChange={() => toggleUrl(page.url)} /></td>
                  <td className="px-3 py-3 text-slate-200"><a className="underline" href={page.url} target="_blank">{page.url}</a></td>
                  <td className="px-3 py-3 text-slate-300">{formatDate(page.lastModified)}</td>
                  <td className="px-3 py-3 text-slate-300">{formatDate(page.submittedAt)}</td>
                  <td className="px-3 py-3">{page.needsSubmission ? <span className="text-amber-300">À envoyer</span> : <span className="text-emerald-300">Déjà envoyé</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
