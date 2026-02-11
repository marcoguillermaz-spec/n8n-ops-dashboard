'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      setError('Password errata');
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-2xl">
            📦
          </div>
        </div>

        <h1 className="text-center text-xl font-semibold tracking-tight">
          Shipping Dashboard
        </h1>
        <p className="text-center text-sm text-gray-400">
          Inserisci la password per accedere
        </p>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm
                       placeholder-gray-500 outline-none transition
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium
                     transition hover:bg-blue-500 disabled:opacity-40"
        >
          {loading ? 'Accesso…' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
