import { Star, BadgeCheck } from "lucide-react";

type Review = {
  name: string;
  time: string;
  rating: number;
  text: string;
  verified?: boolean;
};

const REVIEWS: Review[] = [
  {
    name: "Charlotte Whitmore",
    time: "4 days ago",
    rating: 5,
    text: "My dress delivery was running late and I was worried I wouldn't have it in time for an event. The team kept me updated right up until it arrived. So relieved, thank you! 😊",
    verified: true,
  },
  {
    name: "Daniel Fletcher",
    time: "2 days ago",
    rating: 5,
    text: "Had a delayed parcel and wasn't sure what to do. Got a clear, helpful reply within a couple of hours with a new delivery date. Really good service 🙏",
    verified: true,
  },
  {
    name: "Amelia Hartley",
    time: "5 days ago",
    rating: 4,
    text: "Return was straightforward, but the refund took a few days longer than expected. Once I raised it, it was sorted quickly. Would be five stars if refunds were a bit faster.",
    verified: true,
  },
  {
    name: "Oliver Richardson",
    time: "1 week ago",
    rating: 5,
    text: "Order arrived in two separate parcels and I thought something was missing. Support explained immediately that the second box was on its way. All good 👍",
  },
  {
    name: "Lauren Bennett",
    time: "6 days ago",
    rating: 5,
    text: "Really helpful with my return. Clear instructions, no fuss, everything explained properly.",
    verified: true,
  },
  {
    name: "Matthew Harrison",
    time: "3 days ago",
    rating: 5,
    text: "A refund was taking longer than I hoped, but I could see exactly what stage it was at. Great not to be left guessing ✨",
  },
  {
    name: "Georgia Palmer",
    time: "2 weeks ago",
    rating: 5,
    text: "Didn't know who to contact about an order problem. Having one place to raise it and get a proper answer made things so much easier.",
    verified: true,
  },
  {
    name: "Rebecca Collins",
    time: "9 days ago",
    rating: 5,
    text: "One item in my order arrived faulty. I explained everything in one place and it was resolved without any back-and-forth. Very impressed 😊",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

function TpStar({ fill, size }: { fill: number; size: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-[2px] bg-muted"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 left-0 bg-trustpilot"
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

function TpStars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[2px]" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <TpStar key={i} fill={Math.max(0, Math.min(1, rating - i))} size={size} />
      ))}
    </span>
  );
}

function TpLogo({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded-[2px] bg-trustpilot"
        style={{ width: size, height: size }}
      >
        <Star size={size - 8} strokeWidth={0} className="fill-white text-white" />
      </span>
      <span className="font-sans text-lg font-bold tracking-tight">Reviews</span>
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
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
            <p className="inline-flex items-center gap-1 text-[11px] text-trustpilot">
              <BadgeCheck size={12} strokeWidth={2} aria-hidden />
              Verified customer
            </p>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">{review.time}</span>
      </div>

      <div className="mt-3">
        <TpStars rating={review.rating} />
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">{review.text}</p>
    </article>
  );
}

export function TrustpilotReviews() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-12 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <TpLogo />
          <div className="mt-4 flex items-center gap-3">
            <TpStars rating={4.7} size={22} />
            <span className="text-sm font-medium">TrustScore 4.7</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Rated <span className="font-medium text-foreground">Excellent</span> · Based on 2,847
            reviews
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r) => (
            <ReviewCard key={r.name} review={r} />
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Reviews shown are illustrative examples of the support experience.
        </p>
      </div>
    </section>
  );
}
