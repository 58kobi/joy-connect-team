import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff sign in — Customer Care" },
      { name: "description", content: "Sign in to the customer care claims dashboard." },
      { property: "og:title", content: "Staff sign in — Customer Care" },
      { property: "og:description", content: "Sign in to the customer care claims dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(error.message);
      navigate({ to: "/admin" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      if (data.session) navigate({ to: "/admin" });
      else setMsg("Check your email to confirm your account, then sign in.");
    }
  }

  const field =
    "w-full rounded-lg border border-input bg-surface px-4 py-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-7">
        <p className="text-xs tracking-[0.22em] text-muted-foreground">STAFF ONLY</p>
        <h1 className="mt-2 font-serif text-3xl">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <input className={field} type="email" required placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={field} type="password" required minLength={8} placeholder="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          {msg && <p className="text-sm text-muted-foreground" role="alert">{msg}</p>}
          <button disabled={busy} className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-coffee disabled:opacity-70">
            {busy && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline">
          {mode === "signin" ? "New staff member? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
