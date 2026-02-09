#!/bin/bash
#
# check-bridge.sh — Health check + auto-restart for the PS Bridge Server
#
# Usage:
#   ./check-bridge.sh          # Check and auto-restart if down
#   ./check-bridge.sh --check  # Check only, don't restart
#
# Prerequisites:
#   - gcloud CLI authenticated (run: gcloud auth login)
#   - curl installed
#

set -e

# ── Configuration ──
BRIDGE_URL="http://34.29.110.174:8080"
PROJECT_ID="epm-ai-demo-20260201"
ZONE="us-central1-a"
VM_NAME="epm-trial-server"
TIMEOUT=10
CHECK_ONLY=false

if [ "$1" = "--check" ]; then
  CHECK_ONLY=true
fi

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}  PS Bridge Server Health Check${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# ── Step 1: Check bridge health ──
echo -e "${YELLOW}[1/4]${NC} Checking bridge at ${BRIDGE_URL}/health ..."

HEALTH_RESPONSE=""
HTTP_CODE=""

HTTP_CODE=$(curl -s -o /tmp/bridge_health.json -w "%{http_code}" -m "$TIMEOUT" "${BRIDGE_URL}/health" 2>/dev/null) || true
if [ -f /tmp/bridge_health.json ]; then
  HEALTH_RESPONSE=$(cat /tmp/bridge_health.json)
fi

if [ "$HTTP_CODE" = "200" ] && [ -n "$HEALTH_RESPONSE" ]; then
  echo -e "  ${GREEN}✓ Bridge is UP${NC} (HTTP $HTTP_CODE)"
  echo -e "  Response: $HEALTH_RESPONSE"
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════${NC}"
  echo -e "${GREEN}  All good! Bridge is healthy.${NC}"
  echo -e "${GREEN}═══════════════════════════════════════${NC}"
  echo ""
  exit 0
fi

# Bridge is down
echo -e "  ${RED}✗ Bridge is DOWN${NC} (HTTP: ${HTTP_CODE:-timeout})"

if [ "$CHECK_ONLY" = true ]; then
  echo ""
  echo -e "${RED}Bridge is not responding. Run without --check to auto-restart.${NC}"
  exit 1
fi

# ── Step 2: Check if VM is running ──
echo ""
echo -e "${YELLOW}[2/4]${NC} Checking VM status..."

VM_STATUS=$(gcloud compute instances describe "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --format="get(status)" 2>/dev/null) || {
  echo -e "  ${RED}✗ Could not check VM. Is gcloud authenticated?${NC}"
  echo -e "  Run: ${CYAN}gcloud auth login${NC}"
  exit 1
}

echo -e "  VM Status: ${CYAN}$VM_STATUS${NC}"

if [ "$VM_STATUS" != "RUNNING" ]; then
  echo ""
  echo -e "${YELLOW}  VM is not running. Starting it...${NC}"
  gcloud compute instances start "$VM_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null

  echo -e "  ${GREEN}✓ VM start command sent${NC}"
  echo -e "  Waiting 60 seconds for Windows to boot..."
  sleep 60
fi

# ── Step 3: Restart the bridge via SSH ──
echo ""
echo -e "${YELLOW}[3/4]${NC} Restarting bridge on VM via SSH..."
echo -e "  Connecting to $VM_NAME..."

# Try to restart the scheduled task via gcloud SSH
gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --command="powershell -Command \"
    Write-Host 'Checking PSBridgeServer scheduled task...'
    \$task = Get-ScheduledTask -TaskName 'PSBridgeServer' -ErrorAction SilentlyContinue
    if (\$task) {
      Write-Host 'Found task. Stopping any existing instance...'
      Stop-ScheduledTask -TaskName 'PSBridgeServer' -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 2

      # Also kill any orphan node processes running bridge
      Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object {
        \$_.CommandLine -like '*bridge-server*'
      } | Stop-Process -Force -ErrorAction SilentlyContinue

      Start-Sleep -Seconds 2
      Write-Host 'Starting PSBridgeServer...'
      Start-ScheduledTask -TaskName 'PSBridgeServer'
      Start-Sleep -Seconds 3
      Write-Host 'Task started.'
    } else {
      Write-Host 'PSBridgeServer task not found. Starting bridge manually...'
      Start-Process -FilePath 'cmd.exe' -ArgumentList '/c C:\\ps-bridge\\start-bridge.bat' -WindowStyle Hidden
      Start-Sleep -Seconds 3
      Write-Host 'Bridge started manually.'
    }
  \"" 2>/dev/null && {
  echo -e "  ${GREEN}✓ Restart command executed${NC}"
} || {
  echo -e "  ${YELLOW}⚠ SSH failed. Trying alternative: VM reset...${NC}"
  echo -e "  This will reboot the VM (takes 2-3 minutes)."

  # Set a startup script to ensure bridge starts
  gcloud compute instances add-metadata "$VM_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --metadata=windows-startup-script-cmd="cd C:\\ps-bridge && start /b node bridge-server.js >> C:\\ps-bridge\\bridge.log 2>&1" \
    2>/dev/null

  gcloud compute instances reset "$VM_NAME" \
    --zone="$ZONE" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null

  echo -e "  ${GREEN}✓ VM reset initiated${NC}"
  echo -e "  Waiting 90 seconds for full reboot..."
  sleep 90
}

# ── Step 4: Verify bridge is back ──
echo ""
echo -e "${YELLOW}[4/4]${NC} Verifying bridge is back online..."

MAX_RETRIES=12
RETRY_DELAY=10

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_CODE=$(curl -s -o /tmp/bridge_health.json -w "%{http_code}" -m "$TIMEOUT" "${BRIDGE_URL}/health" 2>/dev/null) || true
  if [ -f /tmp/bridge_health.json ]; then
    HEALTH_RESPONSE=$(cat /tmp/bridge_health.json)
  fi

  if [ "$HTTP_CODE" = "200" ] && [ -n "$HEALTH_RESPONSE" ]; then
    echo -e "  ${GREEN}✓ Bridge is UP!${NC} (attempt $i)"
    echo -e "  Response: $HEALTH_RESPONSE"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Bridge recovered successfully!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    exit 0
  fi

  echo -e "  Attempt $i/$MAX_RETRIES — not ready yet, waiting ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
done

# Failed to recover
echo ""
echo -e "${RED}═══════════════════════════════════════${NC}"
echo -e "${RED}  Bridge did not recover.${NC}"
echo -e "${RED}═══════════════════════════════════════${NC}"
echo ""
echo -e "Manual steps:"
echo -e "  1. RDP into the VM: ${CYAN}gcloud compute instances get-serial-port-output $VM_NAME --zone=$ZONE${NC}"
echo -e "  2. Open PowerShell as Admin"
echo -e "  3. Run: ${CYAN}cd C:\\ps-bridge && node bridge-server.js${NC}"
echo -e "  4. Check: ${CYAN}curl $BRIDGE_URL/health${NC}"
echo ""
exit 1
