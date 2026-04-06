# Weekly Release Digest

## Overview

This is a **Weekly Release Digest** application that helps Product Managers generate weekly product release summaries from Notion. The app allows users to browse releases by week, view them grouped by product, and export digests in Slack and Email formats.

The application follows a full-stack TypeScript architecture with a React frontend and Express backend. Data is sourced from a Notion database via the Notion REST API, with PostgreSQL available as a fallback/local store.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management
- **Styling:** Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations:** Framer Motion for UI transitions
- **Fonts:** Inter (body) and Space Grotesk (display/headings)
- **Build Tool:** Vite

**Key Frontend Structure:**
- `client/src/pages/` — Page components (`weekly-digest.tsx`, `tier-calculator.tsx`, `release-manager.tsx`, `gtm.tsx`)
- `client/src/components/digest/` — Domain-specific components (AppHeader, WeekPicker, ProductGroup, ReleaseCard, KanbanBoard, ReleaseDetailPanel, ExportDrawer)
- `client/src/components/layout/` — Layout components (AppLayout, Sidebar)
- `client/src/components/ui/` — Reusable shadcn/ui components
- `client/src/lib/` — Utilities, types, API helpers, and data formatting functions
- `client/src/hooks/` — Custom React hooks (toast, mobile detection)

**Key Pages:**
- **Weekly Digest** (`/`) — Main page with week picker, release list/board views, status and tier filters, and an export drawer for Slack/Email formats
- **EPD Tier Calculator** (`/epd/tier-calculator`) — Interactive decision tree to determine release tier (Tier 0-3 or Untiered) with YES/NO toggles, live recommendation, examples, and GTM owner info
- **EPD Release Manager** (`/epd/releases`) — CMS for creating/editing product releases with searchable/filterable table, slide-out form panel, customer segments, resources, and tier assignment. Releases created here appear in the Digest.
- **GTM** (`/gtm`) — Placeholder for the Go-To-Market module (coming soon)

**Navigation:**
- Collapsible left sidebar with Digest, EPD (expandable: Tier Calculator + Releases), and GTM sections
- Sidebar collapses from 200px to 60px icon-only mode with tooltips

