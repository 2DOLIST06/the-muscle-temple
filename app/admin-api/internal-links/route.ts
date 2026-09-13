import { NextResponse } from 'next/server';
import { buildDynamicInternalLinkUrl, getStaticInternalLinkTargets, internalLinkTypeOrder, type InternalLinkTarget, type InternalLinkTargetType } from '@/lib/admin/internal-links';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { buildApiUrl } from '@/lib/api/env';
import type { Locale } from '@/lib/i18n/routing';

type ApiItem = Record<string, unknown>;

const collectionPaths: Record<Exclude<InternalLinkTargetType, 'static'>, string> = {
  post: '/admin-api/posts',
  category: '/admin-api/categories',
  author: '/admin-api/authors'
};

const asRecord = (value: unknown): ApiItem | undefined => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as ApiItem : undefined;
const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const recordsOnly = (values: unknown[]): ApiItem[] => values.map(asRecord).filter((item): item is ApiItem => item !== undefined);

const extractItems = (payload: unknown): ApiItem[] => {
  if (Array.isArray(payload)) return recordsOnly(payload);
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ['data', 'docs', 'items', 'posts', 'categories', 'authors']) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return recordsOnly(candidate);
    const nested = asRecord(candidate);
    if (nested) {
      for (const nestedKey of ['docs', 'items', 'posts', 'categories', 'authors']) {
        if (Array.isArray(nested[nestedKey])) return recordsOnly(nested[nestedKey] as unknown[]);
      }
    }
  }
  return [];
};

const isSearchable = (item: ApiItem, type: Exclude<InternalLinkTargetType, 'static'>, locale: Locale) => {
  const status = stringValue(item.status).toUpperCase();
  if (status && status !== 'PUBLISHED') return false;
  if (item.isActive === false || item.isIndexable === false) return false;
  if (/\bnoindex\b/i.test(stringValue(item.robots))) return false;
  const itemLocale = stringValue(item.locale);
  // Older category/author responses do not expose locale; available fields are
  // enforced without treating missing localization metadata as unpublished.
  return !itemLocale || itemLocale === locale;
};

const toTarget = (item: ApiItem, type: Exclude<InternalLinkTargetType, 'static'>, locale: Locale): InternalLinkTarget | undefined => {
  const slug = stringValue(item.slug);
  const id = stringValue(item.id) || slug;
  const title = stringValue(item.title) || stringValue(item.name) || stringValue(item.h1) || slug;
  if (!id || !slug || !title || !isSearchable(item, type, locale)) return undefined;
  return { id, title, type, locale, slug, url: buildDynamicInternalLinkUrl(type, locale, slug) };
};

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

const scoreTarget = (target: InternalLinkTarget, query: string) => {
  if (!query) return 6;
  const title = normalizeSearch(target.title);
  const slug = normalizeSearch(target.slug ?? '');
  const url = normalizeSearch(target.url);
  if (title === query || slug === query || url === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (slug.includes(query)) return 3;
  if (url.includes(query)) return 4;
  return Number.POSITIVE_INFINITY;
};

export async function GET(request: Request) {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const locale: Locale = params.get('locale') === 'en' ? 'en' : 'fr';
  const requestedType = params.get('type') ?? 'all';
  const allowedTypes = new Set<string>(['all', ...internalLinkTypeOrder]);
  if (!allowedTypes.has(requestedType)) return NextResponse.json({ error: 'Type de destination invalide.' }, { status: 400 });
  const limit = Math.min(Math.max(Number.parseInt(params.get('limit') ?? '20', 10) || 20, 1), 50);
  const query = normalizeSearch((params.get('q') ?? '').trim());
  const dynamicTypes = internalLinkTypeOrder.filter((type): type is Exclude<InternalLinkTargetType, 'static'> => type !== 'static' && (requestedType === 'all' || requestedType === type));

  try {
    const responses = await Promise.all(dynamicTypes.map(async (type) => {
      const response = await fetch(buildApiUrl(collectionPaths[type]), { headers: authHeaders, cache: 'no-store' });
      if (!response.ok) throw new Error(`La collection ${type} est indisponible.`);
      return { type, payload: await response.json().catch(() => ({})) };
    }));
    const dynamicTargets = responses.flatMap(({ type, payload }) => extractItems(payload).flatMap((item) => toTarget(item, type, locale) ?? []));
    const staticTargets = requestedType === 'all' || requestedType === 'static' ? getStaticInternalLinkTargets(locale) : [];
    const data = [...dynamicTargets, ...staticTargets]
      .map((target) => ({ target, score: scoreTarget(target, query), typeOrder: internalLinkTypeOrder.indexOf(target.type) }))
      .filter((entry) => Number.isFinite(entry.score))
      .sort((a, b) => a.score - b.score || a.typeOrder - b.typeOrder || a.target.title.localeCompare(b.target.title, locale))
      .slice(0, limit)
      .map(({ target }) => target);
    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Recherche de liens internes indisponible.' }, { status: 502 });
  }
}
