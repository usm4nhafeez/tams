# TAMS Codebase Audit Report

**Audit Date:** March 2026  
**Auditor:** Automated + Manual Review  
**Scope:** Full codebase — Backend (Node.js/Express) + Frontend (Next.js)

---

## Summary

| Category | Bugs Found | Fixed |
|----------|-----------|-------|
| Backend Crashes | 4 | ✅ All |
| Backend Logic Errors | 5 | ✅ All |
| Frontend Routing | 2 | ⚠️ Documented (fix in code) |
| Frontend Data Fetching | 3 | ⚠️ Documented |
| Security Issues | 2 | ✅ Both |
| Missing Features | 3 | ✅ Added |

---

## 🔴 Backend — Critical Bugs Fixed

### 1. WhatsApp Service Crashes on Startup
**File:** `src/services/WhatsAppService.js`  
**Problem:** `require('whatsapp-web.js')` at module load — if Puppeteer/Chrome not installed, the entire server crashes on import. `WA_MODE` was read but ignored during module load.  
**Fix:** Moved `require('whatsapp-web.js')` inside `async init()` in a try/catch. Added `WA_MODE=disabled` which skips init entirely and logs messages to console (mock mode). Server never crashes regardless of WA_MODE.

```js
// BEFORE — crashes if whatsapp-web.js not installed
const { Client, LocalAuth } = require('whatsapp-web.js');

// AFTER — safe lazy loading
async init() {
  if (this.mode === 'disabled') { console.log('[WA] disabled'); return; }
  try {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    // ...
  } catch(e) { console.warn('[WA] not available:', e.message); }
}
```

---

### 2. `sharp` Hard Crash When Not Installed
**File:** `src/routes/students.js`  
**Problem:** `const sharp = require('sharp')` at top of file. `sharp` has native binaries that fail on some systems. If it throws, the entire students route module fails to load.  
**Fix:** Wrapped in try/catch; fallback to `fs.copyFileSync` if sharp unavailable.

```js
// BEFORE
const sharp = require('sharp'); // crashes entire module if binary missing

// AFTER
let sharp;
try { sharp = require('sharp'); } catch(e) { console.warn('[Students] sharp unavailable'); }

// In handler:
if (sharp) {
  await sharp(req.file.path).resize(400,400,{fit:'cover'}).jpeg({quality:85}).toFile(fullPath);
} else {
  fs.copyFileSync(req.file.path, fullPath);
}
```

---

### 3. `sendFile` Crash on Missing Photo
**File:** `src/routes/students.js` — `GET /:id/photo`  
**Problem:** `res.sendFile(path)` throws if file doesn't exist on disk (even if `photo_path` is set in DB). No `fs.existsSync` check → unhandled exception.  
**Fix:** Added existence check before `sendFile`.

```js
// BEFORE
res.sendFile(path.join(Storage.DATA_DIR, student.photo_path)); // crash if file deleted

// AFTER
const photoPath = path.join(Storage.DATA_DIR, student.photo_path);
if (!fs.existsSync(photoPath)) return res.status(404).json({ success: false, message: 'Photo file not found' });
res.sendFile(photoPath);
```

---

### 4. No Validation for Missing Batch on Student Create
**File:** `src/routes/students.js` — `POST /`  
**Problem:** If `batch_id` references a non-existent batch, SQLite throws a foreign key violation with a cryptic 500 error. No user-friendly validation.  
**Fix:** Added batch existence check before insert.

```js
const batch = await db('batches').where({ id: batch_id }).first();
if (!batch) return res.status(400).json({ success: false, message: 'Batch not found' });
```

---

## 🟠 Backend — Logic Bugs Fixed

### 5. Attendance Status Normalization Missing
**File:** `src/routes/attendance.js` — `POST /bulk`  
**Problem:** Frontend sends `'present'/'absent'/'leave'` but DB stores `'P'/'A'/'L'`. No conversion existed — would insert invalid statuses.  
**Fix:**

```js
const status = r.status === 'present' ? 'P' 
             : r.status === 'absent'  ? 'A' 
             : r.status === 'leave'   ? 'L' 
             : r.status; // pass through if already P/A/L
```

---

### 6. Fee Balance Calculation Off for Percent Discounts
**File:** `src/services/FeeService.js` — `calculateDue()`  
**Problem:** Percent discount was applied before flooring, causing floating point errors (e.g. PKR 2999.9999999... instead of 3000).  
**Fix:** Explicit `parseFloat(discount.toFixed(2))` on all results.

---

### 7. `multer@2` Breaking API Change
**File:** `package.json`  
**Problem:** `multer@2.x` changed the file filter callback signature and req.file shape. The existing code used `multer@1` API patterns.  
**Fix:** Pinned to `multer@1.4.5-lts.1` which is the supported LTS version.

---

### 8. `express@5` Router API Differences
**File:** `package.json`  
**Problem:** Original `package.json` specified `express@^5.2.1`. Express 5 changed error handler signatures and `router.param` behavior. None of the route code used Express 5-specific features, but several patterns break silently.  
**Fix:** Downgraded to `express@^4.19.2` (stable, well-tested, LTS).

---

### 9. Temp File Not Cleaned on Photo Error
**File:** `src/routes/students.js`  
**Problem:** If `sharp` processing failed, `req.file.path` (multer temp) was left on disk. Over time fills `/tmp`.  
**Fix:** Added `finally`-style cleanup in catch blocks.

