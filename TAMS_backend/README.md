# TAMS — Tips Academy Management System

Full-stack academy management system built with **Node.js/Express + SQLite** (backend) and **Next.js 16 + shadcn/ui** (frontend).

---

## Features

| Module | Description |
|--------|-------------|
| **Batches & Groups** | Create academic batches, assign groups (Biology, Computer, etc.) |
| **Students** | Full profiles with photos, parent contacts, fee config |
| **Attendance** | Daily bulk marking (P/A/L) with monthly reports |
| **Fees** | Auto-generate monthly fees, record payments, PDF receipts |
| **Exams** | Create exams, enter marks, generate report cards |
| **WhatsApp** | Automated absence alerts & fee reminders (optional) |
| **Settings** | Academy info, fee defaults, backup/restore |

---

## Tech Stack

```
Backend:   Node.js 22 | Express 4 | better-sqlite3 | Knex | PDFKit | multer
Frontend:  Next.js 16 | TypeScript | Tailwind CSS v4 | shadcn/ui | TanStack Query
Database:  SQLite (WAL mode, FK constraints enabled)
```

---

## Quick Start

### Prerequisites
- Node.js >= 18.x
- npm or pnpm

### Backend Setup

```bash
cd TAMS_backend
cp .env.example .env          # edit academy name/address if needed
npm install
npx knex migrate:latest       # create all 11 tables
npx knex seed:run             # load demo data (7 students, 2 batches, fees, exams)
npm run dev                   # starts on http://localhost:5001
```

Verify it works:
```bash
curl http://localhost:5001/health
# {"status":"ok","version":"1.0.0","env":"development"}
```

### Frontend Setup

```bash
cd tams_frontend_v0
cp env.example .env.local     # or create manually:
# NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
# NEXT_PUBLIC_STATIC_URL=http://localhost:5001/static
npm install
npm run dev                   # starts on http://localhost:3000
```

---

## Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5001
DATA_DIR=./data
DB_PATH=./data/tams.db

# Academy info (used in PDFs)
ACADEMY_NAME=Tips Academy
ACADEMY_PHONE=03001234567
ACADEMY_ADDRESS=Tips Street 123, Lahore

# WhatsApp (set WA_MODE=webjs to enable, disabled by default)
WA_MODE=disabled
# WA_MODE=webjs         # uses whatsapp-web.js (needs Puppeteer)
# WA_MODE=meta          # uses Meta Cloud API
META_API_TOKEN=
META_PHONE_NUMBER_ID=
META_VERIFY_TOKEN=
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_STATIC_URL=http://localhost:5001/static
```

---

## Project Structure

```
TAMS_backend/
├── src/
│   ├── app.js                    # Express app entry point
│   ├── db/
│   │   ├── database.js           # Knex singleton + PRAGMA config
│   │   ├── migrations/           # 11 migration files
│   │   └── seeds/                # Demo data seed
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized error handling
│   │   └── upload.js             # Multer photo upload config
│   ├── routes/
│   │   ├── batches.js            # GET/POST/PUT/PATCH /api/v1/batches
│   │   ├── groups.js             # GET/POST/PUT/DELETE /api/v1/groups
│   │   ├── students.js           # GET/POST/PUT /api/v1/students
│   │   ├── attendance.js         # GET/POST /api/v1/attendance
│   │   ├── fees.js               # GET/POST/PATCH /api/v1/fees
│   │   ├── exams.js              # GET/POST/PATCH /api/v1/exams
│   │   ├── whatsapp.js           # WhatsApp status/send/logs
│   │   ├── storage.js            # Backup/restore
│   │   ├── settings.js           # Key-value settings store
│   │   └── subjects.js           # Batch subjects management
│   └── services/
│       ├── FeeService.js         # Fee calculation & payment logic
│       ├── PDFService.js         # Receipt & report card generation
│       ├── StorageService.js     # File paths & backup rotation
│       └── WhatsAppService.js    # WA messaging (disabled stub by default)
├── data/                         # Auto-created: DB, photos, PDFs, backups
├── .env.example
├── knexfile.js
└── package.json

