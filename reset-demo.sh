#!/usr/bin/env bash
#
# EPM-AI Demo Reset Script
# ========================
# Resets all Project Server data back to the original demo baseline.
# Run this after each demo to prepare for the next one.
#
# What it does:
#   1. Force check-in ALL projects (clears any stuck locks)
#   2. Remove any non-baseline assignments (demo-added ones)
#   3. Reset task progress to original percentages
#   4. Clear backend cache
#
# Usage:
#   ./reset-demo.sh              # Full reset
#   ./reset-demo.sh --check      # Just show current state (no changes)
#   ./reset-demo.sh --checkin    # Only force check-in all projects
#

set -eo pipefail

# Configuration
PS_URL="http://34.29.110.174/pwa"
PS_USER="EPMTRIAL\info"
PS_PASS='rXr<{=eiKQ,49+V'
BACKEND_URL="https://epm-ai-demo-20260201.uc.r.appspot.com"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# Get SharePoint form digest for POST requests
get_digest() {
  curl -s --ntlm -u "$PS_USER:$PS_PASS" \
    -X POST -H "Accept: application/json;odata=verbose" -H "Content-Length: 0" \
    "$PS_URL/_api/contextinfo" 2>/dev/null | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['d']['GetContextWebInformation']['FormDigestValue'])"
}

# Project IDs
PROJECT_IDS="a1f72847-9cb7-454c-8035-5098d9310988 2814e004-d9e8-4db4-8d2b-87c03142cafe b0b115dc-912a-4feb-a3c0-3601c9e7c125 5b338e2a-b614-45ff-8da5-d88d9b147744 07217c28-7f78-4176-8b10-26a71421d955"

# All baseline assignment ID prefixes (these should be kept)
BASELINE_IDS="155fea3f 165fea3f 175fea3f 185fea3f 195fea3f 1a5fea3f 1b5fea3f e75eea3f e85eea3f e95eea3f ea5eea3f eb5eea3f ec5eea3f ed5eea3f ee5eea3f 65ffe745 66ffe745 67ffe745 68ffe745 69ffe745 6affe745 6bffe745 b55eea3f b65eea3f b75eea3f b85eea3f b95eea3f ba5eea3f bb5eea3f bc5eea3f 92ffe745 93ffe745 94ffe745 95ffe745 96ffe745 97ffe745 98ffe745"

# ───── Step 1: Force Check-In All Projects ─────
force_checkin_all() {
  log_info "Step 1: Force check-in all projects..."
  local DIGEST
  DIGEST=$(get_digest)

  for PID in $PROJECT_IDS; do
    curl -s --ntlm -u "$PS_USER:$PS_PASS" \
      -X POST -H "Accept: application/json;odata=verbose" -H "Content-Length: 0" \
      -H "X-RequestDigest: $DIGEST" \
      "$PS_URL/_api/ProjectServer/Projects('$PID')/Draft/CheckIn(force=true)" >/dev/null 2>&1
  done
  sleep 5
  log_ok "All 5 projects force-checked-in"
}

# ───── Step 2: Remove Non-Baseline Assignments ─────
remove_extra_assignments() {
  log_info "Step 2: Checking for non-baseline assignments..."
  local DIGEST
  DIGEST=$(get_digest)

  python3 -c "
import subprocess, json, sys

ps_url = '$PS_URL'
ps_auth = '$PS_USER:$PS_PASS'
digest = '$DIGEST'
baseline_ids = set('$BASELINE_IDS'.split())

projects = {
    'a1f72847-9cb7-454c-8035-5098d9310988': ('Cloud Migration', 8),
    '2814e004-d9e8-4db4-8d2b-87c03142cafe': ('Customer Portal', 7),
    'b0b115dc-912a-4feb-a3c0-3601c9e7c125': ('Data Analytics Platform', 7),
    '5b338e2a-b614-45ff-8da5-d88d9b147744': ('ERP Modernization', 8),
    '07217c28-7f78-4176-8b10-26a71421d955': ('Mobile App Revamp', 7),
}

any_removed = False
for pid, (name, expected_count) in projects.items():
    result = subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-H', 'Accept: application/json;odata=verbose',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Assignments?\$expand=Resource,Task&\$select=Id,Resource/Name,Task/Name'
    ], capture_output=True, text=True)

    data = json.loads(result.stdout)
    assignments = data['d']['results']

    extras = []
    for a in assignments:
        prefix = a['Id'].split('-')[0]
        if prefix not in baseline_ids:
            extras.append(a)

    if not extras:
        print(f'  ✅ {name}: {len(assignments)} assignments (baseline)')
        continue

    any_removed = True
    print(f'  ⚠️  {name}: {len(assignments)} assignments ({len(extras)} extra) — removing...')

    # Checkout
    subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-X', 'POST', '-H', 'Accept: application/json;odata=verbose',
        '-H', 'Content-Length: 0', '-H', f'X-RequestDigest: {digest}',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/CheckOut()'
    ], capture_output=True)

    # Delete extras
    for a in extras:
        res = a.get('Resource', {}).get('Name', '?')
        task = a.get('Task', {}).get('Name', '?')
        subprocess.run([
            'curl', '-s', '--ntlm', '-u', ps_auth,
            '-X', 'POST', '-H', 'Accept: application/json;odata=verbose',
            '-H', 'Content-Length: 0', '-H', f'X-RequestDigest: {digest}',
            '-H', 'X-HTTP-Method: DELETE', '-H', 'IF-MATCH: *',
            f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Draft/Assignments(\'{a[\"Id\"]}\')'
        ], capture_output=True)
        print(f'      Removed: {res} → {task}')

    # Publish
    subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-X', 'POST', '-H', 'Accept: application/json;odata=verbose',
        '-H', 'Content-Length: 0', '-H', f'X-RequestDigest: {digest}',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Draft/Publish(true)'
    ], capture_output=True)
    import time; time.sleep(10)
    print(f'      Published ✅')

