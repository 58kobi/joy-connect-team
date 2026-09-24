import { useState } from "react";
import {
  Check,
  Heart,
  Link2,
  Mail,
  MessageCircle,
  Reply,
  Share2,
} from "lucide-react";

type Comment = { name: string; text: string; time: string };
type Story = {
  id: string;
  name: string;
  time: string;
  text: string;
  likes: number;
  comments: Comment[];
  featured?: boolean;
};

const STORIES: Story[] = [
  {
    id: "s1",
    name: "Charlotte Whitmore",
    time: "4 days ago",
    featured: true,
    likes: 24,
    text: "My dress was delayed and I was getting worried because I needed it for an event. The help team handled everything so well and kept me updated until the issue was sorted. Really appreciated the support.",
    comments: [
      { name: "Hannah Okafor", text: "Hope your dress arrived in time.", time: "3 days ago" },
      { name: "Tom Pearce", text: "Glad you got it sorted!", time: "3 days ago" },
      { name: "Priya Chauhan", text: "Good to know there is somewhere to raise these issues.", time: "2 days ago" },
    ],
  },
  {
    id: "s2",
    name: "Daniel Fletcher",
    time: "2 days ago",
    likes: 11,
    text: "My delivery was later than expected and I wasn't sure whether to wait or contact someone. The support team helped me understand what was happening and what to do next.",
    comments: [
      { name: "Megan Lloyd", text: "I'm having a similar delivery issue at the moment.", time: "1 day ago" },
    ],
  },
  {
    id: "s3",
    name: "Amelia Hartley",
    time: "5 days ago",
    likes: 8,
    text: "After sending my return back, I was waiting for an update on the refund. It was helpful being able to explain the issue and provide the order details in one place.",
    comments: [
      { name: "James McAllister", text: "Thanks for sharing this.", time: "4 days ago" },
      { name: "Sophie Grant", text: "How long did the refund take in the end?", time: "4 days ago" },
    ],
  },
  {
    id: "s4",
    name: "Oliver Richardson",
    time: "1 week ago",
    likes: 5,
    text: "The order arrived in separate parcels, so at first I thought something was missing. Once I checked the details properly, everything became much clearer.",
    comments: [
      { name: "Kate Donnelly", text: "Same thing happened to me last month!", time: "6 days ago" },
    ],
  },
  {
    id: "s5",
    name: "Lauren Bennett",
    time: "6 days ago",
    likes: 14,
    text: "Really appreciated the help with my return. There were a few things I wasn't sure about, but the process was explained clearly.",
    comments: [
      { name: "Rhys Evans", text: "Glad it was straightforward.", time: "5 days ago" },
      { name: "Aisha Rahman", text: "Thanks for sharing this.", time: "5 days ago" },
    ],
  },
  {
    id: "s6",
    name: "Matthew Harrison",
    time: "3 days ago",
    likes: 7,
    text: "A refund was taking longer than I expected. I submitted the details and was able to keep track of what was happening rather than wondering what to do.",
    comments: [
      { name: "Eleanor Walsh", text: "The tracking part sounds really useful.", time: "2 days ago" },
    ],
  },
  {
    id: "s7",
    name: "Georgia Palmer",
    time: "2 weeks ago",
    likes: 9,
    text: "Wasn't sure who to contact about an order problem, so having a dedicated support area made things much easier.",
    comments: [
      { name: "Ben Thornton", text: "Good to know there is somewhere to raise these issues.", time: "2 weeks ago" },
    ],
  },
  {
    id: "s8",
    name: "Rebecca Collins",
    time: "9 days ago",
    likes: 6,
    text: "My issue was a little complicated because the order contained more than one item. The support process gave me somewhere to explain everything properly.",
    comments: [
      { name: "Callum Byrne", text: "Multi-item orders can be such a headache.", time: "8 days ago" },
      { name: "Nadia Kowalski", text: "Glad you got it sorted!", time: "7 days ago" },
    ],
  },
];

