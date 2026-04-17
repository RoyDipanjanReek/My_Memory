import { LandingSectionHeading } from "@/components/landing/LandingSectionHeading";
import { landingBenefits } from "@/components/landing/landing-content";

export function LandingBenefits() {
  return (
    <section className="py-24">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-rose-500/10 via-slate-900/80 to-fuchsia-400/10 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-rose-300">
            Outcomes, not just features
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Teams adopt MemoryOS because it reduces repeated effort without adding friction.
          </h3>
          <div className="mt-8 space-y-4">
            {[
              "Replace scattered snippets, docs, and chat archaeology with one retrieval layer.",
              "Improve consistency across engineering, support, operations, and customer-facing work.",
              "Keep the product fast enough that people actually use it during real workflows."
            ].map((point) => (
              <div
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                key={point}
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />
                <p className="text-sm leading-7 text-slate-300">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <LandingSectionHeading
            description="A landing page should answer the buyer's real question: what changes after we adopt this? These metrics frame the value clearly."
            eyebrow="Business value"
            title="The return is time, consistency, and confidence across repeatable work"
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
            {landingBenefits.map((benefit) => (
              <article
                className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
                key={benefit.title}
              >
                <p className="text-3xl font-semibold text-white">{benefit.metric}</p>
                <h3 className="mt-3 text-lg font-semibold text-rose-100">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
