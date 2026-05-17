import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services — Web Development, AI Automation & More | Spacze',
  description: 'Spacze offers web & app development, e-commerce platforms, SaaS dashboards, AI automation, and ongoing maintenance for startups and growing businesses.',
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
