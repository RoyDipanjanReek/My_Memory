// Authentication Form Component
// Reusable form for both login and signup
// Uses the same black and rose brand direction as the landing page
"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchJson } from "@/lib/api-client";
import type { AuthUserRecord } from "@/types/auth.types";
import type { ApiListResponse } from "@/types/template.types";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await fetchJson<ApiListResponse<AuthUserRecord>>(
        isSignup ? "/api/auth/register" : "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      router.push("/workspace");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Authentication failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05010a] px-6 py-10 text-rose-50">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 overflow-hidden rounded-[40px] border border-rose-500/15 bg-[#0b0612] shadow-[0_30px_90px_-35px_rgba(244,114,182,0.3)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative flex flex-col justify-between border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.16),_transparent_35%),linear-gradient(180deg,#120817,#09040f)] p-8 lg:border-b-0 lg:border-r">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.22),_transparent_55%)]" />

          <div className="relative">
            <Link className="flex items-center gap-3 text-lg font-semibold tracking-tight" href="/">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-pink-400 to-fuchsia-400 text-sm font-bold text-slate-950">
                M
              </span>
              <span>MemoryOS</span>
            </Link>
            <p className="mt-12 text-xs uppercase tracking-[0.24em] text-rose-300/70">
              Product promise
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
              Save once.
              <span className="block bg-gradient-to-r from-rose-300 via-pink-200 to-fuchsia-300 bg-clip-text text-transparent">
                Recall in one keystroke.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-slate-300">
              MemoryOS gives developers a protected workspace for reusable code,
              notes, and outreach. It is organized like a product, not a note dump.
            </p>
          </div>

          <div className="relative grid gap-4">
            {[
              "Owner-isolated data model",
              "Session-based authentication",
              "Authorization-ready user roles",
              "Modular repositories and services"
            ].map((item) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center bg-[linear-gradient(180deg,#0b0612,#09040f)] p-8 lg:p-12">
          <div className="w-full max-w-lg">
            <p className="text-xs uppercase tracking-[0.24em] text-rose-300/70">
              {isSignup ? "Create workspace" : "Sign in"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {isSignup ? "Start your memory system." : "Welcome back."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {isSignup
                ? "Build a private workspace for code, notes, and repeated communication."
                : "Get back to your saved knowledge without digging through tabs."}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {isSignup ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-rose-100/85">Name</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ari Morgan"
                    required
                    value={name}
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm text-rose-100/85">Email</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-rose-100/85">Password</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={password}
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <button
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:translate-y-[-1px] hover:shadow-[0_12px_32px_-18px_rgba(244,114,182,0.7)] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? "Please wait..."
                  : isSignup
                    ? "Create workspace"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              {isSignup ? "Already have an account?" : "Need an account?"}{" "}
              <Link
                className="font-semibold text-rose-300 transition hover:text-pink-200"
                href={isSignup ? "/login" : "/signup"}
              >
                {isSignup ? "Sign in" : "Create one"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
