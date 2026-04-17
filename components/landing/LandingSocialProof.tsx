import { trustedCompanies } from "@/components/landing/landing-content";

export function LandingSocialProof() {
  return (
    <section className="border-y border-white/10 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-300">
            Trusted by fast-moving teams
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Placeholder brands today, structured credibility section ready for real logos at
            launch.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:ml-10 lg:max-w-3xl lg:grid-cols-6">
          {trustedCompanies.map((company) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-slate-300"
              key={company}
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