if not any_removed:
    print('  ✅ All assignments are at baseline')
"
}

# ───── Step 3: Reset Task Progress ─────
reset_task_progress() {
  log_info "Step 3: Checking task progress values..."
  local DIGEST
  DIGEST=$(get_digest)

  python3 -c "
import subprocess, json, time

ps_url = '$PS_URL'
ps_auth = '$PS_USER:$PS_PASS'
digest = '$DIGEST'

# Baseline task progress values
baseline = {
    'a1f72847-9cb7-454c-8035-5098d9310988': {
        'Infrastructure Assessment': 100, 'Cloud Architecture Design': 100,
        'Environment Setup': 100, 'Application Migration - Phase 1': 90,
        'Application Migration - Phase 2': 60, 'Performance Testing': 40,
        'Security Audit': 30, 'DNS Cutover & Go-Live': 5,
    },
    '2814e004-d9e8-4db4-8d2b-87c03142cafe': {
        'UX Research & Wireframes': 100, 'Frontend Development': 60,
        'Backend API Development': 50, 'Payment Integration': 10,
        'Legacy System Integration': 0, 'Security Testing': 0, 'Beta Launch': 0,
    },
    'b0b115dc-912a-4feb-a3c0-3601c9e7c125': {
        'Data Source Inventory': 100, 'ETL Pipeline Development': 80,
        'Data Warehouse Setup': 70, 'Dashboard Development': 40,
        'ML Model Training': 30, 'User Training & Documentation': 10,
        'Production Deployment': 0,
    },
    '5b338e2a-b614-45ff-8da5-d88d9b147744': {
        'Requirements Analysis': 100, 'System Architecture Design': 100,
        'Data Migration Planning': 90, 'Core Module Development': 70,
        'Integration Development': 50, 'User Acceptance Testing': 20,
        'Training & Change Management': 10, 'Go-Live & Deployment': 0,
    },
    '07217c28-7f78-4176-8b10-26a71421d955': {
        'UI/UX Redesign': 100, 'Core Feature Development': 90,
        'API Integration Layer': 70, 'Push Notifications': 60,
        'Offline Mode': 40, 'Performance Optimization': 20,
        'App Store Submission': 0,
    },
}

project_names = {
    'a1f72847-9cb7-454c-8035-5098d9310988': 'Cloud Migration',
    '2814e004-d9e8-4db4-8d2b-87c03142cafe': 'Customer Portal',
    'b0b115dc-912a-4feb-a3c0-3601c9e7c125': 'Data Analytics Platform',
    '5b338e2a-b614-45ff-8da5-d88d9b147744': 'ERP Modernization',
    '07217c28-7f78-4176-8b10-26a71421d955': 'Mobile App Revamp',
}

any_changed = False
for pid, tasks_baseline in baseline.items():
    name = project_names[pid]
    result = subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-H', 'Accept: application/json;odata=verbose',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Tasks?\$select=Id,Name,PercentComplete,IsSummary'
    ], capture_output=True, text=True)

    data = json.loads(result.stdout)
    diffs = []
    for t in data['d']['results']:
        if t['IsSummary']:
            continue
        expected = tasks_baseline.get(t['Name'])
        if expected is not None and t['PercentComplete'] != expected:
            diffs.append((t['Id'], t['Name'], t['PercentComplete'], expected))

    if not diffs:
        print(f'  ✅ {name}: all tasks at baseline')
        continue

    any_changed = True
    print(f'  ⚠️  {name}: {len(diffs)} tasks need reset')

    # Checkout
    subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-X', 'POST', '-H', 'Accept: application/json;odata=verbose',
        '-H', 'Content-Length: 0', '-H', f'X-RequestDigest: {digest}',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/CheckOut()'
    ], capture_output=True)

    # Update tasks
    for tid, tname, current, expected in diffs:
        body = json.dumps({'__metadata': {'type': 'PS.DraftTask'}, 'PercentComplete': expected})
        subprocess.run([
            'curl', '-s', '--ntlm', '-u', ps_auth,
            '-X', 'POST', '-H', 'Accept: application/json;odata=verbose',
            '-H', f'Content-Type: application/json;odata=verbose',
            '-H', f'X-RequestDigest: {digest}',
            '-H', 'X-HTTP-Method: MERGE', '-H', 'IF-MATCH: *',
            '-d', body,
            f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Draft/Tasks(\'{tid}\')'
        ], capture_output=True)
        print(f'      {tname}: {current}% → {expected}%')

    # Publish
    subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-X', 'POST', '-H', 'Accept: application/json;odata=verbose',
        '-H', 'Content-Length: 0', '-H', f'X-RequestDigest: {digest}',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Draft/Publish(true)'
    ], capture_output=True)
    time.sleep(10)
    print(f'      Published ✅')

