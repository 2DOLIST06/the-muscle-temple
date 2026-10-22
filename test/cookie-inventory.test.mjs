import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = readFileSync(new URL('../components/legal/CookieServiceInventory.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText
  .replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
  .replaceAll("'@/lib/consent/registry'", JSON.stringify(new URL('../lib/consent/registry.ts', import.meta.url).href));
const { CookieServiceInventory } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

test('cookie policy inventory reflects current empty registry in both languages', () => {
  for (const locale of ['fr', 'en']) {
    const html = renderToStaticMarkup(React.createElement(CookieServiceInventory, { locale }));
    assert.match(html, locale === 'fr' ? /Aucun service facultatif/ : /No optional statistics/);
    assert.doesNotMatch(html, /affiliat/);
    assert.match(html, locale === 'fr' ? /Cette liste est mise à jour/ : /This list is updated/);
  }
});

test('a future declaration appears in the policy with its actual storage, purpose, provider and duration without activation', () => {
  const neverRun = () => { throw new Error('Legal inventory must never initialize a service'); };
  const service = {
    id: 'test-only', name: 'Inventory fixture', category: 'statistics',
    purpose: { fr: 'Finalité de test', en: 'Test purpose' },
    resources: ['https://test-only.invalid/sdk.js'],
    disclosure: { provider: 'Test Provider', retention: { fr: '30 jours', en: '30 days' }, privacyPolicyUrl: 'https://test-only.invalid/privacy', thirdPartyCookies: [{ name: 'third_party_test', domain: 'test-only.invalid', retention: { fr: '1 jour', en: '1 day' } }] },
    cleanup: { cookies: [{ name: 'test_cookie', path: '/', domain: 'example.invalid' }], localStorage: ['test_local'], sessionStorage: ['test_session'] },
    activate: neverRun, stop: neverRun
  };
  for (const locale of ['fr', 'en']) {
    const html = renderToStaticMarkup(React.createElement(CookieServiceInventory, { locale, registry: [service] }));
    for (const expected of ['Inventory fixture', 'Test Provider', 'test_cookie', 'test_local', 'test_session', 'third_party_test', 'https://test-only.invalid/privacy', service.disclosure.retention[locale], service.purpose[locale]]) assert.ok(html.includes(expected), expected);
    assert.doesNotMatch(html, /Aucun service facultatif|No optional statistics/);
  }
});
