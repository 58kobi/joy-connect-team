import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/customer-care/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      path: "/terms",
      title: "Terms & Conditions | Debenhams Care",
      description:
        "The terms for using Debenhams Care, an independent customer support service not affiliated with or endorsed by Debenhams.",
      breadcrumb: "Terms & Conditions",
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage
      eyebrow="LEGAL"
      breadcrumb="Terms & Conditions"
      title="Terms & Conditions"
      intro="By using debenhamscare.uk you agree to these terms."
    >
      <section>
        <h2>Independent service</h2>
        <p className="mt-3">
          Debenhams Customer Care is an independent support service. It is not
          affiliated with, endorsed by or operated by Debenhams. Brand names
          are used only to describe the help we offer.
        </p>
      </section>
      <section>
        <h2>Our help</h2>
        <p className="mt-3">
          We provide guidance and help with enquiries. We cannot guarantee a
          particular outcome for an order, return or refund.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p className="mt-3">
          Questions about these terms? Email <a href="mailto:info@debenhamscare.uk">info@debenhamscare.uk</a>.
        </p>
      </section>
    </InfoPage>
  );
}
