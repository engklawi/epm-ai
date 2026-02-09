#!/bin/bash
#
# Deploy the PS Bridge Server to the Project Server VM.
#
# Usage: ./deploy-to-vm.sh
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - VM "epm-trial-server" running in us-central1-a
#

set -e

PROJECT_ID="epm-ai-demo-20260201"
ZONE="us-central1-a"
VM_NAME="epm-trial-server"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying PS Bridge to $VM_NAME ==="

# 1. Copy files to VM
echo ""
echo "[1/3] Copying files to VM..."
gcloud compute scp \
  "$SCRIPT_DIR/bridge-server.js" \
  "$SCRIPT_DIR/Invoke-PSAssignment.ps1" \
  "$SCRIPT_DIR/setup-bridge.ps1" \
  "$VM_NAME:C:/ps-bridge/" \
  --zone="$ZONE" \
  --project="$PROJECT_ID"

echo "  Files copied successfully"

# 2. Run setup script on the VM
echo ""
echo "[2/3] Running setup on VM..."
gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --command="powershell -ExecutionPolicy Bypass -File C:\\ps-bridge\\setup-bridge.ps1"

# 3. Open firewall rule in GCP (if not already open)
echo ""
echo "[3/3] Ensuring GCP firewall allows port 8080..."
gcloud compute firewall-rules describe allow-ps-bridge \
  --project="$PROJECT_ID" >/dev/null 2>&1 || \
gcloud compute firewall-rules create allow-ps-bridge \
  --project="$PROJECT_ID" \
  --allow=tcp:8080 \
  --target-tags=ps-bridge \
  --description="Allow PS Bridge Server port 8080"

# Tag the VM (if not tagged)
gcloud compute instances add-tags "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT_ID" \
  --tags=ps-bridge 2>/dev/null || true

echo ""
echo "=== Deployment Complete ==="
echo "Bridge URL: http://34.29.110.174:8080/health"
echo "Test:       curl http://34.29.110.174:8080/health"
