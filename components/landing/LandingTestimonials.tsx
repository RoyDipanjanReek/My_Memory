import { LandingSectionHeading } from "@/components/landing/LandingSectionHeading";
import { landingTestimonials } from "@/components/landing/landing-content";

export function LandingTestimonials() {
  return (
    <section className="py-24">
      <LandingSectionHeading
        align="center"
        description="Social proof works best when it sounds concrete. These testimonials focus on trust, adoption, and measurable workflow improvement."
        eyebrow="Testimonials"
        title="Teams buy faster when the value already feels proven"
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {landingTestimonials.map((testimonial) => (
          <article
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
            key={`${testimonial.name}-${testimonial.company}`}
          >
            <p className="text-base leading-8 text-slate-200">“{testimonial.quote}”</p>
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="font-semibold text-white">{testimonial.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {testimonial.role}, {testimonial.company}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
