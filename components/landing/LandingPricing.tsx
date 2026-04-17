import Link from "next/link";
import { LandingSectionHeading } from "@/components/landing/LandingSectionHeading";
import { landingPlans } from "@/components/landing/landing-content";

export function LandingPricing() {
  return (
    <section className="py-24" id="pricing">
      <LandingSectionHeading
        align="center"
        description="Pricing is framed to remove hesitation: a free entry point, a clear professional tier, and a team plan for growing organizations."
        eyebrow="Pricing"
        title="Simple plans that match how teams adopt internal tools"
      />

      <div className="mt-14 grid gap-6 xl:grid-cols-3">
        {landingPlans.map((plan) => (
          <article
              className={`rounded-[2rem] border p-7 ${
              plan.highlight
                ? "border-rose-300/40 bg-gradient-to-br from-rose-500/15 via-slate-900/90 to-fuchsia-400/10 shadow-[0_20px_80px_-30px_rgba(244,114,182,0.35)]"
                : "border-white/10 bg-white/5"
            }`}
            key={plan.name}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>
              </div>
              {plan.highlight ? (
                <span className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">
                  Most popular
                </span>
              ) : null}
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-tight text-white">{plan.price}</span>
              <span className="pb-1 text-sm text-slate-400">
                {plan.price === "$0" ? "forever" : "per month"}
              </span>
            </div>

            <Link
              className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 ${
                plan.highlight
                  ? "bg-gradient-to-r from-rose-500 via-pink-400 to-fuchsia-400 text-slate-950 shadow-lg shadow-rose-500/20 hover:translate-y-[-1px]"
                  : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
              href={plan.name === "Team" ? "/login" : "/signup"}
            >
              {plan.ctaLabel}
            </Link>

            <ul className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-3 text-sm text-slate-300" key={feature}>
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
