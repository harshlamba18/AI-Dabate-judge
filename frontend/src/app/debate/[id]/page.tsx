'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Send, Scale, ArrowLeft, Trophy } from 'lucide-react';
import { debateAPI, argumentAPI } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import toast from 'react-hot-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

export default function DebateRoom() {
  const router = useRouter();
  const params = useParams();
  const debateId = params.id as string;

  const [debate, setDebate] = useState<any>(null);
  const [debateArguments, setDebateArguments] = useState<any[]>([]);
  const [newArgument, setNewArgument] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sending, setSending] = useState(false);
  const [judging, setJudging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadDebate();
    loadArguments();

    const newSocket = io(WS_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket');
      newSocket.emit('join-debate', debateId);
    });

    newSocket.on('debate-state', (data) => {
      setDebate(data.debate);
      setDebateArguments(data.arguments);
    });

    newSocket.on('argument-added', (argument) => {
      setDebateArguments((prev) => [...prev, argument]);
    });

    newSocket.on('debate-ready-for-judging', () => {
      toast.success('All arguments submitted! Ready for judging.');
      loadDebate();
    });

    newSocket.on('judgment-received', (data) => {
      setDebate(data.debate);
      toast.success('AI Judge has delivered the verdict!');
    });

    return () => {
      newSocket.emit('leave-debate', debateId);
      newSocket.disconnect();
    };
  }, [debateId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [debateArguments]);

  const loadDebate = async () => {
    try {
      const { data } = await debateAPI.getById(debateId);
      setDebate(data);
    } catch (error) {
      toast.error('Failed to load debate');
    }
  };

  const loadArguments = async () => {
    try {
      const { data } = await argumentAPI.getByDebate(debateId);
      setDebateArguments(data);
    } catch (error) {
      toast.error('Failed to load arguments');
    }
  };

  const getUserSide = () => {
    if (!user || !debate) return null;
    if (debate.sideA.users.some((u: any) => u._id === user.id)) return 'A';
    if (debate.sideB.users.some((u: any) => u._id === user.id)) return 'B';
    return null;
  };

  const canSubmitArgument = () => {
    const side = getUserSide();
    if (!side || !debate) return false;
    const sideArgs = debateArguments.filter(a => a.side === side);
    return debate.status === 'active' && sideArgs.length < debate.settings.argumentLimit;
  };

  const handleSubmitArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArgument.trim() || !canSubmitArgument()) return;

    setSending(true);
    try {
      const { data } = await argumentAPI.create({
        debateId,
        content: newArgument,
        side: getUserSide(),
        type: 'argument',
      });

      socket?.emit('new-argument', { debateId, argumentId: data._id });
      setNewArgument('');
      toast.success('Argument submitted!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit argument');
    } finally {
      setSending(false);
    }
  };

  const handleJudge = async () => {
    if (!window.confirm('Are you sure you want to request AI judgment? This cannot be undone.')) return;

    setJudging(true);
    try {
      const { data } = await debateAPI.judge(debateId);
      setDebate(data);
      socket?.emit('debate-judged', { debateId });
      toast.success('AI judgment complete!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to judge debate');
    } finally {
      setJudging(false);
    }
  };

  if (!debate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading debate...</div>
      </div>
    );
  }

  const userSide = getUserSide();
  const sideAArgs = debateArguments.filter(a => a.side === 'A');
  const sideBArgs = debateArguments.filter(a => a.side === 'B');
  const canJudge = debate.status === 'active' &&
    sideAArgs.length >= debate.settings.argumentLimit &&
    sideBArgs.length >= debate.settings.argumentLimit;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Navbar */}
      <nav className="surface-card mx-auto mb-6 flex max-w-7xl items-center justify-between p-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-slate-700 transition hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-teal-700" />
          <span className="display-face text-lg font-semibold text-slate-900">{debate.topic}</span>
        </div>
        <div className="w-32"></div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {debate.status === 'completed' && debate.aiJudgment && (
          <div className="surface-card mb-6 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-amber-600" />
              <h2 className="display-face text-2xl font-bold text-slate-900">AI Judge Verdict</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className={`rounded-lg p-6 ${debate.aiJudgment.sideAScore > debate.aiJudgment.sideBScore ? 'border-2 border-teal-500 bg-teal-50' : 'bg-slate-100'}`}>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Side A Score</h3>
                <p className="text-4xl font-bold text-teal-700">{debate.aiJudgment.sideAScore}</p>
              </div>
              <div className={`rounded-lg p-6 ${debate.aiJudgment.sideBScore > debate.aiJudgment.sideAScore ? 'border-2 border-amber-500 bg-amber-50' : 'bg-slate-100'}`}>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Side B Score</h3>
                <p className="text-4xl font-bold text-amber-700">{debate.aiJudgment.sideBScore}</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-slate-100 p-4">
              <h3 className="mb-2 font-semibold text-slate-900">Verdict</h3>
              <p className="text-slate-700">{debate.aiJudgment.verdict}</p>
            </div>

            <div className="rounded-lg bg-slate-100 p-4">
              <h3 className="mb-2 font-semibold text-slate-900">Reasoning</h3>
              <p className="text-slate-700">{debate.aiJudgment.reasoning}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sides Column */}
          <div className="lg:col-span-1 space-y-4">
            <SideCard side="A" users={debate.sideA.users} position={debate.sideA.position} currentUserId={user?.id} argumentsCount={sideAArgs.length} argumentLimit={debate.settings.argumentLimit} color="blue" />
            <SideCard side="B" users={debate.sideB.users} position={debate.sideB.position} currentUserId={user?.id} argumentsCount={sideBArgs.length} argumentLimit={debate.settings.argumentLimit} color="amber" />

            {canJudge && userSide && (
              <button
                onClick={handleJudge}
                disabled={judging}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {judging ? 'Requesting AI Judge...' : 'Request AI Judgment'}
              </button>
            )}
          </div>

          {/* Arguments Column */}
          <div className="surface-card lg:col-span-3 flex h-[calc(100vh-200px)] flex-col">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-xl font-semibold text-slate-900">Debate Arguments</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {debateArguments.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No arguments yet. Be the first to submit.</div>
              ) : (
                debateArguments.map((arg) => (
                  <div
                    key={arg._id}
                    className={`rounded-lg p-4 ${arg.side === 'A' ? 'mr-12 ml-0 bg-teal-50' : 'mr-0 ml-12 bg-amber-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">{arg.userId.username} (Side {arg.side})</span>
                      <span className="text-xs text-slate-500">{new Date(arg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700">{arg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {userSide && debate.status === 'active' && (
              <form onSubmit={handleSubmitArgument} className="border-t border-slate-200 p-4">
                {canSubmitArgument() ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newArgument}
                      onChange={(e) => setNewArgument(e.target.value)}
                      placeholder="Enter your argument..."
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newArgument.trim()}
                      className="brand-button flex items-center gap-2 px-6"
                    >
                      <Send className="w-4 h-4" />
                      <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-center text-slate-500">You have reached the argument limit for this debate.</div>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SideCard({ side, users, position, currentUserId, argumentsCount, argumentLimit, color }: any) {
  const isTeal = color === 'blue';
  const currentUserClass = isTeal
    ? 'bg-teal-100 text-teal-900 font-semibold'
    : 'bg-amber-100 text-amber-900 font-semibold';

  return (
    <div className="surface-card p-4">
      <h3 className="mb-2 font-semibold text-slate-900">Side {side}</h3>
      <p className="mb-2 text-sm text-slate-600">{position}</p>
      {users.map((u: any) => (
        <div
          key={u._id}
          className={`mb-2 rounded px-3 py-2 text-sm ${
            u._id === currentUserId ? currentUserClass : 'bg-slate-100 text-slate-700'
          }`}
        >
          {u.username}
        </div>
      ))}
      <p className="mt-2 text-xs text-slate-500">
        Arguments: {argumentsCount}/{argumentLimit}
      </p>
    </div>
  );
}
