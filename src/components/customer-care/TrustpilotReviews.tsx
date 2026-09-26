import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  id: string;
  name: string;
  text: string;
  createdAt: number;
  likes: number;
  liked: boolean;
  parentId: string | null;
};

type ReplyRow = {
  id: string;
  name: string;
  body: string;
  likes: number;
  created_at: string;
  parent_id: string | null;
};

const LIKED_KEY = "review-reply-likes";
function readLiked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function writeLiked(set: Set<string>) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

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
  onLike: (id: string) => void;
  onReply: (parentId: string, name: string, text: string) => void;
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
  dbId?: string | undefined;
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
  const reviewKey = review.dbId ?? review.name;

  useEffect(() => {
    let active = true;
    const likedSet = readLiked();
    const toReply = (r: ReplyRow): Reply => ({
      id: r.id,
      name: r.name,
      text: r.body,
      createdAt: new Date(r.created_at).getTime(),
      likes: r.likes,
      liked: likedSet.has(r.id),
      parentId: r.parent_id,
    });
    supabase
      .from("review_replies")
      .select("id,name,body,likes,created_at,parent_id")
      .eq("review_key", reviewKey)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setReplies(data.map(toReply));
      });
    const channel = supabase
      .channel(`review-replies-${reviewKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "review_replies", filter: `review_key=eq.${reviewKey}` },
        (payload) => {
          const row = payload.new as ReplyRow | undefined;
          if (!row?.id) return;
          setReplies((cur) => {
            const i = cur.findIndex((r) => r.id === row.id);
            if (i === -1) return [...cur, toReply(row)];
            const next = [...cur];
            next[i] = { ...next[i]!, likes: row.likes };
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [reviewKey]);

  useEffect(() => {
    if (review.dbId && readLiked().has(`review:${review.dbId}`)) setLiked(true);
  }, [review.dbId]);

  async function handleLike() {
    const delta = liked ? -1 : 1;
    setLiked((current) => !current);

    setLikeCount((current) =>
      liked ? Math.max(0, current - 1) : current + 1
    );

    if (review.dbId) {
      const set = readLiked();
      const k = `review:${review.dbId}`;
      if (delta === 1) set.add(k);
      else set.delete(k);
      writeLiked(set);
      const { data, error } = await supabase.rpc("like_review", { _id: review.dbId, _delta: delta });
      if (!error && typeof data === "number") setLikeCount(data);
    }
  }

  async function addReply(parentId: string | null, name: string, text: string) {
    const { data, error } = await supabase
      .from("review_replies")
      .insert({ review_key: reviewKey, parent_id: parentId, name, body: text })
      .select("id,name,body,likes,created_at,parent_id")
      .single();
    if (error || !data) {
      toast.error("Couldn't post your reply. Please try again.");
      return;
    }
    setReplies((cur) =>
      cur.some((r) => r.id === data.id)
        ? cur
        : [...cur, { id: data.id, name: data.name, text: data.body, createdAt: new Date(data.created_at).getTime(), likes: data.likes, liked: false, parentId: data.parent_id }]
    );
    setShowThread(true);
  }

  async function likeReply(id: string) {
    const target = replies.find((r) => r.id === id);
    if (!target) return;
    const delta = target.liked ? -1 : 1;
    setReplies((cur) =>
      cur.map((r) => (r.id === id ? { ...r, liked: !r.liked, likes: Math.max(0, r.likes + delta) } : r))
    );
    const set = readLiked();
    if (delta === 1) set.add(id);
    else set.delete(id);
    writeLiked(set);
    const { data, error } = await supabase.rpc("like_review_reply", { _id: id, _delta: delta });
    if (!error && typeof data === "number") {
      setReplies((cur) => cur.map((r) => (r.id === id ? { ...r, likes: data } : r)));
    }
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
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedText = text.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedText || !trimmedEmail) return;
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      toast.error("Please enter a name between 2 and 80 characters.");
      return;
    }
    if (trimmedEmail.length > 255 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (trimmedText.length < 10 || trimmedText.length > 1000) {
      toast.error("Your review should be between 10 and 1000 characters.");
      return;
    }

    setSending(true);
    const { data, error } = await supabase
      .from("reviews")
      .insert({ name: trimmedName, rating, body: trimmedText })
      .select("id,name,rating,body,likes,created_at")
      .single();
    if (error || !data) {
      setSending(false);
      toast.error("Couldn't submit your review. Please try again.");
      return;
    }
    await supabase.from("review_emails").insert({ review_id: data.id, email: trimmedEmail });
    setSending(false);

    onSubmit(rowToReview(data));
    toast.success("Thanks for your review!");

    setName("");
    setEmail("");
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
          <label htmlFor="review-email" className="mb-1.5 block text-sm font-medium">
            Your email
          </label>

          <input
            id="review-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            maxLength={255}
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Only visible to our customer care team — never shown publicly.
          </p>
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
          disabled={sending || !name.trim() || !text.trim()}
          className="w-full rounded-lg bg-yellow-400 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Review
        </button>
      </form>
    </div>
  );
}

type ReviewRow = { id: string; name: string; rating: number; body: string; likes: number; created_at: string };

function rowToReview(r: ReviewRow): Review {
  return {
    dbId: r.id,
    name: r.name,
    time: relativeTime(new Date(r.created_at).getTime(), Date.now()),
    rating: r.rating,
    text: r.body,
    likes: r.likes,
  };
}

export function TrustpilotReviews() {
  const [saved, setSaved] = useState<Review[]>([]);
  const [showAll, setShowAll] = useState(false);
  const reviews = [...saved, ...INITIAL_REVIEWS];
  const visibleReviews = showAll ? reviews : reviews.slice(0, 4);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("id,name,rating,body,likes,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setSaved(data.map(rowToReview));
      });
    const ch = supabase
      .channel("public-reviews")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reviews" }, (p) => {
        const row = p.new as ReviewRow;
        setSaved((cur) => (cur.some((r) => r.dbId === row.id) ? cur : [rowToReview(row), ...cur]));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "reviews" }, (p) => {
        const id = (p.old as { id?: string }).id;
        if (id) setSaved((cur) => cur.filter((r) => r.dbId !== id));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  function addReview(review: Review) {
    setSaved((current) => (current.some((r) => r.dbId === review.dbId) ? current : [review, ...current]));
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
          {visibleReviews.map((review, index) => (
            <ReviewCard
              key={review.dbId ?? `${review.name}-${index}`}
              review={review}
              reviewIndex={index}
            />
          ))}
        </div>

        {reviews.length > 4 && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              {showAll ? "Show fewer reviews" : `See more reviews (${reviews.length - 4})`}
            </button>
          </div>
        )}

        <LeaveAReview onSubmit={addReview} />

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Share your experience and help other customers.
        </p>
      </div>
    </section>
  );
}