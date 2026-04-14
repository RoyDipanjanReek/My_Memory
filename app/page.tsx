import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-[#120f0a] text-[#f5e8d5]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            MyMemory
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
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

        <section className="grid flex-1 gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-[#4f3f28] bg-[#20170f] px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-[#d9a567]">
              Developer memory, minus the chaos
            </p>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-[#fff1df] sm:text-6xl">
              Stop rewriting the same thing.
              <span className="block text-[#d9a567]">Start shipping from memory.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d5c2a7]">
              MemoryOS turns repeated code, outreach, prompts, and notes into a fast,
              searchable system. Paste once. Recall instantly. Copy with confidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                className="rounded-full bg-[#df8b3d] px-6 py-3 text-sm font-semibold text-[#120f0a] transition hover:bg-[#e79a56]"
                href={user ? "/workspace" : "/signup"}
              >
                {user ? "Go to workspace" : "Create your workspace"}
              </Link>
              <Link
                className="rounded-full border border-[#4f3f28] bg-[#20170f] px-6 py-3 text-sm font-medium text-[#f5e8d5] transition hover:bg-[#2a2014]"
                href="/login"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Paste-first capture", "No forms. Metadata is inferred automatically."],
                ["Keyboard-first recall", "Command palette, instant copy, recent usage signals."],
                ["Built to scale", "Role-ready auth, modular services, owner-isolated data."]
              ].map(([title, body]) => (
                <div
                  className="rounded-3xl border border-[#3f3222] bg-[#19120d] p-4"
                  key={title}
                >
                  <p className="text-sm font-semibold text-[#fff1df]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#c4ae8f]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-[#a14f1a]/20 blur-3xl" />
            <div className="absolute bottom-6 right-0 h-48 w-48 rounded-full bg-[#1f7a55]/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[36px] border border-[#3f3222] bg-[#17110c] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
              <div className="border-b border-[#2a2118] px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8f7453]">
                      Product snapshot
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#fff1df]">
                      Your searchable memory workspace
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#4f3f28] bg-[#21180f] px-3 py-1 text-xs text-[#d5c2a7]">
                    Ctrl + K
                  </div>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="border-r border-[#2a2118] bg-[#140f0a] p-5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8f7453]">
                    Timeline
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Referral follow-up",
                      "React hook for optimistic updates",
                      "Launch checklist for release day"
                    ].map((item, index) => (
                      <div
                        className={`rounded-2xl border px-4 py-3 ${
                          index === 0
                            ? "border-[#d98a43] bg-[#23170f]"
                            : "border-[#2b2218] bg-[#19120d]"
                        }`}
                        key={item}
                      >
                        <p className="text-sm font-medium text-[#fff1df]">{item}</p>
                        <p className="mt-1 text-xs text-[#9f8566]">
                          {index === 0 ? "Email" : index === 1 ? "Code" : "Note"}
                        </p>
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="p-6">
                  <div className="rounded-2xl border border-[#2e2419] bg-[#1e1610] px-4 py-3 text-sm text-[#bda789]">
                    Search or type to copy instantly...
                  </div>

                  <div className="mt-5 grid gap-4">
                    <div className="rounded-3xl border border-[#3a2d20] bg-[#19120d] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[#8f7453]">
                            Email
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-[#fff1df]">
                            X referral message
                          </h3>
                        </div>
                        <div className="rounded-xl bg-[#df8b3d] px-3 py-2 text-xs font-semibold text-[#120f0a]">
                          Copy
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#c4ae8f]">
                        Hi Paul, I came across your post and wanted to reach out. I’m a
                        backend-focused engineer building scalable systems with Node.js,
                        Next.js, and MongoDB...
                      </p>
                    </div>

                    <div className="rounded-3xl border border-[#233428] bg-[#131912] p-5">
                      <p className="text-xs uppercase tracking-[0.22em] text-[#77a488]">
                        Why teams buy
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#2f4735] bg-[#162019] p-4">
                          <p className="text-sm font-semibold text-[#e8f7eb]">
                            Reuse without hunting
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#2f4735] bg-[#162019] p-4">
                          <p className="text-sm font-semibold text-[#e8f7eb]">
                            Capture in seconds
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#2f4735] bg-[#162019] p-4">
                          <p className="text-sm font-semibold text-[#e8f7eb]">
                            Search by usage and recency
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#2f4735] bg-[#162019] p-4">
                          <p className="text-sm font-semibold text-[#e8f7eb]">
                            Auth-ready team architecture
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
