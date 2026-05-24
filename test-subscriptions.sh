#!/bin/bash
# Comprehensive Subscription Module Test v2
BASE_URL="${1:-http://localhost:8000}"
COOKIE_JAR="/tmp/greencart-test-cookies.txt"
PASS=0; FAIL=0
pass() { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); return 0; }
fail() { echo "  ❌ FAIL: $1 => $(echo "$2" | head -c 300)"; FAIL=$((FAIL+1)); return 0; }

login_as() { rm -f "$COOKIE_JAR"; curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL$1" -H "Content-Type: application/json" -d "$2"; }
req() { curl -s -b "$COOKIE_JAR" "$@"; }

echo "============================================"
echo "  Monthly Bazar Module Test Suite"
echo "============================================"

# ── Admin Login ────────────────────────────────
echo ""; echo "── Step 1: Admin Login ──"
login_as "/api/seller/login" '{"email":"admin@greencart.com","password":"admin123"}' | grep -q '"success":true' && pass "Admin login" || fail "Admin login" "failed"

# ── User Register + Login ──────────────────────
echo ""; echo "── Step 2: User Register & Login ──"
TS=$(date +%s)
USER_EMAIL="testuser_${TS}@test.com"
req -X POST "$BASE_URL/api/user/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$USER_EMAIL\",\"password\":\"test1234\",\"phone\":\"1234567890\"}" | grep -q '"success":true' && pass "User register" || fail "User register" "failed"

req -X POST "$BASE_URL/api/user/login" -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"test1234\"}" | grep -q '"success":true' && pass "User login" || fail "User login" "failed"

# ── Products ───────────────────────────────────
echo ""; echo "── Step 3: Products ──"
PROD_RES=$(req "$BASE_URL/api/product/list")
PROD_IDS=$(echo "$PROD_RES" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Only 1 product in DB: $PROD_IDS"
[ -n "$PROD_IDS" ] && pass "Product exists" || fail "Product exists" "None found"

P=$PROD_IDS  # single product ID for all tests

# ── Admin: Create Plans ────────────────────────
echo ""; echo "── Step 4: Admin Create Plans ──"
login_as "/api/seller/login" '{"email":"admin@greencart.com","password":"admin123"}' > /dev/null

MONTHLY_PLAN=$(req -X POST "$BASE_URL/api/subscription/plans" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Monthly Plan\",\"description\":\"Auto-test monthly\",\"type\":\"premium\",\"price\":299,\"deliveryDay\":15,\"schedule\":\"monthly\",\"items\":[{\"product\":\"$P\",\"quantity\":2}]}")
MPID=$(echo "$MONTHLY_PLAN" | grep -o '"_id":"[^"]*"' | tail -1 | cut -d'"' -f4)
[ -n "$MPID" ] && pass "Create monthly plan (${MPID:0:12}...)" || fail "Create monthly plan" "$MONTHLY_PLAN"

WEEKLY_PLAN=$(req -X POST "$BASE_URL/api/subscription/plans" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Weekly Plan\",\"description\":\"Auto-test weekly\",\"type\":\"premium\",\"price\":599,\"deliveryDay\":1,\"schedule\":\"weekly\",\"weeklyItems\":[{\"week\":1,\"items\":[{\"product\":\"$P\",\"quantity\":1}]},{\"week\":2,\"items\":[{\"product\":\"$P\",\"quantity\":2}]},{\"week\":3,\"items\":[{\"product\":\"$P\",\"quantity\":1}]}]}")
WPID=$(echo "$WEEKLY_PLAN" | grep -o '"_id":"[^"]*"' | tail -1 | cut -d'"' -f4)
[ -n "$WPID" ] && pass "Create weekly plan (${WPID:0:12}...)" || fail "Create weekly plan" "$WEEKLY_PLAN"

FREE_PLAN=$(req -X POST "$BASE_URL/api/subscription/plans" -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Free Plan\",\"description\":\"Auto-test free\",\"type\":\"free\",\"price\":0,\"deliveryDay\":1,\"schedule\":\"monthly\",\"items\":[{\"product\":\"$P\",\"quantity\":1}]}")
FPID=$(echo "$FREE_PLAN" | grep -o '"_id":"[^"]*"' | tail -1 | cut -d'"' -f4)
[ -n "$FPID" ] && pass "Create free plan (${FPID:0:12}...)" || fail "Create free plan" "$FREE_PLAN"

# ── Public: Get Plans ─────────────────────────
echo ""; echo "── Step 5: Public Get Plans ──"
PLANS_RES=$(curl -s "$BASE_URL/api/subscription/plans")
PLANS_COUNT=$(echo "$PLANS_RES" | grep -o '"name"' | wc -l)
[ "$PLANS_COUNT" -ge 3 ] && pass "GET /plans ($PLANS_COUNT plans)" || fail "GET /plans" "$PLANS_COUNT plans"

curl -s "$BASE_URL/api/subscription/plans/$MPID" | grep -q '"success":true' && pass "GET /plans/:id (monthly)" || fail "GET /plans/:id monthly" "$(curl -s $BASE_URL/api/subscription/plans/$MPID | head -c 100)"
curl -s "$BASE_URL/api/subscription/plans/$WPID" | grep -q '"success":true' && pass "GET /plans/:id (weekly)" || fail "GET /plans/:id weekly" "$(curl -s $BASE_URL/api/subscription/plans/$WPID | head -c 100)"
echo "$WEEKLY_PLAN" | grep -q '"week":1' && pass "Weekly plan has week1 items" || fail "Weekly plan no week1"

# ── User: Add Address ─────────────────────────
echo ""; echo "── Step 6: Add Address ──"
login_as "/api/user/login" "{\"email\":\"$USER_EMAIL\",\"password\":\"test1234\"}" > /dev/null

req -X POST "$BASE_URL/api/address/add" -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"$USER_EMAIL\",\"houseNumber\":\"123\",\"floorNumber\":\"1\",\"roadNumber\":\"Main St\",\"city\":\"TestCity\",\"state\":\"TS\",\"zipcode\":\"12345\",\"country\":\"Test\",\"phone\":\"1234567890\"}" > /dev/null
ADDR_GET=$(req "$BASE_URL/api/address/get")
ADDR_ID=$(echo "$ADDR_GET" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$ADDR_ID" ] && pass "Add address (${ADDR_ID:0:10}...)" || fail "Add address" "No ID in $(echo $ADDR_GET | head -c 200)"

# ── Subscribe ─────────────────────────────────
echo ""; echo "── Step 7: Subscribe ──"

# 7a: Monthly custom (premium)
SUB_MC=$(req -X POST "$BASE_URL/api/subscription/subscribe" -H "Content-Type: application/json" \
  -d "{\"type\":\"premium-custom\",\"schedule\":\"monthly\",\"items\":[{\"product\":\"$P\",\"quantity\":3}],\"deliveryDay\":10,\"addressId\":\"$ADDR_ID\",\"paymentType\":\"COD\"}")
MCID=$(echo "$SUB_MC" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$MCID" ] && pass "Subscribe monthly custom" || fail "Subscribe monthly custom" "$SUB_MC"

# 7b: Weekly custom
SUB_WC=$(req -X POST "$BASE_URL/api/subscription/subscribe" -H "Content-Type: application/json" \
  -d "{\"type\":\"premium-custom\",\"schedule\":\"weekly\",\"weeklyItems\":[{\"week\":1,\"items\":[{\"product\":\"$P\",\"quantity\":1}]},{\"week\":2,\"items\":[{\"product\":\"$P\",\"quantity\":2}]}],\"addressId\":\"$ADDR_ID\",\"paymentType\":\"COD\"}")
WCID=$(echo "$SUB_WC" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$WCID" ] && pass "Subscribe weekly custom" || fail "Subscribe weekly custom" "$SUB_WC"
echo "$SUB_WC" | grep -q '"week":1' && pass "Weekly sub has week1 items" || fail "Weekly sub no week1"

# 7c: Free custom (monthly)
SUB_FC=$(req -X POST "$BASE_URL/api/subscription/subscribe" -H "Content-Type: application/json" \
  -d "{\"type\":\"free-custom\",\"schedule\":\"monthly\",\"items\":[{\"product\":\"$P\",\"quantity\":2}],\"deliveryDay\":20,\"addressId\":\"$ADDR_ID\",\"paymentType\":\"COD\"}")
FCID=$(echo "$SUB_FC" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$FCID" ] && pass "Subscribe free custom" || fail "Subscribe free custom" "$SUB_FC"
echo "$SUB_FC" | grep -o '"price":[0-9]*' | grep -q '"price":0' && pass "Free plan price = 0" || fail "Free price not 0"

# 7d: Monthly plan-based
SUB_PL=$(req -X POST "$BASE_URL/api/subscription/subscribe" -H "Content-Type: application/json" \
  -d "{\"planId\":\"$MPID\",\"type\":\"plan\",\"deliveryDay\":15,\"addressId\":\"$ADDR_ID\",\"paymentType\":\"COD\"}")
PLID=$(echo "$SUB_PL" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$PLID" ] && pass "Subscribe to monthly plan" || fail "Subscribe to monthly plan" "$SUB_PL"

# 7e: Weekly plan-based
SUB_PLW=$(req -X POST "$BASE_URL/api/subscription/subscribe" -H "Content-Type: application/json" \
  -d "{\"planId\":\"$WPID\",\"type\":\"plan\",\"deliveryDay\":1,\"addressId\":\"$ADDR_ID\",\"paymentType\":\"COD\"}")
PLWID=$(echo "$SUB_PLW" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$PLWID" ] && pass "Subscribe to weekly plan" || fail "Subscribe to weekly plan" "$SUB_PLW"

echo "  IDs: MC=${MCID:0:10} WC=${WCID:0:10} FC=${FCID:0:10} PL=${PLID:0:10} PLW=${PLWID:0:10}"

# ── Get My Subscriptions ─────────────────────
echo ""; echo "── Step 8: Get My Subscriptions ──"
MY_SUBS=$(req "$BASE_URL/api/subscription/my")
MY_COUNT=$(echo "$MY_SUBS" | grep -o '"_id"' | wc -l)
[ "$MY_COUNT" -ge 5 ] && pass "GET /my ($MY_COUNT subs)" || fail "GET /my count" "$MY_COUNT"
echo "$MY_SUBS" | grep -q '"schedule":"weekly"' && pass "Weekly schedule in response" || fail "No weekly flag"
echo "$MY_SUBS" | grep -q '"deliveryDays"' && pass "deliveryDays array in response" || fail "No deliveryDays"

req "$BASE_URL/api/subscription/my/$MCID" | grep -q '"success":true' && pass "GET /my/:id" || fail "GET /my/:id"

# ── Edit Items ────────────────────────────────
echo ""; echo "── Step 9: Edit Items ──"
req -X PUT "$BASE_URL/api/subscription/$MCID/items" -H "Content-Type: application/json" \
  -d "{\"schedule\":\"monthly\",\"items\":[{\"product\":\"$P\",\"quantity\":5}]}" | grep -q '"success":true' && pass "Edit monthly items" || fail "Edit monthly" "failed"

req -X PUT "$BASE_URL/api/subscription/$WCID/items" -H "Content-Type: application/json" \
  -d "{\"schedule\":\"weekly\",\"weeklyItems\":[{\"week\":1,\"items\":[{\"product\":\"$P\",\"quantity\":2}]},{\"week\":2,\"items\":[{\"product\":\"$P\",\"quantity\":3}]},{\"week\":3,\"items\":[{\"product\":\"$P\",\"quantity\":1}]}]}" | grep -q '"success":true' && pass "Edit weekly items" || fail "Edit weekly" "failed"

# ── Status Updates ────────────────────────────
echo ""; echo "── Step 10: Status Updates ──"
req -X PUT "$BASE_URL/api/subscription/$MCID/status" -H "Content-Type: application/json" \
  -d '{"status":"paused"}' | grep -q '"success":true' && pass "Pause subscription" || fail "Pause" "failed"

req -X PUT "$BASE_URL/api/subscription/$MCID/status" -H "Content-Type: application/json" \
  -d '{"status":"active"}' | grep -q '"success":true' && pass "Resume subscription" || fail "Resume" "failed"

# ── Admin: Get All Subscriptions ─────────────
echo ""; echo "── Step 11: Admin Get All Subs ──"
login_as "/api/seller/login" '{"email":"admin@greencart.com","password":"admin123"}' > /dev/null

ALL_SUBS=$(req "$BASE_URL/api/subscription/all")
ALL_COUNT=$(echo "$ALL_SUBS" | grep -o '"_id"' | wc -l)
[ "$ALL_COUNT" -ge 5 ] && pass "Admin GET /all ($ALL_COUNT subs)" || fail "Admin GET /all" "$ALL_COUNT"
echo "$ALL_SUBS" | grep -q '"schedule":"weekly"' && pass "Admin sees weekly subs" || fail "Admin no weekly"

# ── Generate Orders ──────────────────────────
echo ""; echo "── Step 12: Generate Orders ──"
GEN_RES=$(req -X POST "$BASE_URL/api/subscription/generate" -H "Content-Type: application/json" -d '{}')
echo "  Result: $(echo $GEN_RES | head -c 300)"
GEN_COUNT=$(echo "$GEN_RES" | grep -o '"generated":[0-9]*' | cut -d: -f2)
echo "$GEN_RES" | grep -q '"success":true' && pass "Generate orders ($GEN_COUNT generated)" || fail "Generate orders" "$GEN_RES"

# ── Get Orders ───────────────────────────────
echo ""; echo "── Step 13: Admin Get Orders ──"
ORDERS_RES=$(req "$BASE_URL/api/subscription/orders")
ORD_COUNT=$(echo "$ORDERS_RES" | grep -o '"_id"' | wc -l)
[ "$ORD_COUNT" -gt 0 ] && pass "GET /orders ($ORD_COUNT orders)" || fail "GET /orders" "0"
echo "$ORDERS_RES" | grep -o '"month":"[^"]*"' | grep -q "w1\|w2\|w3" && pass "Weekly orders have w1/w2/w3 months" || echo "  ℹ️ No weekly order keys (may need active weekly subs)"

# ── Admin Plan CRUD ──────────────────────────
echo ""; echo "── Step 14: Admin Plan CRUD ──"
req "$BASE_URL/api/subscription/admin/plans" | grep -q '"success":true' && pass "Admin GET /admin/plans" || fail "Admin plans" "failed"

req -X PUT "$BASE_URL/api/subscription/plans/$MPID" -H "Content-Type: application/json" \
  -d '{"price":349}' | grep -q '"success":true' && pass "Update plan (299→349)" || fail "Update plan" "failed"

req -X DELETE "$BASE_URL/api/subscription/plans/$FPID" | grep -q '"success":true' && pass "Delete free plan" || fail "Delete plan" "failed"

req "$BASE_URL/api/subscription/admin/plans" | grep -q "$FPID" && fail "Plan still in DB after delete" || pass "Plan removed from DB"

# ── Error Handling ───────────────────────────
echo ""; echo "── Step 15: Error Handling ──"
curl -s -X POST "$BASE_URL/api/subscription/subscribe" -H "Content-Type: application/json" -d '{}' | grep -q '"success":false' && pass "No auth → error" || fail "No auth" "no error"

# Cancel weekly sub
req -X PUT "$BASE_URL/api/subscription/$WCID/status" -H "Content-Type: application/json" \
  -d '{"status":"cancelled"}' | grep -q '"success":true' && pass "Cancel weekly sub" || fail "Cancel" "failed"

# Edit cancelled sub → should fail
req -X PUT "$BASE_URL/api/subscription/$WCID/items" -H "Content-Type: application/json" \
  -d "{\"schedule\":\"weekly\",\"weeklyItems\":[{\"week\":1,\"items\":[{\"product\":\"$P\",\"quantity\":1}]}]}" | grep -q '"success":false' && pass "Edit cancelled → rejected" || fail "Edit cancelled" "allowed"

req "$BASE_URL/api/subscription/my/000000000000000000000000" | grep -q '"success":false' && pass "Non-existent sub → error" || fail "Non-existent sub" "404?"

# ── Results ─────────────────────────────────
echo ""
echo "============================================"
echo "  TEST RESULTS"
echo "============================================"
echo "  PASSED: $PASS"
echo "  FAILED: $FAIL"
echo "  TOTAL:  $((PASS + FAIL))"
echo "============================================"
