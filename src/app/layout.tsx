import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import TrialExpiredGate from "@/components/auth/TrialExpiredGate";

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
      <body>
        <TrialExpiredGate>
          <AppShell>{children}</AppShell>
        </TrialExpiredGate>
      </body>
    </html>
  );
}
