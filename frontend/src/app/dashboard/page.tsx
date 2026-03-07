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
import { debateAPI } from '@/lib/api';
import { getUser, removeToken, isAuthenticated } from '@/lib/auth';
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

      setUser(currentUser);
      await loadDebates();
      setLoadingAuth(false);
    };

    checkAuth();
  }, [router]);

  const loadDebates = async () => {
    try {
      const { data } = await debateAPI.getAll({ status: 'waiting,active' });
      setDebates(data);
    } catch (error) {
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
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navbar */}
      <nav className="surface-card mb-8 flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Scale className="h-8 w-8 text-teal-700" />
          <span className="display-face text-2xl font-bold text-slate-900">AI Debate Judge</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-700">
            Welcome, <span className="font-semibold">{user.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-8">
        <StatCard icon={<MessageSquare className="w-8 h-8 text-teal-700" />} title="Total Debates" value={user.debateStats?.total || 0} />
        <StatCard icon={<Trophy className="w-8 h-8 text-amber-600" />} title="Wins" value={user.debateStats?.wins || 0} />
        <StatCard
          icon={<Users className="w-8 h-8 text-slate-700" />}
          title="Win Rate"
          value={
            user.debateStats?.total > 0
              ? `${Math.round((user.debateStats.wins / user.debateStats.total) * 100)}%`
              : '0%'
          }
        />
      </div>

      {/* Debates List */}
      <div className="surface-card mx-auto max-w-7xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="display-face text-2xl font-bold text-slate-900">Available Debates</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="brand-button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Debate
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading debates...</div>
        ) : debates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No debates available. Create one to get started!</div>
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
    <div className="surface-card flex items-center justify-between p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <p className="mb-1 text-sm text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div>{icon}</div>
    </div>
  );
}

function DebateCard({ debate }: any) {
  const router = useRouter();
  const user = getUser();
  const [joining, setJoining] = useState(false);

  const handleJoin = async (side: 'A' | 'B') => {
    setJoining(true);
    try {
      await debateAPI.join(debate._id, side);
      toast.success(`Joined Side ${side}!`);
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
    <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-semibold text-slate-900">{debate.topic}</h3>
          {debate.description && <p className="mb-3 text-sm text-slate-600">{debate.description}</p>}
          <div className="flex items-center gap-4 text-sm">
            <span
              className={`px-3 py-1 rounded-full ${
                debate.status === 'waiting'
                  ? 'bg-amber-100 text-amber-800'
                  : debate.status === 'active'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {debate.status.charAt(0).toUpperCase() + debate.status.slice(1)}
            </span>
            <span className="text-slate-500">{debate.type === '1v1' ? '1 vs 1' : 'Team'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-teal-50 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">Side A</p>
          <p className="mb-2 text-xs text-slate-600">{debate.sideA.position || 'For'}</p>
          <p className="text-sm text-slate-700">
            {debate.sideA.users.length > 0 ? debate.sideA.users.map((u: any) => u.username).join(', ') : 'Waiting...'}
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">Side B</p>
          <p className="mb-2 text-xs text-slate-600">{debate.sideB.position || 'Against'}</p>
          <p className="text-sm text-slate-700">
            {debate.sideB.users.length > 0 ? debate.sideB.users.map((u: any) => u.username).join(', ') : 'Waiting...'}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        {isParticipant ? (
          <button
            onClick={() => router.push(`/debate/${debate._id}`)}
            className="brand-button flex-1"
          >
            View Debate
          </button>
        ) : (
          <>
            <button
              onClick={() => handleJoin('A')}
              disabled={joining || !canJoinA}
              className="flex-1 rounded-lg bg-teal-700 px-4 py-2 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Side A
            </button>
            <button
              onClick={() => handleJoin('B')}
              disabled={joining || !canJoinB}
              className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Side B
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// CreateDebateModal implementation
function CreateDebateModal({ onClose, onSuccess }: any) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'1v1' | 'team'>('1v1');
  const [sideAPosition, setSideAPosition] = useState('For');
  const [sideBPosition, setSideBPosition] = useState('Against');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Adapt payload shape if your API expects different fields
      await debateAPI.create({
        topic,
        description,
        type,
        sideA: { position: sideAPosition },
        sideB: { position: sideBPosition },
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="surface-card relative z-10 w-full max-w-xl p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="display-face text-lg font-semibold text-slate-900">Create Debate</h3>
          <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-900">
            Close
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-slate-700">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-slate-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as '1v1' | 'team')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none"
              >
                <option value="1v1">1 vs 1</option>
                <option value="team">Team</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-sm text-slate-700">Side A Position</label>
              <input
                value={sideAPosition}
                onChange={(e) => setSideAPosition(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-sm text-slate-700">Side B Position</label>
              <input
                value={sideBPosition}
                onChange={(e) => setSideBPosition(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-300"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="brand-button"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Debate'}
          </button>
        </div>
      </form>
    </div>
  );
}
