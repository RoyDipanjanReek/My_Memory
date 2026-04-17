import type { Metadata } from "next";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingFinalCta } from "@/components/landing/LandingFinalCta";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingTestimonials } from "@/components/landing/LandingTestimonials";

export const metadata: Metadata = {
  title: "MemoryOS | The Developer Memory Layer for Modern Teams",
  description:
    "MemoryOS helps teams capture reusable code, replies, notes, and prompts in one fast, searchable workspace built for instant retrieval."
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#05010a] text-slate-100">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-[-8rem] -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.24),_transparent_35%),radial-gradient(circle_at_right,_rgba(232,121,249,0.14),_transparent_28%)]" />

        <div className="mx-auto max-w-7xl px-6 pb-10 sm:px-8 lg:px-10">
          <LandingNavbar />
          <LandingHero />
          <LandingSocialProof />
          <LandingFeatures />
          <LandingHowItWorks />
          <LandingBenefits />
          <LandingTestimonials />
          <LandingPricing />
          <LandingFaq />
          <LandingFinalCta />
          <LandingFooter />
        </div>
      </div>
    </main>
  );
}
