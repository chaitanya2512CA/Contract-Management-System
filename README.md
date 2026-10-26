# ContractIQ — AI-Powered Contract Lifecycle Management & Lawyer Consultation Marketplace

ContractIQ is a comprehensive enterprise-grade platform uniting **AI-Powered Contract Lifecycle Management (CLM)** with an **Astrotalk-style on-demand legal consultation marketplace**. Built to empower individuals, startups, enterprise legal departments, and independent Bar Council advocates.

---

## 🏛️ Core Product Pillars

### 1. AI-Powered Contract Lifecycle Management (CLM)
- **Automated Risk Engine**: 0–100 numerical risk scoring, category risk assessments, and executive summaries.
- **Red-Flag Extraction**: High/Medium/Low liability clause identification with exact text snippets and reasoning.
- **Smart Clause Rewrites**: AI-recommended standard, balanced, and fallback clause revisions.
- **Contract AI Assistant**: In-context interactive legal chatbot answering queries specific to active contract text.
- **Multi-Stage Approvals & Audit Trail**: Approval workflows, version control, and time-bound advocate review invites.
- **Built-in E-Signatures**: Legally binding signature capture with IP and timestamp verification.

### 2. Astrotalk-Style Lawyer Discovery & Consultation Marketplace
- **15 Practice Specialties**: Criminal, Corporate & Commercial, Contract, Family & Divorce, Property & Real Estate, Civil Litigation, Tax & GST, IP, Employment & Labour, Consumer Rights, Cybercrime & Tech, Immigration, Banking & Financial, Constitutional, and General Practice.
- **Search & Intelligent Filtering**: Filter by specialty, city/state, languages, experience, consultation modes, and fee ranges.
- **Transparent Tiered Pricing**: Flat rates for 15-minute, 30-minute, and 60-minute sessions with upfront fee breakdown (Lawyer Fee + Platform Convenience Fee + 18% GST).
- **Consultation Modes**: Instant Chat, Encrypted Audio, HD Video Room, and In-Person appointments.
- **Verified Advocate Badges**: Bar Council enrollment verification queue with admin moderation and audit verification status.

### 3. Integrated Audio/Video & Real-Time Consultation Workspace
- **Consultation Room**: Live video/audio stage, camera/microphone/screenshare controls, and countdown session timer.
- **Real-Time Encrypted Chat**: Client-advocate message thread with document sharing and system alerts.
- **Confidential Lawyer Notepad**: Encrypted private notes for advocate case preparation and legal opinions.
- **Post-Session Reviews**: 5-star ratings and client reviews with automated advocate score recalculation.

### 4. Dynamic Specialty-Adapted Lawyer Workspaces
The advocate dashboard dynamically recalibrates its tools, document categories, and widgets based on the advocate's practice area:
- **Criminal Lawyer**: Bail petitions, FIR/Chargesheet records, remand trackers, and court appearance dates.
- **Corporate & Commercial Lawyer**: Board resolutions, commercial agreements, M&A checklists, and compliance deadlines.
- **Contract Lawyer**: Direct CLM integration, clause repositories, redline comparisons, and risk review queues.
- **Family Lawyer**: Divorce petitions, custody schedules, mediation logs, and confidential client records.
- **Property Lawyer**: Title search deeds, encumbrance certificates, sale agreements, and municipal clearances.

### 5. Legal Case Management & Privileged Document Vault
- **6-Stage Matter Progression**: Consultation → Case Filing → Pleadings → Evidence & Arguments → Hearing/Trial → Judgment/Closure.
- **Case Chronology Timeline**: Historical event tracking with dates, descriptions, and hearing reminders.
- **Privileged Document Vault**: Category-based file uploads (FIR, Petitions, Contracts, Evidence, Affidavits) with size and MIME validation.

### 6. Fixed-Price Legal Services Marketplace
- Browse standardized legal deliverables (Startup Incorporation Pack, Custom NDA Drafting, Trademark Filing, Property Title Verification).
- Direct purchasing, deliverable turnaround tracking, and lawyer fulfillment workflow.

### 7. Razorpay Payments & Financial Settlement Engine
- **HMAC-SHA256 Signature Verification**: Cryptographically secure payment order creation and client payment completion.
- **Automated Commission Split**: Lawyer earnings ledger with platform fee deduction and net credit.
- **Bank Payout Requests**: Advocates can withdraw accrued earnings directly to verified bank accounts.
- **Developer Test Checkout Sandbox**: 1-click test checkout bypass for seamless local development and staging verification.

---

## 👥 Four Primary User Experiences

