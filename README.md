# NexusBank — Advanced Digital Banking Management System

## 1. Project Overview
NexusBank is a full-stack, production-oriented Digital Banking Management System built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Redux Toolkit + RTK Query**, **NextAuth.js**, **Prisma ORM (PostgreSQL)**, **Recharts**, and **Nodemailer**. It simulates a real-world fintech banking environment with strict atomic ledger consistency, role-based access control (RBAC), automated transaction emails, loan amortization, and PDF/CSV reporting.

---

## 2. Application Features
- **Customer Portal (`/customer`)**:
  - Multi-account switcher (Savings, Current, Business) with real-time balances and limits.
  - Atomic Fund Transfers (own accounts or external recipients) with recipient verification, Transaction PIN, optional 2FA, idempotency protection, and instant PDF receipt download.
  - Deposit & Withdrawal request submission and status tracking (`PENDING`, `APPROVED`, `REJECTED`).
  - Paginated Transaction History with search by Reference ID, date range filter, type filter, detail modal, and PDF receipt export.
  - Account Statement Export in **PDF** and **CSV** formats.
  - Loan Application, status tracking, automated amortization schedule, and installment repayment.
- **Bank Staff Portal (`/staff`)**:
  - Customer registration, bank account opening, and KYC verification (`isVerified`).
  - Deposit & Withdrawal request approval/rejection with automatic ledger updates and email alerts.
  - Transaction monitoring and suspicious activity flagging for Admin review.
  - Loan pre-screening, internal staff notes, and forwarding to Admin.
- **Admin Portal (`/admin`)**:
  - Executive Analytics Dashboard with 7 KPIs and 5 live Recharts visualizations (Monthly Volume, Deposit vs Withdrawal, Account Distribution, Loan Approval Stats, Monthly Activity).
  - Customer activation, deactivation, and suspicious account blocking.
  - Bank account creation, freeze/unfreeze controls, and per-account limit configuration.
  - Flagged transaction auditing and atomic transaction reversal.
  - Final Loan Approval (triggers atomic disbursement + amortization schedule + email) and Rejection.
  - Bank-wide financial settings (daily limits, single transaction caps, minimum balance, transfer fee %, suspicious threshold).
- **Bonus Features Included**:
  - Downloadable PDF Transaction Receipts & PDF/CSV Account Statements (`jspdf` + `jspdf-autotable`).
  - Automatic Email Alerts via Nodemailer (`src/lib/mailer.ts`) + In-App Notification Center.
  - Rule-based Suspicious Transaction Detection (`evaluateSuspiciousTransaction`).
  - Two-Factor Authentication (2FA) verification step on transfers when enabled.
  - Complete Light & Dark Mode across all pages.

---

## 3. User Roles & Permissions
| Capability | Customer | Bank Staff | Admin |
| :--- | :---: | :---: | :---: |
| View own accounts, balances, statements | Yes | No | Yes (All) |
| Transfer funds (PIN + 2FA) | Yes | No | No |
| Submit deposit/withdrawal requests | Yes | No | No |
| Approve/reject deposit/withdrawal requests | No | Yes | Yes |
| Register customers & verify KYC | No | Yes | Yes |
| Freeze/unfreeze accounts & edit limits | No | No | Yes |
| Flag suspicious transactions | No | Yes | Yes |
| Reverse transactions / clear flags | No | No | Yes |
| Forward loans with internal notes | No | Yes | Yes |
| Approve/reject & disburse loans | No | No | Yes |
| Modify bank-wide financial settings | No | No | Yes |

---

## 4. Redux Toolkit Architecture
Global state is organized into feature-based slices inside `src/store/`:
- `src/store/index.ts`: Configures the Redux store and registers the RTK Query middleware.
- `src/store/slices/authSlice.ts`: Tracks authenticated user metadata and session state.
- `src/store/slices/accountSlice.ts`: Manages active selected account for the Customer switcher.
- `src/store/slices/transactionSlice.ts`: Manages transaction search, type/status filters, date ranges, and pagination.
- `src/store/slices/loanSlice.ts`: Manages loan filter and selection state.
- `src/store/slices/uiSlice.ts`: Manages persisted Light/Dark theme, mobile sidebar drawer, and global toast notifications.

---

