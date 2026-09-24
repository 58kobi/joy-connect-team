import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const STATUSES = ["received", "under_review", "being_handled", "update_available"] as const;
export type ClaimStatus = (typeof STATUSES)[number];

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeRef() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let tail = "";
  for (const b of bytes) tail += REF_ALPHABET[b % REF_ALPHABET.length];
  return `DC-${tail}`;
}

const submitSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().default(""),
  category: z.string().trim().min(1).max(60),
  orderNumber: z.string().trim().max(60).optional().default(""),
  description: z.string().trim().min(10).max(2000),
});

export const submitClaim = createServerFn({ method: "POST" })
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let attempt = 0; attempt < 4; attempt++) {
      const ref = makeRef();
      const { error } = await supabaseAdmin.from("claims").insert({
        ref,
        customer_name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        category: data.category,
        order_number: data.orderNumber || null,
        description: data.description,
      });
      if (!error) return { ref };
      if (error.code !== "23505") {
        console.error(error);
        throw new Error("Could not submit your request. Please try again.");
      }
    }
    throw new Error("Could not submit your request. Please try again.");
  });

export const trackClaim = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ ref: z.string().trim().min(3).max(20), email: z.string().trim().email().max(255) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("claims")
      .select("ref, category, created_at, tracking_token, status, status_updated_at, reply")
      .eq("ref", data.ref.toUpperCase())
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!row) return null;
    return {
      ref: row.ref,
      category: row.category,
      createdAt: row.created_at,
      token: row.tracking_token,
      status: row.status as ClaimStatus,
      statusUpdatedAt: row.status_updated_at,
      reply: row.reply,
    };
  });

export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin) return { isAdmin: true };
    // First account ever becomes the admin; everyone else needs to be granted access.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
      return { isAdmin: true };
    }
    return { isAdmin: false };
  });

export const updateClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(STATUSES).optional(),
        reply: z.string().trim().max(2000).optional(),
        internalNote: z.string().trim().max(2000).optional(),
        seen: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const patch: {
      status?: ClaimStatus;
      reply?: string | null;
      internal_note?: string | null;
      seen?: boolean;
    } = {};
    if (data.status) patch.status = data.status;
    if (data.reply !== undefined) patch.reply = data.reply || null;
    if (data.internalNote !== undefined) patch.internal_note = data.internalNote || null;
    if (data.seen !== undefined) patch.seen = data.seen;
    const { error } = await context.supabase.from("claims").update(patch).eq("id", data.id);
    if (error) throw new Error("Update failed");
    return { ok: true };
  });
