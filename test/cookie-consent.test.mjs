import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { ConsentManager, CONSENT_KEY, cleanupBrowserService, expiresAt } from '../lib/consent/manager.ts';
import { services } from '../lib/consent/registry.ts';

function fixture(mode = 'stopped') {
  const local = new Map([['user_jwt', 'member'], ['admin_jwt', 'admin'], ['mt_admin_posts', 'draft'], ['affiliate_key', 'unchanged']]);
  const session = new Map();
  const counters = { start: 0, stop: 0, reload: 0, requests: 0, reads: 0 };
  let now = new Date('2026-01-31T12:00:00.000Z');
  let blocked = false;
  const service = {
    id: 'test-only', name: 'Test only', purpose: { en: 'Test', fr: 'Test' },
    category: 'statistics', resources: ['https://test-only.invalid/sdk.js'],
    cleanup: { cookies: [{ name: 'test_cookie', path: '/' }], localStorage: ['test_stat'], sessionStorage: ['test_session'] },
    activate() { counters.start++; counters.requests++; counters.reads++; local.set('test_stat', 'active'); session.set('test_session', 'active'); },
    stop() { counters.stop++; return mode; }
  };
  const env = {
    storage() { if (blocked) throw Error('disabled'); return { getItem: key => local.get(key) ?? null, setItem: (key, value) => local.set(key, value) }; },
    now: () => now,
    cleanup(service) { service.cleanup.localStorage.forEach(key => local.delete(key)); service.cleanup.sessionStorage.forEach(key => session.delete(key)); },
    reload() { counters.reload++; }
  };
  return { local, session, counters, service, env, create: (list = [service], version = '1') => new ConsentManager(list, version, env), time: value => { now = new Date(value); }, block: value => { blocked = value; } };
}

test('production registry is empty; first visit causes no optional initialization, read, write or request', () => {
  assert.deepEqual(services, []);
  const f = fixture(); const m = f.create(); m.refresh();
  assert.equal(m.choice, null); assert.equal(f.counters.start, 0); assert.equal(f.counters.requests, 0); assert.equal(f.counters.reads, 0);
  assert.equal(f.local.has(CONSENT_KEY), false); assert.equal(f.local.has('test_stat'), false);
});

test('accepting an empty registry hides the banner but never authorizes a future service', () => {
  const f = fixture(); const empty = f.create([]); empty.refresh();
  assert.equal(empty.save([]), true);
  const sameRegistryAfterReload = f.create([]); sameRegistryAfterReload.refresh();
  assert.deepEqual(sameRegistryAfterReload.choice.categories, []);
  const future = f.create(); future.refresh();
  assert.equal(future.choice, null); assert.equal(f.counters.start, 0);
});

test('refusal survives repeated refresh (navigation) and a fresh manager (reload), without extending retention', () => {
  const f = fixture(); const m = f.create(); m.refresh(); assert.equal(m.save([]), true);
  const saved = f.local.get(CONSENT_KEY);
  f.time('2026-03-01T12:00:00.000Z'); m.refresh(); m.refresh();
  const reloaded = f.create(); reloaded.refresh();
  assert.deepEqual(reloaded.choice.categories, []); assert.equal(f.local.get(CONSENT_KEY), saved); assert.equal(f.counters.start, 0);
  assert.deepEqual(Object.keys(JSON.parse(saved)).sort(), ['categories', 'chosenAt', 'version']);
});

test('accept only one category, avoid duplicate starts; withdrawal cleans only identified storage', () => {
  const f = fixture(); let ads = 0;
  const advertising = { ...f.service, id: 'ad-test', category: 'advertising', activate() { ads++; }, cleanup: { cookies: [], localStorage: [], sessionStorage: [] } };
  const m = f.create([f.service, advertising]); m.refresh(); m.save(['statistics']); m.refresh(); m.refresh();
  assert.equal(f.counters.start, 1); assert.equal(ads, 0);
  m.save([]); m.refresh(); assert.equal(f.counters.stop, 1); assert.equal(f.local.has('test_stat'), false); assert.equal(f.session.has('test_session'), false);
  for (const key of ['user_jwt', 'admin_jwt', 'mt_admin_posts', 'affiliate_key']) assert.equal(f.local.has(key), true);
  assert.equal(f.counters.start, 1);
});

test('expiry is six calendar months and is not renewed by visits; active service stops on expiry', () => {
  assert.equal(expiresAt('2026-08-31T12:00:00.000Z'), Date.parse('2027-02-28T12:00:00.000Z'));
  const f = fixture(); const m = f.create(); m.save(['statistics']);
  f.time('2026-07-31T12:00:00.000Z'); m.refresh();
  assert.equal(m.choice, null); assert.equal(f.counters.stop, 1); assert.equal(f.local.has('test_stat'), false);
});

