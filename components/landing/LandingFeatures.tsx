import type { ReactNode } from "react";
import {
  CommandIcon,
  LightningIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  StackIcon
} from "@/components/landing/LandingIcons";
import { LandingSectionHeading } from "@/components/landing/LandingSectionHeading";
import { landingFeatures } from "@/components/landing/landing-content";

const iconMap: Record<string, ReactNode> = {
  lightning: <LightningIcon className="h-6 w-6" />,
  command: <CommandIcon className="h-6 w-6" />,
  shield: <ShieldIcon className="h-6 w-6" />,
  search: <SearchIcon className="h-6 w-6" />,
  stack: <StackIcon className="h-6 w-6" />,
  spark: <SparkIcon className="h-6 w-6" />
};

export function LandingFeatures() {
  return (
    <section className="py-24" id="features">
      <LandingSectionHeading
        align="center"
        description="Everything on the page is designed to answer one question for buyers: how quickly can this tool turn repeated work into reliable output?"
        eyebrow="Core features"
        title="Built for teams that value speed, consistency, and clear ownership"
      />

      <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {landingFeatures.map((feature) => (
          <article
            className="group rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/20 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-rose-300/30 hover:bg-white/10"
            key={feature.title}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-400/20 to-fuchsia-400/20 text-rose-200 transition group-hover:text-white">
              {iconMap[feature.icon]}
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
