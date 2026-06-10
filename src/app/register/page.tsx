'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            display_name: username.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-bg flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-400/40">
            <Shield className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Create Account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Use the same credentials on the child phone app and this dashboard
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl"
        >
          <div className="portal-form-stack space-y-5">
            <div>
              <label className="portal-label mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="portal-input w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-100 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                placeholder="parent_usman"
              />
            </div>
            <div>
              <label className="portal-label mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="portal-input w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-100 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                placeholder="parent@email.com"
              />
            </div>
            <div>
              <label className="portal-label mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="portal-input w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-slate-100 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="portal-btn portal-btn-solid mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-400 hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
