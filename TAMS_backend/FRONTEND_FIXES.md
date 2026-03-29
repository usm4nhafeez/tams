# TAMS Frontend — Required Fixes

Apply these changes to `tams_frontend_v0` before running.

---

## Fix 1 — Add ThemeProvider to Root Layout

**File:** `app/layout.tsx`

The `Toaster` component uses `useTheme()` which requires a `ThemeProvider` ancestor.

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/theme-provider'  // ADD THIS
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'TAMS - Tips Academy Management System',
  description: 'Academy management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## Fix 2 — Student Navigation Path

**File:** `app/(dashboard)/students/page.tsx`

Two places use the wrong URL path. Find and replace:

```tsx
// WRONG (both occurrences)
router.push(`/dashboard/students/${student.id}`)

// CORRECT
router.push(`/students/${student.id}`)
```

---

## Fix 3 — Add .env.local

Create `tams_frontend_v0/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_STATIC_URL=http://localhost:5001/static
```

---

## Fix 4 — Attendance Bulk POST Body Format

**File:** `hooks/useAttendance.ts`

The existing hook sends `attendance` key but backend expects `records`:

```ts
// CURRENT (wrong key name)
mutationFn: ({ batchId, date, records }) =>
  api.post('/attendance/bulk', {
    batch_id: batchId,
    date,
    attendance: records,  // ← WRONG
  })

// FIX
mutationFn: ({ batchId, date, records }) =>
  api.post('/attendance/bulk', {
    batch_id: batchId,
    date,
    records: records.map(r => ({    // ← CORRECT, also normalize status
      student_id: r.studentId,
      status: r.status,
    })),
  })
```

---

## Fix 5 — WA Status Type Mismatch

**File:** `app/(dashboard)/dashboard/page.tsx` and `app/(dashboard)/whatsapp/page.tsx`

The `WhatsAppStatus` type uses `status: WhatsAppConnectionStatus` (`'disconnected' | 'connecting' | 'connected' | 'error'`) but backend now also returns `'disabled'`. Add it to the type:

**File:** `lib/types.ts`

```ts
// CURRENT
export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

// FIX
export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'disabled'
```

---

## Fix 6 — Exam Type Field Name Mismatch

**File:** `hooks/useExams.ts` — `useExams()` filter

Backend uses `exam_type` param but hook sends `type` which gets auto-converted to `type` (no snake_case needed since it's already a single word):

```ts
// In useExams hook
const params: Record<string, string> = {}
if (filters?.batchId) params.batch_id = filters.batchId    // manual snake_case needed
if (filters?.type && filters.type !== 'all') params.exam_type = filters.type  // ← must be exam_type
if (filters?.month) params.month = filters.month

// Current code uses 'type' but backend route checks 'exam_type'
// The camelCase→snake_case auto-transform won't help here because 'type' is a single word
```

---

## Fix 7 — Student Profile Tabs Data Loading

**File:** `app/(dashboard)/students/[id]/page.tsx`

The `useExams` hook is called with `{ batchId: student?.batchId }` but `student` may be undefined on first render, causing `batchId: undefined`. This triggers a query with no batch filter (fetches all exams).

```tsx
// CURRENT (fetches all exams when student not loaded)
const { data: exams = [] } = useExams({ batchId: student?.batchId })

// FIX — add enabled guard
const { data: exams = [] } = useExams(
  student?.batchId ? { batchId: student.batchId } : undefined
)
```

---

## Summary Checklist

- [ ] `app/layout.tsx` — add ThemeProvider
- [ ] `app/(dashboard)/students/page.tsx` — fix 2× navigation paths
- [ ] `tams_frontend_v0/.env.local` — create with API URLs
- [ ] `hooks/useAttendance.ts` — fix `attendance` → `records` key, add studentId mapping
- [ ] `lib/types.ts` — add `'disabled'` to WhatsAppConnectionStatus
- [ ] `hooks/useExams.ts` — fix `type` → `exam_type` param
- [ ] `app/(dashboard)/students/[id]/page.tsx` — add `enabled` guard on useExams

---

## Install Required Packages

Some packages referenced in the frontend but not in `package.json`:

```bash
cd tams_frontend_v0
npm install qrcode.react  # Already in package.json ✅
```

All packages in `package.json` should be present. If `npm install` fails for any package:

```bash
npm install --legacy-peer-deps  # Try this flag
```
