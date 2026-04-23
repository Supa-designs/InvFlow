<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# InvFlow AI Agent Rules

When assisting with the `invflow` workspace, agents **must** adhere strictly to the following parameters:

## 1. Environment & Execution
- **Mandatory Package Manager**: Always use `bun` and `bunx`. Never suggest or run `npm`, `yarn`, or `pnpm`.
- **Knowledge Base Retrieval**: Always fetch external context via **Context7** (`mcp_context7`) for documentation on Next.js 16, Drizzle 0.45.2, or Clerk before assuming APIs.

## 2. Architecture & Code Structure
- **Repository Pattern**: Never write raw Drizzle queries inside Next.js Page components, Server Components, or React Server Actions directly. Use repositories defined in `src/features/[domain]/repositories/`.
- **Audit Logging**: Any Server Action that mutates state (inserts, updates, deletes) must leverage the `createAuditEntry` service explicitly.
- **Server Actions**: All mutations must go through `actionClient` (from `next-safe-action`) configured in `src/lib/safe-action.ts`. `actionClient` inherently checks for authentication and organization context.

## 3. Styling & Output
- **Tailwind V4**: Strictly abide by the theme variables existing in `globals.css`. Do not apply generic CSS strings or inline styles.
- **Strict TypeScript**: Emulate and adhere strictly to TypeScript configurations. Do not bypass errors with `any`.
