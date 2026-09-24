import { Fragment, useState } from "react";
import { ArrowRight, Clock, Heart, HeartHandshake, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    title: "Tell us your issue",
    text: "Choose a category and provide a few details.",
  },
  {
    title: "We’ll review it",
    text: "Our team will look into your request.",
  },
  {
    title: "Get a resolution",
    text: "We’ll be in touch with an update as soon as possible.",
  },
];

export function Process() {
  return (
    <section className="bg-coffee text-primary-foreground">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div className="min-h-[320px] lg:min-h-[500px]">
          <img
            src="/images/customer-care-team.jpg"
            alt="A customer relaxing on a sofa in a warm, softly lit room"
            className="h-full w-full object-cover"
            loading="lazy"
            width={1200}
            height={1400}
          />
        </div>

        <div className="flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-14">
          <p className="text-xs tracking-[0.22em] text-primary-foreground/60 sm:text-sm">
            A SIMPLE PROCESS
          </p>

          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Get the help you need
            <br className="hidden sm:block" /> in just a few steps
          </h2>

          <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-start md:gap-5">
            {STEPS.map((step, i) => (
              <Fragment key={step.title}>
                {i > 0 && (
                  <ArrowRight
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="hidden shrink-0 self-center text-primary-foreground/50 md:mt-9 md:block"
                  />
                )}
                <div className="flex-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/40 text-sm">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary-foreground/65">
                    {step.text}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const REASONS = [
  {
    icon: HeartHandshake,
    title: "Real People",
    text: "Our friendly team is here to help, not bots.",
  },
  {
    icon: Clock,
    title: "Quick Responses",
    text: "We aim to get back to you as soon as possible.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Safe",
    text: "Your information is handled securely.",
  },
  {
    icon: Heart,
    title: "Customer First",
    text: "Your satisfaction matters to us.",
  },
];

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-12 lg:py-24">
      <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
        WHY CHOOSE DEBENHAMS CUSTOMER CARE?
      </p>

      <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">
        We&rsquo;re committed to you
      </h2>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        {REASONS.map(({ icon: Icon, title, text }, i) => (
          <div
            key={title}
            className={
              "border-t border-border pt-8 first:border-t-0 first:pt-0 md:border-l md:border-t-0 md:pl-8 md:pt-0" +
              (i === 0 ? " md:border-l-0 md:pl-0" : "")
            }
          >
            <Icon size={30} strokeWidth={1.4} aria-hidden />
            <h3 className="mt-6 font-medium">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCta({ onContact }: { onContact: () => void }) {
  return (
    <section className="bg-coffee px-5 py-20 text-center text-primary-foreground sm:px-6 lg:px-12">
      <h2 className="font-serif text-4xl sm:text-5xl">Need more help?</h2>
      <p className="mx-auto mt-4 max-w-md text-primary-foreground/75">
        Our customer care team is here to help.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onContact}
          className="w-full max-w-xs rounded-full bg-surface px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-card sm:w-auto"
        >
          Contact Us →
        </button>
        <a
          href="#track"
          className="w-full max-w-xs rounded-full border border-primary-foreground/40 px-8 py-3.5 text-sm font-medium transition-colors hover:bg-primary-foreground/10 sm:w-auto"
        >
          Track My Request →
        </a>
      </div>
    </section>
  );
}
