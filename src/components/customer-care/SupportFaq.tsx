import { useState } from "react";
import { EmailForm } from "./EmailForm";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Twitter,
  Youtube,
} from "lucide-react";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Enter your order number in the help field at the top of the page or contact our team, and we'll help check the latest status for you.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Orders can often be changed or cancelled shortly after they're placed. Send us your order number as soon as possible and we'll do our best to help.",
  },
  {
    q: "What is your returns policy?",
    a: "Items can be returned within 28 days of delivery, unworn and in their original packaging. Some exclusions apply, such as personalised items and opened beauty products.",
  },
  {
    q: "How long do refunds take?",
    a: "Once your return is received, refunds are typically processed within 5–7 working days to your original payment method.",
  },
  {
    q: "How can I make a complaint?",
    a: "Choose the Complaints category and tell us what happened. Our team will review your complaint and respond with the next steps.",
  },
];

const CONTACT_ROWS = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    text: "Chat with us online (Mon – Fri, 9am – 6pm).",
  },
  {
    icon: Mail,
    title: "Email Us",
    text: "We'll respond within 24 hours.",
  },
  {
    icon: Phone,
    title: "Call Us",
    text: "Mon – Fri, 9am – 6pm.",
  },
];

export function SupportFaq({
  onContact,
}: {
  onContact: (category?: string) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const handleRow = (title: string) => {
    if (title === "Live Chat") window.dispatchEvent(new Event("care-chat:open"));
    else if (title === "Email Us") setEmailOpen(true);
    else onContact("General Enquiries");
  };

  return (
    <section
      id="contact"
      className="border-t border-border bg-surface text-foreground"
    >
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[0.85fr_1fr_1fr]">
        <div className="min-h-[320px] lg:min-h-[560px]">
          <img
            src="/images/customer-care-products.jpg"
            alt="A Debenhams shopping bag beside a handbag, candle and wrapped gift"
            className="h-full w-full object-cover"
            loading="lazy"
            width={1200}
            height={1400}
          />
        </div>

        <div className="px-5 py-14 sm:px-8 lg:px-10">
          <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
            NEED MORE HELP?
          </p>

          <h2 className="mt-3 font-serif text-3xl sm:text-4xl">
            Our support team is here
          </h2>

          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            Can&rsquo;t find what you&rsquo;re looking for? Get in touch with
            our customer care team and we&rsquo;ll be happy to help.
          </p>

          <div className="mt-8 divide-y divide-border border-y border-border">
            {CONTACT_ROWS.map(({ icon: Icon, title, text }) => (
              <button
                key={title}
                type="button"
                onClick={() => handleRow(title)}
                className="group flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <Icon size={21} strokeWidth={1.5} aria-hidden className="shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={17}
                  aria-hidden="true"
                  className="shrink-0 transition-transform group-hover:translate-x-1"
                />
              </button>
            ))}
          </div>
        </div>

        <div
          id="faqs"
          className="border-t border-border px-5 py-14 sm:px-8 lg:border-l lg:border-t-0 lg:px-10"
        >
          <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
            FREQUENTLY ASKED QUESTIONS
          </p>

          <div className="mt-8 divide-y divide-border border-y border-border">
            {FAQS.map((faq, i) => {
              const open = allOpen || openIndex === i;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenIndex((cur) => (cur === i ? null : i))
                    }
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium"
                  >
                    {faq.q}
                    <Plus
                      size={16}
                      strokeWidth={1.6}
                      aria-hidden="true"
                      className={
                        "shrink-0 transition-transform " +
                        (open ? "rotate-45" : "")
                      }
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    aria-hidden={!open}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setAllOpen((v) => !v)}
            className="group mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            {allOpen ? "Collapse all FAQs" : "View all FAQs"}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>
      {emailOpen && <EmailForm onClose={() => setEmailOpen(false)} />}
    </section>
  );
}
