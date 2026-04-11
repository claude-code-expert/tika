# Technology Stack

**Analysis Date:** 2026-04-11

## Languages

**Primary:**
- TypeScript 5.7 - Full codebase (src/, app/)
- JavaScript (ES2017+) - Build configuration files

**Secondary:**
- JSX/TSX - React components

## Runtime

**Environment:**
- Node.js - Runtime (version specified via implicit Next.js requirements)

**Package Manager:**
- npm - Dependency management
- Lockfile: Present (package-lock.json)

## Frameworks

**Core:**
- Next.js 15.1.0 - React metaframework, API routes, routing, SSR/SSG
- React 19.0.0 - UI library for components
- React DOM 19.0.0 - React rendering to DOM

**Database:**
- Drizzle ORM 0.38.0 - Type-safe SQL query builder and migrations
- drizzle-kit 0.30.0 - Schema management and migration generation

**Authentication:**
- NextAuth.js 5.0.0-beta.30 - Session management and OAuth integration

**UI/Styling:**
- Tailwind CSS 4.0.0 - Utility-first CSS framework
- @tailwindcss/postcss 4.0.0 - PostCSS plugin for Tailwind
- Lucide React 0.577.0 - Icon library

**Drag & Drop:**
- @dnd-kit/core 6.3.0 - Headless drag-and-drop library
- @dnd-kit/sortable 10.0.0 - Sortable preset for dnd-kit
- @dnd-kit/utilities 3.2.2 - Utilities for dnd-kit
- react-grab 0.1.25 - Grab cursor component

**Data Fetching:**
- SWR 2.4.1 - React hooks for data fetching and caching

**Validation:**
- Zod 3.24.0 - TypeScript-first schema validation

**Testing:**
- Jest 29.7.0 - Test runner
- @testing-library/react 16.0.0 - React component testing utilities
- @testing-library/jest-dom 6.6.0 - DOM matchers for Jest
- @testing-library/user-event 14.5.0 - User interaction simulation
- @playwright/test 1.58.2 - End-to-end testing framework

**Build/Dev Tools:**
- TypeScript 5.7 - Static type checking
- ESLint 9.0.0 - Code linting (with Next.js config)
- Prettier 3.4.0 - Code formatting
- prettier-plugin-tailwindcss 0.6.0 - Tailwind class sorting for Prettier
- PostCSS 8.5.0 - CSS transformations
- ts-jest 29.2.0 - TypeScript support for Jest
- tsx 4.19.0 - TypeScript executor (for seed scripts)
- ts-node 10.9.2 - TypeScript Node runtime
- dotenv 17.2.3 - Environment variable loading

**Database Drivers:**
- pg 8.18.0 - PostgreSQL client for Node.js
- @vercel/postgres 0.10.0 - Vercel Postgres client wrapper

## Key Dependencies

**Critical:**
- drizzle-orm 0.38.0 - Core database abstraction; provides type safety and query builder for all DB operations
- next-auth 5.0.0-beta.30 - Authentication and session management; handles Google OAuth and user persistence
- next 15.1.0 - Application framework; enables API routes, SSR, and routing
- react 19.0.0 - UI rendering engine

**Infrastructure:**
- @vercel/postgres 0.10.0 - Connection pooling and authentication for Vercel Postgres
- pg 8.18.0 - PostgreSQL protocol implementation
- @dnd-kit/core 6.3.0 - Kanban board drag-and-drop functionality
- swr 2.4.1 - Client-side data fetching with caching and revalidation
- zod 3.24.0 - Runtime validation for API inputs and schema definitions

**Communications:**
- resend 6.9.3 - Email delivery service for invitations and notifications

**File Storage:**
- @vercel/blob 2.3.3 - File upload and storage service for ticket attachments

## Dev Dependencies

**Testing:**
- jest 29.7.0 - Test runner with jsdom environment
- jest-environment-jsdom 29.7.0 - DOM simulation for component tests
- @jest/globals 29.7.0 - Jest global types
- @testing-library/* - React component testing utilities
- @playwright/test 1.58.2 - End-to-end testing

**Type Definitions:**
- @types/node 22.0.0 - Node.js type definitions
- @types/react 19.0.0 - React type definitions
- @types/react-dom 19.0.0 - React DOM type definitions
- @types/pg 8.16.0 - PostgreSQL client type definitions

**Tooling:**
- drizzle-kit 0.30.0 - Database migration and schema management CLI
- ts-jest 29.2.0 - TypeScript preprocessor for Jest
- tsx 4.19.0 - TypeScript executor without compilation
- ts-node 10.9.2 - TypeScript execution in Node.js

## Configuration Files

- `package.json` - Project metadata, scripts, and dependencies
- `tsconfig.json` - TypeScript compiler options with path aliases (`@/*`, `@/app/*`, `@/shared/*`, `@/server/*`, `@/client/*`)
- `next.config.ts` - Next.js configuration (dev indicators disabled)
- `drizzle.config.ts` - Drizzle ORM configuration (schema, migrations dialect)
- `.prettierrc` - Prettier formatting rules (2 spaces, single quotes, Tailwind plugin)
- `eslint.config.mjs` - ESLint configuration (Next.js and TypeScript rules)
- `jest.config.ts` - Jest test runner configuration with jsdom environment
- `playwright.config.ts` - Playwright E2E test configuration (if exists)

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `POSTGRES_URL` | Yes | PostgreSQL connection string for Vercel Postgres (or Neon) |
| `NEXTAUTH_SECRET` | Yes | Secret key for NextAuth.js session encryption |
| `NEXTAUTH_URL` | Yes | Base URL for NextAuth callbacks (e.g., `https://tika.vercel.app` or `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID for authentication |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth 2.0 Client Secret for authentication |
| `NODE_ENV` | No | Execution environment: `development`, `production` (default: based on Next.js) |
| `CRON_SECRET` | Yes | Bearer token for securing cron job endpoints |
| `RESEND_API_KEY` | Yes | API key for Resend email service |
| `RESEND_FROM` | No | Email sender address (default: `Tika <onboarding@resend.dev>`) |
| `DATABASE_URL` | No | Alternative PostgreSQL URL (fallback if `POSTGRES_URL` not set) |

## Build & Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start development server on http://localhost:3000 |
| `build` | `next build` | Build for production |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint checks |
| `format` | `prettier --write .` | Format all files with Prettier |
| `test` | `jest` | Run Jest tests once |
| `test:watch` | `jest --watch` | Run Jest in watch mode |
| `test:coverage` | `jest --coverage` | Generate coverage report |
| `test:e2e` | `playwright test` | Run Playwright E2E tests |
| `test:e2e:ui` | `playwright test --ui` | Run E2E tests with UI |
| `test:e2e:report` | `playwright show-report` | Display E2E test report |
| `db:generate` | `drizzle-kit generate` | Generate migration files from schema changes |
| `db:migrate` | `drizzle-kit migrate` | Apply pending migrations |
| `db:push` | `drizzle-kit push` | Push schema directly without migrations |
| `db:studio` | `drizzle-kit studio` | Open Drizzle Studio GUI for DB inspection |
| `db:seed` | `tsx src/db/seed.ts` | Insert seed data into database |

## Platform Requirements

**Development:**
- Node.js (Latest LTS recommended for Next.js 15)
- npm or yarn
- PostgreSQL 12+ (local or via Vercel Postgres)
- Environment variables file (.env.local)

**Production:**
- Vercel (recommended) - native Next.js deployment
- PostgreSQL-compatible database (Vercel Postgres, Neon, AWS RDS, etc.)
- Proper environment secrets configured on platform

---

*Stack analysis: 2026-04-11*
