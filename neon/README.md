# JurisFlow — Neon PostgreSQL Database

This directory contains the production-grade PostgreSQL schema and migration scripts for **Neon Serverless PostgreSQL** integration into the JurisFlow platform.

## Directory Structure

```
neon/
├── schema.sql                               # Complete normalized PostgreSQL schema (45 tables)
├── migrations/
│   └── 20261104000001_contractiq_neon_schema.sql # Initial idempotent schema migration
└── README.md                                # Setup & configuration instructions
```

## Schema Highlights

The database schema is fully normalized and supports:
1. **User Management**: `users`, `profiles`, `user_roles`, `user_sessions`
2. **Lawyer Marketplace**: `lawyer_profiles`, `lawyer_categories`, `lawyer_specializations`, `lawyer_documents`, `lawyer_verifications`, `verification_requests`, `lawyer_availability`, `availability_schedules`, `lawyer_reviews`, `client_reviews`, `lawyer_favorites`
3. **Contract Lifecycle Management (CLM)**: `contracts`, `contract_parties`, `contract_versions`, `contract_clauses`, `contract_approvals`, `contract_comments`, `contract_signatures`, `contract_reminders`, `contract_activity_logs`, `shared_document_permissions`
4. **Client & Case Management**: `client_cases`, `legal_cases`, `case_documents`, `case_notes`, `consultation_bookings`, `consultation_sessions`
5. **Payments & Billing**: `payment_orders`, `payments`, `payment_transactions`, `commission_ledgers`, `lawyer_earnings`, `payouts`, `refunds`, `invoices`
6. **Communication**: `conversations`, `conversation_participants`, `messages`, `notifications`
7. **Administration & Platform Settings**: `admin_logs`, `audit_logs`, `platform_settings`, `system_settings`

## Connection Configuration

The backend connects to Neon using `@neondatabase/serverless` with WebSocket pooling and HTTP query optimizations for Vercel Serverless Functions.

In Vercel or `.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint-id]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require
NEON_DATABASE_URL=postgresql://[user]:[password]@[endpoint-id]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require
```
