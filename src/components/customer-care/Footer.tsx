import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import logoAsset from "@/assets/debenhams-logo-light.png.asset.json";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "FAQs", href: "#faqs" },
  { label: "Contact Us", href: "#contact" },
];

const LEGAL_LINKS = ["Privacy Policy", "Terms & Conditions", "Cookies"];

const SOCIALS = [
  { icon: Facebook, label: "Facebook" },
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter" },
  { icon: Youtube, label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-primary px-5 py-14 text-primary-foreground sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div>
            <img
              src={logoAsset.url}
              alt="Debenhams"
              width={206}
              height={36}
              className="h-9 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/55">
              Customer care support for orders, delivery, returns, refunds and
              enquiries.
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="text-sm font-medium">Customer Care</h3>
            <div className="mt-5 grid gap-3 text-sm text-primary-foreground/60">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-primary-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <div>
            <h3 className="text-sm font-medium">Legal</h3>
            <div className="mt-5 grid gap-3 text-sm text-primary-foreground/60">
              {LEGAL_LINKS.map((label) => (
                <a
                  key={label}
                  href="#"
                  className="transition-colors hover:text-primary-foreground"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-4 md:justify-end">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="text-primary-foreground/50 transition-colors hover:text-primary-foreground"
              >
                <Icon size={18} strokeWidth={1.6} />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-primary-foreground/10 pt-7">
          <p className="text-xs text-primary-foreground/40">
            © 2026 Debenhams Customer Care. All rights reserved.
          </p>
          <a
            href="/auth"
            className="text-[11px] text-primary-foreground/25 transition-colors hover:text-primary-foreground/60"
          >
            Staff Console
          </a>
        </div>
      </div>
    </footer>
  );
}
