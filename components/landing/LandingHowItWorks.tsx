import { LandingSectionHeading } from "@/components/landing/LandingSectionHeading";
import { landingSteps } from "@/components/landing/landing-content";

export function LandingHowItWorks() {
  return (
    <section className="py-24" id="how-it-works">
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <LandingSectionHeading
          description="The workflow is intentionally simple so adoption happens naturally. Paste what matters, let the system shape it, then retrieve it at the moment of need."
          eyebrow="How it works"
          title="From scattered know-how to a dependable team memory in three steps"
        />

        <div className="space-y-5">
          {landingSteps.map((item) => (
            <article
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:border-rose-300/30 hover:bg-white/10"
              key={item.step}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-fuchsia-400/20 text-sm font-semibold text-rose-100">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
