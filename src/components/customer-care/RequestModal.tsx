import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { CATEGORIES, DEFAULT_CATEGORY } from "./requests";
import { submitClaim } from "@/lib/claims.functions";

type Phase = "form" | "submitting" | "success";

export function RequestModal({
  open,
  initialCategory,
  initialQuery,
  onClose,
  onTracked,
}: {
  open: boolean;
  initialCategory?: string | undefined;
  initialQuery?: string | undefined;
  onClose: () => void;
  onTracked: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [category, setCategory] = useState(initialCategory ?? DEFAULT_CATEGORY);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const submit = useServerFn(submitClaim);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setError("");
    setCategory(initialCategory ?? DEFAULT_CATEGORY);
    setOrderNumber("");
    setEmail("");
    setName("");
    setPhone("");
    setDescription(initialQuery ? `Regarding: ${initialQuery}` : "");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, initialCategory, initialQuery, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "submitting") return;
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Please describe your issue in a little more detail.");
      return;
    }
    setError("");
    setPhase("submitting");
    try {
      const res = await submit({
        data: { name, email, phone, category, orderNumber, description },
      });
      setReference(res.ref);
      setPhase("success");
    } catch {
      setError("We couldn't send your request. Please try again.");
      setPhase("form");
    }
  }

  const fieldClasses =
    "w-full rounded-lg border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-coffee/70 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Submit a support request"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-6 sm:rounded-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-muted-foreground">
              CUSTOMER CARE
            </p>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl">
              How can we help?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 transition-colors hover:bg-card"
          >
            <X size={20} />
          </button>
        </div>

        {phase === "success" ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
              <Check size={26} strokeWidth={1.5} aria-hidden />
            </span>
            <h3 className="mt-6 font-serif text-2xl">
              Your request has been received.
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              We&rsquo;ll review your request and contact you with the next
              steps.
            </p>
            <div className="mt-6 rounded-lg border border-border bg-card px-5 py-4">
              <p className="text-xs tracking-[0.18em] text-muted-foreground">
                YOUR REFERENCE
              </p>
              <p className="mt-1 font-serif text-2xl tracking-wide">
                {reference}
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTracked();
                }}
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-coffee"
              >
                Track this request
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-card"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="req-category" className="text-sm font-medium">
                Category
              </label>
              <select
                id="req-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={fieldClasses}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="req-order" className="text-sm font-medium">
                Order or reference number{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id="req-order"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 1002345678"
                className={fieldClasses}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="req-name" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="req-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={fieldClasses}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="req-phone" className="text-sm font-medium">
                Phone number{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="req-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 900000"
                className={fieldClasses}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="req-email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="req-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={fieldClasses}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="req-description" className="text-sm font-medium">
                How can we help?
              </label>
              <textarea
                id="req-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us a little about your issue…"
                className={`${fieldClasses} resize-none`}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={phase === "submitting"}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-coffee disabled:opacity-70"
            >
              {phase === "submitting" ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Sending your request…
                </>
              ) : (
                "Submit request"
              )}
            </button>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Please don&rsquo;t include payment details in your request.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
