# TAMS Database Schema

SQLite database via Knex.js — 11 tables, WAL mode, foreign keys enforced.

---

## Entity Relationship Overview

```
batches ──< groups
    │          │
    └──< students >──< student_contacts
             │
             ├──< attendance
             ├──< student_fees
             ├──< exam_results >──< exams (──< groups)
             └──< whatsapp_logs

settings  (standalone key-value store)
subjects  (per batch)
```

---

## Tables

### `batches`

Academic batches / classes.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | VARCHAR | e.g. "Matric 2025 Morning" |
| grade | VARCHAR | "9", "10", "11", "12", "custom" |
| academic_year | VARCHAR | "2024-25" |
| monthly_fee | DECIMAL(10,2) | Default fee for students in this batch |
| admission_fee | DECIMAL(10,2) | Default admission fee |
| is_active | BOOLEAN | false = archived |
| notes | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `groups`

Sub-groups within a batch (Biology, Computer, General, etc.)

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| batch_id | INTEGER FK | → batches.id CASCADE DELETE |
| name | VARCHAR | "Biology Group" |
| description | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `students`

Core student records.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | VARCHAR NOT NULL | Full name |
| father_name | VARCHAR | |
| gender | VARCHAR | 'male' \| 'female' \| 'other' |
| dob | VARCHAR | YYYY-MM-DD |
| batch_id | INTEGER FK | → batches.id |
| group_id | INTEGER FK | → groups.id (nullable) |
| photo_path | VARCHAR | Relative: `students/photos/1_1234.jpg` |
| status | VARCHAR | 'active' \| 'inactive' \| 'graduated' \| 'withdrawn' |
| admission_date | VARCHAR NOT NULL | YYYY-MM-DD |
| admission_fee | DECIMAL(10,2) | Student-specific override |
| monthly_fee | DECIMAL(10,2) | Student-specific override |
| discount_type | VARCHAR | 'fixed' \| 'percent' |
| discount_value | DECIMAL(10,2) | Amount or percentage |
| address | VARCHAR | |
| notes | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Fee Calculation:**
```
if discount_type == 'percent':
  discount = monthly_fee * discount_value / 100
else:
  discount = discount_value

net_due = monthly_fee - discount
```

---

### `student_contacts`

Parent/guardian contact information.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| student_id | INTEGER FK | → students.id CASCADE DELETE |
| parent_name | VARCHAR NOT NULL | |
| phone | VARCHAR NOT NULL | Local format: 03001234567 |
| whatsapp_number | VARCHAR NOT NULL | International: 923001234567 |
| relation | VARCHAR | 'father' \| 'mother' \| 'guardian' |
| is_primary | BOOLEAN | Only primary contact gets WA messages |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `attendance`

Daily attendance records.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| student_id | INTEGER FK | → students.id CASCADE DELETE |
| batch_id | INTEGER FK | → batches.id |
| date | VARCHAR NOT NULL | YYYY-MM-DD |
| status | VARCHAR NOT NULL | 'P' (Present) \| 'A' (Absent) \| 'L' (Leave) |
| marked_by | VARCHAR | Staff name |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**UNIQUE(student_id, date)** — one record per student per day (upsert on conflict).

---

### `student_fees`

Monthly fee tracking per student.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| student_id | INTEGER FK | → students.id CASCADE DELETE |
| month_year | VARCHAR NOT NULL | YYYY-MM format |
| amount_due | DECIMAL(10,2) | Gross fee |
| discount | DECIMAL(10,2) | Applied discount amount |
| amount_paid | DECIMAL(10,2) | Cumulative paid |
| balance | DECIMAL(10,2) | net_due - amount_paid |
| paid_date | VARCHAR | YYYY-MM-DD of last payment |
| payment_mode | VARCHAR | 'cash' \| 'bank' \| 'other' |
| receipt_no | VARCHAR | e.g. RCP-202603-00001 |
| status | VARCHAR | 'pending' \| 'partial' \| 'paid' |
| notes | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**UNIQUE(student_id, month_year)** — one fee record per student per month.

