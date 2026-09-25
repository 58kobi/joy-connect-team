import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bot, Headset, Info, Loader2, Lock, Search, Send, StickyNote, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin } from "@/lib/claims.functions";
import { staffChatAction, type ChatSender, type ChatStatus } from "@/lib/chat.functions";
import { timeAgo } from "@/lib/claim-status";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => ({
    meta: [
      { title: "Live chats — Customer Care" },
      { name: "description", content: "Reply to customer chats in real time." },
      { property: "og:title", content: "Live chats — Customer Care" },
      { property: "og:description", content: "Reply to customer chats in real time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatsPage,
});

type Convo = {
  id: string;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  order_number: string | null;
  issue: string | null;
  status: ChatStatus;
  mode: string;
  unread_staff: number;
  last_message: string | null;
  last_message_at: string;
  created_at: string;
};
type Msg = { id: string; conversation_id: string; sender: ChatSender; body: string; created_at: string };

const COLS =
  "id, customer_name, email, phone, order_number, issue, status, mode, unread_staff, last_message, last_message_at, created_at";

const STATUS_LABEL: Record<ChatStatus, string> = {
  ai: "With AI",
  waiting: "Waiting for Staff",
  active: "Staff Active",
  handled: "Handled",
};
const STATUS_TONE: Record<ChatStatus, string> = {
  ai: "bg-cream text-foreground",
  waiting: "bg-destructive/10 text-destructive",
  active: "bg-trustpilot/15 text-foreground",
  handled: "bg-muted text-muted-foreground",
};

function ChatsPage() {
  const checkAdmin = useServerFn(ensureAdmin);
  const act = useServerFn(staffChatAction);
  const [access, setAccess] = useState<"checking" | "yes" | "no">("checking");
  const [convos, setConvos] = useState<Convo[]>([]);
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [showInfo, setShowInfo] = useState(false);
  const [, setNow] = useState(0);
  const openRef = useRef<string | null>(null);
  openRef.current = openId;

  useEffect(() => {
    checkAdmin().then((r) => setAccess(r.isAdmin ? "yes" : "no")).catch(() => setAccess("no"));
  }, [checkAdmin]);

  useEffect(() => {
    if (access !== "yes") return;
    supabase
      .from("chat_conversations")
      .select(COLS)
      .order("last_message_at", { ascending: false })
      .limit(500)
      .then(({ data }) => setConvos((data as Convo[]) ?? []));
    const ch = supabase
      .channel("staff-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, (p) => {
        if (p.eventType === "DELETE") return;
        const c = p.new as Convo & { token?: string };
        delete c.token;
        setConvos((list) => {
          const exists = list.some((x) => x.id === c.id);
          if (!exists && p.eventType === "INSERT") toast("New chat started");
          const next = exists ? list.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [c, ...list];
          return next.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p) => {
        const m = p.new as Msg;
        setMsgs((all) => {
          const cur = all[m.conversation_id];
          if (!cur || cur.some((x) => x.id === m.id)) return all;
          return { ...all, [m.conversation_id]: [...cur, m] };
        });
      })
      .subscribe();
    const tick = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      supabase.removeChannel(ch);
      window.clearInterval(tick);
    };
  }, [access]);

  const open = useCallback(
    (c: Convo) => {
      setOpenId(c.id);
      if (!msgs[c.id]) {
        supabase
          .from("chat_messages")
          .select("id, conversation_id, sender, body, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: true })
          .limit(1000)
          .then(({ data }) => setMsgs((all) => ({ ...all, [c.id]: (data as Msg[]) ?? [] })));
      }
      if (c.unread_staff > 0) {
        setConvos((l) => l.map((x) => (x.id === c.id ? { ...x, unread_staff: 0 } : x)));
        act({ data: { id: c.id, action: "read" } }).catch(() => {});
      }
    },
    [msgs, act],
  );

  // Clear unread while viewing the open chat.
  const selected = convos.find((c) => c.id === openId) ?? null;
  useEffect(() => {
    if (selected && selected.unread_staff > 0 && document.visibilityState === "visible") {
      setConvos((l) => l.map((x) => (x.id === selected.id ? { ...x, unread_staff: 0 } : x)));
      act({ data: { id: selected.id, action: "read" } }).catch(() => {});
    }
  }, [selected, act]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return convos.filter((c) => {
      if (filter === "open" && c.status === "handled") return false;
      if (!s) return true;
      return [c.customer_name, c.email, c.phone, c.order_number, c.issue].some((v) => v?.toLowerCase().includes(s));
    });
  }, [convos, q, filter]);

  const totalUnread = convos.reduce((n, c) => n + c.unread_staff, 0);

  async function run(action: "reply" | "note" | "takeover" | "return_ai" | "waiting" | "handled", body?: string) {
    if (!selected) return;
    try {
      await act({ data: { id: selected.id, action, ...(body ? { body } : {}) } });
      return true;
    } catch {
      toast.error("Action failed");
      return false;
    }
  }

  if (access === "checking")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  if (access === "no")
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-serif text-2xl">No access yet</h1>
        <p className="text-sm text-muted-foreground">Ask an administrator to grant you access.</p>
      </div>
    );

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <Link to="/admin" className="rounded-full p-1.5 hover:bg-coffee" aria-label="Back to claims">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="font-serif text-lg">Live Chats</p>
        {totalUnread > 0 && (
          <span className="rounded-full bg-primary-foreground px-2 py-0.5 text-xs font-medium text-primary">{totalUnread} unread</span>
        )}
        <span className="ml-auto text-xs opacity-70">
          live <span className="ml-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-trustpilot align-middle" />
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* LEFT: list */}
        <aside className={`${selected ? "hidden md:flex" : "flex"} w-full flex-col border-r border-border md:w-80`}>
          <div className="space-y-2 border-b border-border p-3">
            <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, phone, order…" className="w-full bg-transparent text-sm outline-none" />
            </label>
            <div className="flex gap-1 text-xs">
              {(["open", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-card"}`}>
                  {f === "open" ? "Open" : "All incl. handled"}
                </button>
              ))}
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {filtered.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</li>}
            {filtered.map((c) => (
              <li key={c.id}>
                <button onClick={() => open(c)} className={`block w-full border-b border-border px-4 py-3 text-left hover:bg-card ${c.id === openId ? "bg-card" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{c.customer_name || "Anonymous visitor"}</span>
                    {c.mode === "ai" ? <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <Headset className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.last_message_at, Date.now())}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[c.email, c.order_number && `#${c.order_number}`].filter(Boolean).join(" · ") || "No details yet"}
                  </p>
                  {c.issue && <p className="truncate text-xs">{c.issue}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    <span className="truncate text-xs text-muted-foreground">{c.last_message}</span>
                    {c.unread_staff > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">{c.unread_staff}</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* MIDDLE + RIGHT */}
        {selected ? (
          <>
            <ChatPanel
              key={selected.id}
              convo={selected}
              messages={msgs[selected.id]}
              onBack={() => setOpenId(null)}
              onInfo={() => setShowInfo((v) => !v)}
              run={run}
            />
            <aside className={`${showInfo ? "fixed inset-0 z-30 block bg-background" : "hidden"} w-full overflow-y-auto border-l border-border p-5 lg:static lg:block lg:w-72`}>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-serif text-lg">Customer details</p>
                <button onClick={() => setShowInfo(false)} className="lg:hidden" aria-label="Close details">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <dl className="space-y-3 text-sm">
                {[
                  ["Name", selected.customer_name],
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["Order", selected.order_number && `#${selected.order_number}`],
                  ["Issue", selected.issue],
                  ["Status", STATUS_LABEL[selected.status]],
                  ["Handled by", selected.mode === "ai" ? "Care Assistant (AI)" : "Staff"],
                  ["Started", new Date(selected.created_at).toLocaleString()],
                  ["Last activity", new Date(selected.last_message_at).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="break-words">{v || <span className="text-muted-foreground">—</span>}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </>
        ) : (
          <div className="hidden flex-1 items-center justify-center text-sm text-muted-foreground md:flex">Select a conversation</div>
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  convo,
  messages,
  onBack,
  onInfo,
  run,
}: {
  convo: Convo;
  messages: Msg[] | undefined;
  onBack: () => void;
  onInfo: () => void;
  run: (a: "reply" | "note" | "takeover" | "return_ai" | "waiting" | "handled", body?: string) => Promise<boolean | undefined>;
}) {
  const [text, setText] = useState("");
  const [noteMode, setNoteMode] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);
  useEffect(() => inputRef.current?.focus(), []);

  async function submit() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const ok = await run(noteMode ? "note" : "reply", body);
    if (ok) setText("");
    setSending(false);
    inputRef.current?.focus();
  }

  const btn = "rounded-full border border-border px-3 py-1 text-xs hover:bg-card disabled:opacity-40";

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <button onClick={onBack} className="md:hidden" aria-label="Back to list">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="mr-auto truncate font-medium">{convo.customer_name || "Anonymous visitor"}</p>
        <button className={btn} onClick={() => run("takeover")} disabled={convo.mode === "human" && convo.status === "active"}>Take Over Chat</button>
        <button className={btn} onClick={() => run("return_ai")} disabled={convo.mode === "ai"}>Return to AI</button>
        <button className={btn} onClick={() => run("waiting")} disabled={convo.status === "waiting"}>Mark as Waiting</button>
        <button className={btn} onClick={() => run("handled")} disabled={convo.status === "handled"}>Mark as Handled</button>
        <button className={`${btn} lg:hidden`} onClick={onInfo}><Info className="mr-1 inline h-3 w-3" />Details</button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!messages && <Loader2 className="mx-auto animate-spin text-muted-foreground" />}
        {messages?.map((m) => <StaffBubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      <div className={`border-t p-3 ${noteMode ? "border-coffee/40 bg-cream" : "border-border"}`}>
        <div className="mb-2 flex gap-1 text-xs">
          <button onClick={() => setNoteMode(false)} className={`rounded-full px-3 py-1 ${!noteMode ? "bg-primary text-primary-foreground" : "hover:bg-card"}`}>Reply</button>
          <button onClick={() => setNoteMode(true)} className={`rounded-full px-3 py-1 ${noteMode ? "bg-coffee text-primary-foreground" : "hover:bg-card"}`}>
            <Lock className="mr-1 inline h-3 w-3" />Add Internal Note
          </button>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder={noteMode ? "Private note — the customer will never see this" : convo.mode === "ai" ? "Replying will take over from Care Assistant…" : "Reply to customer…"}
            className="flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />
          <button onClick={submit} disabled={sending || !text.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
            {noteMode ? <StickyNote className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}

function StaffBubble({ m }: { m: Msg }) {
  const t = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (m.sender === "system") return <p className="text-center text-xs text-muted-foreground">{m.body} · {t}</p>;
  if (m.sender === "note")
    return (
      <div className="mx-auto max-w-[90%] rounded-lg border border-dashed border-coffee/50 bg-cream px-3 py-2 text-sm">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-coffee"><Lock className="mr-1 inline h-3 w-3" />Internal note · {t}</p>
        <p className="whitespace-pre-wrap">{m.body}</p>
      </div>
    );
  const label = m.sender === "customer" ? "Customer" : m.sender === "ai" ? "Care Assistant" : "Staff";
  const right = m.sender !== "customer";
  return (
    <div className={`flex ${right ? "justify-end" : ""}`}>
      <div className="max-w-[75%]">
        <p className={`mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${right ? "text-right" : ""}`}>{label} · {t}</p>
        <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.sender === "customer" ? "bg-card border border-border" : m.sender === "ai" ? "bg-cream" : "bg-primary text-primary-foreground"}`}>{m.body}</div>
      </div>
    </div>
  );
}
