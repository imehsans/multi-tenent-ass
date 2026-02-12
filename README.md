# Multi-Tenant Ticket System

A comprehensive Next.js 14 application built with Supabase, featuring multi-tenancy, realtime updates, and role-based access control.

## 🚀 Features

- **Multi-Tenancy**: Organization-based data isolation via RLS.
- **Authentication**: Secure login/signup via Supabase Auth + Middleware.
- **Ticket Management**: Create, view, update, and track tickets.
- **Realtime Collaboration**: Live updates for tickets, comments, and presence indicators.
- **File Attachments**: Upload/download using Supabase Storage and RLS.
- **Audit Logging**: Immutable tracking of critical actions.
- **Performance**: Cursor pagination and full-text search using `tsvector`.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Headless UI.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage).
- **Language**: TypeScript.

## 📦 Installation & Setup

1. **Install Dependencies**:

   ```bash
   npm install
   npm install @headlessui/react @heroicons/react slugify date-fns
   # Dev dependencies
   npm install -D @types/slugify ts-node
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Database Migration (Critical)**:
   This project requires a specific database schema.
   - Open **`supa-migration.sql`** in the root directory.
   - Run the entire SQL script in your Supabase **SQL Editor**.
   - This creates tables, RLS policies, indexes, and full-text search triggers.

4. **Generate Types (Optional but Recommended)**:

   ```bash
   npm run db:types
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🧪 Seeding Data (Performance Test)

To generate 10,000+ tickets for performance testing:

```bash
# Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY
npx ts-node src/scripts/seed.ts
```

## 📂 Project Structure

- `src/app`: App Router Pages & Layouts.
- `src/components`: UI Components (Tickets, Auth, Common).
- `src/lib/actions`: Server Actions (Backend Logic).
- `src/hooks`: Realtime Hooks.
- `src/contexts`: Global Contexts (Organization).
- `supa-migration.sql`: Database Schema.
- `ENGINEERING_NOTES.md`: Design decisions and trade-offs.

## 🔑 Security & Architecture

- **RLS**: Row-Level Security policies isolate data by `org_id`.
- **Service Role**: Only used server-side for generating invitations or administration.
- **Realtime**: Channels subscribed via `tickets:org_id=eq.{id}` to prevent leaks.

---

Built with ❤️ by Antigravity.
