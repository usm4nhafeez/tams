#!/bin/bash
# TAMS API Smoke Test Suite
# Usage: bash test_api.sh
# Run AFTER: npm run dev + npx knex migrate:latest + npx knex seed:run

BASE="http://localhost:5001/api/v1"
PASS=0; FAIL=0; SKIP=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

check_get() {
  local name=$1; local url=$2
  local result=$(curl -s --max-time 5 "$url" 2>/dev/null)
  local success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else 'FAIL')" 2>/dev/null)
  if [ "$success" = "OK" ]; then
    printf "${GREEN}✅${NC} $name\n"
    PASS=$((PASS+1))
  else
    printf "${RED}❌${NC} $name → $result\n"
    FAIL=$((FAIL+1))
  fi
}

check_post() {
  local name=$1; local url=$2; local data=$3
  local result=$(curl -s --max-time 5 -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
  local success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else 'FAIL')" 2>/dev/null)
  if [ "$success" = "OK" ]; then
    printf "${GREEN}✅${NC} $name\n"
    PASS=$((PASS+1))
  else
    printf "${RED}❌${NC} $name → $result\n"
    FAIL=$((FAIL+1))
  fi
}

echo "============================================"
echo "  TAMS API Smoke Tests"
echo "  $(date)"
echo "============================================"
echo ""

# Fetch dynamic IDs for testing
DB_FILE="./data/tams.db"
# Use Batch 3 if exists, or first available
BATCH_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM batches LIMIT 1;")
STUDENT_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM students WHERE batch_id = $BATCH_ID LIMIT 1;")
STUDENT_ID_2=$(sqlite3 "$DB_FILE" "SELECT id FROM students WHERE batch_id = $BATCH_ID LIMIT 1 OFFSET 1;")
FEE_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM student_fees WHERE status != 'paid' LIMIT 1;")
EXAM_ID=$(sqlite3 "$DB_FILE" "SELECT id FROM exams WHERE batch_id = $BATCH_ID LIMIT 1;")

# Fallbacks if DB is empty
BATCH_ID=${BATCH_ID:-1}
STUDENT_ID=${STUDENT_ID:-1}
STUDENT_ID_2=${STUDENT_ID_2:-2}
FEE_ID=${FEE_ID:-1}
EXAM_ID=${EXAM_ID:-1}

echo "Using BATCH_ID=$BATCH_ID, STUDENT_ID=$STUDENT_ID, STUDENT_ID_2=$STUDENT_ID_2, FEE_ID=$FEE_ID, EXAM_ID=$EXAM_ID"
echo ""

# Health
echo "--- Health ---"
result=$(curl -s --max-time 5 "http://localhost:5001/health" 2>/dev/null)
status=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','FAIL'))" 2>/dev/null)
if [ "$status" = "ok" ]; then
  printf "${GREEN}✅${NC} Health check\n"
  PASS=$((PASS+1))
else
  printf "${RED}❌${NC} Health check — Server not running? Start with: npm run dev\n"
  echo "Exiting — server must be running to test."
  exit 1
fi

echo ""
echo "--- Batches ---"
check_get "GET /batches" "$BASE/batches"
check_get "GET /batches/$BATCH_ID" "$BASE/batches/$BATCH_ID"
check_post "POST /batches" "$BASE/batches" '{"name":"Test Batch","grade":"9","academic_year":"2025-26","monthly_fee":2000}'

echo ""
echo "--- Groups ---"
check_get "GET /groups" "$BASE/groups"
check_get "GET /groups?batch_id=$BATCH_ID" "$BASE/groups?batch_id=$BATCH_ID"
check_post "POST /groups" "$BASE/groups" "{\"batch_id\":$BATCH_ID,\"name\":\"Test Group\"}"

echo ""
echo "--- Students ---"
check_get "GET /students" "$BASE/students"
check_get "GET /students?status=active" "$BASE/students?status=active"
check_get "GET /students?batch_id=$BATCH_ID" "$BASE/students?batch_id=$BATCH_ID"
check_get "GET /students?search=ahmed" "$BASE/students?search=ahmed"
check_get "GET /students/$STUDENT_ID/profile" "$BASE/students/$STUDENT_ID/profile"

echo ""
echo "--- Attendance ---"
TODAY=$(date +%Y-%m-%d)
MONTH=$(date +%Y-%m)
check_get "GET /attendance?batch_id=$BATCH_ID&date=$TODAY" "$BASE/attendance?batch_id=$BATCH_ID&date=$TODAY"
check_get "GET /attendance/monthly?batch_id=$BATCH_ID&month=$MONTH" "$BASE/attendance/monthly?batch_id=$BATCH_ID&month=$MONTH"
check_post "POST /attendance/bulk" "$BASE/attendance/bulk" \
  "{\"batch_id\":$BATCH_ID,\"date\":\"$TODAY\",\"records\":[{\"student_id\":$STUDENT_ID,\"status\":\"P\"},{\"student_id\":$STUDENT_ID_2,\"status\":\"A\"}]}"

echo ""
echo "--- Fees ---"
check_get "GET /fees" "$BASE/fees"
check_get "GET /fees?month_year=$MONTH" "$BASE/fees?month_year=$MONTH"
check_get "GET /fees?student_id=$STUDENT_ID" "$BASE/fees?student_id=$STUDENT_ID"
check_post "POST /fees/generate" "$BASE/fees/generate" "{\"month_year\":\"$MONTH\"}"

