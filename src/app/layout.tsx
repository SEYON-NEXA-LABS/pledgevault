import { Outfit, Hind_Madurai } from 'next/font/google';
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import TrialExpiredGate from "@/components/auth/TrialExpiredGate";
import PWARegistration from "@/components/pwa/PWARegistration";

const outfit = Outfit({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit' 
});

const hindMadurai = Hind_Madurai({ 
  weight: ['300', '400', '500', '600', '700'], 
  subsets: ['tamil'], 
  variable: '--font-hind-madurai' 
});

export async function generateMetadata(): Promise<Metadata> {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || Date.now().toString();
  
  return {
    title: "PledgeVault — Gold & Silver Loan Management",
    description: "Modern loan management system for pawn shops. Track gold & silver pledges, calculate interest, manage customers, and generate reports.",
    keywords: "gold loan, silver loan, pawn shop, pledge management, jewel loan, loan management",
    manifest: `/manifest.json?v=${version}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "PledgeVault",
    },
    icons: {
      icon: [
        { url: `/android-chrome-192x192.png?v=${version}`, sizes: "192x192", type: "image/png" },
        { url: `/android-chrome-512x512.png?v=${version}`, sizes: "512x512", type: "image/png" }
      ],
      apple: [
        { url: `/apple-touch-icon.png?v=${version}`, sizes: "180x180", type: "image/png" }
      ],
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#107B88",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${hindMadurai.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <PWARegistration />
        <TrialExpiredGate>
          <AppShell>{children}</AppShell>
        </TrialExpiredGate>
      </body>
    </html>
  );
}