if not any_changed:
    print('  ✅ All task progress values are at baseline')
"
}

# ───── Show Current State ─────
show_state() {
  echo ""
  echo "════════════════════════════════════════"
  echo "  Current Project Server State"
  echo "════════════════════════════════════════"

  python3 -c "
import subprocess, json

ps_url = '$PS_URL'
ps_auth = '$PS_USER:$PS_PASS'

projects = [
    ('a1f72847-9cb7-454c-8035-5098d9310988', 'Cloud Migration', 8),
    ('2814e004-d9e8-4db4-8d2b-87c03142cafe', 'Customer Portal', 7),
    ('b0b115dc-912a-4feb-a3c0-3601c9e7c125', 'Data Analytics Platform', 7),
    ('5b338e2a-b614-45ff-8da5-d88d9b147744', 'ERP Modernization', 8),
    ('07217c28-7f78-4176-8b10-26a71421d955', 'Mobile App Revamp', 7),
]

for pid, name, expected_assn in projects:
    print(f'\n── {name} ──')

    # Tasks
    result = subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-H', 'Accept: application/json;odata=verbose',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Tasks?\$select=Name,PercentComplete,IsSummary'
    ], capture_output=True, text=True)
    data = json.loads(result.stdout)
    for t in data['d']['results']:
        if not t['IsSummary']:
            pct = t['PercentComplete']
            bar = '█' * (pct // 10) + '░' * (10 - pct // 10)
            print(f'  {bar} {pct:3d}%  {t[\"Name\"]}')

    # Assignment count
    result2 = subprocess.run([
        'curl', '-s', '--ntlm', '-u', ps_auth,
        '-H', 'Accept: application/json;odata=verbose',
        f'{ps_url}/_api/ProjectServer/Projects(\'{pid}\')/Assignments?\$select=Id'
    ], capture_output=True, text=True)
    data2 = json.loads(result2.stdout)
    count = len(data2['d']['results'])
    status = '✅' if count == expected_assn else '⚠️'
    print(f'  {status} Assignments: {count} (baseline: {expected_assn})')

print()
"
}

# ───── Main ─────
echo ""
echo "╔══════════════════════════════════════╗"
echo "║     EPM-AI Demo Reset Script         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check connectivity
if ! curl -s --connect-timeout 5 --ntlm -u "$PS_USER:$PS_PASS" \
  -H "Accept: application/json;odata=verbose" \
  "$PS_URL/_api/ProjectServer/Projects?\$select=Name&\$top=1" >/dev/null 2>&1; then
  log_err "Cannot connect to Project Server at $PS_URL"
  exit 1
fi
log_ok "Connected to Project Server"

case "${1:-}" in
  --check)
    show_state
    ;;
  --checkin)
    force_checkin_all
    ;;
  *)
    force_checkin_all
    remove_extra_assignments
    reset_task_progress
    log_info "Step 4: Cache will auto-refresh (TTL: 300s)"
    echo ""
    log_ok "═══ Demo Reset Complete ═══"
    show_state
    ;;
esac
