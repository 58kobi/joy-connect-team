import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { Footer } from "@/components/customer-care/Footer";
import { RequestModal } from "@/components/customer-care/RequestModal";
import { CareChat } from "@/components/customer-care/CareChat";
import logoAsset from "@/assets/debenhams-logo-light.png.asset.json";

const TITLE = "Debenhams Returns — Return & Exchange Support | Debenhams Care";
const DESCRIPTION =
  "Independent Debenhams returns support. How to return a Debenhams order, refund timescales, exchanges and return requests — help from our UK customer care team by WhatsApp, email or live chat.";
const URL = "https://debenhamscare.uk/returns";

const STEPS = [
  {
    title: "Check your item is eligible",
    text: "Most items can be returned within 28 days of delivery, unworn and in their original packaging with tags attached. Personalised items and opened beauty products are usually excluded.",
  },
  {
    title: "Start your return request",
    text: "Send us your order number using the request form on this page, or message us on WhatsApp or live chat. Our team will confirm the return process for your order.",
  },
  {
    title: "Send the item back",
    text: "Package the item securely and follow the return instructions we provide. Keep your proof of postage until your refund is confirmed.",
  },
  {
    title: "Receive your refund",
    text: "Once your return is received, refunds are typically processed within 5–7 working days to your original payment method. We'll help you check your refund status at any point.",
  },
];

const COVERED = [
  "Change-of-mind returns within 28 days",
  "Faulty or damaged items",
  "Wrong item received",
  "Exchanges for a different size or colour",
  "Refund status enquiries",
  "Missing refunds after a returned order",
];

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:site_name", content: "Debenhams Customer Care" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const openRequest = useCallback(() => setModalOpen(true), []);

  return (
    <main className="min-h-screen bg-background font-sans text-foreground antialiased">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-12">
          <a href="/" className="flex items-center" aria-label="Debenhams home">
            <img
              src={logoAsset.url}
              alt="Debenhams"
              width={206}
              height={36}
              className="h-8 w-auto sm:h-9"
            />
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Customer Care
          </a>
        </div>
      </header>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-12">
          <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
            DEBENHAMS RETURNS SUPPORT
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Debenhams returns &amp; exchanges, made simple
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
            Need to return a Debenhams order? Our independent UK customer care
            team will guide you through your return request, exchange or
            refund — by WhatsApp, email or live chat, Monday to Friday,
            9am – 6pm.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={openRequest}
              className="group inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start a return request
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
            <a
              href="https://wa.me/447454742785"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-12">
        <h2 className="font-serif text-3xl sm:text-4xl">
          How to return a Debenhams order
        </h2>
        <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="bg-background p-6 sm:p-8">
              <p className="font-serif text-3xl text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-medium">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-2 lg:px-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">
              What we can help you return
            </h2>
            <ul className="mt-8 grid gap-4">
              {COVERED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-border bg-background p-6 sm:p-10">
            <RotateCcw size={26} strokeWidth={1.4} aria-hidden="true" />
            <h3 className="mt-5 font-serif text-2xl">
              Ready to start your return?
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Send us your order number and a short note about what you'd like
              to return or exchange. You'll receive a reference number to quote
              whenever you contact us about your return.
            </p>
            <button
              type="button"
              onClick={openRequest}
              className="group mt-7 inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start a return request
              <ArrowRight
                size={16}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Debenhams Customer Care is an independent support service and is
              not affiliated with or endorsed by Debenhams.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <CareChat />
      <RequestModal
        open={modalOpen}
        initialCategory="Returns & Exchanges"
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}
