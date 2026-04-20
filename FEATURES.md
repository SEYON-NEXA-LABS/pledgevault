# PledgeVault: Platform Feature Guide

PledgeVault is a secure, multi-tenant gold loan management platform designed for pawn shop chains. This document serves as the official feature registry for both platform owners (Superadmins) and business owners (Firms).

---

## 1. Core Platform Infrastructure (Security & Audit)
These features form the backbone of the platform and apply to all users:

- **Multi-Tenant Isolation**: State-of-the-art data separation using Supabase **Row Level Security (RLS)**. No data leakage is possible between different firms.
- **Comprehensive Audit Trail**: Every new loan, client, or payment is automatically tagged with a `created_by` User ID and a high-resolution timestamp.
- **Version Transparency**: The Git-based build version is displayed on the Login page and Sidebar for easy identification and support.
- **Enterprise Design System**: A premium teal and gold aesthetic optimized for professional financial environments.

---

## 2. Superadmin Console (Platform Ownership)
Tools for managed growth and system-wide visibility:

- **Global System Dashboard**: Real-time overview of platform-wide metrics:
    - Total Onboarded Firms.
    - Cumulative Platform Loan Value.
    - Total Active Users across all tenancies.
- **Firm Management Hub**: 
    - **Master Registry**: Searchable database of all onboarded shops.
    - **Growth Analytics**: Monitor branch and staff expansion for each firm at a glance.
    - **Centralized Onboarding**: Link to the multi-step business registration wizard.
- **Subscription Management**: 
    - Tier-based controls (Free, Pro, Enterprise).
    - Centralized billing status monitoring.
- **System Integrity Dashboard**: 
    - **Structural Audit**: Verifies tables and columns are in sync with the latest build.
    - **Security Audit**: Confirms RLS policies are active and protecting data.
    - **Functional Audit**: Validates that all Postgres analytics routines are operational.

---

## 3. Firm Management (Shop Operations)
Tools for pawn shop managers and their employees:

- **Global Operational Context**: A master switcher in the header allows managers to toggle between managing a specific branch and viewing a **Firm-wide Consolidated Overview**.
    - **Role Management**: Grant permissions to Managers (Full Access) or Staff (Operational Access).
    - **Location Pinning**: Assign staff to specific branches for locked-in local context.
- **Unified Settings Hub**:
    - **Personal Interface**: A dedicated **"My Profile"** screen for every user to manage their own name and security (Password).
    - **Consolidated Configuration**: A tabbed hub for Managers to oversee Shop Details, Subscription Billing, and Team Access in one place.
    - **Staff Override Control**: Robust policy toggles that allow managers to decide if staff can change interest rates or LTV % "on the go" during loan creation.
    - **Role-Adaptive UI**: Dynamic tabs that automatically hide sensitive financial and team data from staff members while leaving personal settings accessible.
- **Customer CRM**: 
    - Integrated KYC with ID proof and selfie storage.
    - Complete customer pawn history and phone-based lookup.
- **Digital Pledge Registry**: 
    - **Valuation Engine**: Precision gold and silver weight tracking.
    - **Loan Origination**: Calculated LTV percentages and automated due-date generation.
    - **Branch-Locked Records**: Even in Global mode, new loans must be assigned to a specific branch for audit integrity.
- **Payment Lifecycle**: 
    - Recording of interest and partial payments.
    - Tracking of where payments were physically received (Branch tracking).
- **Dashboard Analytics**: 
    - Live tickers for active loan values and metal weights (Gold/Silver).
    - Monthly expansion charts and metal distribution analytics.

---

## 4. Technical Stack
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind-inspired Vanilla CSS.
- **Backend**: Supabase (Postgres, Auth, Storage).
- **Visualization**: Recharts for financial growth tracking.
- **Icons**: Lucide React.
