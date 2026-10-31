import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import renderer from 'react-test-renderer';
const require = createRequire(import.meta.url),
  { act } = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => (name in mocks ? mocks[name] : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const user = {
  id: 'member-1',
  email: 'new@example.com',
  role: 'USER',
  displayName: '',
  firstName: null,
  lastName: null,
  phone: null,
  address: null,
  postalCode: null,
  city: null,
  country: null,
};
const initial = () => ({
  language: 'fr',
  topics: {
    new_articles: true,
    strength_training: true,
    workout_programs: true,
    nutrition: true,
    supplements: true,
    equipment: true,
    tools: true,
    guides: true,
  },
  goals: [],
  frequency: 'weekly',
  unsubscribed: false,
  subscribed: true,
});
const button = (root, label) => root.root.findAllByType('button').find((b) => b.children.join('') === label);
function fixture(existing = false) {
  let serverUser = null,
    context,
    settings = initial();
  const calls = [];
  const api = {
    me: async () => {
      if (!serverUser) throw Error('anonymous');
      return serverUser;
    },
    startNewsletter: async (...args) => {
      calls.push(['start', ...args]);
      if (existing) return { status: 'existing', authenticated: false };
      serverUser = user;
      return { status: 'active', authenticated: true, user };
    },
    newsletterSettings: async () => settings,
    saveNewsletter: async (value) => {
      settings = value;
      calls.push(['save', value]);
      return value;
    },
    unsubscribeNewsletter: async () => calls.push(['unsubscribe']),
    requestLoginLink: async (...args) => calls.push(['link', ...args]),
  };
  class UserApiError extends Error {}
  const lib = load('lib/newsletter.ts', { '@/lib/api/env': {} });
  const contextModule = load('components/user/UserSessionProvider.tsx', {
    '@/lib/user/api-client': { userApi: api, UserApiError },
  });
  const router = {
    push: (path) => calls.push(['navigate', path]),
    replace: (path) => calls.push(['navigate', path]),
  };
  const params = { get: (key) => (key === 'tab' ? 'newsletter' : null) };
  const mocks = {
    'next/link': Link,
    'next/navigation': { useRouter: () => router, useSearchParams: () => params },
    '@/lib/newsletter': lib,
    '@/lib/user/api-client': { userApi: api, UserApiError },
    '@/components/user/UserSessionProvider': contextModule,
    './UserSessionProvider': contextModule,
  };
  const Signup = load('components/blog/NewsletterCta.tsx', mocks).NewsletterSignup;
  const Prefs = load('components/newsletter/NewsletterPreferencesForm.tsx', mocks).NewsletterPreferencesForm;
  const Auth = load('components/user/AuthForm.tsx', mocks).AuthForm;
  const Account = load('components/user/AccountPage.tsx', {
    ...mocks,
    '@/components/newsletter/NewsletterPreferencesForm': { NewsletterPreferencesForm: Prefs },
    '@/components/blog/NewsletterCta': { NewsletterSignup: Signup },
    './AuthForm': { AuthForm: Auth },
    '@/components/nutrition/NutritionTracker': { NutritionTracker: () => null },
  }).AccountPage;
  function Screen() {
    context = contextModule.useUserSession();
    return context.newsletterEntry
      ? React.createElement(Account, { locale: 'fr' })
      : React.createElement(Signup, { locale: 'fr', source: 'footer' });
  }
  return {
    app: () => React.createElement(contextModule.UserSessionProvider, null, React.createElement(Screen)),
    calls,
    context: () => context,
    api,
  };
}
test('footer signs in immediately and opens the one account editor; preferences and global unsubscribe work', async () => {
  const f = fixture();
  let root;
  await act(async () => {
    root = renderer.create(f.app());
  });
  try {
    assert.equal(root.root.findAllByProps({ type: 'checkbox' }).length, 0);
    act(() => root.root.findByProps({ type: 'email' }).props.onChange({ target: { value: user.email } }));
    await act(async () => root.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    assert.equal(f.context().status, 'authenticated');
    assert.deepEqual(f.calls[0], ['start', user.email, 'fr', 'footer']);
    assert.deepEqual(f.calls[1], ['navigate', '/fr/mon-compte?tab=newsletter']);
    assert.equal(root.root.findAllByProps({ role: 'tab' }).length, 4);
    const topics = root.root.findAllByProps({ type: 'checkbox' }).slice(0, 8);
    assert.equal(topics.length, 8);
    assert.ok(topics.every((t) => t.props.checked));
    act(() => topics[3].props.onChange());
    await act(async () => button(root, 'Enregistrer mes préférences').props.onClick());
    assert.equal(f.calls.at(-1)[0], 'save');
    assert.equal(f.calls.at(-1)[1].topics.nutrition, false);
    act(() => button(root, 'Se désabonner').props.onClick());
    await act(async () => button(root, 'Confirmer la désinscription').props.onClick());
    assert.equal(f.calls.at(-1)[0], 'unsubscribe');
    assert.ok(button(root, 'Réactiver mes abonnements'));
  } finally {
    act(() => root.unmount());
  }
});
test('known address preserves its email on the account sign-in form, without exposing preferences', async () => {
  const f = fixture(true);
  let root;
  await act(async () => {
    root = renderer.create(f.app());
  });
  try {
    act(() => root.root.findByProps({ type: 'email' }).props.onChange({ target: { value: user.email } }));
    await act(async () => root.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    assert.notEqual(f.context().status, 'authenticated');
    assert.equal(root.root.findByProps({ type: 'email' }).props.value, user.email);
    assert.equal(root.root.findAllByProps({ type: 'checkbox' }).length, 0);
    await act(async () => root.root.findByType('form').props.onSubmit({ preventDefault() {} }));
    assert.deepEqual(f.calls.at(-1), ['link', user.email, 'fr']);
    assert.ok(button(root, 'Inscrire une autre adresse email'));
  } finally {
    act(() => root.unmount());
  }
});
test('signup proxy sets only an HttpOnly session cookie and never exposes its JWT to browser code', async () => {
  const oldFetch = globalThis.fetch,
    calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push([url, init]);
    return new Response(
      JSON.stringify({ token: 'private-jwt', authenticated: true, user, status: 'active' }),
      { status: 201 },
    );
  };
  const cookies = [];
  const NextResponse = {
    json: (data, init = {}) => ({
      data,
      status: init.status ?? 200,
      cookies: { set: (...args) => cookies.push(args), delete: () => {} },
      ...init,
    }),
  };
  const origin = load('lib/admin/request-origin.ts');
  const proxy = load('lib/user/auth-proxy.ts', {
    '@/lib/admin/request-origin': origin,
    'next/server': { NextResponse },
    '@/lib/api/env': { buildApiUrl: (path) => 'https://api.example' + path },
    './auth': {
      getUserJwt: async () => null,
      USER_AUTH_COOKIE: 'user_jwt',
      userCookieOptions: () => ({ httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 43200 }),
    },
  }).authProxy;
  try {
    const req = new Request('http://localhost:3000/user-api/auth/newsletter/start', {
      method: 'POST',
      headers: {
        host: 'bodytrainingguide.com',
        origin: 'https://bodytrainingguide.com',
        'x-forwarded-proto': 'https',
      },
      body: '{}',
    });
    const result = await proxy(req, '/api/auth/newsletter/start', false, true, true);
    assert.equal(result.status, 201);
    assert.equal(result.data.token, undefined);
    assert.equal(result.data.authenticated, true);
    assert.equal(cookies[0][0], 'user_jwt');
    assert.equal(cookies[0][2].httpOnly, true);
    assert.equal(calls[0][1].redirect, 'error');
    const rejected = await proxy(
      new Request('https://bodytrainingguide.com/user-api/auth/newsletter/start', {
        method: 'POST',
        headers: { origin: 'https://evil.invalid' },
        body: '{}',
      }),
      '/api/auth/newsletter/start',
      false,
      true,
      true,
    );
    assert.equal(rejected.status, 403);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = oldFetch;
  }
});
test('delayed anonymous session response cannot overwrite a freshly created member session', async () => {
  let reject, context;
  const pending = new Promise((resolve, fail) => (reject = fail));
  const module = load('components/user/UserSessionProvider.tsx', {
    '@/lib/user/api-client': { userApi: { me: () => pending }, UserApiError: class extends Error {} },
  });
  function Probe() {
    context = module.useUserSession();
    return null;
  }
  let root;
  await act(async () => {
    root = renderer.create(React.createElement(module.UserSessionProvider, null, React.createElement(Probe)));
  });
  try {
    act(() => context.completeSignup(user));
    await act(async () => reject(Error('old anonymous response')));
    assert.equal(context.status, 'authenticated');
    assert.equal(context.user.id, user.id);
  } finally {
    act(() => root.unmount());
  }
});