## 5. RTK Query Implementation
`src/store/api/bankingApi.ts` implements a centralized RTK Query API slice with tag-based cache invalidation (`Accounts`, `Transactions`, `Requests`, `Loans`, `Customers`, `Notifications`, `Analytics`, `Settings`). Mutations (e.g., `transferFunds`, `processRequest`, `reviewLoan`, `repayLoan`) automatically invalidate affected tags so balances, tables, charts, and notifications stay synchronized without manual refetches.

---

## 6. Authentication Strategy
- **NextAuth.js (`src/lib/auth.ts`)** with `CredentialsProvider` and `bcryptjs` password verification.
- Stateless JWT session strategy embedding `id`, `role`, `status`, and `twoFactorEnabled`.
- **Middleware (`src/middleware.ts`)** enforces role-based route protection on `/admin/*`, `/staff/*`, and `/customer/*`.
- **Server-Side API Guards**: Every API route calls `getServerSession(authOptions)` and verifies both role permissions and resource ownership (`userId === session.user.id`).

---

## 7. Transaction Processing Logic
All financial mutations execute inside **`prisma.$transaction(async (tx) => { ... })`**:
1. **Idempotency Check**: Prevents duplicate transfers using a unique `idempotencyKey`.
2. **PIN & 2FA Verification**: Compares `transactionPin` against `user.transactionPinHash` via `bcrypt.compare`.
3. **Account & Limit Validation**: Verifies source ownership, `ACTIVE` status on both accounts, `maxSingleTransfer`, 24-hour `dailyTransferLimit`, and `balance - (amount + fee) >= minBalance`.
4. **Atomic Update**: Decrements sender and increments receiver inside a single database transaction. A failed validation rolls back completely.
5. **Email & Notification Dispatch**: Sends formatted HTML email receipts to both sender and receiver via Nodemailer and records `Notification` entries.

---

## 8. Database Structure
Defined in `prisma/schema.prisma` (PostgreSQL):
- `User`: Identity, hashed password, hashed transaction PIN, role (`ADMIN`, `STAFF`, `CUSTOMER`), status, KYC flag.
- `BankAccount`: Account number, type (`SAVINGS`, `CURRENT`, `BUSINESS`), `Decimal(15,2)` balance, status, per-account limits.
- `Transaction`: Unique `referenceId`, `idempotencyKey`, sender/receiver relations, type, amount, fee, status, fraud flags.
- `DepositWithdrawalRequest`: Customer funding requests processed by Staff/Admin.
- `Loan` & `LoanRepayment`: Full loan application metadata and monthly amortized installment schedule.
- `Notification` & `BankSettings`: In-app alerts and singleton bank-wide configuration.

---

## 9. Security Implementation
- Passwords and Transaction PINs hashed with `bcryptjs` (salt rounds: 10).
- Server-side balance and ownership validation on every endpoint (frontend balances are never trusted).
- Customers cannot approve their own deposit/withdrawal requests or access other customers' records.
- Staff cannot approve loans or modify bank-wide settings (`403 Forbidden`).
- Zod schema validation on all API request bodies.

---

## 10. Environment Variables
Configured in `.env` (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string (Prisma Postgres).
- `NEXTAUTH_SECRET`: Secret key for signing NextAuth JWTs.
- `NEXTAUTH_URL`: Application base URL (`http://localhost:3000` locally).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: Optional SMTP credentials for Nodemailer transaction emails (falls back to console logging + in-app notifications when blank).

---

## 11. Local Setup Instructions (VS Code)
1. Open the extracted project folder in **VS Code**.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push the Prisma schema to your PostgreSQL database and generate the Prisma client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Seed the database with demo accounts, transactions, and loans:
   ```bash
   npm run db:seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

*(Optional: Add your Gmail App Password or Mailtrap credentials to `SMTP_*` in `.env` to send live emails on every transaction.)*

---

## 12. Deployment Instructions (Vercel)
1. Push this repository to GitHub.
2. Import the project in **Vercel**.
3. Add all environment variables from `.env` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `SMTP_*`) in Vercel Project Settings.
4. Deploy — Vercel will run `npm run build` (`prisma generate && next build`).

---

## 13. Demo Credentials
All demo accounts use Password: **`Demo@1234`** and Transaction PIN: **`1234`**.

| Role | Email | Password | PIN |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nexusbank.com` | `Demo@1234` | `1234` |
| **Bank Staff** | `staff@nexusbank.com` | `Demo@1234` | `1234` |
| **Customer** | `customer@nexusbank.com` | `Demo@1234` | `1234` |
