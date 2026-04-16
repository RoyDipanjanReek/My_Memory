"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export function LandingHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Quick check: if session cookie exists, user is logged in
    const hasCookie = document.cookie
      .split("; ")
      .some((row) => row.startsWith(SESSION_COOKIE_NAME));
    setIsLoggedIn(hasCookie);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <header className="flex items-center justify-between">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          MyMemory
        </Link>
        <div className="h-10 w-32 animate-pulse rounded-full bg-[#3f3222]" />
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between">
      <Link className="text-lg font-semibold tracking-tight" href="/">
        MyMemory
      </Link>

      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <Link
            className="rounded-full border border-[#4f3f28] bg-[#21180f] px-4 py-2 text-sm font-medium text-[#f5e8d5] transition hover:bg-[#2b2013]"
            href="/workspace"
          >
            Open workspace
          </Link>
        ) : (
          <>
            <Link
              className="rounded-full px-4 py-2 text-sm text-[#d7c3a4] transition hover:text-[#f5e8d5]"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-full bg-[#df8b3d] px-4 py-2 text-sm font-semibold text-[#120f0a] transition hover:bg-[#e79a56]"
              href="/signup"
            >
              Start free
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