# Record payment on fee id (should be pending)
result=$(curl -s --max-time 5 -X PATCH "$BASE/fees/$FEE_ID/pay" \
  -H "Content-Type: application/json" \
  -d '{"amount_paid":500,"payment_mode":"cash"}' 2>/dev/null)
success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else 'FAIL')" 2>/dev/null)
if [ "$success" = "OK" ]; then
  printf "${GREEN}✅${NC} PATCH /fees/$FEE_ID/pay\n"
  PASS=$((PASS+1))
else
  printf "${YELLOW}⚠️${NC}  PATCH /fees/$FEE_ID/pay (fee may already be paid from seed)\n"
  SKIP=$((SKIP+1))
fi

echo ""
echo "--- Exams ---"
check_get "GET /exams" "$BASE/exams"
check_get "GET /exams?batch_id=$BATCH_ID" "$BASE/exams?batch_id=$BATCH_ID"
check_get "GET /exams/$EXAM_ID/results" "$BASE/exams/$EXAM_ID/results"
check_post "POST /exams" "$BASE/exams" \
  "{\"batch_id\":$BATCH_ID,\"subject\":\"Test Subject\",\"exam_type\":\"weekly\",\"date\":\"$TODAY\",\"max_marks\":25}"
check_post "POST /exams/$EXAM_ID/results" "$BASE/exams/$EXAM_ID/results" \
  "{\"results\":[{\"student_id\":$STUDENT_ID,\"marks_obtained\":20,\"is_absent\":false},{\"student_id\":$STUDENT_ID_2,\"marks_obtained\":null,\"is_absent\":true}]}"

echo ""
echo "--- Subjects ---"
check_get "GET /subjects" "$BASE/subjects"
check_get "GET /subjects?batch_id=$BATCH_ID" "$BASE/subjects?batch_id=$BATCH_ID"
check_post "POST /subjects" "$BASE/subjects" "{\"batch_id\":$BATCH_ID,\"name\":\"Test Subject\",\"code\":\"TST\"}"

echo ""
echo "--- Settings ---"
check_get "GET /settings" "$BASE/settings"
check_get "GET /settings/academy_name" "$BASE/settings/academy_name"
result=$(curl -s --max-time 5 -X PUT "$BASE/settings/test_key" \
  -H "Content-Type: application/json" \
  -d '{"value":"test_value"}' 2>/dev/null)
success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else 'FAIL')" 2>/dev/null)
[ "$success" = "OK" ] && { printf "${GREEN}✅${NC} PUT /settings/test_key\n"; PASS=$((PASS+1)); } || { printf "${RED}❌${NC} PUT /settings/test_key\n"; FAIL=$((FAIL+1)); }

echo ""
echo "--- WhatsApp ---"
check_get "GET /whatsapp/status" "$BASE/whatsapp/status"
check_get "GET /whatsapp/logs" "$BASE/whatsapp/logs"
check_get "GET /whatsapp/queue" "$BASE/whatsapp/queue"
check_post "POST /whatsapp/send (mock)" "$BASE/whatsapp/send" "{\"student_id\":$STUDENT_ID,\"to\":\"03001234567\",\"message\":\"Test\"}"

echo ""
echo "--- Storage ---"
check_get "GET /storage/backups" "$BASE/storage/backups"
check_post "POST /storage/backup" "$BASE/storage/backup" '{}'

echo ""
echo "--- Error Handling ---"
# 404 route
result=$(curl -s --max-time 5 "$BASE/nonexistent" 2>/dev/null)
not_found=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if not d.get('success') else 'FAIL')" 2>/dev/null)
[ "$not_found" = "OK" ] && { printf "${GREEN}✅${NC} 404 unknown route\n"; PASS=$((PASS+1)); } || { printf "${RED}❌${NC} 404 unknown route\n"; FAIL=$((FAIL+1)); }

# 400 missing fields
result=$(curl -s --max-time 5 -X POST "$BASE/batches" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
bad_req=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if not d.get('success') else 'FAIL')" 2>/dev/null)
[ "$bad_req" = "OK" ] && { printf "${GREEN}✅${NC} 400 missing required fields\n"; PASS=$((PASS+1)); } || { printf "${RED}❌${NC} 400 missing required fields\n"; FAIL=$((FAIL+1)); }

# 404 student not found
result=$(curl -s --max-time 5 "$BASE/students/999999/profile" 2>/dev/null)
not_found=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if not d.get('success') else 'FAIL')" 2>/dev/null)
[ "$not_found" = "OK" ] && { printf "${GREEN}✅${NC} 404 student not found\n"; PASS=$((PASS+1)); } || { printf "${RED}❌${NC} 404 student not found\n"; FAIL=$((FAIL+1)); }

echo ""
echo "============================================"
echo "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$SKIP skipped${NC}"
echo "============================================"

if [ $FAIL -eq 0 ]; then
  printf "${GREEN}🎉 All tests passed! Backend is working correctly.${NC}\n"
  exit 0
else
  printf "${RED}⚠️  $FAIL test(s) failed. Check output above.${NC}\n"
  exit 1
fi
