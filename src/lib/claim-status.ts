import type { ClaimStatus } from "./claims.functions";

export const STATUS_STEPS: { key: ClaimStatus; label: string; customer: string }[] = [
  { key: "received", label: "Received", customer: "Request Received" },
  { key: "under_review", label: "Under Review", customer: "Under Review" },
  { key: "being_handled", label: "Being Handled", customer: "Being Handled" },
  { key: "update_available", label: "Update Available", customer: "Update Available" },
];

export function statusIndex(s: ClaimStatus) {
  return STATUS_STEPS.findIndex((x) => x.key === s);
}

export function statusLabel(s: ClaimStatus) {
  return STATUS_STEPS[statusIndex(s)]?.label ?? s;
}

export function timeAgo(iso: string, now: number) {
  const diff = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
