import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/customer-care/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      path: "/privacy",
      title: "Privacy Policy | Debenhams Care",
      description:
        "How Debenhams Care collects, uses and protects the personal details you share through our request form, chat, email and reviews.",
      breadcrumb: "Privacy Policy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="LEGAL"
      breadcrumb="Privacy Policy"
      title="Privacy Policy"
      intro="This policy explains what information we collect when you use debenhamscare.uk and how we use it."
    >
      <section>
        <h2>Information we collect</h2>
        <p className="mt-3">
          When you submit a request, send an email, chat with us or leave a
          review, we collect the details you provide — such as your name,
          email address, phone number, order number and message.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p className="mt-3">
          Only to respond to your enquiry, follow up on your request and
          improve our service. Review email addresses are visible only to our
          staff. We do not sell your information.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p className="mt-3">
          You can ask us to access, correct or delete your information by
          emailing <a href="mailto:info@debenhamscare.uk">info@debenhamscare.uk</a>.
        </p>
      </section>
    </InfoPage>
  );
}
