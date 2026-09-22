import { NextResponse } from 'next/server';
import { buildInternalLinkReport, type InternalLinkReportPost } from '@/lib/admin/internal-link-report';
import { buildUpstreamAuthHeaders } from '@/lib/admin/upstream-token';
import { buildApiUrl } from '@/lib/api/env';

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => typeof value === 'string' ? value : '';

const extractItems = (payload: unknown): UnknownRecord[] => {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  for (const key of ['data', 'posts', 'items', 'docs']) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
    if (isRecord(value)) {
      for (const nestedKey of ['data', 'posts', 'items', 'docs']) {
        const nested = value[nestedKey];
        if (Array.isArray(nested)) return nested.filter(isRecord);
      }
    }
  }
  return [];
};

const contentFrom = (post: UnknownRecord) => {
  const contentJson = isRecord(post.contentJson) ? post.contentJson : undefined;
  return text(contentJson?.html) || text(post.contentHtml) || text(post.contentMarkdown) || text(post.content);
};

const toPost = (post: UnknownRecord): InternalLinkReportPost | undefined => {
  const id = text(post.id);
  const slug = text(post.slug);
  if (!id || !slug) return undefined;
  return {
    id,
    slug,
    title: text(post.title) || text(post.h1) || slug,
    locale: text(post.locale) === 'fr' ? 'fr' : 'en',
    status: text(post.status) || 'DRAFT',
    contentHtml: contentFrom(post),
    chapoHtml: text(post.chapoHtml) || text(post.excerpt)
  };
};

export async function GET() {
  const authHeaders = await buildUpstreamAuthHeaders();
  if (authHeaders === null) return NextResponse.json({ error: 'Session admin absente, reconnectez-vous.' }, { status: 401 });

  try {
    const listResponse = await fetch(buildApiUrl('/admin-api/posts'), { headers: authHeaders, cache: 'no-store' });
    if (!listResponse.ok) return NextResponse.json(await listResponse.json().catch(() => ({})), { status: listResponse.status });
    const summaries = extractItems(await listResponse.json());
    const detailed = await Promise.all(summaries.map(async (summary) => {
      if (contentFrom(summary)) return summary;
      const id = text(summary.id);
      if (!id) return summary;
      const response = await fetch(buildApiUrl(`/admin-api/posts/${encodeURIComponent(id)}`), { headers: authHeaders, cache: 'no-store' });
      if (!response.ok) return summary;
      const payload = await response.json().catch(() => ({}));
      return isRecord(payload) && isRecord(payload.data) ? payload.data : isRecord(payload) ? payload : summary;
    }));
    const posts = detailed.flatMap((post) => toPost(post) ?? []);
    const pages = buildInternalLinkReport(posts);
    const links = pages.reduce((total, page) => total + page.outgoing.length, 0);
    const brokenLinks = pages.reduce((total, page) => total + page.outgoing.filter((link) => link.broken).length, 0);
    return NextResponse.json({
      data: pages,
      summary: { pages: pages.length, links, orphanPages: pages.filter((page) => page.incoming.length === 0).length, brokenLinks },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Audit du maillage interne indisponible.' }, { status: 502 });
  }
}
