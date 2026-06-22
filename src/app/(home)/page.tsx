"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Home/Navbar";
import { HeroSection } from "@/components/Home/HeroSection";
import { HowItWorks } from "@/components/Home/HowItWorks";
import { Features } from "@/components/Home/Features";
import { EventTypes } from "@/components/Home/EventTypes";
import { FeaturedEvents } from "@/components/Home/FeaturedEvents";
import { CtaBand } from "@/components/Home/CtaBand";
import { Footer } from "@/components/Home/Footer";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignIn   = () => router.push(ROUTES.LOGIN);
  const handleRegister = () => router.push(ROUTES.REGISTER);
  const handleExplore  = () => router.push(ROUTES.EXPLORE);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar
        onSignIn={handleSignIn}
        onRegister={handleRegister}
        onExplore={handleExplore}
        session={session}
      />

      <main>
        <HeroSection
          onSignIn={handleSignIn}
          onRegister={handleRegister}
          onExplore={handleExplore}
        />
        <FeaturedEvents />
        <HowItWorks />
        <Features />
        <EventTypes />
        <CtaBand onSignIn={handleSignIn} onRegister={handleRegister} />
      </main>

      <Footer />
    </div>
  );
}
