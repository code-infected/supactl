<p align="center">
  <img src="https://supabase.com/brand-assets/supabase-logo-icon.png" alt="Supactl Logo" width="64" />
</p>

<h1 align="center">Supactl</h1>

<p align="center">
  <strong>The native desktop client for Supabase.</strong><br/>
  Manage your database, auth, storage, edge functions, and more — without a browser.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-3ECF8E?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/Tauri-v2-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-v3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-Private-red?style=flat-square" alt="License" />
</p>

---

## What is Supactl?

Supactl is a **native desktop application** for [Supabase](https://supabase.com) — the open source Firebase alternative built on Postgres. It brings the full Supabase experience to the desktop: faster, native, offline-capable, and better designed.

**Elevator pitch:** *"Supabase Studio, but native."*

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Desktop shell | **Tauri v2** | Rust backend, minimal Rust needed |
| Frontend | **React 19 + TypeScript** | Strict mode, no `any` types |
| Styling | **Tailwind CSS v3** | Dark theme only ("Digital Obsidian") |
| Fonts | **Geist Sans + Geist Mono** | Via Google Fonts CDN |
| Icons | **Material Symbols Outlined** | Google icon font |
| DB / Auth / Storage | **@supabase/supabase-js** | Full Supabase SDK |
| Management API | **Supabase REST API** | Project listing, API keys |
| Local storage | **Tauri Store Plugin** | Encrypted credential storage |
| State management | **Zustand** | Lightweight, zero boilerplate |
| Routing | **React Router v7** | Client-side navigation |
| SQL editor | **CodeMirror 6** | SQL language support + custom theme |
| Package manager | **pnpm** | Fast, disk-efficient |

---

## Design System — "Digital Obsidian"

Supactl follows a bespoke dark-mode design system designed in [Google Stitch](https://stitch.googleapis.com). Every decision is intentional. 

For the full color palette, typography guidelines, and design principles, see the [**DESIGN_SYSTEM.md**](./DESIGN_SYSTEM.md) file.

### Signature Element — Green glow
The single accent element across the app is a subtle primary green inner/outer glow applied to key CTAs and connection signals.

```css
box-shadow: 0 0 8px rgba(62, 207, 142, 0.4);
```

---

## Screens

### Phase 1 — MVP

| Screen | Route | Description |
|--------|-------|-------------|
| **Onboarding** | `/connect` | 3-step flow: Welcome → Connect Project → Success |
| **Table Editor** | `/tables/:tableName` | Spreadsheet view with schema browser + info panel |
| **SQL Editor** | `/sql` | CodeMirror editor + tabbed queries + results table |
| **Auth Users** | `/auth` | User management with provider badges + stats |
| **Project Keys** | `/settings/keys` | API keys, URLs, JWT settings, system health |

### Phase 2 — Core

| Screen | Route | Description |
|--------|-------|-------------|
| **Storage Browser** | `/storage` | Bucket list + file grid/list + detail panel |
| **RLS Policies** | `/rls` | Policy cards + creation form per table |
| **Edge Function Logs** | `/logs` | Dense log stream + function stats + sparkline |
| **Realtime Listener** | `/realtime` | Live event monitor + subscription manager |
| **Migrations Tracker** | `/migrations` | Timeline view + SQL diff viewer |

### Phase 3+ — Planned

- Cron jobs viewer
- Database queues
- Webhooks manager
- Index advisor
- Vault secrets manager
- AI SQL assistant (⌘K)
- ERD visual schema viewer
- Multi-project workspaces

---

## Project Structure

```
supactl/
├── src/                          # React frontend
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Router setup + AppLayout shell
│   ├── components/
│   │   ├── shell/
│   │   │   ├── TopNav.tsx        # Fixed top navigation bar (40px)
│   │   │   ├── Sidebar.tsx       # Fixed left sidebar (220px)
│   │   │   └── StatusBar.tsx     # Fixed bottom status bar (24px)
│   │   ├── ui/                   # Reusable UI primitives (planned)
│   │   └── shared/               # Shared composite components (planned)
│   ├── pages/
│   │   ├── Onboarding.tsx        # 3-step connect flow
│   │   ├── TableEditor.tsx       # Spreadsheet table view
│   │   ├── SqlEditor.tsx         # SQL editor + results
│   │   ├── AuthUsers.tsx         # Auth user management
│   │   ├── ProjectKeys.tsx       # API keys / settings
│   │   ├── StorageBrowser.tsx    # File/bucket manager
│   │   ├── RlsPolicyEditor.tsx   # RLS policy manager
│   │   ├── EdgeFunctionLogs.tsx  # Edge function log viewer
│   │   ├── RealtimeListener.tsx  # Live event monitor
│   │   └── MigrationsTracker.tsx # Migration history + diff
│   ├── store/
│   │   ├── projectStore.ts       # Active project, connection state
│   │   ├── schemaStore.ts        # Cached schema/tables
│   │   └── uiStore.ts            # Command palette, sidebar state
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client factory
│   │   └── storage.ts            # Tauri local credential storage
│   └── styles/
│       └── globals.css           # Tailwind base + scrollbar hide
├── src-tauri/                    # Tauri Rust backend
│   ├── tauri.conf.json           # App config (1280x800, no decorations)
│   ├── Cargo.toml                # Rust deps: store, opener, window-state
│   └── src/
│       ├── main.rs               # Binary entry point
│       └── lib.rs                # Plugin registration (minimal)
├── tailwind.config.ts            # Design system tokens
├── vite.config.ts                # Vite dev server config
├── tsconfig.json                 # TypeScript strict config
├── package.json                  # Dependencies + scripts
└── contex.md                     # Design & architecture Bible
```

---

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8
- **Rust** (via [rustup](https://rustup.rs))
- **Visual Studio Build Tools** (Windows) or **Xcode CLI** (macOS)

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd supactl
pnpm install
```

### 2. Run in Development Mode

```bash
# Frontend only (browser preview)
pnpm run dev

# Full Tauri desktop app
pnpm run tauri dev
```

### 3. Build for Production

```bash
pnpm run tauri build
```

The compiled binary will be in `src-tauri/target/release/`.

---

## Tauri Configuration

```json
{
  "app": {
    "windows": [{
      "title": "Supactl",
      "width": 1280,
      "height": 800,
      "minWidth": 900,
      "minHeight": 600,
      "decorations": false,
      "transparent": false
    }]
  }
}
```

- **`decorations: false`** — Custom title bar with macOS-style traffic light buttons
- **Window state persistence** — Remembers size/position between sessions via `tauri-plugin-window-state`
- **Credential storage** — Encrypted local storage via `tauri-plugin-store`

---

## Data Flow

```
User opens app
  → Check Tauri store for saved credentials
  → If none: redirect to /connect (Onboarding)
  → If found: create Supabase client → test connection
    → Success: load schema → redirect to /tables
    → Fail: show disconnected state + retry

Supabase client:
  createClient(projectUrl, serviceRoleKey)
  — service role key used for desktop admin (bypasses RLS)

All DB queries:
  supabase.from(table).select() / .insert() / .update() / .delete()
  OR raw SQL via supabase.rpc()

Credential storage:
  Tauri store plugin → { projectUrl, serviceRoleKey }
  Never sent anywhere — stays on device
```

---

## State Management

Three Zustand stores manage all application state:

| Store | Purpose | Key Fields |
|-------|---------|------------|
| `projectStore` | Connection & credentials | `projectUrl`, `serviceKey`, `isConnected`, `isConnecting` |
| `schemaStore` | Cached database schema | `tables[]`, `isLoading` |
| `uiStore` | UI toggles | `commandPaletteOpen`, `sidebarCollapsed` |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.101.0 | Supabase SDK |
| `zustand` | ^5.0.12 | State management |
| `react-router-dom` | ^7.13.2 | Client-side routing |
| `@uiw/react-codemirror` | ^4.25.9 | CodeMirror React wrapper |
| `@codemirror/lang-sql` | ^6.10.0 | SQL syntax support |
| `@tauri-apps/plugin-store` | ^2.4.2 | Encrypted local storage |
| `@tauri-apps/plugin-window-state` | ~2.4.1 | Window position persistence |

---

## Development Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 0 — Project Setup | 🟡 In Progress | ~70% |
| Phase 1 — Shell + Onboarding | 🟡 In Progress | ~50% |
| Phase 2 — Core Screens | 🟢 Mostly Done | ~85% |
| Phase 3 — Advanced Screens | 🟢 Mostly Done | ~85% |
| Phase 4 — Polish | 🔴 Not Started | ~10% |

### What's Working

- ✅ Full Tauri v2 desktop shell with custom title bar
- ✅ All 10 screens rendered with correct layouts
- ✅ Onboarding flow (connect → test → save credentials)
- ✅ Real Supabase data fetching (tables, auth users, storage)
- ✅ SQL editor with CodeMirror, multi-tab support
- ✅ Realtime event simulation with live counters
- ✅ RLS policy editor with command-colored cards
- ✅ Migration timeline with diff viewer
- ✅ TypeScript compiles with 0 errors

### What's Remaining

- 🔴 Reusable UI component library (Button, Badge, Input, Card, etc.)
- 🔴 Command Palette (⌘K)
- 🔴 Custom hooks (useConnection, useSchema, useProject)
- 🔴 Management API integration
- 🔴 Custom CodeMirror theme matching design system
- 🔴 Disconnected state UI (red banner, dimmed content)
- 🔴 Global keyboard shortcuts
- 🔴 Empty states on all screens

---

## Naming Conventions

- **Components:** PascalCase (`TableEditor.tsx`)
- **Hooks:** camelCase with `use` prefix (`useSchema.ts`)
- **Stores:** camelCase with `Store` suffix (`projectStore.ts`)
- **CSS:** Tailwind utility classes only (no custom CSS except `globals.css`)
- **Constants:** Centralized in `lib/constants.ts`
- **Types:** No `any` — proper TypeScript interfaces for all props

---

## Security

- Service role key stored locally via Tauri's encrypted store plugin
- Credentials never logged, transmitted, or exposed to the renderer process URL
- `persistSession: false` prevents auth token leakage
- `user-select: none` for desktop-native feel (text selection enabled in inputs)

---

## Designer

Designed by **Athul Nair M** using [Google Stitch](https://stitch.googleapis.com).

Design system codename: **"Digital Obsidian"** — a philosophy of deep, monochromatic layering that feels carved from a single block of dark glass.

---

<p align="center">
  <sub>Built with Tauri v2 · React · TypeScript · Tailwind CSS</sub><br/>
  <sub>Project codename: Supactl · v0.1.0 · March 2026</sub>
</p>
