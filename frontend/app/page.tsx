'use client';

import { CTA } from "@/components/shared/cta";
import { Features } from "@/components/shared/features";
import { Hero } from "@/components/shared/hero";
import { MerchantSection } from "@/components/shared/merchant-section";
import { Stats } from "@/components/shared/stats.";



export default function HomePage() {
  return (
    <>
      <Hero />
      <MerchantSection />
      <Features />
      <Stats />
      <CTA />
    </>
  );
}