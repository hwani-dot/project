import { HomeBackground } from "@/components/home/HomeBackground";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeServices } from "@/components/home/HomeServices";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeProfileGuard } from "./components/HomeProfileGuard";

export default function LandingPage() {
  return (
    <HomeProfileGuard>
      <main className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
        <HomeBackground />
        <HomeHero />
        <HomeServices />
        <HomeHowItWorks />
        <HomeFooter />
      </main>
    </HomeProfileGuard>
  );
}
