import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

// Modern grotesque type system. Body/UI = Hanken (warm, highly legible);
// display/wordmark = Schibsted (a touch more character). Professional, inclusive,
// and deliberately not a generic SaaS/agent typeface.
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Versona — Where the whole person meets the whole community",
    template: "%s · Versona",
  },
  description:
    "A human-first professional community. Build your professional identity, find your people, and connect around shared missions — before any company is involved.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Versona", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