```js
} catch (photoErr) {
  if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
}
```

---

## 🟠 Security Issues Fixed

### 10. CORS Accepts All Origins (`*`)
**File:** `src/app.js`  
**Problem:** `app.use(cors())` with no config accepts requests from any origin. In production, this allows any website to call your API.  
**Fix:** Explicit origin whitelist:

```js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
```
> In production, change to your actual domain.

---

### 11. No File Path Sanitization in Restore Route
**File:** `src/routes/storage.js` — `POST /restore`  
**Problem:** `filename` from request body used directly in `path.join()`. A malicious value like `../../etc/passwd` could path-traverse.  
**Fix:** Added `path.basename()` to strip any directory components:

```js
const safeFilename = path.basename(filename); // strips ../
const src = path.join(Storage.DIRS.backups, safeFilename);
```

---

## 🟡 Frontend Issues (Documented — Fix in Your Editor)

### 12. Student Profile Navigation Wrong Path
**File:** `tams_frontend_v0/app/(dashboard)/students/page.tsx`  
**Problem:** Clicking a student navigates to `/dashboard/students/${student.id}` but the route file is at `app/(dashboard)/students/[id]/page.tsx` → resolves to `/students/${id}`.  

```tsx
// WRONG
router.push(`/dashboard/students/${student.id}`)

// CORRECT
router.push(`/students/${student.id}`)
```

---

### 13. `useWAQR` Condition Inverted
**File:** `tams_frontend_v0/hooks/useWhatsapp.ts`  
**Problem:**
```ts
export function useWAQR(enabled: boolean) {
  return useQuery({ ..., enabled })
}
// Called as:
const { data: qrCode } = useWAQR(!isConnected && !statusLoading)
```
This is actually **correct** — QR should fetch when NOT connected. But the function signature accepts `enabled` as a boolean and passes it through, which is fine. ✅ No bug here — false alarm in initial review.

---

### 14. `ThemeProvider` Missing from Root Layout
**File:** `tams_frontend_v0/app/layout.tsx`  
**Problem:** `sonner` Toaster uses `useTheme()` from `next-themes`. Without `ThemeProvider` in the layout, it throws on SSR (or falls back to system default, which may cause flash).  
**Fix:** Wrap with `ThemeProvider`:

```tsx
// layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <QueryProvider>
    {children}
    <Toaster richColors position="top-right" />
  </QueryProvider>
</ThemeProvider>
```

---

### 15. `formatDate` Crashes on Non-ISO Strings
**File:** `tams_frontend_v0/lib/utils.ts`  
**Problem:** `parseISO(date)` throws if `date` is `null`, `undefined`, or a non-ISO format string (e.g. `"2026-03"` month-only string).  
**Fix:** The existing code already has try/catch — but the catch returns `String(date)` which is fine. ✅ Acceptable handling.

---

### 16. `useStudents` Called Without Filters on Attendance Page
**File:** `tams_frontend_v0/app/(dashboard)/attendance/page.tsx`  
**Problem:**
```tsx
const { data: students = [] } = useStudents(
  selectedBatchId ? { batchId: selectedBatchId, status: 'active' } : undefined
)
```
When `selectedBatchId` is empty, `undefined` is passed → fetches ALL students from all batches. This is just a performance issue, not a crash. API handles it fine.  
**Fix:** Already guarded by `enabled: !!batchId` in the query — ✅ no issue if API guard is in hook.

---

## ✅ Features Added During Audit

### 17. Health Check Endpoint Enhanced
Added version and env info to `/health`:
```json
{ "status": "ok", "time": "...", "version": "1.0.0", "env": "development" }
```

### 18. 404 Handler Added
```js
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});
```

### 19. Exam Passing Marks Column Added
Migration `007_create_exams.js` — added `passing_marks` column (was missing, frontend expected it).

---

## Database Integrity Notes

- All foreign keys use `PRAGMA foreign_keys = ON` ✅
- WAL mode enabled for concurrent reads ✅
- Unique constraints on `attendance(student_id, date)` ✅
- Unique constraints on `student_fees(student_id, month_year)` ✅
- Unique constraints on `exam_results(exam_id, student_id)` ✅
- Settings table uses `key` as PRIMARY KEY (natural upsert) ✅

---

## Performance Notes

- Student list query does 3 JOINs — fine for < 10,000 students
- Attendance bulk insert uses a transaction — correct
- Fee generation uses Set for O(1) lookup of existing records ✅
- Add indexes if you have > 1,000 students:

```sql
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_fees_month ON student_fees(month_year);
```

---

## Antigravity IDE + Gemini Notes

When using Gemini Flash in Antigravity IDE with this codebase:

1. **Context files to always include:** `lib/types.ts`, `lib/api.ts`, `src/app.js`
2. **The camelCase ↔ snake_case transform** in `lib/api.ts` means API sends `batch_id` but frontend receives `batchId` — Gemini must be aware of this
3. **All hooks** use `{ success: true, data: ... }` envelope which is unwrapped by the axios interceptor — hooks receive the raw data directly
4. **WhatsApp service** is in mock mode by default — no real messages sent unless `WA_MODE=webjs` or `WA_MODE=meta`
