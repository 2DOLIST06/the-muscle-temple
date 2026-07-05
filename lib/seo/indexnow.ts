import 'server-only';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getLocalizedSitemap } from '@/lib/seo/sitemap';

export interface IndexNowPage {
  url: string;
  lastModified: string;
  submittedAt: string | null;
  needsSubmission: boolean;
}

interface Store {
  submissions: Record<string, { submittedAt: string; lastModified: string }>;
}

export class IndexNowError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'IndexNowError';
    this.status = status;
  }
}

const primaryStorePath = process.env.INDEXNOW_STORE_PATH?.trim() || path.join(process.cwd(), 'data', 'indexnow-submissions.json');
const fallbackStorePath = path.join(os.tmpdir(), 'indexnow-submissions.json');
const storePaths = primaryStorePath === fallbackStorePath ? [primaryStorePath] : [primaryStorePath, fallbackStorePath];
const endpoint = 'https://www.bing.com/indexnow';

const readStore = async (): Promise<Store> => {
  for (const storePath of storePaths) {
    try {
      const raw = await fs.readFile(storePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<Store>;
      return { submissions: parsed.submissions ?? {} };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  return { submissions: {} };
};

const writeStore = async (store: Store) => {
  let lastError: unknown;

  for (const storePath of storePaths) {
    try {
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

export const getConfiguredIndexNowKey = () => process.env.INDEXNOW_KEY?.trim() || process.env.BING_INDEXNOW_KEY?.trim() || '';

export const getIndexNowPages = async (): Promise<IndexNowPage[]> => {
  const [enEntries, frEntries, store] = await Promise.all([getLocalizedSitemap('en'), getLocalizedSitemap('fr'), readStore()]);
  const byUrl = new Map<string, string>();

  for (const entry of [...enEntries, ...frEntries]) {
    if (!entry.url) continue;
    const lastModified = new Date(entry.lastModified ?? new Date()).toISOString();
    const previous = byUrl.get(entry.url);
    if (!previous || new Date(lastModified).getTime() > new Date(previous).getTime()) byUrl.set(entry.url, lastModified);
  }

  return [...byUrl.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([url, lastModified]) => {
      const submission = store.submissions[url];
      const submittedAt = submission?.submittedAt ?? null;
      return {
        url,
        lastModified,
        submittedAt,
        needsSubmission: !submission || new Date(lastModified).getTime() > new Date(submission.lastModified).getTime()
      };
    });
};

const assertKeyFileIsReachable = async (keyLocation: string, key: string) => {
  const response = await fetch(keyLocation, { cache: 'no-store' });
  const body = await response.text().catch(() => '');

  if (!response.ok || body.trim() !== key) {
    throw new IndexNowError(
      `Fichier de clé IndexNow inaccessible ou invalide (${keyLocation}). Vérifiez que INDEXNOW_KEY est configurée en production et que cette URL affiche exactement la clé.`,
      400
    );
  }
};

export const submitIndexNowUrls = async (urls: string[]) => {
  const key = getConfiguredIndexNowKey();
  if (!key) throw new IndexNowError('Clé IndexNow absente. Définissez INDEXNOW_KEY ou BING_INDEXNOW_KEY.', 400);

  const pages = await getIndexNowPages();
  const allowed = new Map(pages.map((page) => [page.url, page]));
  const selected = [...new Set(urls)].map((url) => allowed.get(url)).filter((page): page is IndexNowPage => Boolean(page));
  if (selected.length === 0) return { submitted: [] as IndexNowPage[] };

  const host = new URL(selected[0].url).hostname;
  const keyLocation = `https://${host}/${key}.txt`;
  await assertKeyFileIsReachable(keyLocation, key);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation, urlList: selected.map((page) => page.url) })
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new IndexNowError(`Bing IndexNow a refusé l’envoi (${response.status})${message ? `: ${message}` : '.'}`, response.status);
  }

  const submittedAt = new Date().toISOString();
  const store = await readStore();
  for (const page of selected) store.submissions[page.url] = { submittedAt, lastModified: page.lastModified };
  await writeStore(store);
  return { submitted: selected.map((page) => ({ ...page, submittedAt, needsSubmission: false })) };
};
