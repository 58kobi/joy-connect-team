import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — Customer Care" },
      {
        name: "description",
        content: "Sign in to the customer care claims dashboard.",
      },
      { property: "og:title", content: "Staff sign in — Customer Care" },
      {
        property: "og:description",
        content: "Sign in to the customer care claims dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => emailRef.current?.focus(), []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMsg("The email or password is incorrect. Please try again.");
      return;
    }

    navigate({ to: "/admin", replace: true });
  }

  const field =
    "w-full rounded-lg border border-input bg-surface px-4 py-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="animate-soft-enter w-full max-w-sm rounded-xl border border-border bg-surface p-7 shadow-sm">
        <p className="text-xs tracking-[0.22em] text-muted-foreground">
          STAFF ONLY
        </p>

        <h1 className="mt-2 font-serif text-3xl">
          Sign in
        </h1>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input
            ref={emailRef}
            className={field}
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Staff email"
          />

          <input
            className={field}
            type="password"
            required
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Password"
          />

          {msg && (
            <p className="text-sm text-muted-foreground" role="alert">
              {msg}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-coffee disabled:opacity-70"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
