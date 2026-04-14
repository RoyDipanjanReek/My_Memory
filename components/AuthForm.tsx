// Authentication Form Component
// Reusable form for both login and signup
// Handles form validation, submission, and user feedback
// Works in both modes: login and signup
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchJson } from "@/lib/api-client";
import type { ApiListResponse } from "@/types/template.types";
import type { AuthUserRecord } from "@/types/auth.types";

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <div className="min-h-screen bg-[#120f0a] px-6 py-10 text-[#f5e8d5]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 overflow-hidden rounded-[40px] border border-[#3f3222] bg-[#17110c] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-between border-b border-[#2a2118] bg-[#140f0a] p-8 lg:border-b-0 lg:border-r">
          <div>
            <Link className="text-lg font-semibold tracking-tight" href="/">
              MemoryOS
            </Link>
            <p className="mt-12 text-xs uppercase tracking-[0.24em] text-[#8f7453]">
              Product promise
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#fff1df]">
              Save once.
              <span className="block text-[#d9a567]">Recall in one keystroke.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-[#d5c2a7]">
              MemoryOS gives developers a protected workspace for reusable code,
              notes, and outreach. It is organized like a product, not a note dump.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Owner-isolated data model",
              "Session-based authentication",
              "Authorization-ready user roles",
              "Modular repositories and services"
            ].map((item) => (
              <div
                className="rounded-2xl border border-[#2b2218] bg-[#19120d] px-4 py-3 text-sm text-[#e7d8c1]"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center p-8 lg:p-12">
          <div className="w-full max-w-lg">
            <p className="text-xs uppercase tracking-[0.24em] text-[#8f7453]">
              {isSignup ? "Create workspace" : "Sign in"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[#fff1df]">
              {isSignup ? "Start your memory system." : "Welcome back."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#c4ae8f]">
              {isSignup
                ? "Build a private workspace for code, notes, and repeated communication."
                : "Get back to your saved knowledge without digging through tabs."}
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              {isSignup ? (
                <label className="block">
                  <span className="mb-2 block text-sm text-[#d5c2a7]">Name</span>
                  <input
                    className="w-full rounded-2xl border border-[#3f3222] bg-[#1b140f] px-4 py-3 text-sm text-[#fff1df] outline-none transition placeholder:text-[#8f7453] focus:border-[#df8b3d] focus:ring-2 focus:ring-[#df8b3d]/20"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ari Morgan"
                    required
                    value={name}
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm text-[#d5c2a7]">Email</span>
                <input
                  className="w-full rounded-2xl border border-[#3f3222] bg-[#1b140f] px-4 py-3 text-sm text-[#fff1df] outline-none transition placeholder:text-[#8f7453] focus:border-[#df8b3d] focus:ring-2 focus:ring-[#df8b3d]/20"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-[#d5c2a7]">Password</span>
                <input
                  className="w-full rounded-2xl border border-[#3f3222] bg-[#1b140f] px-4 py-3 text-sm text-[#fff1df] outline-none transition placeholder:text-[#8f7453] focus:border-[#df8b3d] focus:ring-2 focus:ring-[#df8b3d]/20"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={password}
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-[#7a3429] bg-[#311510] px-4 py-3 text-sm text-[#f5c5bc]">
                  {error}
                </div>
              ) : null}

              <button
                className="w-full rounded-2xl bg-[#df8b3d] px-4 py-3 text-sm font-semibold text-[#120f0a] transition hover:bg-[#e79a56] disabled:cursor-not-allowed disabled:opacity-70"
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

            <p className="mt-6 text-sm text-[#b99f7f]">
              {isSignup ? "Already have an account?" : "Need an account?"}{" "}
              <Link
                className="font-semibold text-[#df8b3d] transition hover:text-[#e79a56]"
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
