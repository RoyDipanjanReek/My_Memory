import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-[28rem] max-w-6xl rounded-full bg-rose-500/18 blur-3xl" />
      <div className="absolute right-0 top-24 -z-10 h-72 w-72 rounded-full bg-pink-400/12 blur-3xl" />
      <div className="absolute bottom-12 left-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100">
            <span className="h-2 w-2 rounded-full bg-pink-400" />
            Teams stop rewriting when memory becomes a product
          </div>

          <h1 className="mt-8 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your team already wrote the answer.
            <span className="mt-2 block bg-gradient-to-r from-rose-300 via-pink-200 to-fuchsia-300 bg-clip-text text-transparent">
              MemoryOS helps them reuse it instantly.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Capture code, replies, prompts, and operational know-how in one fast,
            searchable workspace built for developer teams that need speed, consistency,
            and trust at scale.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-400 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-rose-500/25 transition duration-200 hover:translate-y-[-1px] hover:shadow-rose-400/35"
              href="/signup"
            >
              Start free trial
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-rose-300/40 hover:bg-white/10"
              href="/login"
            >
              Watch demo
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span>No credit card required</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Set up in under 5 minutes</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Built for personal and team workspaces</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute -right-6 bottom-8 h-32 w-32 rounded-full bg-fuchsia-400/15 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2rem] border border-rose-500/15 bg-slate-900/80 shadow-[0_30px_80px_-20px_rgba(190,24,93,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">
                  Live workspace
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Faster capture. Faster retrieval.
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Ctrl + K
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="border-b border-white/10 bg-slate-950/60 p-5 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Memory timeline
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      title: "Incident update template",
                      type: "Pinned",
                      active: true
                    },
                    {
                      title: "OAuth callback troubleshooting",
                      type: "Recently copied"
                    },
                    {
                      title: "Quarterly launch status email",
                      type: "Collection: Growth"
                    }
                  ].map((item) => (
                    <div
                      className={`rounded-2xl border px-4 py-3 transition ${
                        item.active
                          ? "border-rose-300/40 bg-rose-400/10 shadow-lg shadow-rose-500/10"
                          : "border-white/10 bg-white/5"
                      }`}
                      key={item.title}
                    >
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.type}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="p-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  Search or type to copy instantly...
                </div>

                <div className="mt-5 grid gap-4">
                  <article className="rounded-3xl border border-rose-300/30 bg-gradient-to-br from-rose-400/10 to-fuchsia-500/10 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-200">
                          Most used
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          Customer incident update
                        </h3>
                      </div>
                      <button
                        className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-white"
                        type="button"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      We identified the root cause, contained the impact, and are now
                      validating the fix across production regions. The next update will be
                      shared in 30 minutes with mitigation status and customer guidance.
                    </p>
                  </article>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        title: "Built for real reuse",
                        description: "Favorites, history, collections, and command search."
                      },
                      {
                        title: "Trust signals included",
                        description:
                          "Access-ready architecture, backups, and consistent retrieval."
                      }
                    ].map((item) => (
                      <div
                        className="rounded-3xl border border-white/10 bg-white/5 p-5"
                        key={item.title}
                      >
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
