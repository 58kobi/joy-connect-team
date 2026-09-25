import { useState } from "react";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import logoAsset from "@/assets/debenhams-logo-light.png.asset.json";

const LINKS = [
  { label: "Home", href: "#home" },
  { label: "FAQs", href: "#faqs" },
  { label: "Contact Us", href: "#contact" },
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-12">
        <a
          href="#home"
          onClick={() => setOpen(false)}
          className="flex items-center"
          aria-label="Debenhams home"
        >
          <img
            src={logoAsset.url}
            alt="Debenhams"
            width={206}
            height={36}
            className="h-8 w-auto sm:h-9"
          />
        </a>

        <nav className="hidden gap-9 text-sm md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-opacity hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex" aria-hidden="true">
          <Search size={20} strokeWidth={1.6} />
          <UserRound size={20} strokeWidth={1.6} />
          <ShoppingBag size={20} strokeWidth={1.6} />
        </div>

        <button
          type="button"
          className="rounded-md p-1 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-primary-foreground/10 bg-primary md:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto flex max-w-7xl flex-col px-5 py-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-primary-foreground/5 py-3.5 text-sm last:border-b-0"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
