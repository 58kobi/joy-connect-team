import { createFileRoute } from "@tanstack/react-router";
import { CustomerCarePage } from "@/components/customer-care/CustomerCarePage";

const TITLE =
  "Debenhams Care — Debenhams Customer Care UK, Customer Service & Contact";
const DESCRIPTION =
  "Independent Debenhams customer care and support team. Get help with orders, order tracking, delivery, returns, refunds and complaints. Contact us by WhatsApp, email or live chat — Debenhams customer service for the UK.";
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
      {
        name: "keywords",
        content:
          "Debenhams, Debenhams customer care, Debenhams customer service, Debenhams customer support, Debenhams help, Debenhams help centre, Debenhams contact, Debenhams contact us, Debenhams customer care contact, Debenhams customer service contact, Debenhams support, Debenhams support team, Debenhams contact number, Debenhams email, Debenhams customer care email, Debenhams WhatsApp, Debenhams live chat, Debenhams order support, Debenhams order tracking, Debenhams track order, Debenhams refund, Debenhams refund support, Debenhams refund status, Debenhams refund enquiry, Debenhams returns, Debenhams returns support, Debenhams return request, Debenhams delivery, Debenhams delivery support, Debenhams delivery tracking, Debenhams delayed order, Debenhams missing order, Debenhams payment support, Debenhams complaints, Debenhams complaint, Debenhams complaint contact, Debenhams customer service UK, Debenhams UK customer care, Debenhams UK customer service, Debenhams help with order, Debenhams help with refund, Debenhams help with returns",
      },
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