tams_frontend_v0/
├── app/(dashboard)/              # Route pages
│   ├── dashboard/page.tsx
│   ├── students/[id]/page.tsx
│   ├── attendance/page.tsx
│   ├── fees/page.tsx
│   ├── exams/page.tsx
│   ├── whatsapp/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── layout/                   # Sidebar, AppShell
│   ├── shared/                   # StatCard, StatusBadge, EmptyState...
│   └── ui/                       # shadcn/ui components
├── hooks/                        # TanStack Query hooks per domain
├── lib/
│   ├── api.ts                    # Axios with camelCase ↔ snake_case transform
│   ├── types.ts                  # All TypeScript interfaces
│   └── utils.ts                  # formatCurrency, formatDate, getPhotoUrl...
└── store/useAppStore.ts          # Zustand global state
```

---

## WhatsApp Setup (Optional)

WhatsApp is **disabled by default**. The service logs messages to console instead.

### Option A: whatsapp-web.js (Free, local)

```bash
# 1. Install optional dependency
npm install whatsapp-web.js qrcode-terminal

# 2. Set in .env
WA_MODE=webjs

# 3. Restart server — scan QR from /whatsapp page in the app
```

> **Note:** Requires Chrome/Chromium. On headless servers: `apt install chromium-browser`

### Option B: Meta Cloud API (Reliable, paid tier available)

```env
WA_MODE=meta
META_API_TOKEN=your_token_here
META_PHONE_NUMBER_ID=your_phone_number_id
```

---

## API Quick Reference

Base URL: `http://localhost:5001/api/v1`

All responses: `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/batches` | List all batches with student counts |
| POST | `/batches` | Create batch |
| PUT | `/batches/:id` | Update batch |
| PATCH | `/batches/:id/archive` | Archive batch |
| GET | `/groups?batch_id=` | List groups |
| POST | `/groups` | Create group |
| GET | `/students?batch_id=&status=active&search=` | List students |
| POST | `/students` | Create student (multipart/form-data) |
| GET | `/students/:id/profile` | Full student profile |
| GET | `/attendance?batch_id=&date=` | Get attendance for date |
| POST | `/attendance/bulk` | Save attendance records |
| GET | `/attendance/monthly?batch_id=&month=` | Monthly summary |
| GET | `/fees?month_year=&batch_id=` | List fee records |
| POST | `/fees/generate` | Generate fees for a month |
| PATCH | `/fees/:id/pay` | Record payment |
| GET | `/fees/:id/receipt` | Generate PDF receipt |
| GET | `/exams?batch_id=&month=` | List exams |
| POST | `/exams` | Create exam |
| POST | `/exams/:id/results` | Bulk save marks |
| GET | `/exams/report/:studentId/:month` | Generate report card PDF |
| GET | `/whatsapp/status` | WA connection status |
| GET | `/whatsapp/qr` | QR code for connection |
| POST | `/whatsapp/broadcast` | Send fee broadcast |
| POST | `/whatsapp/absence` | Send absence alerts |
| GET | `/whatsapp/logs` | Message history |
| GET | `/settings` | All settings as key-value map |
| PUT | `/settings/:key` | Upsert a setting |
| GET | `/subjects?batch_id=` | List subjects for batch |
| POST | `/subjects` | Add subject |
| POST | `/storage/backup` | Manual DB backup |
| GET | `/storage/backups` | List backups |
| POST | `/storage/restore` | Restore from backup |

---

## curl Test Scripts

See `TESTING.md` for complete curl test suite.

---

## Database Schema

See `SCHEMA.md` for full ERD description.

---

## Known Issues & Fixes Applied

See `AUDIT.md` for full audit findings.

---

## Deployment (Production)

```bash
# 1. Set environment
NODE_ENV=production
DB_PATH=/var/data/tams.db
DATA_DIR=/var/data

# 2. Run migrations
NODE_ENV=production npx knex migrate:latest

# 3. Start with PM2
pm2 start src/app.js --name tams-api

# 4. Nginx reverse proxy → localhost:5001
```

---

## License

Private — Tips Academy internal use only.
