'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminApiError, adminApi } from '@/lib/admin/api-client';

interface IndexNowPageRow {
  url: string;
  lastModified: string | null;
  submittedAt: string | null;
  needsSubmission: boolean;
  submissionReason: 'never-submitted' | 'modified' | 'unchanged';
}

type ModificationSortDirection = 'desc' | 'asc';

const formatDate = (value: string | null, emptyLabel = 'Jamais') =>
  value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : emptyLabel;

const statusLabel = (page: IndexNowPageRow) => {
  if (page.submissionReason === 'never-submitted') return 'Jamais envoyée';
  if (page.submissionReason === 'modified') return `Modifiée depuis l’envoi du ${formatDate(page.submittedAt)}`;
  return 'Aucune modification détectée';
};

export default function AdminIndexNowPage() {
  const router = useRouter();
  const [pages, setPages] = useState<IndexNowPageRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modificationSortDirection, setModificationSortDirection] = useState<ModificationSortDirection>('desc');
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedCount = selected.size;
  const pendingCount = useMemo(() => pages.filter((page) => page.needsSubmission).length, [pages]);
  const allSelected = pages.length > 0 && selectedCount === pages.length;
  const partiallySelected = selectedCount > 0 && !allSelected;
  const sortedPages = useMemo(
    () =>
      [...pages].sort((firstPage, secondPage) => {
        const firstDate = firstPage.lastModified ? new Date(firstPage.lastModified).getTime() : null;
        const secondDate = secondPage.lastModified ? new Date(secondPage.lastModified).getTime() : null;

        if (firstDate === null) return secondDate === null ? 0 : 1;
        if (secondDate === null) return -1;

        return modificationSortDirection === 'desc' ? secondDate - firstDate : firstDate - secondDate;
      }),
    [modificationSortDirection, pages],
  );

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

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

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(pages.map((page) => page.url)));
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
        présélectionnées automatiquement. L’état explique si l’URL n’a jamais été envoyée, a été modifiée ou n’a pas changé.
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
                <th className="px-3 py-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={allSelected ? 'Tout décocher' : 'Tout cocher'}
                  />
                </th>
                <th className="px-3 py-3">URL</th>
                <th className="px-3 py-3" aria-sort={modificationSortDirection === 'desc' ? 'descending' : 'ascending'}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 hover:text-white"
                    onClick={() => setModificationSortDirection((direction) => (direction === 'desc' ? 'asc' : 'desc'))}
                  >
                    Dernière modification
                    <span aria-hidden="true">{modificationSortDirection === 'desc' ? '↓' : '↑'}</span>
                    <span className="sr-only">
                      {modificationSortDirection === 'desc' ? '(plus récentes en premier)' : '(plus anciennes en premier)'}
                    </span>
                  </button>
                </th>
                <th className="px-3 py-3">Dernier envoi</th>
                <th className="px-3 py-3">État</th>
              </tr>
            </thead>
            <tbody>
              {sortedPages.map((page) => (
                <tr key={page.url} className="border-t border-slate-800">
                  <td className="px-3 py-3"><input type="checkbox" checked={selected.has(page.url)} onChange={() => toggleUrl(page.url)} aria-label={`Envoyer ${page.url}`} /></td>
                  <td className="px-3 py-3 text-slate-200"><a className="underline" href={page.url} target="_blank">{page.url}</a></td>
                  <td className="px-3 py-3 text-slate-300">{formatDate(page.lastModified, 'Non applicable')}</td>
                  <td className="px-3 py-3 text-slate-300">{formatDate(page.submittedAt)}</td>
                  <td className="px-3 py-3"><span className={page.needsSubmission ? 'text-amber-300' : 'text-emerald-300'}>{statusLabel(page)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
