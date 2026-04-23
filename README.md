# InvFlow

InvFlow is a modern SaaS Multi-tenant Inventory Management System. It is the modernized successor to the legacy `lovableinv` application, built to handle advanced multitenancy, role-based access, and robust audit logging.

## Tech Stack

This project strictly enforces the following stack:
- **Framework**: Next.js 16.2 (App Router)
- **Database**: Neon (PostgreSQL) + Drizzle ORM (0.45.2)
- **Authentication**: Clerk (with Organizations for multitenancy)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Package Manager**: Bun (mandatory)
- **Forms & State**: TanStack Form, `nuqs` (URL state)
- **Server Actions**: `next-safe-action`

## Architecture

- **Multitenancy**: Handled with shared tables plus mandatory `tenant_id` scoping.
- **Repository Pattern**: ALL database interactions MUST go through dedicated repositories (e.g., `ProductRepository`) located inside specific feature modules.
- **Audit Logging**: Any write operation (create/update/delete) triggered from a Server Action must call `createAuditEntry` from the audit service to maintain system-wide history.
- **Modules**: Code is separated by functional domain in `/src/features/` (e.g., `products`, `categories`, `movements`).
- **Organizations**: Clerk Organizations is the source of truth for members, roles, and invitations.

## Developer Setup

1. **Install Dependencies** (Strictly use Bun):
   ```bash
   bun install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and populate Neon connection strings, Clerk publishable/secret keys, and any other required tokens (Upstash, Polar.sh, etc.).

3. **Database Migrations / Push**:
   ```bash
   bunx drizzle-kit push
   ```
   For a clean bootstrap you can also apply [`drizzle/0001_shared_tenant_model.sql`](/Users/fernan/Dev/turboinv/apps/invflow/drizzle/0001_shared_tenant_model.sql).

4. **Run Development Server**:
   ```bash
   bun dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Runtime Features

- `/members` uses a custom UI backed by Clerk Organizations APIs.
- `/audit` exposes the application audit log.
- `/settings` contains feature toggles, scanner setup, and the import module.
- `/api/lookup/isbn` uses Upstash Redis cache with Open Library and Google Books fallback.

## Design Guidelines

- Do not modify `globals.css` variable definitions unless changing core branding explicitly. Always use the predefined Tailwind CSS variable tokens.
- All forms should prefer robust Zod validation.

---
*Built with ❤️ and Next.js*
