'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Plus,
  Trophy,
  Users,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { authAPI, debateAPI } from '@/lib/api';
import { getUser, removeToken, isAuthenticated, setUser as setStoredUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        removeToken();
        router.push('/login');
        return;
      }

      const currentUser = getUser();
      if (!currentUser) {
        removeToken();
        router.push('/login');
        return;
      }

      // Start with local cache, then replace with fresh server value.
      setUser(currentUser);

      try {
        const { data } = await authAPI.me();
        setUser(data);
        setStoredUser(data);
      } catch {
        // If profile refresh fails, keep cached user for this render.
      }

      await loadDebates();
      setLoadingAuth(false);
    };

    checkAuth();
  }, [router]);

  const loadDebates = async () => {
    try {
      const { data } = await debateAPI.getAll({ status: 'waiting,active' });
      setDebates(data);
    } catch {
      toast.error('Failed to load debates');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  if (loadingAuth) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <nav className="mx-auto mb-8 flex max-w-7xl items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="h-7 w-7 text-teal-700" />
          <span className="text-xl font-semibold text-slate-900">
            AI Debate Judge
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Welcome, <span className="font-semibold">{user.username}</span>
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="mx-auto mb-8 grid max-w-7xl gap-5 md:grid-cols-3">
        <StatCard
          icon={<MessageSquare className="h-7 w-7 text-teal-700" />}
          title="Total Debates"
          value={user.debateStats?.total || 0}
        />
        <StatCard
          icon={<Trophy className="h-7 w-7 text-amber-600" />}
          title="Wins"
          value={user.debateStats?.wins || 0}
        />
        <StatCard
          icon={<Users className="h-7 w-7 text-slate-700" />}
          title="Win Rate"
          value={
            user.debateStats?.total > 0
              ? `${Math.round(
                  (user.debateStats.wins / user.debateStats.total) * 100
                )}%`
              : '0%'
          }
        />
      </div>

      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Available Debates
          </h2>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900"
          >
            <Plus className="h-4 w-4" />
            Create Debate
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading debates...
          </div>
        ) : debates.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No debates available
          </div>
        ) : (
          <div className="space-y-4">
            {debates.map((debate) => (
              <DebateCard key={debate._id} debate={debate} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDebateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false);
            await loadDebates();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, title, value }: any) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div>
        <p className="text-sm text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      {icon}
    </div>
  );
}

function DebateCard({ debate }: any) {
  const router = useRouter();
  const user = getUser();
  const [joining, setJoining] = useState(false);
  const argumentLimit = debate?.settings?.argumentLimit ?? 5;

  const handleJoin = async (side: 'A' | 'B') => {
    setJoining(true);
    try {
      await debateAPI.join(debate._id, side);
      toast.success(`Joined Side ${side}`);
      router.push(`/debate/${debate._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join');
      setJoining(false);
    }
  };

  const canJoinA = !debate.sideA.users.some((u: any) => u._id === user?.id);
  const canJoinB = !debate.sideB.users.some((u: any) => u._id === user?.id);
  const isParticipant = !canJoinA || !canJoinB;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {debate.topic}
        </h3>

        {debate.description && (
          <p className="mt-1 text-sm text-slate-600">{debate.description}</p>
        )}

        <div className="mt-3 flex items-center gap-3 text-xs">
          <span
            className={`rounded-full px-3 py-1 ${
              debate.status === 'waiting'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-teal-100 text-teal-800'
            }`}
          >
            {debate.status}
          </span>

          <span className="text-slate-500">
            {debate.type === '1v1' ? '1 vs 1' : 'Team'}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Limit: {argumentLimit} / side
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-teal-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Side A</p>
          <p className="text-xs text-slate-600">{debate.sideA.position}</p>
          <p className="mt-1 text-sm text-slate-700">
            {debate.sideA.users.length > 0
              ? debate.sideA.users.map((u: any) => u.username).join(', ')
              : 'Waiting'}
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Side B</p>
          <p className="text-xs text-slate-600">{debate.sideB.position}</p>
          <p className="mt-1 text-sm text-slate-700">
            {debate.sideB.users.length > 0
              ? debate.sideB.users.map((u: any) => u.username).join(', ')
              : 'Waiting'}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {isParticipant ? (
          <button
            onClick={() => router.push(`/debate/${debate._id}`)}
            className="w-full rounded-xl bg-teal-800 py-2 text-sm font-semibold text-white hover:bg-teal-900"
          >
            View Debate
          </button>
        ) : (
          <>
            <button
              onClick={() => handleJoin('A')}
              disabled={joining || !canJoinA}
              className="flex-1 rounded-xl bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              Join A
            </button>

            <button
              onClick={() => handleJoin('B')}
              disabled={joining || !canJoinB}
              className="flex-1 rounded-xl bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Join B
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CreateDebateModal({ onClose, onSuccess }: any) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'1v1' | 'team'>('1v1');
  const [argumentLimit, setArgumentLimit] = useState<1 | 3 | 5>(3);
  const [sideAPosition, setSideAPosition] = useState('For');
  const [submitting, setSubmitting] = useState(false);

  const sideBPosition = sideAPosition === 'For' ? 'Against' : 'For';

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await debateAPI.create({
        topic,
        description,
        type,
        sideAPosition,
        sideBPosition,
        settings: {
          argumentLimit,
        },
      });

      toast.success('Debate created');

      if (onSuccess) await onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create debate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Create Debate
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Debate topic"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200"
          />

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200"
          >
            <option value="1v1">1 vs 1</option>
            <option value="team">Team</option>
          </select>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Arguments Per Side
            </label>
            <select
              value={argumentLimit}
              onChange={(e) => setArgumentLimit(Number(e.target.value) as 1 | 3 | 5)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Side A
              </label>
              <select
                value={sideAPosition}
                onChange={(e) => setSideAPosition(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200"
              >
                <option value="For">For</option>
                <option value="Against">Against</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Side B
              </label>
              <input
                value={sideBPosition}
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}