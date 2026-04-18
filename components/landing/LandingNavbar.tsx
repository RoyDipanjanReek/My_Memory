"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export function LandingNavbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith(SESSION_COOKIE_NAME));

    setIsLoggedIn(hasCookie);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-full border border-rose-500/15 bg-slate-950/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-pink-400 to-fuchsia-400 text-sm font-bold text-slate-950 shadow-lg shadow-rose-500/25">
            M
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-wide text-white">
              MyMemory
            </span>
            <span className="block text-xs text-slate-400">Developer memory platform</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-slate-300 lg:flex">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-white" href="#pricing">
            Pricing
          </a>
          <a className="transition hover:text-white" href="#faq">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
            href={isLoggedIn ? "/workspace" : "/login"}
          >
            {isLoggedIn ? "Open workspace" : "Sign in"}
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-rose-500/25 transition duration-200 hover:translate-y-[-1px] hover:shadow-rose-400/35"
            href={isLoggedIn ? "/workspace" : "/signup"}
          >
            {isLoggedIn ? "Go to app" : "Start free trial"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
