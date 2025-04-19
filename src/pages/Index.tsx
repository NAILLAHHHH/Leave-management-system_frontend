
import { HomeHero } from "@/components/ui/home-hero";
import { FeaturesSection } from "@/components/ui/features-section";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-gray-50">
      <main>
        <HomeHero />
        <FeaturesSection />
      </main>
    </div>
  );
};

export default Index;
