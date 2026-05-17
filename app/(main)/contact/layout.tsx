import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Spacze — Book a Free Strategy Call',
  description: 'Book a free 20-minute strategy call with Spacze. Tell us about your project and we\'ll get back to you within 24 hours.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