const TRUST = [
  "Clear support process",
  "Secure information handling",
  "Dedicated customer-care assistance",
  "Updates on your request",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-cream font-medium tracking-wide text-foreground ring-1 ring-border ${cls}`}
    >
      {initials(name)}
    </span>
  );
}

function StoryCard({ story }: { story: Story }) {
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState(story.comments);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const featured = !!story.featured;

  const openComposer = (prefill = "") => {
    setExpanded(true);
    setDraft(prefill);
    setTimeout(() => document.getElementById(`input-${story.id}`)?.focus(), 0);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((c) => [...c, { name: "You", text, time: "Just now" }]);
    setDraft("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/#story-${story.id}`);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShareOpen(false);
    }, 1200);
  };

  const action =
    "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-cream hover:text-foreground active:scale-[0.97]";

  return (
    <article
      id={`story-${story.id}`}
      className={`flex flex-col rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--foreground)_18%,transparent)] sm:p-6 ${
        featured ? "md:col-span-2 lg:row-span-2" : ""
      }`}
    >
      <header className="flex items-center gap-3">
        <Avatar name={story.name} size={featured ? "lg" : "md"} />
        <div className="min-w-0">
          <p className="truncate font-medium">{story.name}</p>
          <p className="text-xs text-muted-foreground">
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] tracking-wide">
              Customer Story
            </span>
            <span className="ml-2">{story.time}</span>
          </p>
        </div>
      </header>

      <p
        className={`mt-5 flex-1 leading-relaxed ${
          featured ? "font-serif text-xl sm:text-2xl lg:text-[1.7rem] lg:leading-snug" : "text-[15px]"
        }`}
      >
        {featured ? <>&ldquo;{story.text}&rdquo;</> : story.text}
      </p>

      <div className="relative mt-5 flex flex-wrap items-center gap-1 border-t border-border pt-3 -mx-2">
        <button
          type="button"
          aria-pressed={liked}
          onClick={() => setLiked((v) => !v)}
          className={action + (liked ? " text-foreground" : "")}
        >
          <Heart
            size={17}
            strokeWidth={1.6}
            className={`transition-transform ${liked ? "scale-110 fill-current" : ""}`}
          />
          {story.likes + (liked ? 1 : 0)}
          {featured && " likes"}
        </button>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={action}
        >
          <MessageCircle size={17} strokeWidth={1.6} />
          {comments.length}
          {featured && " comments"}
        </button>
        <button type="button" onClick={() => openComposer()} className={action}>
          <Reply size={17} strokeWidth={1.6} />
          Reply
        </button>
        <button
          type="button"
          aria-expanded={shareOpen}
          onClick={() => setShareOpen((v) => !v)}
          className={action}
        >
          <Share2 size={16} strokeWidth={1.6} />
          Share
        </button>

        {shareOpen && (
          <div className="absolute bottom-full right-2 z-10 mb-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-cream"
            >
              {copied ? <Check size={15} /> : <Link2 size={15} />}
              {copied ? "Link copied" : "Copy link"}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent("A customer story")}&body=${encodeURIComponent(story.text)}`}
              onClick={() => setShareOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-cream"
            >
              <Mail size={15} /> Share by email
            </a>
          </div>
        )}
      </div>

      {!expanded && comments.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 self-start text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          View {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </button>
      )}

      {expanded && (
        <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-1">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-3">
              <Avatar name={c.name} size="sm" />
              <div className="min-w-0 flex-1 rounded-xl bg-background px-3.5 py-2.5">
                <p className="text-xs">
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-muted-foreground">{c.time}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed">{c.text}</p>
                {c.name !== "You" && (
                  <button
                    type="button"
                    onClick={() => openComposer(`@${c.name.split(" ")[0]} `)}
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))}
          <form onSubmit={submit} className="flex gap-2">
            <label htmlFor={`input-${story.id}`} className="sr-only">
              Write a comment
            </label>
            <input
              id={`input-${story.id}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a comment…"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-input bg-surface px-4 text-sm outline-none focus:border-ring"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
            >
              Post
            </button>
          </form>
          <p className="text-[11px] text-muted-foreground">
            Sample comments shown for illustration.
          </p>
        </div>
      )}
    </article>
  );
}

export function CustomerStories({
  onShare,
  onSupport,
}: {
  onShare: () => void;
  onSupport: () => void;
}) {
  return (
    <section id="stories" className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-12 lg:py-24">
        <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
          CUSTOMER STORIES
        </p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">
          Real experiences. Real support.
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          See how customers have navigated delivery, returns, refunds and order
          issues with the help of customer support.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Stories below are sample customer feedback shared for illustration and
          have not been independently verified.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 sm:p-10 md:flex-row md:items-center">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl">Had an issue with an order?</h3>
            <p className="mt-2 max-w-lg leading-relaxed text-muted-foreground">
              Tell us what happened and our support team can help you understand
              the next steps.
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onShare}
              className="min-h-12 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Share Your Experience
            </button>
            <button
              type="button"
              onClick={onSupport}
              className="min-h-12 px-4 text-sm font-medium underline-offset-4 hover:underline"
            >
              Get Support →
            </button>
          </div>
        </div>

        <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check size={16} strokeWidth={1.8} className="text-foreground" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
