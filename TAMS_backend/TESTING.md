# TAMS API — Full curl Test Suite

Run these after `npm run dev` to verify every endpoint works.  
Base URL: `http://localhost:5001/api/v1`

Set a variable for convenience:
```bash
BASE="http://localhost:5001/api/v1"
```

---

## 1. Health Check

```bash
curl -s http://localhost:5001/health | python3 -m json.tool
# Expected: {"status":"ok","version":"1.0.0","env":"development"}
```

---

## 2. Batches

### List all batches
```bash
curl -s "$BASE/batches" | python3 -m json.tool
```

### Create a batch
```bash
curl -s -X POST "$BASE/batches" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grade 9 Morning",
    "grade": "9",
    "academic_year": "2025-26",
    "monthly_fee": 2500,
    "admission_fee": 4000
  }' | python3 -m json.tool
# Expected: {"success":true,"data":{"id":3,"name":"Grade 9 Morning",...}}
```

### Get single batch
```bash
curl -s "$BASE/batches/1" | python3 -m json.tool
```

### Update batch
```bash
curl -s -X PUT "$BASE/batches/1" \
  -H "Content-Type: application/json" \
  -d '{"monthly_fee": 3200}' | python3 -m json.tool
```

### Archive batch
```bash
curl -s -X PATCH "$BASE/batches/3/archive" | python3 -m json.tool
# Expected: {"success":true,"message":"Batch archived"}
```

---

## 3. Groups

### List groups for a batch
```bash
curl -s "$BASE/groups?batch_id=1" | python3 -m json.tool
```

### Create a group
```bash
curl -s -X POST "$BASE/groups" \
  -H "Content-Type: application/json" \
  -d '{"batch_id": 1, "name": "Commerce Group"}' | python3 -m json.tool
```

### Delete group (must have no students)
```bash
curl -s -X DELETE "$BASE/groups/4" | python3 -m json.tool
```

---

## 4. Students

### List all active students
```bash
curl -s "$BASE/students?status=active" | python3 -m json.tool
```

### List students in batch 1
```bash
curl -s "$BASE/students?batch_id=1" | python3 -m json.tool
```

### Search students
```bash
curl -s "$BASE/students?search=ahmed" | python3 -m json.tool
```

### Get student profile (id=1 after seeding)
```bash
curl -s "$BASE/students/1/profile" | python3 -m json.tool
```

### Create a student (with contact info)
```bash
curl -s -X POST "$BASE/students" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "father_name": "Test Father",
    "gender": "male",
    "dob": "2008-01-01",
    "batch_id": 1,
    "admission_date": "2026-01-01",
    "monthly_fee": 3000,
    "parent_name": "Test Father",
    "phone": "03009999999",
    "whatsapp_number": "923009999999"
  }' | python3 -m json.tool
# Save the id from the response
```

### Create student with photo (multipart)
```bash
# Create a test image first
echo "fake image data" > /tmp/test_photo.jpg

curl -s -X POST "$BASE/students" \
  -F "name=Photo Student" \
  -F "batch_id=1" \
  -F "admission_date=2026-01-01" \
  -F "parent_name=Parent Name" \
  -F "phone=03008888888" \
  -F "photo=@/tmp/test_photo.jpg" | python3 -m json.tool
```

---

## 5. Attendance

### Mark attendance for batch 1 today
```bash
TODAY=$(date +%Y-%m-%d)

curl -s -X POST "$BASE/attendance/bulk" \
  -H "Content-Type: application/json" \
  -d "{
    \"batch_id\": 1,
    \"date\": \"$TODAY\",
    \"records\": [
      {\"student_id\": 1, \"status\": \"P\"},
      {\"student_id\": 2, \"status\": \"P\"},
      {\"student_id\": 3, \"status\": \"A\"},
      {\"student_id\": 4, \"status\": \"L\"},
      {\"student_id\": 5, \"status\": \"P\"}
    ],
    \"marked_by\": \"teacher\"
  }" | python3 -m json.tool
# Expected: {"success":true,"message":"5 records saved","absentStudents":[{"student_id":3,...}]}
```

