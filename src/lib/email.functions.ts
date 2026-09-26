import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SUPPORT_EMAIL = "info@debenhamscare.uk";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  order: z.string().trim().max(50).optional(),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(10).max(2000),
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const sendSupportEmail = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) return { ok: false as const };
    const from = process.env["EMAIL_FROM"] || `Customer Care <${SUPPORT_EMAIL}>`;
    const rows: [string, string][] = [
      ["Name", data.name],
      ["Email", data.email],
      ["Order / Reference", data.order || "—"],
      ["Subject", data.subject],
    ];
    const html = `<table>${rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("")}</table><p style="white-space:pre-wrap">${esc(data.message)}</p>`;
    const text = `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${data.message}`;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [SUPPORT_EMAIL],
          reply_to: data.email,
          subject: `[Website] ${data.subject}`,
          html,
          text,
        }),
      });
      if (!res.ok) {
        console.error("Email send failed", res.status, await res.text());
        return { ok: false as const };
      }
      return { ok: true as const };
    } catch (e) {
      console.error("Email send error", e);
      return { ok: false as const };
    }
  });
