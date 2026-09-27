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
  Settings,
  Star,
  Users,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin, updateClaim, type ClaimStatus } from "@/lib/claims.functions";
import { STATUS_STEPS, statusIndex, statusLabel, timeAgo } from "@/lib/claim-status";
import logoAsset from "@/assets/debenhams-logo-light.png.asset.json";
import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";

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
    return claims
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .sort((a, b) => {
        if (order === "oldest") return a.created_at.localeCompare(b.created_at);
        if (order === "updated") return b.status_updated_at.localeCompare(a.status_updated_at);
        return b.created_at.localeCompare(a.created_at);
      });
  }, [claims, statusFilter, order]);

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

  const scrollTo = (id: string) => {
    setNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="staff-console min-h-screen w-full max-w-full overflow-x-hidden bg-console-bg text-console-ink">
      {navOpen && <div className="fixed inset-0 z-30 bg-console-nav/40 lg:hidden" onClick={() => setNavOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-console-nav text-console-nav-fg transition-transform duration-200 lg:translate-x-0 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-6 pb-6 pt-7">
          <img src={logoAsset.url} alt="Debenhams" width={160} height={28} className="h-auto w-40" />
          <p className="mt-2 text-[11px] tracking-wide opacity-60">Better Style. Brighter Days.</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 text-sm">
          <SidebarLink icon={<LayoutDashboard size={17} />} label="Dashboard" active onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <SidebarLink icon={<ClipboardList size={17} />} label="Claims" badge={newCount} onClick={() => scrollTo("recent-claims")} />
          <SidebarLink icon={<MessageSquare size={17} />} label="Live Chats" badge={unreadChats} onClick={() => navigate({ to: "/chats" })} />
          <SidebarLink icon={<Users size={17} />} label="Customers" onClick={() => scrollTo("recent-claims")} />
          <SidebarLink icon={<Package size={17} />} label="Orders" onClick={() => scrollTo("recent-claims")} />
          <SidebarLink icon={<Star size={17} />} label="Reviews" onClick={() => scrollTo("reviews")} />
          <SidebarLink icon={<Bell size={17} />} label="Notifications" badge={notifications.length} onClick={() => scrollTo("notifications")} />
          <SidebarLink icon={<Activity size={17} />} label="Activity History" onClick={() => scrollTo("recent-activity")} />
          <SidebarLink icon={<Settings size={17} />} label="Settings" onClick={() => toast("Settings are managed by your administrator.")} />
        </nav>
        <div className="border-t border-console-nav-fg/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={staffName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{staffName}</p>
              <p className="text-[11px] opacity-60">Staff Member</p>
            </div>
          </div>
          <button onClick={signOut} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm opacity-80 transition hover:bg-console-nav-fg/10 hover:opacity-100">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 max-w-full lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-console-line bg-surface px-4 py-3 sm:px-6">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-console-bg lg:hidden">
            <Menu size={18} />
          </button>
          <button onClick={() => scrollTo("notifications")} aria-label="Notifications" className="relative ml-auto shrink-0 rounded-full p-2 hover:bg-console-bg">
            <Bell size={18} />
            {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-console-red" />}
          </button>
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <Avatar name={staffName} />
            <div className="leading-tight">
              <p className="text-sm font-semibold">{staffName}</p>
              <p className="text-[11px] text-muted-foreground">Staff Member</p>
            </div>
            <ChevronDown size={16} className="text-muted-foreground" />
          </div>
        </header>

        <main className="w-full min-w-0 max-w-full px-4 py-6 sm:px-6">
          <div className="mb-6 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 break-words text-sm text-muted-foreground">Overview of customer requests, chats and recent activity.</p>
          </div>

          <div className="mb-6 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="New Requests" value={newCount} icon={<Inbox size={18} />} tone="accent" live />
            <MetricCard label="Unread Chats" value={unreadChats} icon={<MessageSquare size={18} />} tone="pink" live />
            <MetricCard label="Under Review" value={underReview} icon={<FileText size={18} />} tone="orange" />
            <MetricCard label="Being Handled" value={beingHandled} icon={<RefreshCw size={18} />} tone="blue" />
            <MetricCard label="Update Available" value={updateAvailable} icon={<CheckCircle2 size={18} />} tone="green" />
            <MetricCard label="Needs Attention" value={needsAttention} icon={<AlertTriangle size={18} />} tone="red" />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <section id="recent-claims" className="min-w-0 scroll-mt-20 overflow-hidden rounded-xl border border-console-line bg-surface shadow-sm">
                <SectionHeader title="Recent Claims">
                  <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value as "newest" | "oldest" | "updated")}
                    aria-label="Order claims"
                    className="rounded-lg border border-console-line bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-console-accent"
                  >
                    <option value="newest">Newest first</option>
                    <option value="updated">Recently updated</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </SectionHeader>
                <div className="flex gap-2 overflow-x-auto px-5 pb-3" aria-label="Filter claims by progress">
                  {(["all", ...STATUS_STEPS.map((step) => step.key)] as const).map((key) => {
                    const count = key === "all" ? claims.length : claims.filter((claim) => claim.status === key).length;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        aria-pressed={statusFilter === key}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${statusFilter === key ? "bg-console-accent text-console-nav-fg" : "bg-console-bg hover:bg-console-accent-soft"}`}
                      >
                        {key === "all" ? "All" : statusLabel(key)} <span className="ml-1 opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
                {loading ? (
                  <div className="space-y-3 px-5 pb-5" aria-label="Loading claims">
                    {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-console-bg" />)}
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
                  <>
                  <ul className="divide-y divide-console-line border-t border-console-line md:hidden">
                    {filtered.map((c) => (
                      <li key={c.id} className={`min-w-0 px-4 py-3 ${openId === c.id ? "bg-console-accent-soft" : ""}`}>
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs">
                            {!c.seen && <span className="h-2 w-2 shrink-0 rounded-full bg-console-red" aria-label="New" />}
                            <span className="truncate">{c.ref}</span>
                          </span>
                          <span className="shrink-0 text-xs"><StatusPill status={c.status} /></span>
                        </div>
                        <p className="mt-1.5 truncate text-sm font-medium">{c.customer_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.category}</p>
                        <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-[11px] text-muted-foreground">
                            Updated {formatDateTime(c.status_updated_at)}
                          </span>
                          <button onClick={() => open(c)} className="shrink-0 rounded-lg border border-console-line px-3 py-1 text-xs font-medium text-console-accent transition hover:bg-console-accent-soft">
                            View
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[920px] text-left text-sm">
                      <thead>
                        <tr className="border-y border-console-line bg-console-bg text-[11px] uppercase tracking-wide text-muted-foreground">
                          {["Claim ID", "Customer", "Issue Type", "Order No.", "Status", "Submitted", "Last Updated", "Actions"].map((h) => (
                            <th key={h} className="px-4 py-2.5 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c) => (
                          <tr key={c.id} className={`border-b border-console-line last:border-0 transition-colors hover:bg-console-bg ${openId === c.id ? "bg-console-accent-soft" : ""}`}>
                            <td className="px-4 py-3 font-mono text-xs">
                              <span className="flex items-center gap-1.5">
                                {!c.seen && <span className="h-2 w-2 rounded-full bg-console-red" aria-label="New" />}
                                {c.ref}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={c.customer_name} />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{c.customer_name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                                  {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="max-w-[220px] px-4 py-3">
                              <p className="font-medium">{c.category}</p>
                              <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                            </td>
                            <td className="px-4 py-3 text-xs">{c.order_number || "—"}</td>
                            <td className="px-4 py-3 text-xs"><StatusPill status={c.status} /></td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDateTime(c.created_at)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{formatDateTime(c.status_updated_at)}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => open(c)} className="rounded-lg border border-console-line px-3 py-1 text-xs font-medium text-console-accent transition hover:bg-console-accent-soft">
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </section>

              <ReviewsAdmin />

              <section id="recent-activity" className="scroll-mt-20 rounded-xl border border-console-line bg-surface shadow-sm">
                <SectionHeader title="Recent Activity" />
                <FeedList items={activities} now={now} empty="No activity yet." />
              </section>
            </div>

            <div className="min-w-0 space-y-6">
              <section className="rounded-xl border border-console-line bg-surface shadow-sm">
                <SectionHeader title="Live Chats">
                  <Link to="/chats" className="text-xs font-medium text-console-accent hover:underline">View all</Link>
                </SectionHeader>
                {convos.length === 0 ? (
                  <p className="px-5 pb-5 text-sm text-muted-foreground">No chats yet.</p>
                ) : (
                  <ul className="pb-2">
                    {convos.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <Link to="/chats" className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-console-bg">
                          <Avatar name={c.customer_name || "Visitor"} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{c.customer_name || "Anonymous visitor"}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.last_message || "—"}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-[11px] text-muted-foreground">{timeAgo(c.last_message_at, now)}</span>
                            {c.unread_staff > 0 && (
                              <span className="rounded-full bg-console-accent px-1.5 text-[10px] font-semibold text-console-nav-fg">{c.unread_staff}</span>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section id="notifications" className="scroll-mt-20 rounded-xl border border-console-line bg-surface shadow-sm">
                <SectionHeader title="Notifications" />
                <FeedList items={notifications} now={now} empty="You're all caught up." />
              </section>

              <section className="rounded-xl bg-console-nav p-5 text-console-nav-fg">
                <p className="font-semibold">Need help?</p>
                <p className="mt-1 text-sm opacity-70">Contact the customer support team</p>
                <Link to="/chats" className="mt-4 inline-flex text-sm font-medium hover:underline">Open support chat →</Link>
              </section>
            </div>
          </div>
        </main>
      </div>


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

function SidebarLink({ icon, label, active, badge, onClick }: { icon: ReactNode; label: string; active?: boolean | undefined; badge?: number | undefined; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-console-accent font-medium" : "opacity-75 hover:bg-console-nav-fg/10 hover:opacity-100"}`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {!!badge && <span className="rounded-full bg-console-pink px-1.5 text-[10px] font-semibold">{badge}</span>}
    </button>
  );
}

const TONES = {
  accent: "bg-console-accent-soft text-console-accent",
  pink: "bg-console-pink/10 text-console-pink",
  orange: "bg-console-orange/10 text-console-orange",
  blue: "bg-console-blue/10 text-console-blue",
  green: "bg-console-green/10 text-console-green",
  red: "bg-console-red/10 text-console-red",
} as const;

function MetricCard({ label, value, icon, tone, live }: { label: string; value: number; icon: ReactNode; tone: keyof typeof TONES; live?: boolean | undefined }) {
  return (
    <div className="min-w-0 rounded-xl border border-console-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>{icon}</span>
        {live && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-console-green">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-console-green" /> Live
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="break-words text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-console-accent-soft text-xs font-semibold text-console-accent">
      {initials}
    </span>
  );
}

function ActivityIcon({ kind }: { kind: Feed["kind"] }) {
  const map = {
    new: { i: <Inbox size={15} />, t: TONES.accent },
    chat: { i: <MessageSquare size={15} />, t: TONES.pink },
    status: { i: <Clock size={15} />, t: TONES.blue },
    reply: { i: <Mail size={15} />, t: TONES.green },
    note: { i: <FileText size={15} />, t: TONES.orange },
  }[kind];
  return <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${map.t}`}>{map.i}</span>;
}

function FeedList({ items, now, empty }: { items: Feed[]; now: number; empty: string }) {
  if (items.length === 0) return <p className="px-5 pb-5 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="pb-2">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-3 px-5 py-2.5">
          <ActivityIcon kind={a.kind} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.title}</p>
            <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(a.at, now)}</span>
        </li>
      ))}
    </ul>
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
