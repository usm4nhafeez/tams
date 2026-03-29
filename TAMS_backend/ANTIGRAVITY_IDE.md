# Antigravity IDE Setup — TAMS with Gemini Flash

Setup guide for developing TAMS in Antigravity IDE using Gemini 3 Flash.

---

## Project Configuration

### Recommended Context Files

Always include these files in your AI context window for best results:

**Core context (always):**
- `TAMS_backend/src/app.js` — route map
- `tams_frontend_v0/lib/types.ts` — all TypeScript types
- `tams_frontend_v0/lib/api.ts` — API client & key transform
- `TAMS_backend/SCHEMA.md` — database tables reference

**When working on a specific feature, add:**
- The relevant route file (e.g. `src/routes/fees.js`)
- The relevant hook file (e.g. `hooks/useFees.ts`)
- The relevant page file (e.g. `app/(dashboard)/fees/page.tsx`)

---

## Key Architecture Facts for Gemini

Tell Gemini these facts at the start of each session:

```
This is a Next.js 16 + Express 4 + SQLite academy management system.

KEY FACTS:
1. API responses are always { success: true, data: ... } or { success: false, message: "..." }
2. The axios interceptor in lib/api.ts automatically:
   - Unwraps the "data" field (hooks receive data directly, not the wrapper)
   - Converts snake_case keys to camelCase on responses
   - Converts camelCase keys to snake_case on requests
3. So API sends: { batch_id, monthly_fee } but frontend receives: { batchId, monthlyFee }
4. WhatsApp is in mock mode (WA_MODE=disabled) — messages log to console only
5. SQLite uses WAL mode, all foreign keys enforced
6. Multer handles photo uploads (max 5MB, JPG/PNG/WebP only)
7. PDFs are generated server-side with PDFKit and served via /static route
```

---

## Frontend Prompt Templates

### Adding a new page

```
Add a [FEATURE] page to TAMS at app/(dashboard)/[route]/page.tsx.

Context:
- API endpoint: GET /api/v1/[endpoint]  
- TypeScript types are in lib/types.ts
- Use the existing useQuery pattern from hooks/useBatches.ts as reference
- Use shadcn/ui components (Table, Card, Button, etc.)
- Use PageHeader, EmptyState, LoadingTable, StatCard from components/shared/
- Sidebar link is in components/layout/Sidebar.tsx

The page should:
1. [requirement 1]
2. [requirement 2]
```

### Adding a new API hook

```
Add a React Query hook for [FEATURE] in hooks/use[Feature].ts.

Pattern to follow (from hooks/useFees.ts):
- useQuery for GET requests
- useMutation for POST/PUT/PATCH/DELETE
- invalidateQueries on mutation success
- toast.success() on success
- The API interceptor handles snake_case conversion automatically
- Hook receives camelCase data, sends camelCase (auto-converted to snake_case)

Endpoint: [METHOD] /api/v1/[path]
TypeScript types needed: [types from lib/types.ts]
```

### Fixing a backend route

```
Fix the [ROUTE] route in TAMS_backend/src/routes/[file].js.

Database uses Knex.js with better-sqlite3.
Pattern: async (req, res, next) => { try { ... } catch(err) { next(err); } }
Error handler is in middleware/errorHandler.js.
Always return { success: true, data: ... } or { success: false, message: "..." }

Issue: [describe the bug]
```

---

## Common Development Tasks

### Add a new setting key

1. Add to seed file `src/db/seeds/01_demo_data.js`
2. Add to Settings page `app/(dashboard)/settings/page.tsx` as a `<SettingField>`
3. Use in backend via: `await db('settings').where({ key: 'your_key' }).first()`

### Add a new student field

1. Create new migration: `src/db/migrations/20260xxx_add_field.js`
   ```js
   exports.up = knex => knex.schema.alterTable('students', t => {
     t.string('new_field').defaultTo('');
   });
   exports.down = knex => knex.schema.alterTable('students', t => {
     t.dropColumn('new_field');
   });
   ```
2. Run: `npx knex migrate:latest`
3. Add to `Student` type in `lib/types.ts`
4. Add form field in `components/students/student-form.tsx`

### Add a new fee payment mode

1. Add to `PaymentMode` union in `lib/types.ts`
2. Add `<SelectItem>` in fee payment dialogs
3. No backend change needed (stored as-is)

---

## Debugging Tips for Gemini Flash

### "API call returns 404"
Ask Gemini to check:
1. Route is registered in `src/app.js`
2. HTTP method matches (GET vs POST)
3. URL path exactly matches (including `/api/v1/` prefix)

### "Frontend shows empty data"
Ask Gemini to check:
1. `useQuery` has correct `queryKey` (changes when params change)
2. `enabled` flag is not blocking the query
3. API response envelope is `{ success: true, data: [...] }`
4. camelCase/snake_case mismatch in params

### "Student photo not loading"
Ask Gemini to check:
1. `NEXT_PUBLIC_STATIC_URL` is set in `.env.local`
2. `getPhotoUrl()` in `lib/utils.ts` is called with the relative path
3. The `students/photos/` directory exists in `data/`

### "SQLite UNIQUE constraint violation"
Common causes:
- Attendance: same student + date already exists → should use `onConflict().merge()`
- Student fees: same student + month → same fix
- These are already handled with `.onConflict().merge()` in the routes

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Route files | lowercase | `src/routes/student-contacts.js` |
| Service files | PascalCase | `src/services/FeeService.js` |
| Frontend hooks | camelCase with `use` prefix | `hooks/useFees.ts` |
| Frontend pages | lowercase folder + `page.tsx` | `app/(dashboard)/fees/page.tsx` |
| Components | PascalCase | `components/shared/StatCard.tsx` |
| Types | PascalCase interfaces | `interface FeeRecord {...}` |

---

## Environment-Specific Notes

### Development
- SQLite database at `./data/tams.db`
- Photos at `./data/students/photos/`
- PDFs at `./data/pdfs/`
- Backups at `./data/backups/`

### Production
- All paths via `DATA_DIR` env var
- Use PM2: `pm2 start src/app.js --name tams-api`
- Frontend: `npm run build && npm start`
- Consider nginx reverse proxy for both

---

## Quick Reference Commands

```bash
# Backend
npm run dev              # Start with nodemon (auto-restart)
npm start                # Production start
npx knex migrate:latest  # Run pending migrations
npx knex migrate:rollback # Rollback last batch
npx knex seed:run        # Re-seed demo data (CLEARS EXISTING!)

# Frontend
npm run dev              # Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint check

# Database inspection
sqlite3 data/tams.db ".tables"
sqlite3 data/tams.db "SELECT * FROM batches;"
sqlite3 data/tams.db ".schema students"

# Check logs
tail -f /proc/$(pgrep node)/fd/1  # Linux live log
```
