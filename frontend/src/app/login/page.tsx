'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await authAPI.login(formData);
      setToken(data.token);
      setUser(data.user);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const goToHome = () => {
    router.push('/');
  };

  return (
    <div className="relative min-h-screen px-4 py-8">
      <button
        onClick={goToHome}
        className="absolute left-4 top-4 rounded-lg border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Home
      </button>

      <div className="surface-card w-full max-w-md p-8 sm:p-10">
        <div className="flex items-center justify-center mb-8">
          <Scale className="mr-3 h-11 w-11 text-teal-700" />
          <h1 className="display-face text-4xl font-extrabold text-slate-900">Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brand-button w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-700">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
