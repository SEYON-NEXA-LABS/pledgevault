import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
