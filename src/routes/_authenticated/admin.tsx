import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin, updateClaim, type ClaimStatus } from "@/lib/claims.functions";
import { STATUS_STEPS, statusIndex, statusLabel, timeAgo } from "@/lib/claim-status";
import logoAsset from "@/assets/debenhams-logo-light.png.asset.json";

type Convo = {
  id: string;
  customer_name: string | null;
  email: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_staff: number;
  status: string;
};

type Feed = { id: string; kind: "new" | "chat" | "status" | "reply" | "note"; title: string; subtitle: string; at: string };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Claims dashboard — Customer Care" },
      { name: "description", content: "Manage incoming customer claims in real time." },
      { property: "og:title", content: "Claims dashboard — Customer Care" },
      { property: "og:description", content: "Manage incoming customer claims in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Claim = {
  id: string;
  ref: string;
  customer_name: string;
  email: string;
  phone: string | null;
  category: string;
  order_number: string | null;
  description: string;
  status: ClaimStatus;
  status_updated_at: string;
  reply: string | null;
  internal_note: string | null;
  seen: boolean;
  created_at: string;
};

const COLS =
  "id, ref, customer_name, email, phone, category, order_number, description, status, status_updated_at, reply, internal_note, seen, created_at";

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(ensureAdmin);
  const update = useServerFn(updateClaim);
  const [access, setAccess] = useState<"checking" | "yes" | "no">("checking");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClaimStatus>("all");
  const [order, setOrder] = useState<"newest" | "oldest" | "updated">("newest");
  const [now, setNow] = useState(() => Date.now());
  const [convos, setConvos] = useState<Convo[]>([]);
  const [staffName, setStaffName] = useState("Staff");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    checkAdmin().then((r) => setAccess(r.isAdmin ? "yes" : "no")).catch(() => setAccess("no"));
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const n = (u?.user_metadata?.["full_name"] as string | undefined) || u?.email?.split("@")[0];
      if (n) setStaffName(n.charAt(0).toUpperCase() + n.slice(1));
    });
  }, [checkAdmin]);

  useEffect(() => {
    if (access !== "yes") return;
    const cols = "id, customer_name, email, last_message, last_message_at, unread_staff, status";
    supabase
      .from("chat_conversations")
      .select(cols)
      .order("last_message_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setConvos((data as Convo[]) ?? []));
    const ch = supabase
      .channel("admin-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, (p) => {
        const c = p.new as Convo;
        if (!c?.id) return;
        setConvos((l) => [c, ...l.filter((x) => x.id !== c.id)].sort((a, b) => b.last_message_at.localeCompare(a.last_message_at)));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [access]);

  useEffect(() => {
    if (access !== "yes") return;
    supabase
      .from("claims")
      .select(COLS)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (error) {
          setLoadError(true);
          setLoading(false);
          return;
        }
        setClaims((data as Claim[]) ?? []);
        setLoadError(false);
        setLoading(false);
      });
    const channel = supabase
      .channel("admin-claims")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "claims" }, (p) => {
        const c = p.new as Claim;
        setClaims((list) => (list.some((x) => x.id === c.id) ? list : [c, ...list]));
        toast(`New claim from ${c.customer_name}`, { description: c.ref });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "claims" }, (p) => {
        const c = p.new as Claim;
        setClaims((list) => list.map((x) => (x.id === c.id ? { ...x, ...c } : x)));
      })
      .subscribe();
    const tick = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(tick);
    };
  }, [access]);

  const patchLocal = (id: string, p: Partial<Claim>) =>
    setClaims((list) => list.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const setStatus = useCallback(
    async (c: Claim, status: ClaimStatus) => {
      if (c.status === status) return;
      const prev = { status: c.status, status_updated_at: c.status_updated_at };
      patchLocal(c.id, { status, status_updated_at: new Date().toISOString(), seen: true });
      try {
        await update({ data: { id: c.id, status, seen: true } });
      } catch {
        patchLocal(c.id, prev);
        toast.error("Couldn't update status");
      }
    },
    [update],
  );

  const open = (c: Claim) => {
    setOpenId(c.id);
    if (!c.seen) {
      patchLocal(c.id, { seen: true });
      update({ data: { id: c.id, seen: true } }).catch(() => {});
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return claims
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter((c) => !s || [c.customer_name, c.email, c.ref, c.phone ?? "", c.description].some((v) => v.toLowerCase().includes(s)))
      .sort((a, b) => {
        if (order === "oldest") return a.created_at.localeCompare(b.created_at);
        if (order === "updated") return b.status_updated_at.localeCompare(a.status_updated_at);
        return b.created_at.localeCompare(a.created_at);
      });
  }, [claims, q, statusFilter, order]);

  const newCount = claims.filter((c) => !c.seen).length;
  const selected = claims.find((c) => c.id === openId) ?? null;
  const unreadChats = convos.reduce((n, c) => n + (c.unread_staff > 0 ? 1 : 0), 0);
  const underReview = claims.filter((c) => c.status === "under_review").length;
  const beingHandled = claims.filter((c) => c.status === "being_handled").length;
  const updateAvailable = claims.filter((c) => c.status === "update_available").length;
  const needsAttention = claims.filter(
    (c) => c.status !== "update_available" && now - new Date(c.status_updated_at).getTime() > 48 * 3600 * 1000,
  ).length;

  const notifications: Feed[] = useMemo(() => {
    const list: Feed[] = [
      ...claims.filter((c) => !c.seen).map((c) => ({
        id: `n-${c.id}`, kind: "new" as const, title: `New request ${c.ref}`, subtitle: `${c.customer_name} · ${c.category}`, at: c.created_at,
      })),
      ...convos.filter((c) => c.unread_staff > 0).map((c) => ({
        id: `c-${c.id}`, kind: "chat" as const, title: `${c.unread_staff} unread message${c.unread_staff > 1 ? "s" : ""}`, subtitle: c.customer_name || "Anonymous visitor", at: c.last_message_at,
      })),
    ];
    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
  }, [claims, convos]);

  const activities: Feed[] = useMemo(() => {
    const list: Feed[] = claims.flatMap((c) => {
      const items: Feed[] = [{ id: `a-new-${c.id}`, kind: "new", title: `Request ${c.ref} submitted`, subtitle: c.customer_name, at: c.created_at }];
      if (c.status_updated_at !== c.created_at && c.status !== "received")
        items.push({ id: `a-st-${c.id}`, kind: c.reply ? "reply" : "status", title: `${c.ref} moved to ${statusLabel(c.status)}`, subtitle: c.customer_name, at: c.status_updated_at });
      return items;
    });
    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  }, [claims]);

  // Keyboard: j/k to move, Enter to open, Esc to close, 1-4 to set status.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      if (e.key === "Escape") setOpenId(null);
      const idx = filtered.findIndex((c) => c.id === openId);
      if (e.key === "j" || e.key === "ArrowDown") {
        const n = filtered[Math.min(filtered.length - 1, idx + 1)];
        if (n) open(n);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        const n = filtered[Math.max(0, idx - 1)];
        if (n) open(n);
      }
      if (selected && ["1", "2", "3", "4"].includes(e.key)) {
        const step = STATUS_STEPS[Number(e.key) - 1];
        if (step) setStatus(selected, step.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (access === "checking")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );

  if (access === "no")
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-2xl">No access yet</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account isn&rsquo;t approved for the claims dashboard. Ask an administrator to grant access.
        </p>
        <button onClick={signOut} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-card">
          Sign out
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <p className="font-serif text-lg tracking-wide">Claims</p>
          <Link to="/chats" className="rounded-full border border-primary-foreground/30 px-3 py-1 text-xs hover:bg-coffee">
            Live Chats
          </Link>
          {newCount > 0 && (
            <span className="rounded-full bg-primary-foreground px-2 py-0.5 text-xs font-medium text-primary">
              {newCount} new
            </span>
          )}
          <span className="ml-auto hidden text-xs opacity-70 sm:inline">
            {claims.length} open · live
            <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-trustpilot align-middle" />
          </span>
          <button onClick={signOut} aria-label="Sign out" className="rounded-full p-2 hover:bg-coffee">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, claim ID…"
              aria-label="Search claims"
              className="w-full rounded-lg border border-input bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "newest" | "oldest" | "updated")}
            aria-label="Order claims"
            className="rounded-lg border border-input bg-surface px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="newest">Newest first</option>
            <option value="updated">Recently updated</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter claims by progress">
          {(["all", ...STATUS_STEPS.map((step) => step.key)] as const).map((key) => {
            const count = key === "all" ? claims.length : claims.filter((claim) => claim.status === key).length;
            const label = key === "all" ? "All" : statusLabel(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                aria-pressed={statusFilter === key}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${statusFilter === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-card"}`}
              >
                {label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface" aria-label="Loading claims">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="grid animate-pulse gap-3 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1.3fr_2fr_auto]">
                <span className="h-4 w-32 rounded bg-muted" />
                <span className="h-4 w-full rounded bg-muted" />
                <span className="h-4 w-24 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Claims could not be loaded. Refresh the page to try again.
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {claims.length === 0 ? "No claims yet. New ones appear here instantly." : "No claims match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => open(c)}
                  className={`grid w-full gap-1 px-4 py-3 text-left transition-colors hover:bg-card sm:grid-cols-[1.3fr_2fr_auto] sm:items-center sm:gap-4 ${
                    openId === c.id ? "bg-card" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {!c.seen && <span className="h-2 w-2 shrink-0 rounded-full bg-destructive" aria-label="New" />}
                      {c.customer_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.email}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{c.description}</p>
                  <div className="flex items-center gap-3 text-xs sm:justify-end">
                    <StatusPill status={c.status} />
                    <span className="font-mono text-muted-foreground">{c.ref}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 hidden text-xs text-muted-foreground sm:block">
          Tip: j / k to move, 1–4 to set status, Esc to close.
        </p>
      </main>

      {selected && (
        <ClaimDrawer
          key={selected.id}
          claim={selected}
          now={now}
          onClose={() => setOpenId(null)}
          onStatus={(s) => setStatus(selected, s)}
          onSave={async (p) => {
            try {
              await update({ data: { id: selected.id, ...p } });
              patchLocal(selected.id, {
                ...(p.reply !== undefined ? { reply: p.reply || null } : {}),
                ...(p.internalNote !== undefined ? { internal_note: p.internalNote || null } : {}),
              });
              toast.success(p.reply !== undefined ? "Reply sent to tracking page" : "Note saved");
            } catch {
              toast.error("Couldn't save");
            }
          }}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: ClaimStatus }) {
  const i = statusIndex(status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5">
      <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-destructive" : i === 3 ? "bg-trustpilot" : "bg-coffee"}`} />
      {statusLabel(status)}
    </span>
  );
}

function ClaimDrawer({
  claim,
  now,
  onClose,
  onStatus,
  onSave,
}: {
  claim: Claim;
  now: number;
  onClose: () => void;
  onStatus: (s: ClaimStatus) => void;
  onSave: (p: { reply?: string; internalNote?: string }) => Promise<void>;
}) {
  const [reply, setReply] = useState(claim.reply ?? "");
  const [note, setNote] = useState(claim.internal_note ?? "");
  const [saving, setSaving] = useState<"" | "reply" | "note">("");
  const current = statusIndex(claim.status);
  const progressWidth = ["w-1/4", "w-1/2", "w-3/4", "w-full"][current] ?? "w-1/4";
  const area =
    "w-full resize-none rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-coffee/40 backdrop-blur-[1px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="animate-panel-in-right h-full w-full max-w-md overflow-y-auto overscroll-contain bg-surface p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{claim.ref}</p>
            <h2 className="mt-1 font-serif text-2xl">{claim.customer_name}</h2>
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(claim.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · updated {timeAgo(claim.status_updated_at, now)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-card">
            <X size={18} />
          </button>
        </div>

        <section className="mt-5">
          <p className="mb-2 text-xs font-medium tracking-[0.16em] text-muted-foreground">CHANGE STATUS</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => onStatus(s.key)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  i === current
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < current
                      ? "border-border bg-card"
                      : "border-border hover:bg-card"
                }`}
              >
                <span className="mr-1.5 text-xs opacity-60">{i + 1}</span>
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`Claim progress: step ${current + 1} of ${STATUS_STEPS.length}`}>
            <div className={`h-full rounded-full bg-trustpilot transition-[width] duration-300 ${progressWidth}`} />
          </div>
        </section>

        <section className="mt-6 grid gap-2 text-sm">
          <a href={`mailto:${claim.email}`} className="flex items-center gap-2 hover:underline">
            <Mail size={14} className="text-muted-foreground" /> {claim.email}
          </a>
          {claim.phone && (
            <a href={`tel:${claim.phone}`} className="flex items-center gap-2 hover:underline">
              <Phone size={14} className="text-muted-foreground" /> {claim.phone}
            </a>
          )}
          <p className="text-muted-foreground">
            {claim.category}
            {claim.order_number ? ` · Order ${claim.order_number}` : ""}
          </p>
        </section>

        <section className="mt-5 rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground">ISSUE</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{claim.description}</p>
        </section>

        <section className="mt-5">
          <label htmlFor="reply" className="text-xs font-medium tracking-[0.16em] text-muted-foreground">
            REPLY TO CUSTOMER
          </label>
          <p className="mb-2 text-xs text-muted-foreground">Shown on the customer&rsquo;s tracking page instantly.</p>
          <textarea id="reply" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} className={area} />
          <button
            disabled={saving !== "" || reply === (claim.reply ?? "")}
            onClick={async () => {
              setSaving("reply");
              await onSave({ reply });
              setSaving("");
            }}
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-coffee disabled:opacity-50"
          >
            {saving === "reply" ? "Sending…" : "Send reply"}
          </button>
        </section>

        <section className="mt-5">
          <label htmlFor="note" className="text-xs font-medium tracking-[0.16em] text-muted-foreground">
            INTERNAL NOTE
          </label>
          <p className="mb-2 text-xs text-muted-foreground">Only visible to staff.</p>
          <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={area} />
          <button
            disabled={saving !== "" || note === (claim.internal_note ?? "")}
            onClick={async () => {
              setSaving("note");
              await onSave({ internalNote: note });
              setSaving("");
            }}
            className="mt-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-card disabled:opacity-50"
          >
            {saving === "note" ? "Saving…" : "Save note"}
          </button>
        </section>
      </aside>
    </div>
  );
}
