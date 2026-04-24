import { Outfit, Hind_Madurai } from 'next/font/google';
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import TrialExpiredGate from "@/components/auth/TrialExpiredGate";

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

export const metadata: Metadata = {
  title: "PledgeVault — Gold & Silver Loan Management",
  description: "Modern loan management system for pawn shops. Track gold & silver pledges, calculate interest, manage customers, and generate reports.",
  keywords: "gold loan, silver loan, pawn shop, pledge management, jewel loan, loan management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${outfit.variable} ${hindMadurai.variable} antialiased`}>
        <TrialExpiredGate>
          <AppShell>{children}</AppShell>
        </TrialExpiredGate>
      </body>
    </html>
  );
}