### Get attendance for today
```bash
curl -s "$BASE/attendance?batch_id=1&date=$TODAY" | python3 -m json.tool
```

### Get monthly summary
```bash
MONTH=$(date +%Y-%m)
curl -s "$BASE/attendance/monthly?batch_id=1&month=$MONTH" | python3 -m json.tool
```

---

## 6. Fees

### List fees for current month
```bash
MONTH=$(date +%Y-%m)
curl -s "$BASE/fees?month_year=$MONTH" | python3 -m json.tool
```

### List fees for a specific student
```bash
curl -s "$BASE/fees?student_id=1" | python3 -m json.tool
```

### Generate fees for current month
```bash
MONTH=$(date +%Y-%m)
curl -s -X POST "$BASE/fees/generate" \
  -H "Content-Type: application/json" \
  -d "{\"month_year\": \"$MONTH\"}" | python3 -m json.tool
# Expected: {"success":true,"data":{"generated":N,"skipped":M}}
```

### Record a payment (fee id=1)
```bash
curl -s -X PATCH "$BASE/fees/1/pay" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_paid": 3000,
    "payment_mode": "cash",
    "notes": "Paid in full"
  }' | python3 -m json.tool
# Expected: fee record with status="paid"
```

### Record partial payment (fee id=2)
```bash
curl -s -X PATCH "$BASE/fees/2/pay" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_paid": 1500,
    "payment_mode": "bank_transfer",
    "notes": "Half payment"
  }' | python3 -m json.tool
# Expected: fee record with status="partial"
```

### Generate receipt PDF (fee id=1, must be paid)
```bash
curl -s "$BASE/fees/1/receipt" | python3 -m json.tool
# Expected: {"success":true,"data":{"path":"/home/.../receipt_RCP-...pdf"}}
```

---

## 7. Exams

### List exams for batch 1
```bash
curl -s "$BASE/exams?batch_id=1" | python3 -m json.tool
```

### Create an exam
```bash
TODAY=$(date +%Y-%m-%d)
curl -s -X POST "$BASE/exams" \
  -H "Content-Type: application/json" \
  -d "{
    \"batch_id\": 1,
    \"subject\": \"Chemistry\",
    \"exam_type\": \"weekly\",
    \"date\": \"$TODAY\",
    \"max_marks\": 25,
    \"passing_marks\": 10,
    \"description\": \"Weekly Test\"
  }" | python3 -m json.tool
# Save exam id from response
```

### Save exam results (exam id=1)
```bash
curl -s -X POST "$BASE/exams/1/results" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {"student_id": 1, "marks_obtained": 88, "is_absent": false},
      {"student_id": 2, "marks_obtained": 72, "is_absent": false},
      {"student_id": 3, "marks_obtained": null, "is_absent": true},
      {"student_id": 4, "marks_obtained": 65, "is_absent": false},
      {"student_id": 5, "marks_obtained": 91, "is_absent": false}
    ]
  }' | python3 -m json.tool
```

### Get exam results
```bash
curl -s "$BASE/exams/1/results" | python3 -m json.tool
```

### Generate report card PDF (student=1, month=current)
```bash
MONTH=$(date +%Y-%m)
curl -s "$BASE/exams/report/1/$MONTH" | python3 -m json.tool
```

### Lock an exam
```bash
curl -s -X PATCH "$BASE/exams/1/lock" | python3 -m json.tool
```

---

## 8. Subjects

### List subjects for batch
```bash
curl -s "$BASE/subjects?batch_id=1" | python3 -m json.tool
```

### Add a subject
```bash
curl -s -X POST "$BASE/subjects" \
  -H "Content-Type: application/json" \
  -d '{"batch_id": 1, "name": "Urdu", "code": "URD"}' | python3 -m json.tool
```

---

## 9. Settings

### Get all settings
```bash
curl -s "$BASE/settings" | python3 -m json.tool
```

### Update a setting
```bash
curl -s -X PUT "$BASE/settings/academy_name" \
  -H "Content-Type: application/json" \
  -d '{"value": "My Academy"}' | python3 -m json.tool
```

