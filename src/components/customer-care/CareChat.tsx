import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Headset, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import {
  getChat,
  getStaffAvailability,
  requestHuman,
  sendChatMessage,
  startChat,
  type ChatStatus,
  type PublicMessage,
} from "@/lib/chat.functions";

const KEY = "cc-chat-token";
const QUICK = [
  "Track an Order",
  "Delivery Problem",
  "Return an Item",
  "Refund Problem",
  "Make a Complaint",
  "Existing Claim",
  "Talk to a Person",
];

type State = { mode: "ai" | "human"; status: ChatStatus; messages: PublicMessage[]; staffOnline: boolean };

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function CareChat() {
  const start = useServerFn(startChat);
  const get = useServerFn(getChat);
  const getAvailability = useServerFn(getStaffAvailability);
  const send = useServerFn(sendChatMessage);
  const human = useServerFn(requestHuman);

  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [staffOnline, setStaffOnline] = useState(false);
  const seenCount = useRef(0);
  const previousVisibleCount = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = window.localStorage.getItem(KEY);
    if (t) setToken(t);
  }, []);

  const apply = useCallback((s: State | null) => {
    if (!s) {
      window.localStorage.removeItem(KEY);
      setToken(null);
      setState(null);
      return;
    }
    setState(s);
  }, []);

  // Poll for new messages (staff replies arrive here).
  useEffect(() => {
    if (!token) return;
    let alive = true;
    const tick = () =>
      get({ data: { token } })
        .then((s) => alive && apply(s))
        .catch(() => {});
    tick();
    const iv = window.setInterval(tick, open ? 1200 : 5000);
    return () => {
      alive = false;
      window.clearInterval(iv);
    };
  }, [token, open, get, apply]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const tick = () =>
      getAvailability()
        .then((result) => alive && setStaffOnline(result.staffOnline))
        .catch(() => {});
    tick();
    const interval = window.setInterval(tick, 10_000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [open, getAvailability]);

  const visibleCount = state?.messages.length ?? 0;
  // Unread = replies from the assistant/staff that arrived after the last one the customer saw.
  // Remembered across reloads so already-read messages never re-trigger the badge.
  useEffect(() => {
    const msgs = state?.messages ?? [];
    const incoming = msgs.filter((m) => m.sender === "ai" || m.sender === "staff");
    const readKey = `${KEY}:read`;
    if (open) {
      const last = incoming[incoming.length - 1];
      if (last) window.localStorage.setItem(readKey, last.created_at);
      seenCount.current = visibleCount;
      setUnread(0);
      return;
    }
    const lastRead = window.localStorage.getItem(readKey);
    const count = lastRead ? incoming.filter((m) => m.created_at > lastRead).length : 0;
    if (!lastRead && incoming.length) window.localStorage.setItem(readKey, incoming[incoming.length - 1]!.created_at);
    setUnread(count);
  }, [state, visibleCount, open]);

  useEffect(() => {
    const hasNewMessage = visibleCount > previousVisibleCount.current;
    endRef.current?.scrollIntoView({ block: "end", behavior: hasNewMessage ? "smooth" : "auto" });
    previousVisibleCount.current = visibleCount;
  }, [visibleCount, pending, busy, open]);

  useEffect(() => {
    if (open && state && !busy) inputRef.current?.focus();
  }, [open, state, busy]);

  async function begin(mode: "ai" | "human", firstMessage?: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await start({ data: { mode } });
      window.localStorage.setItem(KEY, r.token);
      setToken(r.token);
      setState(r);
      if (firstMessage) await submit(firstMessage, r.token);
    } catch {
      setError("We couldn't start the chat. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(text: string, t = token) {
    const body = text.trim();
    if (!body || !t) return;
    setInput("");
    setPending(body);
    setBusy(true);
    setError(null);
    try {
      apply(await send({ data: { token: t, body } }));
    } catch {
      setError("Message not sent. Please try again.");
      setInput(body);
    } finally {
      setPending(null);
      setBusy(false);
    }
  }

  async function quick(label: string) {
    if (label === "Talk to a Person") {
      if (!token) return begin("human");
      setBusy(true);
      try {
        apply(await human({ data: { token } }));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!token) return begin("ai", label);
    submit(label);
  }

  function reset() {
    window.localStorage.removeItem(KEY);
    setToken(null);
    setState(null);
    setError(null);
  }

  const isHuman = state?.mode === "human";
  const isStaffOnline = state?.staffOnline ?? staffOnline;
  const customerCount = state?.messages.filter((m) => m.sender === "customer").length ?? 0;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Care Assistant chat"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Care Assistant"
          className="animate-panel-up fixed inset-x-0 bottom-0 z-50 flex max-h-[55vh] flex-col rounded-t-2xl border border-border bg-background shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[50vh] sm:max-h-[50vh] sm:w-[390px] sm:overflow-hidden sm:rounded-2xl"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <Avatar human={isHuman} inverted />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base leading-tight">Care Assistant</p>
               <p className="flex items-center gap-1.5 text-xs opacity-80">
                 {isHuman && isStaffOnline && <span className="h-2 w-2 rounded-full bg-trustpilot" aria-hidden="true" />}
                 {isHuman ? (isStaffOnline ? "Staff online" : "Waiting for a support specialist") : "Automated assistant · replies instantly"}
               </p>
            </div>
            {state && (
              <button onClick={reset} aria-label="Start a new conversation" className="rounded-full p-2 opacity-80 hover:bg-primary-foreground/10 hover:opacity-100">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 hover:bg-primary-foreground/10">
              <X className="h-5 w-5" />
            </button>
          </header>

          {!state ? (
            <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
              <h2 className="font-serif text-2xl">How can we help today?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Choose how you&rsquo;d like to continue:</p>
              <div className="mt-5 space-y-3">
                <ChoiceButton icon={<Bot className="h-5 w-5" />} label="Get help with Care Assistant" hint="Instant answers to common questions" onClick={() => begin("ai")} disabled={busy} />
                 <ChoiceButton
                   icon={<Headset className="h-5 w-5" />}
                   label="Talk to a support specialist"
                   hint={isStaffOnline ? "Staff online now" : "Leave a message for our team"}
                   online={isStaffOnline}
                   onClick={() => begin("human")}
                   disabled={busy}
                 />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">You can switch to a support specialist at any time.</p>
              <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">Or start with</p>
              <QuickActions onPick={quick} disabled={busy} />
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              <p className="mt-auto pt-6 text-[11px] leading-relaxed text-muted-foreground">
                Independent customer support service. Never share passwords, card numbers or security codes in chat.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {state.messages.map((m) => (
                  <Bubble key={m.id} m={m} />
                ))}
                {customerCount === 0 && !pending && <QuickActions onPick={quick} disabled={busy} />}
                {pending && <Bubble m={{ id: "p", sender: "customer", body: pending, created_at: new Date().toISOString() }} faded />}
                {busy && pending && !isHuman && <Typing label="Care Assistant is typing…" />}
                <div ref={endRef} />
              </div>
              {error && <p className="px-4 pb-1 text-xs text-destructive">{error}</p>}
              {!isHuman && customerCount > 0 && (
                <button onClick={() => quick("Talk to a Person")} disabled={busy} className="mx-4 mb-2 self-start text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  Talk to a support specialist instead
                </button>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
                className="flex items-end gap-2 border-t border-border p-3"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Type your message…"
                  aria-label="Message"
                  className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-[15px] outline-none focus:border-foreground/40"
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Avatar({ human, inverted }: { human: boolean; inverted?: boolean }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${inverted ? "bg-primary-foreground/15" : human ? "bg-coffee text-primary-foreground" : "bg-cream text-foreground"}`}>
      {human ? <Headset className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
    </span>
  );
}

function Bubble({ m, faded }: { m: PublicMessage; faded?: boolean | undefined }) {
  if (m.sender === "system")
    return <p className="mx-auto max-w-[85%] py-1 text-center text-xs text-muted-foreground">{m.body}</p>;
  if (m.sender === "customer")
    return (
      <div className={`flex justify-end ${faded ? "opacity-60" : ""}`}>
        <div className="max-w-[80%]">
          <div className="whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[15px] text-primary-foreground">{m.body}</div>
          <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{time(m.created_at)}</p>
        </div>
      </div>
    );
  const human = m.sender === "staff";
  return (
    <div className="flex items-end gap-2">
      <Avatar human={human} />
      <div className="max-w-[80%]">
        <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">{human ? "Support specialist" : "Care Assistant"}</p>
        <div className={`whitespace-pre-wrap rounded-2xl rounded-bl-sm px-3.5 py-2 text-[15px] ${human ? "border border-coffee/30 bg-card" : "bg-cream"}`}>{m.body}</div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{time(m.created_at)}</p>
      </div>
    </div>
  );
}

function Typing({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </span>
      {label}
    </div>
  );
}

function ChoiceButton({ icon, label, hint, online, onClick, disabled }: { icon: React.ReactNode; label: string; hint: string; online?: boolean | undefined; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-foreground/40 disabled:opacity-50">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream">{icon}</span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {online && <span className="h-2 w-2 rounded-full bg-trustpilot" aria-hidden="true" />}
          {hint}
        </span>
      </span>
    </button>
  );
}

function QuickActions({ onPick, disabled }: { onPick: (l: string) => void; disabled: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {QUICK.map((q) => (
        <button key={q} onClick={() => onPick(q)} disabled={disabled} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-foreground/40 disabled:opacity-50">
          {q}
        </button>
      ))}
    </div>
  );
}
