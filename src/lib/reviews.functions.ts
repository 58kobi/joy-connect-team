import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Please write at least a short sentence").max(1000),
});

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
};

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, name, rating, title, body, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicReview[];
});

export const submitReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => reviewSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.from("reviews").insert({
      name: data.name,
      rating: data.rating,
      title: data.title || null,
      body: data.body,
    });
    if (error) throw new Error("Could not submit your review. Please try again.");
    return { ok: true };
  });
