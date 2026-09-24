import { createFileRoute } from "@tanstack/react-router";
import { CustomerCarePage } from "@/components/customer-care/CustomerCarePage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Debenhams Customer Care — Help with Orders, Delivery & Returns",
      },
      {
        name: "description",
        content:
          "Get help with your orders, delivery, returns, refunds, complaints and more. Submit a support request or track an existing one.",
      },
      { property: "og:title", content: "Debenhams Customer Care" },
      {
        property: "og:description",
        content:
          "We're here to help with your orders, delivery, returns, refunds, complaints and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerCarePage,
});
