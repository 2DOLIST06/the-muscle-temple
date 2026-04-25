'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractApiMessage } from '@/lib/admin/api-contract';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reason') === 'session-expired') {
      setSessionMessage(params.get('message') ?? 'Session expirée, reconnectez-vous.');
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const payload = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      setError(extractApiMessage(payload, 'Connexion impossible.'));
      setLoading(false);
      return;
    }

    router.push('/admin/posts');
    router.refresh();
  };

  return (
    <section className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h1 className="text-2xl font-bold">Connexion admin</h1>
      <p className="mt-2 text-sm text-slate-300">Connectez-vous pour gérer les articles en base.</p>
      {sessionMessage ? (
        <p className="mt-4 rounded-lg border border-amber-700 bg-amber-950/30 p-3 text-sm text-amber-200">
          {sessionMessage}
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="admin@exemple.com"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </section>
  );
}
