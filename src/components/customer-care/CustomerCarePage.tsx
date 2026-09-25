import { useCallback, useState } from "react";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { Categories } from "./Categories";
import { TrackSection } from "./TrackSection";
import { FinalCta, Process, WhyUs } from "./Sections";
import { SupportFaq } from "./SupportFaq";
import { TrustpilotReviews } from "./TrustpilotReviews";
import { Footer } from "./Footer";
import { RequestModal } from "./RequestModal";
import { CareChat } from "./CareChat";

export function CustomerCarePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [presetCategory, setPresetCategory] = useState<string | undefined>(
    undefined,
  );
  const [presetQuery, setPresetQuery] = useState("");

  const openRequest = useCallback((category?: string, query?: string) => {
    setPresetCategory(category);
    setPresetQuery(query ?? "");
    setModalOpen(true);
  }, []);

  const scrollToTrack = useCallback(() => {
    document.getElementById("track")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <main className="min-h-screen bg-background font-sans text-foreground antialiased">
      <Navigation />
      <Hero onGetHelp={(query) => openRequest(undefined, query)} />
      <WhyUs />
      <TrustpilotReviews />
      <Process />
      <Categories onRequest={(category) => openRequest(category)} />
      <TrackSection />
      <SupportFaq onContact={(category) => openRequest(category)} />
      <FinalCta onContact={() => openRequest()} />
      <Footer />
      <CareChat />
      <RequestModal
        open={modalOpen}
        initialCategory={presetCategory}
        initialQuery={presetQuery}
        onClose={() => setModalOpen(false)}
        onTracked={scrollToTrack}
      />
    </main>
  );
}
