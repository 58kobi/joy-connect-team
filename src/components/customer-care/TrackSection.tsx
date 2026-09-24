import { useState } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import {
  findRequest,
  formatRequestDate,
  type SupportRequest,
} from "./requests";

type Status = "idle" | "loading" | "success" | "error";

export function TrackSection() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SupportRequest | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setResult(null);
    window.setTimeout(() => {
      const found = findRequest(reference, email);
      if (found) {
        setResult(found);
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 1200);
  }

  return (
    <section
      id="track"
      className="border-y border-border bg-cream px-5 py-16 sm:px-6 lg:px-12 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
            TRACK MY REQUEST
          </p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">
            Track your request
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            Enter the support reference number we gave you, along with the
            email address you used when submitting your request, and we&rsquo;ll
            check its status.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-1.5">
              <label
                htmlFor="track-reference"
                className="text-sm font-medium"
              >
                Support reference number
              </label>
              <input
                id="track-reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. DC-4KP2XW"
                className="w-full rounded-lg border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="track-email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="track-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-coffee disabled:opacity-70"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Checking your request…
                </>
              ) : (
                "Check Status"
              )}
            </button>
          </form>

          <div className="mt-6" aria-live="polite">
            {status === "idle" && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <PackageSearch size={16} strokeWidth={1.6} aria-hidden />
                Your request status will appear here.
              </p>
            )}

            {status === "success" && result && (
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-serif text-lg tracking-wide">
                    {result.ref}
                  </p>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-coffee"
                      aria-hidden
                    />
                    Received — under review
                  </span>
                </div>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>{result.category}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd>{formatRequestDate(result.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="truncate">{result.email}</dd>
                  </div>
                </dl>
              </div>
            )}

            {status === "error" && (
              <div
                className="rounded-lg border border-destructive/30 bg-surface p-5 text-sm"
                role="alert"
              >
                <p className="font-medium text-destructive">
                  We couldn&rsquo;t find a request with those details.
                </p>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">
                  Check your reference number and email address, or contact us
                  and we&rsquo;ll help you find it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
