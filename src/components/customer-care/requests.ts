import {
  CircleUserRound,
  HelpCircle,
  MessageCircle,
  Package,
  PoundSterling,
  RotateCcw,
  Truck,
  type LucideIcon,
} from "lucide-react";

export type SupportRequest = {
  ref: string;
  email: string;
  category: string;
  orderNumber: string;
  description: string;
  createdAt: string;
};

export type Category = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export const CATEGORY_DATA: Category[] = [
  {
    title: "Track Your Order",
    text: "Check the status of your order or delivery.",
    icon: Package,
  },
  {
    title: "Delivery Issues",
    text: "Late, missing or damaged delivery?",
    icon: Truck,
  },
  {
    title: "Returns & Exchanges",
    text: "Start a return or request an exchange.",
    icon: RotateCcw,
  },
  {
    title: "Refunds",
    text: "Check your refund status or request a refund.",
    icon: PoundSterling,
  },
  {
    title: "Complaints",
    text: "Tell us about an issue or unresolved problem.",
    icon: MessageCircle,
  },
  {
    title: "Account & Orders",
    text: "Get help with your account and orders.",
    icon: CircleUserRound,
  },
  {
    title: "General Enquiries",
    text: "Other questions? We're here to help.",
    icon: HelpCircle,
  },
];

export const CATEGORIES = CATEGORY_DATA.map((c) => c.title);

const STORAGE_KEY = "debenhams-cc-requests";
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReference(): string {
  let tail = "";
  for (let i = 0; i < 6; i++) {
    tail += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `DC-${tail}`;
}

function readAll(): SupportRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SupportRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveRequest(request: SupportRequest): void {
  try {
    const all = readAll();
    all.push(request);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable — the request still confirms in the UI.
  }
}

export function findRequest(
  reference: string,
  email: string,
): SupportRequest | undefined {
  const ref = reference.trim().toUpperCase();
  const mail = email.trim().toLowerCase();
  if (!ref || !mail) return undefined;
  return readAll().find(
    (r) => r.ref.toUpperCase() === ref && r.email.toLowerCase() === mail,
  );
}

export function formatRequestDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
