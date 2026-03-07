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
    } catch {
      toast.error('Failed to load debate');
    }
  };

  const loadArguments = async () => {
    try {
      const { data } = await argumentAPI.getByDebate(debateId);
      setDebateArguments(data);
    } catch {
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
    const sideArgs = debateArguments.filter((a) => a.side === side);
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
    if (!window.confirm('Are you sure you want to request AI judgment?')) return;

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading debate...</div>
      </div>
    );
  }

  const userSide = getUserSide();
  const sideAArgs = debateArguments.filter((a) => a.side === 'A');
  const sideBArgs = debateArguments.filter((a) => a.side === 'B');

  const canJudge =
    debate.status === 'active' &&
    sideAArgs.length >= debate.settings.argumentLimit &&
    sideBArgs.length >= debate.settings.argumentLimit;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <nav className="mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3 text-slate-900">
          <Scale className="h-6 w-6 text-teal-700" />
          <span className="text-lg font-semibold">{debate.topic}</span>
        </div>

        <div className="w-20" />
      </nav>

      <main className="mx-auto max-w-7xl space-y-6">
        {debate.status === 'completed' && debate.aiJudgment && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-600" />
              <h2 className="text-xl font-semibold text-slate-900">AI Verdict</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-teal-50 p-5">
                <p className="text-sm text-slate-600">Side A Score</p>
                <p className="text-3xl font-bold text-teal-700">
                  {debate.aiJudgment.sideAScore}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-5">
                <p className="text-sm text-slate-600">Side B Score</p>
                <p className="text-3xl font-bold text-amber-700">
                  {debate.aiJudgment.sideBScore}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-100 p-4">
              <p className="font-semibold text-slate-900">Verdict</p>
              <p className="text-slate-700">{debate.aiJudgment.verdict}</p>
            </div>

            <div className="mt-4 rounded-xl bg-slate-100 p-4">
              <p className="font-semibold text-slate-900">Reasoning</p>
              <p className="text-slate-700">{debate.aiJudgment.reasoning}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-4">
            <SideCard
              side="A"
              users={debate.sideA.users}
              position={debate.sideA.position}
              currentUserId={user?.id}
              argumentsCount={sideAArgs.length}
              argumentLimit={debate.settings.argumentLimit}
              color="teal"
            />

            <SideCard
              side="B"
              users={debate.sideB.users}
              position={debate.sideB.position}
              currentUserId={user?.id}
              argumentsCount={sideBArgs.length}
              argumentLimit={debate.settings.argumentLimit}
              color="amber"
            />

            {canJudge && userSide && (
              <button
                onClick={handleJudge}
                disabled={judging}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {judging ? 'Judging...' : 'Request AI Judgment'}
              </button>
            )}
          </div>

          <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Arguments</h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {debateArguments.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No arguments yet
                </div>
              ) : (
                debateArguments.map((arg) => (
                  <div
                    key={arg._id}
                    className={`max-w-xl rounded-xl px-4 py-3 text-sm ${
                      arg.side === 'A'
                        ? 'bg-teal-50'
                        : 'ml-auto bg-amber-50'
                    }`}
                  >
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        {arg.userId.username} • Side {arg.side}
                      </span>
                      <span>{new Date(arg.createdAt).toLocaleTimeString()}</span>
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newArgument}
                      onChange={(e) => setNewArgument(e.target.value)}
                      placeholder="Enter your argument..."
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-200"
                    />

                    <button
                      type="submit"
                      disabled={sending || !newArgument.trim()}
                      className="flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-sm text-slate-500">
                    Argument limit reached
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SideCard({
  side,
  users,
  position,
  currentUserId,
  argumentsCount,
  argumentLimit,
  color,
}: any) {
  const highlight =
    color === 'teal'
      ? 'bg-teal-100 text-teal-900'
      : 'bg-amber-100 text-amber-900';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-slate-900">Side {side}</h3>
      <p className="mb-3 text-sm text-slate-600">{position}</p>

      <div className="space-y-2">
        {users.map((u: any) => (
          <div
            key={u._id}
            className={`rounded-lg px-3 py-2 text-sm ${
              u._id === currentUserId
                ? highlight
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {u.username}
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Arguments {argumentsCount}/{argumentLimit}
      </p>
    </div>
  );
}