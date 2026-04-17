import { LandingSectionHeading } from "@/components/landing/LandingSectionHeading";
import { landingFaqs } from "@/components/landing/landing-content";

export function LandingFaq() {
  return (
    <section className="py-24" id="faq">
      <LandingSectionHeading
        align="center"
        description="FAQ content helps handle objections before a buyer reaches sales or signs up. These answers are written to reduce uncertainty, not just fill space."
        eyebrow="FAQ"
        title="Clear answers to the questions buyers usually ask before they commit"
      />

      <div className="mx-auto mt-14 max-w-4xl space-y-4">
        {landingFaqs.map((item) => (
          <details
            className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-6 open:border-rose-300/30 open:bg-white/10"
            key={item.question}
          >
            <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-white">
              {item.question}
            </summary>
            <p className="mt-4 text-sm leading-7 text-slate-300">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
