import { useEffect, useState } from "react";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Row = {
  id: string;
  name: string;
  rating: number;
  body: string;
  created_at: string;
  likes: number;
  replies: number;
  email: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ReviewsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [{ data: reviews, error: e1 }, { data: replies, error: e2 }] = await Promise.all([
      supabase.from("reviews").select("id,name,rating,body,created_at,likes").order("created_at", { ascending: false }),
      supabase.from("review_replies").select("review_key"),
    ]);
    const { data: emails } = await supabase.from("review_emails").select("review_id,email");
    const emailMap = new Map((emails ?? []).map((e) => [e.review_id, e.email]));
    if (e1 || e2 || !reviews) {
      setError(true);
      return;
    }
    const counts = new Map<string, number>();
    for (const r of replies ?? []) counts.set(r.review_key, (counts.get(r.review_key) ?? 0) + 1);
    setError(false);
    setRows(reviews.map((r) => ({ ...r, replies: counts.get(r.id) ?? 0, email: emailMap.get(r.id) ?? null })));
  }

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("admin-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "review_replies" }, () => void load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function doDelete() {
    if (!confirm) return;
    setDeleting(true);
    const id = confirm.id;
    const { error: e1 } = await supabase.from("review_replies").delete().eq("review_key", id);
    const { data, error: e2 } = e1 ? { data: null, error: e1 } : await supabase.from("reviews").delete().eq("id", id).select("id");
    setDeleting(false);
    if (e2 || !data?.length) {
      toast.error("Couldn't delete this review. Only staff admins can delete reviews.");
      return;
    }
    setRows((cur) => cur?.filter((r) => r.id !== id) ?? cur);
    setConfirm(null);
    toast.success("Review deleted");
  }

  return (
    <section id="reviews" className="min-w-0 scroll-mt-20 overflow-hidden rounded-xl border border-console-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-console-line px-5 py-4">
        <h2 className="text-sm font-semibold text-console-ink">Reviews</h2>
        <span className="text-xs text-muted-foreground">{rows ? `${rows.length} total` : ""}</span>
      </div>

      {error ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Couldn't load reviews.</p>
      ) : !rows ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No customer reviews submitted yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-console-bg text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Rating</th>
                <th className="px-4 py-2.5 font-medium">Review</th>
                <th className="px-4 py-2.5 font-medium">Submitted</th>
                <th className="px-4 py-2.5 font-medium text-right">Likes</th>
                <th className="px-4 py-2.5 font-medium text-right">Replies</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-console-line">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-console-ink">{r.name}</p>
                    {r.email ? (
                      <a href={`mailto:${r.email}`} className="text-xs text-console-accent hover:underline break-all">{r.email}</a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No email</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"} />
                      ))}
                    </span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-foreground/80"><p className="line-clamp-3 break-words">{r.body}</p></td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.likes}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.replies}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setConfirm(r)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && !deleting && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              The review from {confirm?.name} and all {confirm?.replies ?? 0} of its replies will be permanently removed from the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void doDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
