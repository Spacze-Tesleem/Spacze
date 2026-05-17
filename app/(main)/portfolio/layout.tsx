import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio — Spacze Web Apps & AI Projects',
  description: 'See the web apps, e-commerce platforms, dashboards, and AI systems Spacze has built for real estate, logistics, fashion, and more.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
