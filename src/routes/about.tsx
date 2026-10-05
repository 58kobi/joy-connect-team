import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/customer-care/InfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      path: "/about",
      title: "About Us | Debenhams Care — Independent Support",
      description:
        "Who runs Debenhams Care: an independent UK customer support service helping shoppers with orders, delivery, returns and refunds.",
      breadcrumb: "About",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <InfoPage
      eyebrow="ABOUT US"
      breadcrumb="About"
      title="About Debenhams Customer Care"
      intro="We are an independent UK customer support team helping shoppers with order, delivery, returns and refund questions."
    >
      <section>
        <h2>Who we are</h2>
        <p className="mt-3">
          Debenhams Customer Care (debenhamscare.uk) is run by an independent
          support team. We are not part of, affiliated with or endorsed by
          Debenhams. We help customers understand their options, prepare
          requests and follow up on order issues.
        </p>
      </section>
      <section>
        <h2>What we help with</h2>
        <p className="mt-3">
          Order enquiries, delivery problems, <a href="/returns">returns and exchanges</a>,
          refund status and complaints. Reach us by WhatsApp, email or live
          chat, Monday to Friday, 9am – 6pm.
        </p>
      </section>
      <section>
        <h2>Get in touch</h2>
        <p className="mt-3">
          See our <a href="/contact">contact page</a> for all the ways to reach the team.
        </p>
      </section>
    </InfoPage>
  );
}
