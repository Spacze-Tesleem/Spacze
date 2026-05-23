'use client';

import React from 'react';
import ProductHero from './sections/Hero';
import ProductFeatures from './sections/Features';
import ProductHowItWorks from './sections/HowItWorks';
import ProductPricing from './sections/Pricing';
import ProductCTA from './sections/CTA';

export default function ProductPage() {
  return (
    <main className="bg-[#020202] min-h-screen text-white overflow-hidden">
      <ProductHero />
      <ProductFeatures />
      <ProductHowItWorks />
      <ProductPricing />
      <ProductCTA />
    </main>
  );
}
