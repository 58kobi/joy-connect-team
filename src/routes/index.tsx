import { createFileRoute } from "@tanstack/react-router";
import { CustomerCarePage } from "@/components/customer-care/CustomerCarePage";

const TITLE = "Debenhams Customer Care Help — Orders, Returns & Refunds";
const DESCRIPTION =
  "Independent customer care support for Debenhams orders, delivery, returns and refunds. Contact us by WhatsApp, email or live chat and get help fast.";
const URL = "https://debenhamscare.uk/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:site_name", content: "Debenhams Customer Care" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Debenhams Customer Care",
          description:
            "Independent customer support service for orders, delivery, returns and refunds.",
          url: URL,
          email: "info@debenhamscare.uk",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "info@debenhamscare.uk",
            telephone: "+44 7454 742785",
            areaServed: "GB",
            availableLanguage: "English",
          },
        }),
      },
    ],
  }),
  component: CustomerCarePage,
});
