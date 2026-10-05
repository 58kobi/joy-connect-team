import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/customer-care/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead({
      path: "/contact",
      title: "Contact Us | Debenhams Care — WhatsApp, Email, Phone",
      description:
        "Contact our independent customer care team by WhatsApp, phone or email at info@debenhamscare.uk. Monday to Friday, 9am – 6pm UK time.",
      breadcrumb: "Contact",
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <InfoPage
      eyebrow="CONTACT US"
      breadcrumb="Contact"
      title="Contact our customer care team"
      intro="Choose the way that suits you best. We reply Monday to Friday, 9am – 6pm UK time."
    >
      <section>
        <h2>WhatsApp</h2>
        <p className="mt-3">
          <a href="https://wa.me/447454742785" target="_blank" rel="noopener noreferrer">
            Message +44 7454 742785 on WhatsApp
          </a>
        </p>
      </section>
      <section>
        <h2>Phone</h2>
        <p className="mt-3"><a href="tel:+447454742785">Call +44 7454 742785</a></p>
      </section>
      <section>
        <h2>Email</h2>
        <p className="mt-3"><a href="mailto:info@debenhamscare.uk">info@debenhamscare.uk</a></p>
      </section>
      <section>
        <h2>Returns</h2>
        <p className="mt-3">
          Need to send something back? Read our <a href="/returns">returns and exchanges guide</a>.
        </p>
      </section>
    </InfoPage>
  );
}
