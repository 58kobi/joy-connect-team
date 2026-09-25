import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { z } from "zod";

// Business email address — add it here when available.
const SUPPORT_EMAIL = "";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  order: z.string().trim().max(50).optional(),
  subject: z.string().trim().min(1, "Please enter a subject").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40";

export function EmailForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"sent" | "not-connected" | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(fd);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setError(null);
    // TODO: Connect this form to the business email service when SUPPORT_EMAIL is provided.
    if (!SUPPORT_EMAIL) {
      setResult("not-connected");
      return;
    }
    setResult("sent");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-panel-up max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="email-title" className="font-serif text-2xl">Email us</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll respond within 24 hours.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-card">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              {result === "sent"
                ? "Your email has been sent successfully. Our support team will get back to you within 24 hours."
                : "Email isn't available just yet. Please use Live Chat or Call Us for now."}
            </p>
            <button onClick={onClose} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Full Name</span>
                <input name="name" autoComplete="name" className={field} />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Email Address</span>
                <input name="email" type="email" autoComplete="email" className={field} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Order Number <span className="font-normal text-muted-foreground">(optional)</span></span>
              <input name="order" className={field} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Subject</span>
              <input name="subject" className={field} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Message</span>
              <textarea name="message" rows={5} className={`${field} resize-none`} />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button type="submit" className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              Send Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