test('malformed, future, unknown-category, duplicate-category and outdated choices fail closed', () => {
  const f = fixture(); const m = f.create(); m.save(['statistics']);
  const good = JSON.parse(f.local.get(CONSENT_KEY));
  for (const value of ['broken', 'null', '{}', JSON.stringify({ ...good, chosenAt: '2027-01-01T00:00:00.000Z' }), JSON.stringify({ ...good, categories: ['unknown'] }), JSON.stringify({ ...good, categories: ['statistics', 'statistics'] }), JSON.stringify({ ...good, version: 'old' }), JSON.stringify({ ...good, chosenAt: 123 })]) {
    f.local.set(CONSENT_KEY, value); const fresh = f.create(); fresh.refresh(); assert.equal(fresh.choice, null);
  }
  assert.equal(f.counters.start, 1);
});

test('new service or purpose invalidates old consent even without policy bump', () => {
  const f = fixture(); f.create().save(['statistics']);
  for (const list of [[{ ...f.service, purpose: { en: 'New purpose', fr: 'Nouvelle finalité' } }], [f.service, { ...f.service, id: 'new-service' }]]) {
    const m = f.create(list); m.refresh(); assert.equal(m.choice, null);
  }
  const changedPolicy = f.create([f.service], '2'); changedPolicy.refresh(); assert.equal(changedPolicy.choice, null);
});

test('unavailable storage blocks acceptance; failed withdrawal stops active service and stays blocked', () => {
  const f = fixture(); const m = f.create(); f.block(true); m.refresh(); assert.equal(m.save(['statistics']), false); assert.equal(f.counters.start, 0);
  f.block(false); assert.equal(m.save(['statistics']), true); assert.equal(f.counters.start, 1);
  f.block(true); assert.equal(m.save([]), false); assert.equal(f.counters.stop, 1);
  f.block(false); m.refresh(); assert.equal(m.choice, null); assert.equal(f.counters.start, 1);
});

test('silently ignored writes never authorize optional services', () => {
  const f = fixture(); const m = new ConsentManager([f.service], '1', { ...f.env, storage: () => ({ getItem: () => null, setItem() {} }) });
  assert.equal(m.save(['statistics']), false); assert.equal(f.counters.start, 0);
});

test('unstoppable service saves refusal before reloading and cannot activate again', () => {
  const f = fixture('reload'); const m = f.create(); m.save(['statistics']); m.save([]);
  assert.deepEqual(JSON.parse(f.local.get(CONSENT_KEY)).categories, []); assert.equal(f.counters.reload, 1);
  const fresh = f.create(); fresh.refresh(); assert.equal(f.counters.start, 1);
});

test('activation and stop errors fail safely', () => {
  const f = fixture(); f.service.activate = () => { throw Error('partial initialization'); }; f.service.stop = () => { throw Error('cannot stop'); };
  f.create().save(['statistics']); assert.equal(f.counters.reload, 1);
});

test('protected auth/admin/consent keys and duplicate services cannot be declared for cleanup', () => {
  const f = fixture();
  for (const key of ['user_jwt', 'admin_jwt', 'mt_admin_posts', 'admin-header-hidden', 'adminToken', CONSENT_KEY]) {
    assert.throws(() => f.create([{ ...f.service, cleanup: { cookies: [{ name: key, path: '/' }], localStorage: [], sessionStorage: [] } }]));
  }
  assert.throws(() => f.create([f.service, f.service]));
});

test('browser cleanup targets exact declared cookie scopes and keys only', () => {
  const f = fixture(); const cookies = [];
  globalThis.document = { set cookie(value) { cookies.push(value); } };
  globalThis.window = { localStorage: { removeItem: key => f.local.delete(key) }, sessionStorage: { removeItem: key => f.session.delete(key) } };
  try {
    cleanupBrowserService(f.service);
    assert.deepEqual(cookies, ['test_cookie=; Max-Age=0; Path=/; SameSite=Lax']);
    assert.equal(f.local.get('user_jwt'), 'member'); assert.equal(f.local.get('admin_jwt'), 'admin'); assert.equal(f.local.get('affiliate_key'), 'unchanged');
  } finally { delete globalThis.document; delete globalThis.window; }
});

test('authentication contracts remain essential, HttpOnly and separate from consent', () => {
  for (const [file, name] of [['lib/user/auth.ts', 'user_jwt'], ['lib/admin/auth.ts', 'admin_jwt']]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.ok(source.includes(name)); assert.match(source, /httpOnly: true/); assert.match(source, /maxAge: 60 \* 60 \* 12/); assert.doesNotMatch(source, /consent/i);
  }
});
