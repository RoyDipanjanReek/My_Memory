import Link from "next/link";

export function LandingFinalCta() {
  return (
    <section className="py-24">
      <div className="overflow-hidden rounded-[2.5rem] border border-rose-300/20 bg-gradient-to-br from-rose-500/20 via-slate-900 to-fuchsia-400/10 px-8 py-12 shadow-[0_20px_80px_-30px_rgba(244,114,182,0.35)] sm:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-200">
            Ready to move faster?
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Give your team a memory system they will actually want to use every day.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Start free, capture your most repeated work, and see how quickly retrieval
            becomes a competitive advantage.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition duration-200 hover:translate-y-[-1px]"
              href="/signup"
            >
              Start free, no credit card
            </Link>
            <span className="text-sm text-slate-400">
              Live in minutes. Structured to grow with your team.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