| Role | Portal / Dashboard | Core Capabilities |
| :--- | :--- | :--- |
| **Client** | `/client/dashboard` | Search advocates, book consultations, review contracts, track legal cases, view consultation history, and submit reviews. |
| **Lawyer / Advocate** | `/lawyer/dashboard` | Manage consultation requests, conduct video/chat consultations, update specialty availability schedules, track earnings, and withdraw payouts. |
| **Business / Enterprise** | `/business/dashboard` | Central CLM contract repository, AI risk analysis, multi-stage approvals, e-signatures, and advocate review collaboration. |
| **Platform Administrator** | `/admin/dashboard` | Platform KPI metrics, Bar Council advocate verification queue, payout settlements, commission policy configuration, and audit logs. |

---

## 🔑 Pre-Configured Demo Credentials

The platform is pre-seeded with realistic data across all user personas. All login screens feature a **1-Click Persona Fast-Switcher** in the top navigation bar and an **Auto Fill** button on `/login`:

| Persona | Role | Email | Password | Practice / Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Ananya Sharma** | Client (Individual) | `client@contractiq.law` | `Client@12345` | Startup Founder / Legal Consumer |
| **Adv. Rajesh Iyer** | Advocate (Corporate) | `lawyer.corporate@contractiq.law` | `Lawyer@12345` | Corporate & Commercial (14 yrs exp) |
| **Adv. Vikram Malhotra** | Advocate (Criminal) | `lawyer.criminal@contractiq.law` | `Lawyer@12345` | Criminal Defence (16 yrs exp) |
| **Adv. Sneha Deshmukh** | Advocate (Contract) | `lawyer.contract@contractiq.law` | `Lawyer@12345` | Contract Lifecycle & Licensing (11 yrs exp) |
| **Vikramaditya Rao** | Business Enterprise | `business@contractiq.law` | `Business@12345` | General Counsel, Apex Tech Ventures |
| **ContractIQ Lead Admin** | Super Administrator | `admin@contractiq.law` | `Admin@12345` | Platform Operations & Verification |

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router v6.
- **Backend**: Node.js, Express.js, JWT session security, bcrypt password hashing, Multer file handling.
- **Database Architecture**:
  - PostgreSQL via Neon / Supabase in production.
  - Zero-config high-performance `pg-mem` fallback in local development (auto-boots with 25+ relational tables and realistic seed data without requiring local database daemons).
- **Payments**: Razorpay Node SDK with HMAC-SHA256 signature verification and developer sandbox instant test checkout.
- **Deployment**: Vercel-ready with `vercel.json` SPA routing rewrites and `api/index.js` serverless handler.

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

### 1. Installation
In the project root directory:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Configure `DATABASE_URL` with a Neon connection string, or leave empty to automatically run the embedded PostgreSQL engine).*

### 3. Launch Development Servers
Run backend and frontend concurrently:
```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

### 4. Access the Application
- **Home / Landing Page**: [http://localhost:5173](http://localhost:5173)
- **Advocate Marketplace**: [http://localhost:5173/lawyers](http://localhost:5173/lawyers)
- **Fixed-Price Legal Services**: [http://localhost:5173/services](http://localhost:5173/services)
- **Universal Sign In**: [http://localhost:5173/login](http://localhost:5173/login)
- **AI Contract Repository**: [http://localhost:5173/contracts](http://localhost:5173/contracts)
- **Legal Matters Workspace**: [http://localhost:5173/cases](http://localhost:5173/cases)
- **Backend API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📦 Production Build & Testing

### Frontend Build
```bash
cd client
npm run build
```
Generates optimized production assets in `client/dist`.

### Database Seeding
To manually re-populate demo accounts, verified advocates, CLM contracts, cases, and ledger transactions:
```bash
cd server
npm run seed
```

---

## ☁️ Deployment to Vercel

The repository includes a battle-tested `vercel.json` configuration configured for Vercel:

1. Import the repository into your [Vercel Dashboard](https://vercel.com).
2. Configure settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm --prefix client run build`
   - **Output Directory**: `client/dist`
3. Add Environment Variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (`postgresql://...sslmode=require`).
   - `JWT_SECRET`: A secure random secret key.
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Secret.
4. Deploy. Vercel automatically exposes the API endpoints via `api/index.js` and serves the frontend SPA.

---

## ⚖️ Statutory & Compliance Disclaimer

*ContractIQ is a legal technology platform facilitating contract lifecycle management, legal project collaboration, and appointment discovery between clients and independent advocates. In accordance with Bar Council of India regulations, the advocate listings on ContractIQ do not constitute advertisement or solicitation of legal work. All advocates listed are independent practitioners responsible for their professional legal opinions.*
