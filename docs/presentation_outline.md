# 🪙 PledgeVault Presentation Decks
**Website:** [pledgevault.in](https://pledgevault.in)

This document contains two separate slide decks:
1. **Deck A: Client & Business Presentation** (For shop owners, clients, and partners)
2. **Deck B: Technical & Architecture Presentation** (For developers, system architects, and security auditors)

---

# DECK A: Client & Business Presentation
*Focus: Problem solved, ease of use, growth features, and bottom-line value.*

---

<!-- Slide A1 -->
## Slide A1: Welcome to PledgeVault
### Simple & Secure Gold Loan Management for Pawn Shop Chains
**Website:** [pledgevault.in](https://pledgevault.in)

* **The Vision:** Transforming traditional paper-based pawn shops into efficient, digital-first operations.
* **Our Commitment:** Building trust with your customers while giving you full control over your shop’s finances.
* **Local First:** Tailored for local jewelry and lending markets with easy-to-use interfaces.

---

<!-- Slide A2 -->
## Slide A2: The Cost of Paper Ledgers
### Why Paper-based Shops Struggle to Grow

* **Loss of Data:** Physical ledgers can be lost, damaged, or altered.
* **Time Wasted:** Calculating metal valuations, interest rates, and loan limits by hand is slow and prone to errors.
* **Overdue Blindspots:** Hard to track who owes what, and when their payments are overdue.
* **Scaling Barriers:** Managing more than one branch location creates massive administrative overhead.

---

<!-- Slide A3 -->
## Slide A3: Key Operations Made Easy
### Streamlined Daily Workflows for Your Staff

* **Smart Valuations:** Input the karat (e.g., 22k/916) and weight to instantly get appraised values.
* **Professional Receipts:** Instantly print A5 Pledge Certificates or 80mm thermal paper receipts.
* **KYC & Customer Profiles:** Safely store Aadhaar/PAN details and look up customer histories by phone number.
* **WhatsApp Reminders:** Send manual, one-click payment reminders directly from your dashboard.

---

<!-- Slide A4 -->
## Slide A4: Live Rates & Weighing Automation
### Eliminating Pricing Errors and Manual Fraud

* **Live MCX Rate Sync:** No more manual price checking. Gold and silver rates sync directly from live market feeds (MCX) in real-time.
* **Weighing Machine Integration:** Connect digital weighing scales directly to the platform via WebUSB/Serial interface.
* **Zero-Error Data Entry:** The weight reads straight from the scale to the software, preventing manual typing errors or employee fraud.
* **Fair Valuations:** Automatically lock in maximum loan values based on live rates and verified scale weights.

---

<!-- Slide A5 -->
## Slide A5: Scale Your Business Securely
### Multi-Branch Operations & Clear Oversight

* **Consolidated Dashboard:** View your entire pawn business network's performance at a glance.
* **Branch Switcher:** Toggle between your different shop locations instantly to inspect local books.
* **Staff Controls:** Grant different accesses to Managers (full access) vs. Counter Staff (operational access).
* **Safe Backups:** Rest easy knowing your business data can be backed up and restored with cloud safety.

---

# DECK B: Technical & Architecture Presentation
*Focus: Technology stack, security protocols, tenant separation, and database integrity.*

---

<!-- Slide B1 -->
## Slide B1: System Architecture
### High-Performance Foundations
**Website:** [pledgevault.in](https://pledgevault.in)

* **Framework:** Next.js (App Router) & TypeScript for speed, SEO, and robust type safety.
* **Database & Security:** Supabase (PostgreSQL) as the core data layer.
* **Data Visualization:** Interactive graphs and charts utilizing Recharts.
* **Theme:** Optimized Teal-and-Gold interface styled with responsive, vanilla CSS.

---

<!-- Slide B2 -->
## Slide B2: Multi-Tenant Database Isolation
### Row Level Security (RLS) Implementation

* **Shared-DB, Isolated-Rows:** A single database engine serving all firms, but protected by Postgres Row Level Security.
* **Zero Leakage:** Every query is filtered by the authenticated user's `firm_id` at the database level.
* **Secure Storage:** Customer KYC documents and assets stored in Supabase buckets, protected by corresponding storage RLS policies.

---

<!-- Slide B3 -->
## Slide B3: Advanced Branching & RBAC
### Granular Access Control and Audit Trails

* **Role-Based Routing (RBAC):** Superadmin console for platform growth, Firm Manager for billing/settings, and Staff accounts for day-to-day work.
* **Location Pinning:** Actions are tagged with branch contexts to ensure audit logs track where every transaction physically occurred.
* **Role-Adaptive UI:** Sensitive financials and manager tabs are dynamically removed from UI compilation for non-manager roles.

---

<!-- Slide B4 -->
## Slide B4: Live Rates & Hardware Integration
### MCX API Sync & Web Serial/USB Protocol

* **Automated MCX Synchronization:** Cron jobs and settings interfaces fetch real-time gold/silver commodity feeds through a dedicated backend API route.
* **Hardware Scale Connection:** Implements the **Web Serial API** to securely interface with desktop weighing machines directly from the web browser.
* **Data Stream Parsing:** Decodes incoming serial data streams (e.g., continuous output format from standard scale interfaces) to verify gold and silver weight readings safely client-side.
* **Integrity Audits:** Validates database schema updates and verifies functional RLS security metrics in real-time.
