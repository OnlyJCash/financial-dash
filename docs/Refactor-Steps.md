# FinDash — Refactor Steps

> **Goal**: Enhance performance, introduce reusable components, optimise DynamoDB queries, and enforce a clear separation between public and private areas.
>
> Every step below is derived from the expertise defined in the `.claude/agents` directory (`refactoring-specialist`, `architect-reviewer`, `nextjs-developer`, `frontend-developer`, `backend-developer`, `api-designer`, `typescript-pro`, `javascript-pro`, `ui-designer`, `qa-expert`, `penetration-tester`, `ad-security-reviewer`, `mobile-developer`) and cross-referenced against the current codebase.

---

## Table of Contents

1. [Project Structure Reorganisation](#1-project-structure-reorganisation)
2. [Public vs Private Area Separation](#2-public-vs-private-area-separation)
3. [Reusable Component Library](#3-reusable-component-library)
4. [DynamoDB Query Optimisation](#4-dynamodb-query-optimisation)
5. [Context & State Management Refactor](#5-context--state-management-refactor)
6. [Service Layer Consolidation](#6-service-layer-consolidation)
7. [Authentication & Security Hardening](#7-authentication--security-hardening)
8. [TypeScript Strict-Mode & Type Safety](#8-typescript-strict-mode--type-safety)
9. [Performance & Next.js Optimisation](#9-performance--nextjs-optimisation)
10. [Testing Strategy](#10-testing-strategy)
11. [UI/UX & Design System](#11-uiux--design-system)
12. [Dependency Cleanup](#12-dependency-cleanup)

---

## 1. Project Structure Reorganisation

**Agent sources**: `architect-reviewer`, `refactoring-specialist`, `nextjs-developer`

### Current State

```
src/
├── app/          ← pages + server actions mixed together
├── components/   ← only LayoutWrapper & Providers + empty reminder/
├── context/      ← AppContext (monolith) + AuthContext
├── lib/          ← dynamodb client + cognito config
├── service/      ← financial/ + reminder/
└── types/        ← single index.ts
```

### Target State

```
src/
├── app/
│   ├── (public)/              ← public route group (login, landing)
│   │   └── login/page.tsx
│   ├── (private)/             ← private route group (authenticated)
│   │   ├── layout.tsx         ← AuthGuard + Navbar + account blocker
│   │   ├── dashboard/page.tsx
│   │   ├── movements/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   └── report/page.tsx
│   ├── layout.tsx             ← root layout (providers, fonts)
│   └── globals.css
├── components/
│   ├── ui/                    ← reusable primitives
│   │   ├── StatCard.tsx
│   │   ├── CurrencyAmount.tsx
│   │   ├── EmptyState.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── LoadingSpinner.tsx
│   ├── movements/
│   │   ├── MovementTable.tsx
│   │   ├── MovementRow.tsx
│   │   ├── MovementFilters.tsx
│   │   └── MovementForm.tsx
│   ├── reminders/
│   │   ├── ReminderList.tsx
│   │   ├── ReminderItem.tsx
│   │   └── ReminderModal.tsx
│   ├── account/
│   │   ├── AccountSelector.tsx
│   │   ├── AccountBlocker.tsx
│   │   └── AccountForm.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── AuthGuard.tsx
│   └── Providers.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── AccountContext.tsx      ← extracted from AppContext
│   ├── MovementContext.tsx     ← extracted from AppContext
│   └── ReminderContext.tsx     ← extracted from AppContext
├── hooks/
│   ├── useCurrency.ts
│   ├── useMovements.ts
│   └── useReminders.ts
├── lib/
│   ├── dynamodb.ts
│   └── amplify.ts             ← single Amplify.configure call
├── server/
│   ├── actions/
│   │   ├── account.actions.ts
│   │   ├── movement.actions.ts
│   │   ├── reminder.actions.ts
│   │   └── label.actions.ts
│   └── queries/
│       ├── account.queries.ts
│       ├── movement.queries.ts
│       └── reminder.queries.ts
├── services/
│   ├── QuickFinancialReportService.ts
│   └── ReminderService.ts
├── types/
│   ├── account.ts
│   ├── movement.ts
│   ├── reminder.ts
│   ├── user.ts
│   └── index.ts               ← re-exports only
└── utils/
    ├── currency.ts
    ├── date.ts
    └── constants.ts
```

### Steps

1. Create the directory structure above.
2. Move files incrementally, updating imports after each batch.
3. Run `next build` after each move to verify zero regressions.

---

## 2. Public vs Private Area Separation

**Agent sources**: `architect-reviewer`, `penetration-tester`, `ad-security-reviewer`, `nextjs-developer`

### Current Problems

| Issue | File(s) |
|---|---|
| No route groups; login page separated only by `pathname` check in `LayoutWrapper.tsx` | `LayoutWrapper.tsx:48` |
| `Amplify.configure()` called **3 times** (layout, AuthContext, LayoutWrapper, login) | Multiple files |
| Auth guard is a client-side redirect — no server-side protection | `LayoutWrapper.tsx:27-37` |
| Dashboard page (`page.tsx` at root) is accessible without auth at the route level | `app/page.tsx` |

### Steps

**Step 2.1 — Create Route Groups**

```
app/
  (public)/
    login/page.tsx       ← no layout wrapping, no navbar
    layout.tsx           ← minimal layout (no auth providers)
  (private)/
    layout.tsx           ← AuthGuard + Navbar + Footer
    dashboard/page.tsx   ← current app/page.tsx
    movements/...
    report/...
```

**Step 2.2 — Server-Side Auth Guard via Middleware**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth token/session cookie
  const authToken = request.cookies.get('auth_token');
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

**Step 2.3 — Single Amplify Configuration**

- Create `src/lib/amplify.ts` — single source of `Amplify.configure()`.
- Remove `Amplify.configure()` from `AuthContext.tsx`, `LayoutWrapper.tsx`, `login/page.tsx`, and `cognito-users.tsx`.
- Delete `cognito-users.tsx`.
- Call it once in root `layout.tsx` or `Providers.tsx`.

**Step 2.4 — Private Layout**

Create `app/(private)/layout.tsx`:

```tsx
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar />
        <main className="flex-grow-1 py-4">{children}</main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
```

---

## 3. Reusable Component Library

**Agent sources**: `frontend-developer`, `ui-designer`, `refactoring-specialist`

### Current Problems

| Problem | Evidence |
|---|---|
| `getCurrencySymbol()` duplicated 4× | `page.tsx:30`, `movements/page.tsx:17`, `report/page.tsx:22`, `movements/new/page.tsx:122` |
| Movement table row rendered inline in 2 pages | `page.tsx:209-232`, `movements/page.tsx:141-194` |
| Stat cards (Balance, Monthly, Income, Expenses) are copy-pasted blocks | `page.tsx:73-113` |
| Reminder modal is 80+ lines embedded in dashboard page | `page.tsx:242-327` |
| Account form duplicated in `LayoutWrapper.tsx` | `LayoutWrapper.tsx:83-116` |
| No empty state component; each page does its own | Multiple files |
| Loading spinner duplicated | `LayoutWrapper.tsx:40-44` |

### Step 3.1 — Extract `useCurrency` Hook

```typescript
// src/hooks/useCurrency.ts
import { useApp } from '@/context/AppContext';

const CURRENCY_MAP: Record<string, string> = {
  EUR: '€', GBP: '£', USD: '$',
};

export function useCurrency() {
  const { activeAccount } = useApp();
  const symbol = CURRENCY_MAP[activeAccount?.currency ?? 'USD'] ?? '$';

  const format = (amount: number) => `${symbol}${Math.abs(amount).toFixed(2)}`;

  return { symbol, format };
}
```

### Step 3.2 — Extract UI Primitives

**`StatCard.tsx`** — Replaces 4 nearly identical blocks in dashboard:

```tsx
interface StatCardProps {
  title: string;
  value: string;
  variant: 'primary' | 'danger' | 'success';
}

export function StatCard({ title, value, variant }: StatCardProps) {
  return (
    <Card className={`h-100 bg-${variant} text-white shadow-sm`}>
      <Card.Body className="d-flex flex-column justify-content-center">
        <h6 className="text-white-50 text-uppercase fw-semibold mb-2">{title}</h6>
        <h2 className="display-5 fw-bold mb-0">{value}</h2>
      </Card.Body>
    </Card>
  );
}
```

**`CurrencyAmount.tsx`** — Replaces repeated amount display logic:

```tsx
interface CurrencyAmountProps {
  amount: number;
  showIcon?: boolean;
}

export function CurrencyAmount({ amount, showIcon = true }: CurrencyAmountProps) {
  const { format } = useCurrency();
  const isIncome = amount > 0;

  return (
    <span className={`fw-bold d-inline-flex align-items-center gap-1 ${isIncome ? 'text-success' : 'text-danger'}`}>
      {showIcon && (isIncome ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />)}
      {format(amount)}
    </span>
  );
}
```

**`EmptyState.tsx`**, **`PageHeader.tsx`**, **`LoadingSpinner.tsx`**, **`ConfirmDialog.tsx`** — follow the same pattern.

### Step 3.3 — Extract Domain Components

| Component | Extracted From | Reused In |
|---|---|---|
| `MovementTable` + `MovementRow` | `page.tsx` + `movements/page.tsx` | Dashboard, Movements list |
| `MovementFilters` | `movements/page.tsx:70-115` | Movements list |
| `MovementForm` | `movements/new/page.tsx:87-276` | New movement page |
| `ReminderList` + `ReminderItem` | `page.tsx:132-166` | Dashboard |
| `ReminderModal` | `page.tsx:242-327` | Dashboard |
| `AccountSelector` | `LayoutWrapper.tsx:159-196` | Navbar |
| `AccountBlocker` + `AccountForm` | `LayoutWrapper.tsx:68-149` | Private layout |
| `LabelCreator` | `movements/new/page.tsx:192-236` | New movement form |

### Step 3.4 — Dashboard Page After Refactor (example)

```tsx
export default function DashboardPage() {
  const { balance, movements, reminders } = useApp();
  const { format } = useCurrency();
  const { quickReport } = useQuickReport();

  return (
    <Container>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.username}!`} />

      <Row className="g-4 mb-4">
        <Col md={3}><StatCard title="Total Balance" value={format(balance)} variant="primary" /></Col>
        <Col md={3}><StatCard title="Monthly Balance" value={format(quickReport.monthlyBalance)} variant="primary" /></Col>
        <Col md={3}><StatCard title="Monthly Expenses" value={format(quickReport.totalExpenses)} variant="danger" /></Col>
        <Col md={3}><StatCard title="Monthly Income" value={format(quickReport.totalIncome)} variant="success" /></Col>
      </Row>

      <ReminderList reminders={reminders} />
      <MovementTable movements={movements.slice(0, 5)} compact />
    </Container>
  );
}
```

---

## 4. DynamoDB Query Optimisation

**Agent sources**: `backend-developer`, `api-designer`, `refactoring-specialist`

### Current Problems

| Problem | Impact |
|---|---|
| **All reads use `ScanCommand`** — full table scans on every page load | O(n) cost; expensive as data grows |
| `getAllMovements()` fetches ALL movements for ALL accounts, then filters client-side | Unnecessary data transfer + memory |
| `getAllReminders()` same issue | Same |
| No pagination — all items loaded at once | Poor UX and performance at scale |
| `QuickFinancialReportService` calls `getAllMovements()` to compute monthly totals | Redundant full scan |
| No GSI (Global Secondary Index) usage | Missing `accountId` index |

### Step 4.1 — Add Global Secondary Indexes (DynamoDB Console / IaC)

```
Table: financial_movements
  GSI: accountId-date-index
    Partition key: accountId (S)
    Sort key: date (S)

Table: financial_reminders
  GSI: accountId-dueDate-index
    Partition key: accountId (S)
    Sort key: dueDate (S)
```

### Step 4.2 — Replace Scans with Queries

```typescript
// src/server/queries/movement.queries.ts
'use server';

import { docClient } from '@/lib/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Movement } from '@/types';

const TABLE = 'financial_movements';
const GSI = 'accountId-date-index';

export async function getMovementsByAccount(
  accountId: string,
  options?: { startDate?: string; endDate?: string; limit?: number; lastKey?: Record<string, unknown> }
): Promise<{ items: Movement[]; lastKey?: Record<string, unknown> }> {
  const { startDate, endDate, limit = 50, lastKey } = options ?? {};

  let keyCondition = 'accountId = :accountId';
  const expressionValues: Record<string, unknown> = { ':accountId': accountId };

  if (startDate && endDate) {
    keyCondition += ' AND #date BETWEEN :start AND :end';
    expressionValues[':start'] = startDate;
    expressionValues[':end'] = endDate;
  }

  const { Items, LastEvaluatedKey } = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: expressionValues,
      ScanIndexForward: false, // newest first
      Limit: limit,
      ExclusiveStartKey: lastKey as Record<string, unknown> | undefined,
    })
  );

  return { items: (Items ?? []) as Movement[], lastKey: LastEvaluatedKey };
}
```

### Step 4.3 — Server-Side Monthly Report

Move `QuickFinancialReportService` logic into a server action that queries only the current month:

```typescript
// src/server/queries/report.queries.ts
'use server';

export async function getMonthlyReport(accountId: string): Promise<QuickFinancialReport> {
  const startDate = new Date();
  startDate.setDate(1);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

  const { items } = await getMovementsByAccount(accountId, {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    limit: 1000,
  });

  const totalIncome = items.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0);
  const totalExpenses = items.filter(m => m.amount < 0).reduce((s, m) => s + m.amount, 0);

  return { totalIncome, totalExpenses, monthlyBalance: totalIncome + totalExpenses };
}
```

### Step 4.4 — Add Pagination to Movements List

Update `MovementTable` to support infinite scroll or "Load More" using `lastKey` from DynamoDB.

### Step 4.5 — Separate Actions from Queries

Split `app/actions/dynamodb.ts` (145 lines, mixed reads and writes) into:

| File | Purpose |
|---|---|
| `server/actions/account.actions.ts` | `addAccount`, `deleteAccount` |
| `server/actions/movement.actions.ts` | `addMovement`, `deleteMovement` |
| `server/actions/reminder.actions.ts` | `addReminder`, `updateReminder`, `deleteReminder` |
| `server/actions/label.actions.ts` | `addLabel`, `deleteLabel` |
| `server/queries/account.queries.ts` | `getAccounts` (scan is OK — small table) |
| `server/queries/movement.queries.ts` | `getMovementsByAccount` (QueryCommand) |
| `server/queries/reminder.queries.ts` | `getRemindersByAccount` (QueryCommand) |

---

## 5. Context & State Management Refactor

**Agent sources**: `refactoring-specialist`, `architect-reviewer`, `frontend-developer`

### Current Problems

- `AppContext.tsx` is a **216-line monolith** managing accounts, movements, reminders, labels, and balance.
- All data is loaded at once on mount via `Promise.all` of 4 full-table scans.
- Every state update (e.g. adding a label) triggers re-render of the entire component tree.
- `new DefaultCreateReminderService()` is instantiated on every render (line 46).

### Steps

**Step 5.1 — Split into Focused Contexts**

| Context | Responsibilities |
|---|---|
| `AccountContext` | accounts list, activeAccountId, add/delete/switch |
| `MovementContext` | movements for active account, add/delete, balance |
| `ReminderContext` | reminders for active account, add/dismiss/delete |
| `LabelContext` | labels, add/delete |

**Step 5.2 — Lazy Load Per Account**

Only fetch movements/reminders when `activeAccountId` changes, using the new Query-based server actions. This eliminates the initial full-scan bottleneck.

**Step 5.3 — Use `useCallback` / `useMemo` Properly**

Wrap handler functions in `useCallback` and derived data in `useMemo` to prevent unnecessary re-renders. Currently `balance` (line 102) is recalculated on every render.

**Step 5.4 — Move Service Instantiation Out of Render**

```typescript
// Before (on every render)
const createReminderService = new DefaultCreateReminderService();

// After (module-level singleton)
const createReminderService = new DefaultCreateReminderService();
export function ReminderProvider({ children }: ...) { ... }
```

---

## 6. Service Layer Consolidation

**Agent sources**: `backend-developer`, `api-designer`, `refactoring-specialist`

### Current Problems

- `QuickFinancialReportService` calls `getAllMovements()` (full scan) then filters client-side.
- `CreateReminderService` imports `captureRejections` from `node:events` (unused import).
- Services instantiated with `new` on the client side but call server actions — confusing boundary.
- No interface-implementation separation beyond the same file.

### Steps

**Step 6.1 — Remove Unused Import**

Delete `import { captureRejections } from 'node:events'` from `CreateReminderService.ts`.

**Step 6.2 — Convert Services to Pure Server Actions**

Instead of class-based services called from the client, convert to server actions:

```typescript
// src/server/actions/reminder.actions.ts
'use server';

export async function createReminder(
  reminder: Omit<Reminder, 'id' | 'accountId'>,
  accountId: string
): Promise<void> {
  if (reminder.type === 'recurrent') {
    await createUpcomingReminders(reminder, accountId);
  } else {
    await dbAddReminder({ ...reminder, id: uuidv4(), accountId });
  }
}
```

**Step 6.3 — Consolidate Date Library**

The project uses both `moment` and `date-fns`. Standardise on **`date-fns`** (already imported) and remove `moment` to reduce bundle size (~230kB gzipped saving).

---

## 7. Authentication & Security Hardening

**Agent sources**: `penetration-tester`, `ad-security-reviewer`, `backend-developer`

### Current Problems

| Vulnerability | Location |
|---|---|
| Auth state stored in `localStorage` (XSS-accessible) | `AuthContext.tsx:46` |
| No server-side route protection | All routes |
| `Amplify.configure()` called 3+ times with `{ ssr: true }` | Multiple files |
| User role is hardcoded to `'admin'` | `AuthContext.tsx:44`, `LayoutWrapper.tsx:34` |
| No CSRF protection on server actions | `app/actions/dynamodb.ts` |
| `window.confirm()` for destructive actions | `movements/page.tsx:184` |

### Steps

1. **Add Next.js middleware** for server-side auth gating (see Step 2.2).
2. **Remove `localStorage` auth** — rely solely on Amplify/Cognito session.
3. **Single Amplify configuration** — call once in `Providers.tsx`.
4. **Add role-based access** — derive role from Cognito groups, not hardcoded.
5. **Add confirmation modals** instead of `window.confirm()`.
6. **Validate server action inputs** — add Zod schemas.

---

## 8. TypeScript Strict-Mode & Type Safety

**Agent sources**: `typescript-pro`, `javascript-pro`

### Steps

1. **Enable strict compiler flags** in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true
     }
   }
   ```
2. **Make `accountId` required** on `Movement` and `Reminder` types (remove `?`).
3. **Use discriminated unions** for reminder types:
   ```typescript
   type Reminder = OneTimeReminder | RecurrentReminder;
   ```
4. **Add Zod schemas** for server action input validation.
5. **Replace `as` type assertions** with proper type guards in DynamoDB responses.

---

## 9. Performance & Next.js Optimisation

**Agent sources**: `nextjs-developer`, `frontend-developer`, `javascript-pro`

### Steps

| Step | Detail |
|---|---|
| **9.1** Use Server Components | Dashboard stats, report chart — fetch data server-side, render without JS |
| **9.2** Streaming & Suspense | Wrap data-dependent sections in `<Suspense>` with skeleton loaders |
| **9.3** Remove `'use client'` where possible | `report/page.tsx` chart needs client, but the table could be server-rendered |
| **9.4** Dynamic imports for heavy libraries | `import dynamic from 'next/dynamic'` for `recharts` (~200kB) |
| **9.5** Image/font optimisation | Already using `next/font` — good. Add `next/image` if images are added |
| **9.6** Eliminate `moment.js` | Replace with `date-fns` (tree-shakeable); saves ~230kB |
| **9.7** Memoize expensive computations | `monthlyData` in report is already memoized — apply same to dashboard |
| **9.8** Add `loading.tsx` files | Next.js convention for route-level loading states |

---

## 10. Testing Strategy

**Agent sources**: `qa-expert`, `penetration-tester`, `frontend-developer`

### Steps

1. **Add Jest + React Testing Library** for unit/integration tests.
2. **Test reusable components** (`StatCard`, `CurrencyAmount`, `MovementRow`) in isolation.
3. **Test server actions** with mocked DynamoDB client.
4. **Test auth flows** — login, logout, expired session redirect.
5. **Add Playwright** for E2E tests covering:
   - Login → Dashboard → Add Movement → Verify in list
   - Account switching and data isolation
   - Reminder creation (one-time and recurrent)
6. **Target ≥80% coverage** on business logic (`services/`, `server/`, `context/`).

---

## 11. UI/UX & Design System

**Agent sources**: `ui-designer`, `frontend-developer`, `mobile-developer`

### Steps

1. **Create a design tokens file** (`src/styles/tokens.css`) for colours, spacing, shadows.
2. **Standardise card hover effects** — currently all cards hover (even stat cards), which can feel jarring.
3. **Add skeleton loaders** for data-loading states instead of a single spinner.
4. **Responsive improvements** — test on mobile; the 4-column stat row will stack poorly.
5. **Accessibility** — add `aria-label` to icon-only buttons (Trash, Dismiss), ensure colour contrast on badges.
6. **Dark mode support** — prepare CSS custom properties for a future toggle.

---

## 12. Dependency Cleanup

**Agent sources**: `javascript-pro`, `refactoring-specialist`

| Action | Package | Reason |
|---|---|---|
| **Remove** | `moment` | Replace with `date-fns` (already used). Saves ~230kB |
| **Remove** | `@tailwindcss/postcss`, `tailwindcss` | Not used — project uses Bootstrap + vanilla CSS |
| **Remove** | `postcss.config.mjs` | Only needed for Tailwind |
| **Keep** | `date-fns` | Tree-shakeable date library |
| **Keep** | `recharts` | Lazy-load via `next/dynamic` |
| **Audit** | `aws-amplify`, `@aws-amplify/ui-react` | Ensure single configuration call |

---

## Execution Order (Recommended)

| Phase | Steps | Risk | Effort |
|---|---|---|---|
| **Phase 1 — Quick Wins** | 6.1, 12, 3.1 | 🟢 Low | Small |
| **Phase 2 — Structure** | 1, 2 | 🟡 Medium | Medium |
| **Phase 3 — Components** | 3.2, 3.3, 3.4 | 🟡 Medium | Medium |
| **Phase 4 — Data Layer** | 4.1–4.5, 5 | 🔴 High | Large |
| **Phase 5 — Security** | 7 | 🔴 High | Medium |
| **Phase 6 — TypeScript** | 8 | 🟡 Medium | Medium |
| **Phase 7 — Performance** | 9 | 🟡 Medium | Medium |
| **Phase 8 — Testing** | 10 | 🟢 Low | Large |
| **Phase 9 — Polish** | 11 | 🟢 Low | Small |

> **Important**: After each phase, run `next build` and verify no regressions before proceeding.

---

## Verification Checklist

- [ ] `next build` succeeds with zero errors
- [ ] All pages render correctly (Dashboard, Movements, New Movement, Report, Login)
- [ ] Account switching correctly isolates data
- [ ] No `ScanCommand` remains for movements or reminders
- [ ] `moment` dependency removed from `package.json`
- [ ] No duplicate `Amplify.configure()` calls
- [ ] All reusable components have TypeScript props interfaces
- [ ] `getCurrencySymbol()` function removed from all pages (replaced by `useCurrency` hook)
- [ ] Public routes accessible without auth; private routes redirect to login
- [ ] Server actions validate inputs