**Path Aliases:**
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets` → `attached_assets/`

### Backend

- **Runtime:** Node.js with Express 5
- **Language:** TypeScript (compiled with tsx in dev, esbuild for production)
- **API Style:** RESTful JSON API under `/api/` prefix

**Key API Routes:**
- `GET /api/notion/releases` — List all releases from Notion database
- `POST /api/notion/releases` — Create a new release in Notion
- `GET /api/notion/pages/:pageId/content` — Fetch parsed page content (overview text blocks + media items) with in-memory cache (30-min TTL, refreshes when page last_edited_time changes)
- `GET /api/health` — Health check
- `GET /api/releases` — Legacy: List releases from PostgreSQL (optional `startDate`/`endDate` params)
- `GET /api/releases/:id` — Legacy: Get a single release by ID from PostgreSQL

**Server Structure:**
- `server/index.ts` — Express app setup, middleware, HTTP server creation
- `server/routes.ts` — API route registration
- `server/storage.ts` — Data access layer with `DatabaseStorage` class implementing `IStorage` interface
- `server/db.ts` — PostgreSQL connection pool and Drizzle ORM setup
- `server/vite.ts` — Vite dev server middleware for development
- `server/static.ts` — Static file serving for production builds

### Data Storage

- **Database:** PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM:** Drizzle ORM with `drizzle-zod` for schema validation
- **Schema Location:** `shared/schema.ts` (shared between frontend and backend)
- **Migrations:** Generated via `drizzle-kit push` (`npm run db:push`)

**Database Schema — `releases` table:**
| Column | Type | Notes |
|---|---|---|
| id | serial | Primary key |
| product | text | Product name / category (used for grouping) |
| release_name | text | Name of the release |
| notion_url | text | Link to Notion page |
| status | text | In Development, Coming Soon, Beta, Partially Released, Fully Released |
| release_date | text | Date string (yyyy-MM-dd format) |
| what | text | What the release is |
| why | text | Why it matters |
| knowledge_article_url | text | Optional URL |
| owner | text | Release owner (PM name) |
| description | text | Optional |
| context | text | Optional |
| scope | text | Optional |
| rollout_notes | text | Optional |
| prd_url | text | Optional |
| enablement_deck_url | text | Optional |
| video_url | text | Optional |
| image_urls | text[] | Optional array of image URLs |
| tier | text | Tier 0, Tier 1, Tier 2, Tier 3, or Untiered |
| who | text[] | Customer segments (e.g., All customers, Enterprise) |
| resources | jsonb | Array of {title, url, type} resource links |
| attachments | jsonb | Array of {id, name, url, type, size} file attachments |
| created_at | timestamp | Auto-set on creation |
| updated_at | timestamp | Auto-updated on modification |

### Shared Code

The `shared/` directory contains code used by both frontend and backend:
- `shared/schema.ts` — Drizzle table definitions, Zod insert schemas, and TypeScript types

### Build System

- **Development:** `npm run dev` runs the Express server with tsx, which sets up Vite as middleware for HMR
- **Production Build:** `npm run build` runs a custom build script that builds the client with Vite and the server with esbuild
- **Production Start:** `npm start` runs the compiled server from `dist/index.cjs`

### Design Decisions

1. **Date range filtering uses text comparison** — Release dates are stored as text strings in `yyyy-MM-dd` format, enabling simple string comparison for range queries via Drizzle's `gte`/`lte` operators.

2. **Storage interface pattern** — The `IStorage` interface in `server/storage.ts` abstracts the data layer, making it possible to swap implementations (e.g., for testing or switching data sources).

3. **Client-side export formatting** — Slack and Email digest formats are generated on the client side (`client/src/lib/mock-notion.ts`), keeping the export logic close to the UI.

4. **Dual view modes** — The digest supports both a list view (grouped by product with collapsible sections) and a Kanban board view (grouped by status).

## External Dependencies

### Required Services
- **Notion API** — Primary data source. The app fetches and creates releases via the Notion REST API (`server/notion.ts`). Requires `NOTION_TOKEN` and `NOTION_DATABASE_ID` secrets. API endpoints: `GET /api/notion/releases`, `POST /api/notion/releases`, `GET /api/health`.
- **PostgreSQL Database** — Available via `DATABASE_URL`. Used as fallback/local storage with Drizzle ORM. Legacy `/api/releases` endpoints still exist but the UI is wired to Notion.

### Notion Integration Status
- **Phase 0-2 (Complete):** Backend Notion integration with GET/POST/PATCH endpoints, field mapping, database ID normalization
- **Phase 3 (Complete):** UI wired to Notion data — Weekly Digest and Release Manager both fetch from Notion. Create and edit releases push to Notion. Overview section fetches page content (text + media) from linked Notion pages.
- **1:1 Field Mapping (Complete):** All fields map identically across Notion DB, Release Manager, and Weekly Digest:
  - Release Status, Release Date, Release Name, Product (multi-select), Brief Description, Why It Matters, Detailed Overview, Release Tier, Knowledge Article Link, Owner of Feature
  - No fields are required (matching Notion)
  - Release Name links to its Notion page across all views
  - Slack & Email exports use matching field labels
  - Detailed Overview is seeded from Notion page content blocks on first edit, then editable bidirectionally
  - Digest detail panel order: Brief Description → Why It Matters → Detailed Overview → Documentation & Resources
- **Known Limitations:** Release Status (Notion "status" type) and Owner of Feature (Notion "people" type) cannot be set via the Notion Pages API. Warnings are returned in POST/PATCH responses.

### Future/Planned Integrations
- **Slack** — Export format generation exists on the client; actual Slack posting is not yet implemented.
- **Email** — HTML email format generation exists on the client; actual email sending is not yet implemented.

### Key NPM Packages
- **drizzle-orm / drizzle-kit** — ORM and migration tooling for PostgreSQL
- **express** — HTTP server framework
- **@tanstack/react-query** — Server state management
- **wouter** — Client-side routing
- **framer-motion** — Animations
- **date-fns** — Date manipulation
- **shadcn/ui ecosystem** — Radix UI primitives, class-variance-authority, tailwind-merge, clsx
- **react-day-picker** — Calendar component
- **vaul** — Drawer component
- **zod / drizzle-zod** — Schema validation