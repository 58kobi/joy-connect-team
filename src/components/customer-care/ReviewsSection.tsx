import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star, PenLine, X } from "lucide-react";
import { toast } from "sonner";
import { listReviews, submitReview, type PublicReview } from "@/lib/reviews.functions";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          className={i < rating ? "fill-accent text-accent" : "fill-muted text-muted"}
        />
      ))}
    </span>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const active = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none"
          >
            <Star
              size={26}
              strokeWidth={0}
              className={active ? "fill-accent text-accent" : "fill-muted text-muted"}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="animate-soft-enter flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-medium tracking-wide text-foreground ring-1 ring-border"
        >
          {initials(review.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{review.name}</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{timeAgo(review.created_at)}</span>
      </div>
      <div className="mt-3">
        <Stars rating={review.rating} />
      </div>
      {review.title && <p className="mt-2 text-sm font-medium">{review.title}</p>}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/90">{review.body}</p>
    </article>
  );
}

export function ReviewsSection() {
  const fetchReviews = useServerFn(listReviews);
  const postReview = useServerFn(submitReview);

  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchReviews()
      .then((r) => {
        if (!cancelled) setReviews(r);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchReviews]);

  const average =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please choose a star rating");
      return;
    }
    setSending(true);
    try {
      await postReview({ data: { name, rating, title: title || undefined, body } });
      toast.success("Thank you! Your review has been published.");
      setFormOpen(false);
      setName("");
      setRating(0);
      setTitle("");
      setBody("");
      const fresh = await fetchReviews();
      setReviews(fresh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your review");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-12 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">Customer reviews</h2>
          {reviews.length > 0 ? (
            <div className="mt-4 flex items-center gap-3">
              <Stars rating={Math.round(average)} size={22} />
              <span className="text-sm font-medium">{average} out of 5</span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No reviews yet — be the first to share your experience.
            </p>
          )}
          {reviews.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Based on {reviews.length} review{reviews.length === 1 ? "" : "s"} from our customers
            </p>
          )}
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <PenLine size={15} aria-hidden />
            Write a review
          </button>
        </div>

        {!loaded ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : (
          reviews.length > 0 && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false);
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="animate-panel-up w-full max-w-lg rounded-t-2xl border border-border bg-background p-6 shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl">Share your experience</h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Your rating</label>
                <RatingInput value={rating} onChange={setRating} />
              </div>
              <div>
                <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium">
                  Your name
                </label>
                <input
                  id="review-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="e.g. Sarah M."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium">
                  Title <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="Sum it up in a few words"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label htmlFor="review-body" className="mb-1.5 block text-sm font-medium">
                  Your review
                </label>
                <textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="How did we do? What happened with your order, return or question?"
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-6 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {sending ? "Publishing…" : "Publish review"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Reviews are published under the name you provide.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
