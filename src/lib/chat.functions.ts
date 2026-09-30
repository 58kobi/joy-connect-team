import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type ChatSender = "customer" | "ai" | "staff" | "system" | "note";
export type ChatStatus = "ai" | "waiting" | "active" | "handled";
export type PublicMessage = { id: string; sender: ChatSender; body: string; created_at: string };

const GREETING =
  "Hello, I'm the Debenhams Customer Care AI Assistant. How may I help you today?";
const CONNECTED = "You're now connected to customer support. A support specialist will reply here shortly.";
const HANDOFF = "I've passed your conversation to a support specialist — they can see everything so far and will reply here shortly.";

const tokenSchema = z.string().min(20).max(100);

function makeToken() {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function convoByToken(token: string) {
  const db = await admin();
  const { data } = await db.from("chat_conversations").select("*").eq("token", token).maybeSingle();
  return data;
}

async function addMessage(conversationId: string, sender: ChatSender, body: string, opts?: { staffId?: string; unread?: boolean }) {
  const db = await admin();
  const { data, error } = await db
    .from("chat_messages")
    .insert({ conversation_id: conversationId, sender, body, staff_id: opts?.staffId ?? null })
    .select("id, sender, body, created_at")
    .single();
  if (error) throw new Error("Could not save message");
  if (sender !== "note") {
    const patch: Database["public"]["Tables"]["chat_conversations"]["Update"] = {
      last_message: body.slice(0, 200),
      last_message_at: data.created_at,
      updated_at: data.created_at,
    };
    if (opts?.unread) {
      const { data: c } = await db.from("chat_conversations").select("unread_staff").eq("id", conversationId).single();
      patch.unread_staff = (c?.unread_staff ?? 0) + 1;
    }
    await db.from("chat_conversations").update(patch).eq("id", conversationId);
  }
  return data as PublicMessage;
}

async function publicState(token: string) {
  const c = await convoByToken(token);
  if (!c) return null;
  const db = await admin();
  const { data: msgs } = await db
    .from("chat_messages")
    .select("id, sender, body, created_at")
    .eq("conversation_id", c.id)
    .neq("sender", "note")
    .order("created_at", { ascending: true })
    .limit(500);
  const onlineSince = new Date(Date.now() - 45_000).toISOString();
  const { count: onlineStaff } = await db
    .from("staff_chat_presence")
    .select("user_id", { count: "exact", head: true })
    .gte("last_seen_at", onlineSince);
  return {
    mode: c.mode as "ai" | "human",
    status: c.status as ChatStatus,
    messages: (msgs ?? []) as PublicMessage[],
    staffOnline: (onlineStaff ?? 0) > 0,
  };
}

// ---------- Customer ----------

export const startChat = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ mode: z.enum(["ai", "human"]) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const token = makeToken();
    const { data: c, error } = await db
      .from("chat_conversations")
      .insert({ token, mode: data.mode, status: data.mode === "ai" ? "ai" : "waiting" })
      .select("id")
      .single();
    if (error || !c) throw new Error("Could not start chat");
    if (data.mode === "ai") await addMessage(c.id, "ai", GREETING);
    else await addMessage(c.id, "system", CONNECTED, { unread: true });
    return { token, ...(await publicState(token))! };
  });

export const getChat = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => publicState(data.token));

export const getStaffAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const onlineSince = new Date(Date.now() - 45_000).toISOString();
  const { count } = await db
    .from("staff_chat_presence")
    .select("user_id", { count: "exact", head: true })
    .gte("last_seen_at", onlineSince);
  return { staffOnline: (count ?? 0) > 0 };
});

export const requestHuman = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const c = await convoByToken(data.token);
    if (!c) throw new Error("Chat not found");
    if (c.mode !== "human") {
      const db = await admin();
      await db.from("chat_conversations").update({ mode: "human", status: "waiting" }).eq("id", c.id);
      await addMessage(c.id, "system", CONNECTED, { unread: true });
    }
    return publicState(data.token);
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema, body: z.string().trim().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const c = await convoByToken(data.token);
    if (!c) throw new Error("Chat not found");
    const db = await admin();
    await addMessage(c.id, "customer", data.body, { unread: true });
    if (c.status === "handled") {
      await db.from("chat_conversations").update({ status: c.mode === "ai" ? "ai" : "waiting" }).eq("id", c.id);
    }

    if (c.mode === "ai") {
      const { data: hist } = await db
        .from("chat_messages")
        .select("sender, body")
        .eq("conversation_id", c.id)
        .in("sender", ["customer", "ai"])
        .order("created_at", { ascending: true })
        .limit(60);
      const history = (hist ?? []).map((m) => ({
        role: (m.sender === "customer" ? "user" : "assistant") as "user" | "assistant",
        content: m.body,
      }));
      try {
        const { runCareAssistant } = await import("./chat-ai.server");
        const turn = await runCareAssistant(history, {
          customer_name: c.customer_name,
          email: c.email,
          phone: c.phone,
          order_number: c.order_number,
          issue: c.issue,
        });
        const patch: Database["public"]["Tables"]["chat_conversations"]["Update"] = {};
        for (const k of ["customer_name", "email", "phone", "order_number", "issue"] as const) {
          const v = turn[k]?.trim();
          if (v && v.length <= 200) patch[k] = k === "email" ? v.toLowerCase() : v;
        }
        if (turn.escalate) {
          patch.mode = "human";
          patch.status = "waiting";
        }
        if (Object.keys(patch).length) await db.from("chat_conversations").update(patch).eq("id", c.id);
        await addMessage(c.id, "ai", turn.reply);
        if (turn.escalate) await addMessage(c.id, "system", HANDOFF);
      } catch (e) {
        console.error("Care Assistant failed", e);
        await db.from("chat_conversations").update({ mode: "human", status: "waiting" }).eq("id", c.id);
        await addMessage(
          c.id,
          "system",
          "Care Assistant is unavailable right now, so we've passed your conversation to a support specialist who will reply here.",
        );
      }
    }
    return publicState(data.token);
  });

// ---------- Staff ----------

export const updateStaffChatPresence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("staff_chat_presence").upsert(
      { user_id: context.userId, last_seen_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw new Error("Could not update chat availability");
    return { ok: true };
  });

export const staffChatAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["reply", "note", "takeover", "return_ai", "waiting", "handled", "read"]),
        body: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const db = await admin();
    const upd = (p: Record<string, unknown>) =>
      db.from("chat_conversations").update({ ...p, updated_at: new Date().toISOString() }).eq("id", data.id);
    switch (data.action) {
      case "reply":
        if (!data.body) throw new Error("Empty reply");
        await upd({ mode: "human", status: "active", assigned_to: context.userId, unread_staff: 0 });
        await addMessage(data.id, "staff", data.body, { staffId: context.userId });
        break;
      case "note":
        if (!data.body) throw new Error("Empty note");
        await addMessage(data.id, "note", data.body, { staffId: context.userId });
        break;
      case "takeover":
        await upd({ mode: "human", status: "active", assigned_to: context.userId });
        await addMessage(data.id, "system", "A support specialist has joined the conversation.");
        break;
      case "return_ai":
        await upd({ mode: "ai", status: "ai" });
        await addMessage(data.id, "system", "Care Assistant is back to help. You can ask for a specialist at any time.");
        break;
      case "waiting":
        await upd({ status: "waiting" });
        break;
      case "handled":
        await upd({ status: "handled", unread_staff: 0 });
        break;
      case "read":
        await upd({ unread_staff: 0 });
        break;
    }
    return { ok: true };
  });