### Get single setting
```bash
curl -s "$BASE/settings/academy_name" | python3 -m json.tool
```

---

## 10. WhatsApp

### Check status (should show disabled/mock)
```bash
curl -s "$BASE/whatsapp/status" | python3 -m json.tool
# Expected: {"success":true,"data":{"ready":false,"mode":"disabled","qrPending":false,"status":"disabled"}}
```

### Get message logs
```bash
curl -s "$BASE/whatsapp/logs" | python3 -m json.tool
```

### Send manual message (mock mode — logs to console)
```bash
curl -s -X POST "$BASE/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "03001234567",
    "message": "Test message from TAMS"
  }' | python3 -m json.tool
```

### Send absence alerts
```bash
curl -s -X POST "$BASE/whatsapp/absence" \
  -H "Content-Type: application/json" \
  -d "{
    \"absent_students\": [{\"student_id\": 3}],
    \"date\": \"$(date +%Y-%m-%d)\"
  }" | python3 -m json.tool
```

---

## 11. Storage / Backup

### Create a backup
```bash
curl -s -X POST "$BASE/storage/backup" | python3 -m json.tool
# Expected: {"success":true,"data":{"filename":"tams_backup_2026-03-28_manual.db",...}}
```

### List backups
```bash
curl -s "$BASE/storage/backups" | python3 -m json.tool
```

---

## 12. Error Handling Tests

### 404 — non-existent route
```bash
curl -s "$BASE/nonexistent" | python3 -m json.tool
# Expected: {"success":false,"message":"Route GET /api/v1/nonexistent not found"}
```

### 400 — missing required fields
```bash
curl -s -X POST "$BASE/batches" \
  -H "Content-Type: application/json" \
  -d '{"name": "Missing grade"}' | python3 -m json.tool
# Expected: {"success":false,"message":"name and grade are required"}
```

### 404 — student not found
```bash
curl -s "$BASE/students/99999/profile" | python3 -m json.tool
# Expected: {"success":false,"message":"Student not found"}
```

### 409 — duplicate attendance
```bash
TODAY=$(date +%Y-%m-%d)
# Run this twice — second run should silently upsert (not error)
curl -s -X POST "$BASE/attendance/bulk" \
  -H "Content-Type: application/json" \
  -d "{
    \"batch_id\": 1,
    \"date\": \"$TODAY\",
    \"records\": [{\"student_id\": 1, \"status\": \"A\"}]
  }" | python3 -m json.tool
# Expected: success=true (upsert, not error)
```

---

## Full Smoke Test Script

Save as `test_api.sh` and run `bash test_api.sh`:

```bash
#!/bin/bash
BASE="http://localhost:5001/api/v1"
PASS=0; FAIL=0

check() {
  local name=$1; local url=$2; local expected=$3
  local result=$(curl -s "$url" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else 'FAIL')" 2>/dev/null)
  if [ "$result" = "OK" ]; then
    echo "✅ $name"
    PASS=$((PASS+1))
  else
    echo "❌ $name"
    FAIL=$((FAIL+1))
  fi
}

echo "=== TAMS API Smoke Tests ==="
check "Health"         "http://localhost:5001/health"          "ok"
check "Batches list"   "$BASE/batches"                         "success"
check "Groups list"    "$BASE/groups"                          "success"
check "Students list"  "$BASE/students"                        "success"
check "Fees list"      "$BASE/fees"                            "success"
check "Exams list"     "$BASE/exams"                           "success"
check "Settings"       "$BASE/settings"                        "success"
check "WA Status"      "$BASE/whatsapp/status"                 "success"
check "WA Logs"        "$BASE/whatsapp/logs"                   "success"
check "Backups list"   "$BASE/storage/backups"                 "success"
check "Subjects list"  "$BASE/subjects"                        "success"
check "Students/1"     "$BASE/students/1/profile"              "success"
check "Attendance"     "$BASE/attendance?batch_id=1&date=$(date +%Y-%m-%d)" "success"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "🎉 All tests passed!" || echo "⚠️  Some tests failed"
```
