# Supactl Bugfixes & Issues Log

> **Internal Development Document** - Do not commit to repository
> This file tracks all bugfixes, known issues, and technical debt for the Supactl project.

---

## Table of Contents

1. [Completed Bugfixes](#completed-bugfixes)
2. [Known Issues & Technical Debt](#known-issues--technical-debt)
3. [Potential Security Issues](#potential-security-issues)
4. [Performance Concerns](#performance-concerns)
5. [Code Quality Issues](#code-quality-issues)

---

## Completed Bugfixes

### Session 1: Production-Ready Fixes (Priority: Critical)

#### 1. Security: CSP Policy Added
- **File**: `src-tauri/tauri.conf.json`
- **Issue**: No Content Security Policy - vulnerable to XSS attacks
- **Fix**: Added strict CSP configuration
- **Status**: ✅ Complete

#### 2. StatusBar: Hardcoded Connection State
- **File**: `src/components/shell/StatusBar.tsx`
- **Issue**: Connection status was hardcoded, not reading from stores
- **Fix**: Connected to `projectStore` and `schemaStore` for real state
- **Status**: ✅ Complete

#### 3. Font Import URLs
- **File**: `src/styles/globals.css`
- **Issue**: Incorrect Google Fonts import URLs (wrong syntax)
- **Fix**: Fixed to proper Geist Sans/Mono URLs with display=swap
- **Status**: ✅ Complete

#### 4. App.tsx: Missing Error Handling
- **File**: `src/App.tsx`
- **Issue**: Startup flow had no error handling for credential loading
- **Fix**: Added comprehensive error UI with retry/reconnect options, fixed stale closures with refs
- **Status**: ✅ Complete

#### 5. React 19 Import Cleanup
- **File**: `src/main.tsx`
- **Issue**: Unnecessary `import React` for JSX transform
- **Fix**: Removed default import, used named `StrictMode` import, added null check
- **Status**: ✅ Complete

#### 6. Reusable Button Component
- **File**: `src/components/ui/Button.tsx` (new)
- **Issue**: No standardized button component across app
- **Fix**: Created Button with variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading state, icon support
- **Status**: ✅ Complete

#### 7. Utility Functions
- **File**: `src/lib/utils.ts`
- **Issue**: Missing utility functions for class merging
- **Fix**: Added `cn()` (clsx + tailwind-merge), formatBytes, truncate, sleep, generateId
- **Dependencies**: Added `clsx` and `tailwind-merge`
- **Status**: ✅ Complete

#### 8. Store Type Exports
- **File**: `src/store/*.ts`
- **Issue**: Store interfaces not exported, reducing type safety
- **Fix**: Exported `ProjectState`, `SchemaState`, `TableInfo`, `UiState` with JSDoc
- **Status**: ✅ Complete

#### 9. Sidebar Collapse State
- **File**: `src/components/shell/Sidebar.tsx`
- **Issue**: `sidebarCollapsed` state in `uiStore` not being used
- **Fix**: Integrated `useUiStore` state, added toggle button, responsive width
- **Status**: ✅ Complete

---

### Session 3: Production Architecture & Security (Priority: Critical)

#### 20. Security: SQL Injection Prevention
- **File**: `src/lib/security.ts` (new)
- **Issue**: Table names interpolated directly into SQL queries (TableEditor.tsx)
- **Fix**: Created security utilities with `sanitizeTableName()`, `isValidPostgresIdentifier()`, reserved keyword blocking
- **Validation**: Tables validated against known schema before SQL execution
- **Tests**: 9 passing tests in `security.test.ts`
- **Status**: ✅ Complete

#### 21. Multi-Project Architecture
- **File**: `src/store/projectsStore.ts` (new), `src/lib/storage.ts`
- **Issue**: Single-project only design, no support for multiple projects
- **Fix**: Created new multi-project store with:
  - Project list with unique IDs, colors, metadata
  - Active project tracking
  - Automatic migration from legacy single-project storage
  - Persistent storage with zustand persist middleware
- **Status**: ✅ Complete

#### 22. Production Logging System
- **File**: `src/lib/logger.ts` (new)
- **Issue**: Console.log/console.error used throughout, not production-ready
- **Fix**: Created structured logging with:
  - Environment-aware output (dev vs production)
  - Log levels (debug, info, warn, error)
  - Context support for debugging
  - Buffer for recent log access
- **Status**: ✅ Complete

#### 23. Audit Logging System
- **File**: `src/lib/audit.ts` (new)
- **Issue**: No tracking of sensitive user operations
- **Fix**: Created audit logging for compliance:
  - Tracks USER_DELETE, USER_BAN, USER_UNBAN, PROJECT_CONNECT, PROJECT_DISCONNECT
  - Storage with rotation (max 1000 entries)
  - Export capability for compliance
  - Integrated into AuthUsers, Onboarding, Projects pages
- **Status**: ✅ Complete

#### 24. Toast Notification System
- **File**: `src/store/toastStore.ts`, `src/components/shell/ToastContainer.tsx`
- **Issue**: Native alert()/confirm() used - poor UX
- **Fix**: Created comprehensive toast system:
  - Types: success, error, warning, info
  - Auto-dismiss with configurable duration
  - Action buttons for confirmations
  - Replaced all native alerts in AuthUsers.tsx
- **Status**: ✅ Complete

#### 25. Request Caching & Deduplication
- **File**: `src/lib/cache.ts` (new)
- **Issue**: No request caching, duplicate API calls possible
- **Fix**: Created caching layer with:
  - Request deduplication (prevents simultaneous identical requests)
  - TTL-based caching (customizable per endpoint)
  - Pattern-based cache invalidation
  - React hooks for cached fetching
- **Status**: ✅ Complete

#### 26. Tooltip Component for UX
- **File**: `src/components/ui/Tooltip.tsx` (new)
- **Issue**: Disabled buttons show no explanation
- **Fix**: Created Tooltip and DisabledButtonWithTooltip components
- **Applied to**: TableEditor Insert Row, Filter, Sort buttons
- **Status**: ✅ Complete

#### 27. Legacy Store Migration
- **Files**: `src/pages/Onboarding.tsx`, `src/pages/Projects.tsx`, `src/pages/AuthUsers.tsx`
- **Issue**: Pages still using deprecated `projectStore` (single project)
- **Fix**: Migrated all pages to use `projectsStore`:
  - Onboarding: Uses `addProject()` instead of `setCredentials()`
  - Projects: Full multi-project UI with switch/remove functionality
  - AuthUsers: Uses `getActiveProject()` for credentials
- **Status**: ✅ Complete

#### 28. Testing Infrastructure
- **Files**: `vitest.config.ts`, `src/test/setup.ts`
- **Issue**: No testing framework configured
- **Fix**: Added Vitest + React Testing Library:
  - Tauri API mocks
  - Security utility tests (9 passing)
  - Coverage reporting with @vitest/coverage-v8
- **Scripts**: `pnpm test`, `pnpm test:coverage`
- **Status**: ✅ Complete

#### 29. Complete Legacy Store Migration
- **Files**: All pages migrated from `useProjectStore` to `useProjectsStore`
- **Pages Updated**:
  - `TableEditor.tsx` - Now uses `getActiveProject()` from projectsStore
  - `StorageBrowser.tsx` - Migrated with log import
  - `SqlEditor.tsx` - Migrated with log import
  - `RlsPolicyEditor.tsx` - Migrated, fixed error handling (removed incorrect `.catch()`)
  - `RealtimeListener.tsx` - Migrated with log import
  - `ProjectKeys.tsx` - Migrated
  - `MigrationsTracker.tsx` - Migrated with log import
  - `EdgeFunctionLogs.tsx` - Migrated with log import
  - `App.tsx` - Migrated startup flow to use `getProjects()` instead of `getCredentials()`
- **Status**: ✅ Complete

#### 30. RlsPolicyEditor Error Handling Fix
- **File**: `src/pages/RlsPolicyEditor.tsx`
- **Issue**: Using `.catch()` on Supabase RPC result (not a Promise)
- **Fix**: Replaced with proper try-catch blocks
- **Status**: ✅ Complete

---

### Session 2: Mock Data Removal (Priority: High)

#### 10. EdgeFunctionLogs: Logs Never Fetched
- **File**: `src/pages/EdgeFunctionLogs.tsx`
- **Issue**: `logs` array always empty - no useEffect to fetch logs
- **Fix**: Added `useEffect` to call `client.getEdgeFunctionLogs(activeFunc)` when function selected
- **Transformation**: Maps Management API response to UI `LogEntry` interface
- **Status**: ✅ Complete

#### 11. SqlEditor: Fake Query Plan
- **File**: `src/pages/SqlEditor.tsx`
- **Issue**: Hardcoded explain plan and memory usage stats ("Seq Scan on users...", "1.2 MB / 128 MB")
- **Fix**: Replaced with actual query statistics (rows returned, execution time, column count)
- **Note**: Added disclaimer about EXPLAIN plans requiring direct database access
- **Status**: ✅ Complete

#### 12. StatusBar: Hardcoded Postgres Version
- **File**: `src/components/shell/StatusBar.tsx`
- **Issue**: Always showed "Postgres 15.x" regardless of actual database
- **Fix**: Added `useEffect` to fetch `SELECT version()` via RPC when connected, parses version string dynamically
- **Fallback**: Shows "PostgreSQL" if RPC unavailable
- **Status**: ✅ Complete

#### 13. AuthUsers: Fake "Active Now" Count
- **File**: `src/pages/AuthUsers.tsx`
- **Issue**: Stats panel showed "Active Now: 0" hardcoded
- **Fix**: Added `useEffect` to fetch count from `auth.sessions` table
- **Fallback**: Shows 0 if no access to sessions table
- **Status**: ✅ Complete

#### 14. TableEditor: Fake Index Info
- **File**: `src/pages/TableEditor.tsx`
- **Issue**: Always showed `{tableName}_pkey` as primary key (guessed)
- **Fix**: Queries `pg_indexes` for real index information, fetches row count from `pg_stat_user_tables`
- **Features**: Shows index type badges (primary key, unique), real row count with formatting
- **Fallback**: Infers PK from 'id' column if RPC unavailable
- **Status**: ✅ Complete

#### 15. StorageBrowser: Fake Public URL
- **File**: `src/pages/StorageBrowser.tsx`
- **Issue**: Showed placeholder URL when not connected: `https://xyz.supabase.co/...`
- **Fix**: Only renders public URL section when `projectUrl` exists, removed fallback
- **Improvement**: Added click-to-copy handler with actual URL
- **Status**: ✅ Complete

#### 16. MigrationsTracker: Fake Execution Time
- **File**: `src/pages/MigrationsTracker.tsx`
- **Issue**: `executionTimeMs: 0` hardcoded, fake row counts ("0 / +(computed)")
- **Fix**: Marked as unavailable in data transform, UI shows informative banner about Management API limitations
- **Status**: ✅ Complete

#### 17. ProjectKeys: Placeholder URL
- **File**: `src/pages/ProjectKeys.tsx`
- **Issue**: Showed `https://xxxxxx.supabase.co` when not connected
- **Fix**: Shows "Not connected" text, disabled copy button, added helper text
- **Status**: ✅ Complete

#### 18. RealtimeListener: Mock Subscription UI
- **File**: `src/pages/RealtimeListener.tsx`
- **Issue**: Hardcoded "Active Subscription Mock" card visible regardless of state
- **Fix**: Conditional UI - shows actual channel config when connected, empty state when disconnected
- **Status**: ✅ Complete

---

## Known Issues & Technical Debt

### Critical Issues Requiring Attention

#### TODO-001: Unimplemented Button Actions
- **Files**: Multiple pages
- **Issue**: Many buttons have no actual functionality (just visual)
- **Examples**:
  - `TableEditor.tsx`: "Insert Row", "Filter", "Sort" buttons - ✅ Now show toast with "coming soon" message
  - `StorageBrowser.tsx`: "New Bucket", "New Folder", "Upload Files" buttons
  - `MigrationsTracker.tsx`: "New Migration", "Rollback" buttons
  - `RlsPolicyEditor.tsx`: "New Policy", "Save Policy" buttons
- **Impact**: App appears broken to users
- **Recommendation**: Implement or disable with tooltips explaining "Coming soon"
- **Status**: Partially Complete (TableEditor done)

#### TODO-002: Management API Error Handling
- **Files**: `src/pages/EdgeFunctionLogs.tsx`, `MigrationsTracker.tsx`
- **Issue**: No retry logic for Management API failures
- **Impact**: Users must refresh app if initial API calls fail
- **Recommendation**: Add retry with exponential backoff

#### TODO-003: SQL Injection Vulnerabilities ✅ FIXED
- **Files**: `src/pages/TableEditor.tsx`
- **Issue**: Dynamic SQL strings with template literals
- **Fix**: Implemented `sanitizeTableName()` validation against known schema
- **Status**: ✅ Complete

### Medium Priority Issues

#### FIXME-001: console.log Statements in Production ✅ FIXED
- **Files**: `App.tsx`, `TableEditor.tsx`, `AuthUsers.tsx`, `schemaStore.ts`
- **Issue**: 15+ console.log/error/warn statements
- **Fix**: Created `src/lib/logger.ts` and migrated all console calls to use it
- **Status**: ✅ Complete

#### FIXME-002: Native alert()/confirm() Usage ✅ FIXED
- **File**: `src/pages/AuthUsers.tsx`
- **Issue**: Using native `alert()` and `confirm()` for user interactions
- **Fix**: Created toast notification system, replaced all native alerts
- **Status**: ✅ Complete

#### FIXME-003: Disabled Buttons Without Feedback ✅ FIXED
- **Files**: Throughout app
- **Issue**: Many buttons disabled with no explanation
- **Fix**: Created `Tooltip` and `DisabledButtonWithTooltip` components
- **Applied**: TableEditor Insert Row, Filter, Sort buttons now have tooltips
- **Status**: ✅ Complete

### Code Quality Issues

#### CQ-001: Type Safety Concerns
- **Files**: Multiple
- **Issues**:
  - `any[]` used for user data in `AuthUsers.tsx`
  - `as any` casting in `StorageBrowser.tsx`
  - Missing proper error types in catch blocks
- **Impact**: Reduced TypeScript benefits, potential runtime errors

#### CQ-002: Large Component Files
- **Files**: `AuthUsers.tsx` (340+ lines), `RlsPolicyEditor.tsx` (424 lines)
- **Issue**: Components doing too much (data fetching, UI, business logic)
- **Recommendation**: Split into smaller components, custom hooks for data fetching

#### CQ-003: Duplicate Error Handling Patterns
- **Pattern**: Repeated try-catch blocks with similar error setting
- **Files**: Most data fetching components
- **Recommendation**: Create reusable data fetching hooks

#### CQ-004: Missing Loading States
- **Files**: `SqlEditor.tsx` (query execution has spinner but limited)
- **Issue**: Some operations lack visual feedback
- **Recommendation**: Audit all async operations for loading states

### Performance Concerns

#### PERF-001: Inefficient Re-renders
- **Files**: Components using Zustand without selectors
- **Issue**: Some components subscribe to entire store causing unnecessary re-renders
- **Example**: `useProjectStore()` vs `useProjectStore(state => state.projectUrl)`
- **Recommendation**: Audit store subscriptions, use selectors

#### PERF-002: No Request Deduplication ✅ FIXED
- **Files**: Data fetching components
- **Issue**: Rapid navigation can trigger multiple simultaneous identical requests
- **Fix**: Created `src/lib/cache.ts` with request deduplication and TTL caching
- **Status**: ✅ Complete

#### PERF-003: Unlimited Event Buffer
- **File**: `src/pages/RealtimeListener.tsx`
- **Issue**: Events array grows without bound (slice to 100, but 100 may be too high)
- **Recommendation**: Consider virtual scrolling or pagination for large event lists

---

## Potential Security Issues

### SEC-001: Credentials in Memory
- **Files**: `src/store/projectStore.ts`
- **Issue**: Service key stored in Zustand (JavaScript memory)
- **Risk**: Memory dump could expose credentials
- **Mitigation**: Tauri secure storage used for persistence, but memory exposure remains
- **Recommendation**: Consider Tauri's secure storage API for runtime as well

### SEC-002: Clipboard Exposure
- **Files**: `ProjectKeys.tsx`, `StorageBrowser.tsx`
- **Issue**: Service keys copied to system clipboard
- **Risk**: Clipboard history tools may retain sensitive data
- **Recommendation**: Add warning about clipboard history, clear after timeout

### SEC-003: SQL RPC Exposure
- **Files**: Multiple using `exec_sql` RPC
- **Issue**: If `exec_sql` function exists, any authenticated user can execute arbitrary SQL
- **Risk**: Data exfiltration, modification
- **Note**: Requires service_role key which should be closely guarded
- **Recommendation**: Document this risk prominently, consider read-only alternatives

---

## Architecture Recommendations

### Future Improvements

1. **Error Boundary Components**: Add React error boundaries for graceful crash handling
2. **Toast Notification System**: Replace native alerts with custom toast system
3. **Loading Skeletons**: Add skeleton screens for better perceived performance
4. **Virtual Scrolling**: For large tables in TableEditor
5. **Request Caching**: Cache schema/frequently accessed data
6. **Offline Support**: Basic offline detection and messaging
7. **Audit Logging**: Log sensitive operations (user deletion, etc.)

### Testing Needs

1. **Unit Tests**: Utility functions, store logic
2. **Integration Tests**: Data fetching, API integration
3. **E2E Tests**: Critical user flows (connect, browse tables, view users)
4. **Security Tests**: Verify credential handling, XSS prevention

---

## File Structure Issues

### Redundant Files
- **context.md** and **claude-auto-learn.md**: Listed in .gitignore but tracked? (verify)

### Missing Files
- **README**: Could benefit from architecture decision records (ADRs)
- **CONTRIBUTING.md**: For open-source contributors
- **CHANGELOG.md**: Track version changes

---

## Dependency Updates Needed

### Outdated/Vulnerable
- Check for `npm audit` vulnerabilities regularly
- Keep Tauri plugins updated for security patches

### Missing Dev Dependencies
- Consider adding:
  - `eslint` with stricter rules
  - `prettier` for consistent formatting
  - `husky` for pre-commit hooks
  - `vitest` for testing

---

*Last Updated: 2026-04-14*
*Next Review: When major feature added or before release*
