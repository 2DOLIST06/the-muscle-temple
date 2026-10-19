import assert from 'node:assert/strict';
import test from 'node:test';
import { isSameOriginAdminRequest } from '../lib/admin/request-origin.ts';

for (const [name, url, headers, allowed] of [
  ['direct browser write', 'http://localhost:3199/admin-api/posts/affiliate-banner', { origin: 'http://localhost:3199' }, true],
  ['external Host differs from Next internal URL', 'http://localhost:3199/admin-api/posts/affiliate-banner', { host: '127.0.0.1:3199', origin: 'http://127.0.0.1:3199' }, true],
  ['TLS reverse proxy', 'http://localhost:3000/admin-api/posts/affiliate-banner', { host: 'bodytrainingguide.com', origin: 'https://bodytrainingguide.com', 'x-forwarded-proto': 'https' }, true],
  ['canonical default port', 'http://localhost:3000/admin-api/posts/affiliate-banner', { host: 'BODYTRAININGGUIDE.COM:443', origin: 'https://bodytrainingguide.com', 'x-forwarded-proto': 'https' }, true],
  ['foreign origin', 'http://localhost:3199/admin-api/posts/affiliate-banner', { host: 'localhost:3199', origin: 'https://foreign.invalid' }, false],
  ['opaque preview origin', 'http://localhost:3199/admin-api/posts/affiliate-banner', { origin: 'null' }, false],
  ['wrong protocol', 'http://localhost:3199/admin-api/posts/affiliate-banner', { origin: 'https://localhost:3199' }, false],
  ['non-browser client still subject to API authentication', 'http://localhost:3199/admin-api/posts/affiliate-banner', {}, true]
]) {
  test(name, () => assert.equal(isSameOriginAdminRequest(new Request(url, { method: 'POST', headers })), allowed));
}
