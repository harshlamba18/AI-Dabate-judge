"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Brain, Clock3, Sparkles, ArrowRight } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <nav className="surface-card sticky top-4 z-20 mb-10 flex items-center justify-between px-4 py-3 sm:px-6">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => router.push("/")}
            type="button"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e,#0b5d58)] text-white">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <p className="display-face text-lg">AI Debate Judge</p>
              <p className="text-xs text-slate-500">Objective scoring for real-time debates</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="brand-button text-sm"
            >
              Create Account
            </button>
          </div>
        </nav>

        <main className="space-y-12">
          <section className="surface-card overflow-hidden p-7 sm:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-Assisted Debating
                </p>
                <h1 className="display-face text-4xl leading-tight text-slate-900 sm:text-5xl">
                  Debate with structure.
                  <br />
                  Win with clarity.
                </h1>
                <p className="mt-4 max-w-xl text-slate-600 sm:text-lg">
                  Host focused debates, submit arguments in real time, and get consistent AI scoring based on logic, relevance, and persuasiveness.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => router.push("/register")} className="brand-button inline-flex items-center gap-2">
                    Start Debating
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Explore Debates
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatBadge title="Live Rooms" subtitle="Join and argue instantly" />
                <StatBadge title="AI Verdict" subtitle="Scores both sides" />
                <StatBadge title="Guided Flow" subtitle="Clear turn structure" />
                <StatBadge title="Fair Outcomes" subtitle="Same criteria each round" />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5">
              <h2 className="display-face text-3xl text-slate-900">Built For Competitive Thinking</h2>
              <p className="mt-2 text-slate-600">A focused interface for fast rounds and structured argument quality.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FeatureCard icon={<Brain className="h-7 w-7" />} title="AI Scoring" description="Each side is rated with consistent judging criteria." />
              <FeatureCard icon={<Clock3 className="h-7 w-7" />} title="Real-Time Pace" description="Live rooms keep rebuttals and responses flowing." />
              <FeatureCard icon={<Scale className="h-7 w-7" />} title="Clear Verdicts" description="Reasoning is returned alongside final side scores." />
            </div>
          </section>

          <section className="surface-card p-6 sm:p-8">
            <h3 className="display-face text-2xl text-slate-900">How It Works</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Step number="01" title="Create or Join" description="Open a room or join an ongoing debate from dashboard." />
              <Step number="02" title="Submit Arguments" description="Each side presents points until the argument limit is reached." />
              <Step number="03" title="Request AI Judgment" description="Trigger scoring and review verdict reasoning instantly." />
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t border-slate-300/70 py-6 text-sm text-slate-600">
          <p>AI Debate Judge • Built for practical, fair debate sessions.</p>
        </footer>
      </div>
    </div>
  );
}

function StatBadge({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-[linear-gradient(135deg,#0f766e,#0b5d58)] text-white">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="surface-card p-6 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e,#0b5d58)] text-white">
        {icon}
      </div>
      <h4 className="display-face text-xl text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-amber-800">
        {number}
      </div>
      <h5 className="font-semibold text-slate-900">{title}</h5>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}
