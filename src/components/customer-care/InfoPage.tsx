import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Footer } from "./Footer";
import logoAsset from "@/assets/debenhams-logo-light.png.asset.json";

export function InfoPage({
  eyebrow,
  title,
  intro,
  breadcrumb,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  breadcrumb: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-12">
          <a href="/" className="flex items-center" aria-label="Debenhams Customer Care home">
            <img src={logoAsset.url} alt="Debenhams Customer Care" width={206} height={36} className="h-8 w-auto sm:h-9" />
          </a>
          <a href="/" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Customer Care
          </a>
        </div>
      </header>
      <main>
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 sm:py-18 lg:px-12">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <ol className="flex gap-2">
                <li><a href="/" className="hover:underline">Home</a></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">{breadcrumb}</li>
              </ol>
            </nav>
            <p className="mt-6 text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">{eyebrow}</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>
          </div>
        </section>
        <article className="mx-auto max-w-4xl space-y-8 px-5 py-14 text-sm leading-relaxed text-muted-foreground sm:px-6 lg:px-12 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_a]:text-foreground [&_a]:underline">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}
