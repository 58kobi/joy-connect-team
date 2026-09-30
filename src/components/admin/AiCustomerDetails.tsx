import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Dialling code -> country + main time zone (longest prefix wins).
const CODES: [string, string, string][] = [
  ["44", "United Kingdom", "Europe/London"],
  ["353", "Ireland", "Europe/Dublin"],
  ["1", "United States / Canada", "America/New_York"],
  ["254", "Kenya", "Africa/Nairobi"],
  ["255", "Tanzania", "Africa/Dar_es_Salaam"],
  ["256", "Uganda", "Africa/Kampala"],
  ["234", "Nigeria", "Africa/Lagos"],
  ["233", "Ghana", "Africa/Accra"],
  ["27", "South Africa", "Africa/Johannesburg"],
  ["33", "France", "Europe/Paris"],
  ["49", "Germany", "Europe/Berlin"],
  ["34", "Spain", "Europe/Madrid"],
  ["39", "Italy", "Europe/Rome"],
  ["31", "Netherlands", "Europe/Amsterdam"],
  ["48", "Poland", "Europe/Warsaw"],
  ["351", "Portugal", "Europe/Lisbon"],
  ["971", "United Arab Emirates", "Asia/Dubai"],
  ["966", "Saudi Arabia", "Asia/Riyadh"],
  ["91", "India", "Asia/Kolkata"],
  ["92", "Pakistan", "Asia/Karachi"],
  ["61", "Australia", "Australia/Sydney"],
  ["64", "New Zealand", "Pacific/Auckland"],
  ["86", "China", "Asia/Shanghai"],
  ["63", "Philippines", "Asia/Manila"],
];

function country(phone: string | null) {
  if (!phone) return null;
  let d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("07") && d.length === 11) d = "44" + d.slice(1); // UK mobile without code
  else return null;
  const hit = CODES.filter(([c]) => d.startsWith(c)).sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? { name: hit[1], tz: hit[2] } : null;
}

type Row = {
  id: string;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  order_number: string | null;
  issue: string | null;
  created_at: string;
  sharedAt: string | null;
};

const fmt = (iso: string, tz?: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: tz, timeZoneName: "short" });

export function AiCustomerDetails() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id,customer_name,email,phone,order_number,issue,created_at")
      .or("customer_name.not.is.null,email.not.is.null,phone.not.is.null,order_number.not.is.null")
      .order("updated_at", { ascending: false })
      .limit(100);
    const convos = data ?? [];
    const ids = convos.filter((c) => c.phone).map((c) => c.id);
    const { data: msgs } = ids.length
      ? await supabase
          .from("chat_messages")
          .select("conversation_id,body,created_at")
          .in("conversation_id", ids)
          .eq("sender", "customer")
          .order("created_at", { ascending: true })
      : { data: [] };
    setRows(
      convos.map((c) => {
        const tail = (c.phone ?? "").replace(/\D/g, "").slice(-7);
        const m = tail ? (msgs ?? []).find((x) => x.conversation_id === c.id && x.body.replace(/\D/g, "").includes(tail)) : undefined;
        return { ...c, sharedAt: m?.created_at ?? null };
      }),
    );
  }

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("admin-ai-details")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => void load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-console-line bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-console-line px-5 py-4">
        <h2 className="text-sm font-semibold text-console-ink">AI-collected customer details</h2>
        <span className="text-xs text-muted-foreground">{rows ? `${rows.length} chats` : ""}</span>
      </div>
      {!rows ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No details collected by the AI assistant yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-console-bg text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Phone & country</th>
                <th className="px-4 py-2.5 font-medium">Number shared at</th>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-console-line">
              {rows.map((r) => {
                const c = country(r.phone);
                const at = r.sharedAt ?? r.created_at;
                return (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-console-ink">{r.customer_name ?? "—"}</p>
                      <p className="break-all text-xs text-muted-foreground">{r.email ?? "No email"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.phone ? (
                        <>
                          <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="font-medium tabular-nums text-console-accent hover:underline">{r.phone}</a>
                          <p className="text-xs text-muted-foreground">{c?.name ?? "Country unknown"}</p>
                        </>
                      ) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      {r.phone ? (
                        <>
                          <p className="text-console-ink">{fmt(at, c?.tz)}{c ? " (customer's time)" : ""}</p>
                          <p className="text-muted-foreground">{fmt(at, "Europe/London")} UK</p>
                          {!r.sharedAt && <p className="text-muted-foreground">Chat start time</p>}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.order_number ?? "—"}</td>
                    <td className="max-w-xs px-4 py-3 text-foreground/80">{r.issue ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
