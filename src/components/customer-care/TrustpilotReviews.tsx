import { useState } from "react";
import {
  Star,
  BadgeCheck,
  ThumbsUp,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Reply = {
  id: number;
  name: string;
  text: string;
  createdAt: number;
  likes: number;
  liked: boolean;
  parentId: number | null;
};

function relativeTime(ts: number, now: number) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ReplyComposer({
  label,
  onSubmit,
  onCancel,
}: {
  label: string;
  onSubmit: (name: string, text: string) => void;
  onCancel?: (() => void) | undefined;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  function submit() {
    const t = text.trim().slice(0, 500);
    if (!t) return;
    onSubmit(name.trim().slice(0, 60) || "Guest", t);
    setText("");
  }
  return (
    <div className="mt-3 space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        maxLength={60}
        aria-label="Your name"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Write a reply..."
          maxLength={500}
          aria-label={label}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none transition focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim()}
          aria-label="Post reply"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-yellow-400 px-3 text-foreground transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function ReplyItem({
  reply,
  all,
  depth,
  now,
  onLike,
  onReply,
}: {
  reply: Reply;
  all: Reply[];
  depth: number;
  now: number;
  onLike: (id: number) => void;
  onReply: (parentId: number, name: string, text: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const children = all.filter((r) => r.parentId === reply.id);
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-medium text-foreground ring-1 ring-border"
        >
          {initials(reply.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-xs font-medium">{reply.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {relativeTime(reply.createdAt, now)}
              </span>
            </div>
            <p className="mt-0.5 break-words text-xs leading-relaxed text-foreground/80">
              {reply.text}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3 px-1">
            <button
              type="button"
              onClick={() => onLike(reply.id)}
              aria-pressed={reply.liked}
              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                reply.liked ? "text-yellow-600" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp size={12} className={reply.liked ? "fill-yellow-400" : ""} />
              {reply.likes > 0 ? reply.likes : "Like"}
            </button>
            {depth < 3 && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Reply{children.length > 0 ? ` (${children.length})` : ""}
              </button>
            )}
          </div>
          {replying && (
            <ReplyComposer
              label={`Reply to ${reply.name}`}
              onCancel={() => setReplying(false)}
              onSubmit={(name, text) => {
                onReply(reply.id, name, text);
                setReplying(false);
              }}
            />
          )}
          {children.length > 0 && (
            <div className="ml-1 border-l-2 border-border pl-3">
              {children.map((c) => (
                <ReplyItem
                  key={c.id}
                  reply={c}
                  all={all}
                  depth={depth + 1}
                  now={now}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Review = {
  name: string;
  time: string;
  rating: number;
  text: string;
  verified?: boolean;
  likes?: number;
};

const INITIAL_REVIEWS: Review[] = [
  {
    name: "Charlotte Whitmore",
    time: "4 days ago",
    rating: 5,
    text: "My dress delivery was running late and I was worried I wouldn't have it in time for an event. The team kept me updated right up until it arrived. So relieved, thank you! 😊",
    verified: true,
    likes: 12,
  },
  {
    name: "Daniel Fletcher",
    time: "2 days ago",
    rating: 5,
    text: "Had a delayed parcel and wasn't sure what to do. Got a clear, helpful reply within a couple of hours with a new delivery date. Really good service 🙏",
    verified: true,
    likes: 9,
  },
  {
    name: "Amelia Hartley",
    time: "5 days ago",
    rating: 4,
    text: "Return was straightforward, but the refund took a few days longer than expected. Once I raised it, it was sorted quickly. Would be five stars if refunds were a bit faster.",
    verified: true,
    likes: 7,
  },
  {
    name: "Oliver Richardson",
    time: "1 week ago",
    rating: 5,
    text: "Order arrived in two separate parcels and I thought something was missing. Support explained immediately that the second box was on its way. All good 👍",
    likes: 15,
  },
  {
    name: "Lauren Bennett",
    time: "6 days ago",
    rating: 5,
    text: "Really helpful with my return. Clear instructions, no fuss, everything explained properly.",
    verified: true,
    likes: 11,
  },
  {
    name: "Matthew Harrison",
    time: "3 days ago",
    rating: 5,
    text: "A refund was taking longer than I hoped, but I could see exactly what stage it was at. Great not to be left guessing ✨",
    likes: 8,
  },
  {
    name: "Georgia Palmer",
    time: "2 weeks ago",
    rating: 5,
    text: "Didn't know who to contact about an order problem. Having one place to raise it and get a proper answer made things so much easier.",
    verified: true,
    likes: 14,
  },
  {
    name: "Rebecca Collins",
    time: "9 days ago",
    rating: 5,
    text: "One item in my order arrived faulty. I explained everything in one place and it was resolved without any back-and-forth. Very impressed 😊",
    likes: 10,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TpStar({ fill, size }: { fill: number; size: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-[2px] bg-muted"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 bg-yellow-400"
        style={{ width: `${fill * 100}%` }}
      />

      <Star
        size={size - 4}
        strokeWidth={0}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-white text-white"
      />
    </span>
  );
}

function TpStars({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-[2px]"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <TpStar
          key={i}
          fill={Math.max(0, Math.min(1, rating - i))}
          size={size}
        />
      ))}
    </span>
  );
}

function ReviewsLogo({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded-[2px] bg-yellow-400"
        style={{ width: size, height: size }}
      >
        <Star
          size={size - 8}
          strokeWidth={0}
          className="fill-white text-white"
        />
      </span>

      <span className="font-sans text-lg font-bold tracking-tight">
        Reviews
      </span>
    </span>
  );
}

function ReviewCard({
  review,
  reviewIndex,
}: {
  review: Review;
  reviewIndex: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    review.likes ?? 8 + reviewIndex
  );
  const [showReply, setShowReply] = useState(false);
  const [showThread, setShowThread] = useState(true);
  const [replies, setReplies] = useState<Reply[]>([]);
  const now = Date.now();

  function handleLike() {
    setLiked((current) => !current);

    setLikeCount((current) =>
      liked ? Math.max(0, current - 1) : current + 1
    );
  }

  function addReply(parentId: number | null, name: string, text: string) {
    setReplies((current) => [
      ...current,
      { id: Date.now() + Math.random(), name, text, createdAt: Date.now(), likes: 0, liked: false, parentId },
    ]);
    setShowThread(true);
  }

  function likeReply(id: number) {
    setReplies((current) =>
      current.map((r) =>
        r.id === id ? { ...r, liked: !r.liked, likes: r.liked ? Math.max(0, r.likes - 1) : r.likes + 1 } : r
      )
    );
  }

  const topLevel = replies.filter((r) => r.parentId === null);

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-medium tracking-wide text-foreground ring-1 ring-border"
        >
          {initials(review.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{review.name}</p>

          {review.verified && (
            <p className="inline-flex items-center gap-1 text-[11px] text-foreground/60">
              <BadgeCheck size={12} strokeWidth={2} aria-hidden />
              Verified customer
            </p>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground">
          {review.time}
        </span>
      </div>

      <div className="mt-3">
        <TpStars rating={review.rating} />
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
        {review.text}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={liked}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            liked
              ? "bg-yellow-50 text-yellow-600"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <ThumbsUp
            size={15}
            className={liked ? "fill-yellow-400" : ""}
          />

          <span>
            {likeCount} {likeCount === 1 ? "Like" : "Likes"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowReply((current) => !current)}
          aria-expanded={showReply}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageCircle size={15} />

          <span>
            {replies.length > 0
              ? `${replies.length} ${
                  replies.length === 1 ? "Reply" : "Replies"
                }`
              : "Reply"}
          </span>
        </button>
      </div>

      {showReply && (
        <ReplyComposer
          label={`Reply to ${review.name}`}
          onSubmit={(name, text) => addReply(null, name, text)}
        />
      )}

      {replies.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowThread((v) => !v)}
            aria-expanded={showThread}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {showThread ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showThread ? "Hide discussion" : `Show discussion (${replies.length})`}
          </button>
          {showThread && (
            <div className="animate-soft-enter">
              {topLevel.map((r) => (
                <ReplyItem
                  key={r.id}
                  reply={r}
                  all={replies}
                  depth={0}
                  now={now}
                  onLike={likeReply}
                  onReply={addReply}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function LeaveAReview({
  onSubmit,
}: {
  onSubmit: (review: Review) => void;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedText = text.trim();

    if (!trimmedName || !trimmedText) return;

    onSubmit({
      name: trimmedName,
      time: "Just now",
      rating,
      text: trimmedText,
      likes: 0,
    });

    setName("");
    setRating(5);
    setText("");
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-surface p-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold">Leave a Review</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Tell us about your experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="review-name"
            className="mb-1.5 block text-sm font-medium"
          >
            Your name
          </label>

          <input
            id="review-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">
            Your rating
          </span>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, index) => {
              const starNumber = index + 1;

              return (
                <button
                  key={starNumber}
                  type="button"
                  onClick={() => setRating(starNumber)}
                  aria-label={`Give ${starNumber} star${
                    starNumber === 1 ? "" : "s"
                  }`}
                  className="rounded p-1 transition hover:scale-110"
                >
                  <Star
                    size={24}
                    className={
                      starNumber <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="review-text"
            className="mb-1.5 block text-sm font-medium"
          >
            Your review
          </label>

          <textarea
            id="review-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write about your experience..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !text.trim()}
          className="w-full rounded-lg bg-yellow-400 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}

export function TrustpilotReviews() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  function addReview(review: Review) {
    setReviews((current) => [review, ...current]);
  }

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-12 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <ReviewsLogo />

          <div className="mt-4 flex items-center gap-3">
            <TpStars rating={4.7} size={22} />

            <span className="text-sm font-medium">
              4.7 out of 5
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review, index) => (
            <ReviewCard
              key={`${review.name}-${index}`}
              review={review}
              reviewIndex={index}
            />
          ))}
        </div>

        <LeaveAReview onSubmit={addReview} />

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Share your experience and help other customers.
        </p>
      </div>
    </section>
  );
}