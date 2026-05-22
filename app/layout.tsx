import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spacze — Web Apps & AI Systems for Startups and Growing Businesses",
  description: "Spacze builds fast, modern web apps, e-commerce platforms, dashboards, and AI automation systems for startups and growing businesses across Africa and beyond. Get more customers with a digital product that works.",
  keywords: [
    "web developer Nigeria",
    "Next.js developer Africa",
    "web app development",
    "AI automation agency",
    "e-commerce development",
    "SaaS development",
    "software agency Nigeria",
    "React developer freelance",
    "dashboard development",
    "startup web development",
  ],
  authors: [{ name: "Spacze" }],
  creator: "Spacze",
  metadataBase: new URL("https://spacze.vercel.app"),
  openGraph: {
    type: "website",
    url: "https://spacze.vercel.app",
    title: "Spacze — Web Apps & AI Systems for Startups and Growing Businesses",
    description: "We build fast, modern web apps and AI automation systems that get you more customers. Real Estate · Logistics · E-Commerce · SaaS.",
    siteName: "Spacze",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Spacze — Web Apps & AI Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spacze — Web Apps & AI Systems for Startups and Growing Businesses",
    description: "We build fast, modern web apps and AI automation systems that get you more customers.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://spacze.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
