# 🪙 PledgeVault

Modern gold and silver loan management system tailored for small pawn shops. PledgeVault replaces paper registers and basic spreadsheets with a slick, local-first web application.

## 🌟 The Vision

Gold loan management is a real pain point for small pawn shops that still run on paper registers or basic spreadsheets. PledgeVault addresses this by providing a digital-first, reliable ledger that build trust with customers and streamlines shop operations.

## 🗺️ Roadmap

### Phase 1: MVP (Completed)
- **Loan Management**: Open new loans with gold/silver item details (weight + karat).
- **Valuation**: Auto-calculate appraised value and loan amounts based on live rates.
- **Status Tracking**: Monitor active, overdue, and closed loans.
- **Analytics**: Granular metal distribution and loan volume charts.

### Phase 2: Financials & KYC (Completed)
- **Payments**: Record full or partial payments with transaction history.
- **KYC Storage**: Secure storage for Aadhaar/PAN details in customer profiles.
- **Reminders**: Manual WhatsApp reminders for overdue items from the dashboard.

### Phase 3: Professionalism (Completed)
- **Pledge Certificates**: Professional A5 pledged receipts with terms and conditions.
- **Thermal Printing**: Optimization for 80mm thermal printers for standard shop workflows.

### Phase 4: Business Tools (Completed)
- **MCX Integration**: Live MCX gold/silver rate synchronization in settings.
- **Financial Reporting**: Profit/Loss, interest yield, and asset performance reports.

### Phase 5: SaaS & Scale (Completed)
- **Multi-branch**: Support for multiple shop locations with active branch switching.
- **Cloud Sync**: Local-first cloud redundancy via JSON Backup/Restore for multi-device sync.

---

## 🏗️ Core Principles

- **Offline Support**: Small pawn shops often have patchy internet. PledgeVault uses a local-first storage architecture (PWA ready).
- **Tamil Localization**: Designed with Tamil UI and bilingual receipts in mind for Coimbatore-based shops.
- **Interest Engine**: Configurable calculation modes from day one (Flat Rate, Reducing Balance, Per-gram).
- **Purity Presets**: Pre-configured hallmarks (916, 875, 750, etc.) for instant value calculation.

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the results.

## ☁️ Cloud Sync (Supabase)

PledgeVault now supports optional cloud synchronization via Supabase.

### 1. Setup Supabase
- Create a new project on [Supabase.com](https://supabase.com).
- Open the SQL Editor and run the schema found in `src/lib/supabase/schema.sql`.

### 2. Configure Environment
Add your credentials to a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Migrate Local Data
Go to **Settings > Supabase Connectivity** and click **Migrate Local Data to Cloud**.

---

Built with ❤️ for the Pawn Shop community in Coimbatore.
