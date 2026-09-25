import { useState } from "react";

export function Hero({ onGetHelp }: { onGetHelp: (query: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <section id="home" className="relative isolate overflow-hidden bg-coffee">
      <img
        src="/images/customer-care-hero.jpg"
        alt="A Debenhams shopping bag, candle and wrapped gifts on a table in a warmly lit living room"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-right"
        width={1920}
        height={1080}
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-coffee/70" />

      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-5 py-20 sm:px-6 lg:px-12 lg:py-24">
        <div className="max-w-xl text-primary-foreground">
          <p className="text-xs tracking-[0.24em] text-primary-foreground/70 sm:text-sm">
            DEBENHAMS CUSTOMER CARE
          </p>

          <h1 className="mt-5 font-serif text-5xl leading-[1.02] sm:text-6xl md:text-7xl">
            Debenhams
            <br />
            Customer Care
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            We&rsquo;re here to help with your orders, delivery, returns,
            refunds, complaints and more.
          </p>

          <form
            className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-surface p-2 shadow-lg transition-[box-shadow,transform] duration-200 focus-within:-translate-y-0.5 focus-within:ring-4 focus-within:ring-primary-foreground/20 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              onGetHelp(query.trim());
            }}
          >
            <label htmlFor="hero-search" className="sr-only">
              Order number, email or inquiry
            </label>
            <input
              id="hero-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your order number, email or inquiry…"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-coffee"
            >
              Get Help
            </button>
          </form>

        </div>
      </div>
    </section>
  );
}
