# Multi-Tenant Ticket System

A comprehensive, production-ready SaaS application built with **Next.js 15**, **Supabase**, and **Tailwind CSS**. This system features strict multi-tenancy, real-time updates, role-based access control (RBAC), and a modern UI.

## 🚀 Key Features

*   **🏢 Multi-Tenancy**: Data is strictly isolated by Organization ID (`org_id`). Users can belong to multiple organizations with different roles.
*   **🔒 Secure Authentication**: Powered by Supabase Auth with robust middleware protection.
*   **👥 Role-Based Access Control (RBAC)**:
    *   **Owner**: Full access, including deleting the organization and managing all members.
    *   **Admin**: Manage members and tickets, but cannot delete the org.
    *   **Member**: Create and edit tickets.
    *   **Viewer**: Read-only access to tickets.
*   **⚡ Real-time Updates**: Live ticket lists and activity feeds using Supabase Realtime channels.
*   **🎫 Ticket Management**:
    *   Create, Read, Update, Delete (CRUD) tickets.
    *   Assign priority/severity (Critical, High, Medium, Low, Trivial).
    *   Status tracking (Open, Investigating, Mitigated, Resolved).
    *   Infinite scrolling and server-side filtering.
*   **💬 Activity Timeline**: Track status changes and history for every ticket.
*   **📨 Invitation System**: Secure email-based invitations with expiry and token validation.
*   **🛡️ Audit Logging**: Immutable logs for security-critical actions (e.g., role changes, ticket deletions).

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components**: [Headless UI](https://headlessui.com/), [Heroicons](https://heroicons.com/)
*   **State/Data Fetching**: Server Actions, React Hooks, Supabase Realtime
*   **Utilities**: `zod` (validation), `date-fns` (dates), `clsx` (class names)

## 📋 Prerequisites

*   [Node.js](https://nodejs.org/) (v18.17 or higher)
*   [npm](https://www.npmjs.com/) (v9 or higher)
*   A [Supabase](https://supabase.com/) project (Free tier works great)

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd multi-tenant-ass
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a file named `.env.local` in the root directory and add your Supabase credentials:

```env
# Connect to your Supabase project
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for server-side administration (invites, user management)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database Setup (Critical)
You must apply the database schema to your Supabase project.

1.  Go to the `supabase/migrations` folder.
2.  Copy the content of the SQL files (in order) and run them in your Supabase **SQL Editor**.
    *   `20240101000000_init_schema.sql` (Creates tables, enums, basic RLS)
    *   `20240102000000_add_invites.sql` (Adds invitation system)
    *   `20240103000000_update_rbac_policies.sql` (Refines security policies)
3.  **Alternatively**, if you have the Supabase CLI installed:
    ```bash
    npx supabase db push
    ```

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

A brief overview of the codebase organization:

```
src/
├── app/                 # Next.js App Router (Pages & Layouts)
│   ├── (public)/        # Public routes (Landing page)
│   ├── auth/            # Auth pages (Login, Signup, Callback)
│   └── orgs/[orgId]/    # Protected Organization Dashboard
│       ├── tickets/     # Ticket management
│       ├── members/     # Member management
│       └── settings/    # Organization settings
├── components/          # Reusable UI components
│   ├── tickets/         # Ticket-specific components (Card, List, Filters)
│   └── ui/              # Generic UI elements (Button, Input, Modal)
├── hooks/               # Custom React Hooks
│   ├── useRealtimeTickets.ts  # Live ticket updates
│   └── useInfiniteScroll.ts   # Infinite loading logic
├── lib/                 # Core logic and utilities
│   ├── actions/         # Server Actions (Backend logic)
│   ├── supabase/        # Supabase client clients (Server & Client)
│   └── permissions/     # Permission checking utility
└── types/               # TypeScript definitions
    └── database.types.ts # Generated database types
```

## 📖 Usage Guide

### Getting Started
1.  **Sign Up**: Create an account on the `/auth/signup` page.
2.  **Create Organization**: You will be prompted to create an organization (e.g., "Acme Corp"). You become the **Owner**.
3.  **Dashboard**: You will be redirected to your organization's dashboard.

### Managing Tickets
1.  **Create**: Click "**+ New Ticket**", fill in the title, description, and severity.
2.  **View**: Click on any ticket card to see details.
3.  **Search**: Use the search bar to filter by title or description. Filters are URL-shareable.
4.  **Real-time**: Open the app in two different tabs/browsers. Changes in one are instantly reflected in the other.

### Managing Team Members
1.  Go to the **Members** tab.
2.  **Invite**: Enter an email address and select a role (e.g., Member, Admin).
3.  **Accept Invite**: The user receives a link (simulated in this demo, check the console or pending invites list for the link).
4.  **Roles**:
    *   **Owners** can remove anyone.
    *   **Admins** can invite/remove members.

### Organization Settings
*   **Owners** can update the organization name.
*   **Danger Zone**: Owners can delete the entire organization (and all its data).

## 🛡️ Security Model

This project uses **Row Level Security (RLS)** in PostgreSQL to ensure strict data isolation.
*   **`organizations`**: Users can only see organizations they are a member of.
*   **`tickets`**: Users can only see tickets where `org_id` matches their membership.
*   **`user_roles`**: Only Admins/Owners can access role data.

## 🐛 Troubleshooting

*   **"Table not found"**: Ensure you ran all migration scripts in Supabase.
*   **"Permission denied"**: Check if your RLS policies are active and you are logged in with the correct user.
*   **Realtime not working**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct.