**Fee Generation Logic:**
1. Get all active students
2. Skip students who already have a record for that month
3. Calculate: `amount_due = monthly_fee`, `discount` from student config, `balance = amount_due - discount`
4. Insert with `status = 'pending'`

---

### `exams`

Examination definitions.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| batch_id | INTEGER FK | → batches.id |
| group_id | INTEGER FK | → groups.id (nullable — null = all groups) |
| subject | VARCHAR NOT NULL | Subject name |
| exam_type | VARCHAR NOT NULL | 'quiz' \| 'weekly' \| 'monthly' \| 'quarterly' \| 'annual' |
| date | VARCHAR NOT NULL | YYYY-MM-DD |
| max_marks | DECIMAL(6,2) | |
| passing_marks | DECIMAL(6,2) | Default 0 |
| session_id | VARCHAR | Groups related exams (e.g. "March 2026 Monthly") |
| description | TEXT | |
| is_locked | BOOLEAN | Locked exams cannot be edited |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `exam_results`

Per-student marks for each exam.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| exam_id | INTEGER FK | → exams.id CASCADE DELETE |
| student_id | INTEGER FK | → students.id CASCADE DELETE |
| marks_obtained | DECIMAL(6,2) | NULL if absent |
| is_absent | BOOLEAN | |
| remarks | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**UNIQUE(exam_id, student_id)** — one result per student per exam.

---

### `subjects`

Subject list per batch (used in exam creation dropdown).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| batch_id | INTEGER FK | → batches.id CASCADE DELETE |
| name | VARCHAR NOT NULL | |
| code | VARCHAR | Short code e.g. "MATH" |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `whatsapp_logs`

Outbound message history.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| student_id | INTEGER FK | → students.id (nullable — for broadcasts) |
| parent_number | VARCHAR NOT NULL | WhatsApp number sent to |
| message_type | VARCHAR | 'fee_broadcast' \| 'fee_alert' \| 'absence' \| 'manual' \| 'report_card' |
| message_body | TEXT | Full message text |
| status | VARCHAR | 'pending' \| 'sent' \| 'delivered' \| 'failed' |
| wa_message_id | VARCHAR | ID returned by WhatsApp API |
| retry_count | INTEGER | |
| sent_at | VARCHAR | ISO timestamp |
| error_log | TEXT | Error message if failed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `settings`

Key-value configuration store.

| Column | Type | Notes |
|--------|------|-------|
| key | VARCHAR PK | Setting name |
| value | TEXT | Setting value |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Default settings (seeded):**
```
academy_name       = "Tips Academy"
academy_phone      = "03001234567"
academy_address    = "Tips Street 123, Lahore"
academy_email      = "info@tipsacademy.pk"
default_monthly_fee = "3000"
default_admission_fee = "5000"
fee_due_day        = "10"
```

---

## Useful Queries

### Students with unpaid fees this month
```sql
SELECT s.name, sf.amount_due, sf.balance, sf.status
FROM student_fees sf
JOIN students s ON sf.student_id = s.id
WHERE sf.month_year = strftime('%Y-%m', 'now')
  AND sf.status != 'paid'
ORDER BY sf.balance DESC;
```

### Attendance percentage per student this month
```sql
SELECT 
  s.name,
  SUM(CASE WHEN a.status = 'P' THEN 1 ELSE 0 END) as present,
  COUNT(*) as total,
  ROUND(100.0 * SUM(CASE WHEN a.status = 'P' THEN 1 ELSE 0 END) / COUNT(*), 1) as pct
FROM attendance a
JOIN students s ON a.student_id = s.id
WHERE a.date LIKE strftime('%Y-%m', 'now') || '%'
GROUP BY s.id
ORDER BY pct DESC;
```

### Top scorers in an exam
```sql
SELECT s.name, er.marks_obtained, e.max_marks,
       ROUND(100.0 * er.marks_obtained / e.max_marks, 1) as pct
FROM exam_results er
JOIN students s ON er.student_id = s.id
JOIN exams e ON er.exam_id = e.id
WHERE er.exam_id = 1 AND er.is_absent = 0
ORDER BY er.marks_obtained DESC;
```
