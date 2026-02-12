# Multi-Tenant Realtime Ops Console

A production-ready multi-tenant ticket management system with real-time collaboration, built with **Next.js 15**, **Supabase**, and **TypeScript**.

## 🚀 Features

- **🏢 Multi-Tenancy** - Strict data isolation by organization with RLS
- **🔐 Authentication** - Secure auth with Supabase Auth
- **👥 Role-Based Access Control** - Owner, Admin, Member, Viewer roles
- **⚡ Real-time Collaboration** - Live updates with Supabase Realtime
- **🎫 Ticket Management** - Full CRUD with status tracking and priorities
- **💬 Activity Timeline** - Comments, status changes, audit trail
- **📎 File Attachments** - Secure file uploads with Supabase Storage
- **🔍 Search & Filters** - Full-text search with pagination
- **📊 Audit Logging** - Immutable audit trail for compliance
- **📨 Invite System** - Token-based invitations with expiry

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18.17 or higher ([Download](https://nodejs.org/))
- **npm** v9 or higher (comes with Node.js)
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **Git** (for cloning the repository)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/imehsans/multi-tenent-ass
cd multi-tenent-ass
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Supabase client, and UI libraries.

### 3. Set Up Supabase Project

1. **Create a new project** at [supabase.com](https://supabase.com/dashboard)
2. **Note your project credentials**:
   - Project URL (found in Settings > API)
   - Anon/Public key (found in Settings > API)
   - Service role key (found in Settings > API - keep this secret!)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# Server-side Administration (Keep Secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Rate Limiting (Production recommended)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Important Notes:**
- Never commit `.env.local` to version control
- The service role key bypasses RLS - use carefully
- Get all keys from your Supabase project dashboard

### 5. Database Setup

You need to apply database migrations to set up tables, RLS policies, and functions.

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration files in order:

**Step 1:** Run `supabase/migrations/20240101000000_init_schema.sql`
- Creates core tables (organizations, users, tickets, etc.)
- Sets up RLS policies
- Creates helper functions

**Step 2:** Run `supabase/migrations/20240102000000_add_invites.sql`
- Adds invitation system
- Creates invite validation functions

**Step 3:** Run `supabase/migrations/20240103000000_update_rbac_policies.sql`
- Updates role-based access policies
- Refines permissions

#### Option B: Using Supabase CLI

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

### 6. (Optional) Seed Test Data

Generate 10,000+ test tickets for performance testing:

```bash
npm run db:seed
```

This creates:
- 3 organizations
- 60 users with various roles
- 10,500 tickets with realistic distributions
- Timeline events and comments

**Login credentials:** Email from console output, Password: `password123`

See [`scripts/SEED_README.md`](scripts/SEED_README.md) for details.

### 7. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Usage

### First-Time Setup

1. **Navigate to** `http://localhost:3000`
2. **Click "Sign Up"** and create an account
3. **Create your first organization** (you'll be the Owner)
4. **You're ready!** Start creating tickets and inviting team members

### Managing Tickets

**Create a Ticket:**
1. Click **"+ New Ticket"**
2. Fill in title, description, severity (1-5)
3. Optionally assign to a team member
4. Click **"Create Ticket"**

**Search & Filter:**
- Use the search bar for full-text search
- Filter by status (Open, Investigating, Mitigated, Resolved)
- Filter by severity (1-5)
- All filters update the URL for easy sharing

**Real-time Updates:**
- Open the app in multiple tabs/browsers
- Changes appear instantly for all viewers
- See who's viewing each ticket (presence indicators)

### Managing Team Members

**Invite Users:**
1. Go to **Members** tab
2. Enter email and select role:
   - **Owner** - Full control (delete org, manage all)
   - **Admin** - Manage members, tickets (cannot delete org)
   - **Member** - Create/edit tickets and comments
   - **Viewer** - Read-only access
3. User receives invite link (check console or pending invites list)
4. Invites expire after 7 days

**Role Permissions:**

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View tickets | ✅ | ✅ | ✅ | ✅ |
| Create tickets | ✅ | ✅ | ✅ | ❌ |
| Edit tickets | ✅ | ✅ | ✅ | ❌ |
| Delete tickets | ✅ | ✅ | ❌ | ❌ |
| Add comments | ✅ | ✅ | ✅ | ❌ |
| Upload files | ✅ | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅ | ❌ | ❌ |
| Delete org | ✅ | ❌ | ❌ | ❌ |

### Organization Settings

**Update Organization:**
1. Go to **Settings** tab
2. Update organization name
3. Click **"Save Changes"**

**Delete Organization** (Owner only):
1. Go to **Settings** > Danger Zone
2. Click **"Delete Organization"**
3. Confirm deletion
4. **Warning:** This permanently deletes all tickets, members, and data

## 📂 Project Structure

```
multi-tenant-ass/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/         # Login page
│   │   │   ├── signup/        # Sign up page
│   │   │   └── callback/      # Auth callback
│   │   └── orgs/              # Organization routes
│   │       ├── [orgId]/       # Dynamic org routes
│   │       │   ├── tickets/   # Ticket management
│   │       │   ├── members/   # Member management
│   │       │   ├── settings/  # Org settings
│   │       │   └── audit/     # Audit logs
│   │       ├── new/           # Create organization
│   │       └── page.tsx       # Organizations list
│   ├── components/             # React components
│   │   ├── tickets/           # Ticket-specific components
│   │   ├── ui/                # Reusable UI components
│   │   └── ...                # Other components
│   ├── hooks/                  # Custom React hooks
│   │   ├── useRealtimeTickets.ts
│   │   ├── usePermissions.tsx
│   │   └── ...
│   ├── lib/                    # Core utilities
│   │   ├── actions/           # Server Actions
│   │   │   ├── tickets.ts
│   │   │   ├── organizations.ts
│   │   │   └── ...
│   │   ├── supabase/          # Supabase clients
│   │   │   ├── server.ts      # Server-side client
│   │   │   └── client.ts      # Client-side client
│   │   ├── auth.ts            # Auth helpers
│   │   └── permissions.ts     # Permission checks
│   ├── types/                  # TypeScript types
│   │   └── database.types.ts  # Generated DB types
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── migrations/             # Database migrations
├── scripts/
│   ├── seed.ts                # Seed script
│   └── SEED_README.md         # Seed documentation
├── .env.local                  # Environment variables (create this)
├── package.json                # Dependencies & scripts
└── README.md                   # This file
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking

# Database
npm run db:types     # Generate TypeScript types from DB
npm run db:migrate   # Push migrations to Supabase
npm run db:seed      # Seed database with test data
```

## 🔒 Security

### Row Level Security (RLS)

All tables use PostgreSQL RLS to ensure:
- Users only see data from their organizations
- Roles are enforced at the database level
- No cross-organization data leaks

### Authentication

- Session-based auth with HTTP-only cookies
- Middleware protects all `/orgs/*` routes
- Service role key never exposed to client

### Audit Logging

- Insert-only audit logs (no updates/deletes)
- Tracks all critical actions
- Admins/Owners can view org audit logs

## 🐛 Troubleshooting

### "Table does not exist" Error

**Solution:** Run all migration files in the Supabase SQL Editor:
1. `20240101000000_init_schema.sql`
2. `20240102000000_add_invites.sql`
3. `20240103000000_update_rbac_policies.sql`

### "Permission denied for table" Error

**Solution:** Check RLS policies are enabled and you're logged in with correct user.

### Real-time Updates Not Working

**Causes:**
- Incorrect Supabase credentials in `.env.local`
- RLS policies blocking subscriptions
- Network/firewall blocking WebSocket connections

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Check browser console for errors
4. Ensure RLS policies allow SELECT for your user

### Build Errors on Vercel

**Solution:** Ensure environment variables are set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Slow Performance with Large Datasets

**Solution:** 
- Ensure all database indexes are created (check migration files)
- Use cursor pagination instead of offset
- Enable connection pooling in Supabase

## 📚 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Headless UI](https://headlessui.com/), [Heroicons](https://heroicons.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Date Formatting:** [date-fns](https://date-fns.org/)

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [Supabase Documentation](https://supabase.com/docs)
3. Check the [Next.js Documentation](https://nextjs.org/docs)
