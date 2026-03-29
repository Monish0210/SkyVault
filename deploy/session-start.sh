#!/bin/bash
# Run once after clone: chmod +x deploy/session-start.sh
set -euo pipefail

# -----------------------------------------------------
# SKYVAULT SESSION-START SCRIPT
# Run this at the start of EVERY new sandbox session.
# It launches a fresh EC2, installs K3s, transfers the
# Docker images, and deploys everything. Takes ~5 minutes.
# -----------------------------------------------------

EC2_IP=${1:?"Usage: $0 <NEW-EC2-PUBLIC-IP>"}
PEM_FILE=${PEM_FILE:-"$HOME/Downloads/labsuser.pem"}
EC2_USER="ec2-user"

echo "===== SkyVault Session Start ====="
echo "EC2 IP: $EC2_IP"
echo "PEM: $PEM_FILE"
echo ""

# Wait for EC2 to be ready for SSH (it needs ~60s after launch)
echo "Waiting for EC2 to be SSH-ready..."
EC2_READY=0
for i in $(seq 1 12); do
	if ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$EC2_USER@$EC2_IP" "echo ready" 2>/dev/null; then
		echo "EC2 is ready."
		EC2_READY=1
		break
	fi
	echo "Attempt $i/12 - waiting 10s..."
	sleep 10
done

if [ "$EC2_READY" -ne 1 ]; then
	echo "EC2 did not become SSH-ready in time."
	exit 1
fi

# Install K3s on fresh EC2
echo ""
echo "Step 1/5: Installing K3s..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
	sudo dnf update -y -q
	curl -sfL https://get.k3s.io | sh -
	sleep 30
	sudo k3s kubectl create namespace skyvault --dry-run=client -o yaml | sudo k3s kubectl apply -f -
	echo 'K3s ready'
"

# Transfer environment file
echo ""
echo "Step 2/5: Transferring environment file..."
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no server/.env "$EC2_USER@$EC2_IP:/home/ec2-user/skyvault.env"
echo "NOTE: Update AWS credentials in skyvault.env if they have rotated"

# Transfer Docker images (backend + frontend)
echo ""
echo "Step 3/5: Transferring Docker images (takes 2-4 minutes)..."
if [ ! -f "skyvault-backend.tar" ] || [ ! -f "skyvault-frontend.tar" ]; then
	echo "Building images (tar files not found)..."
	docker build -f docker/Dockerfile.backend -t skyvault-backend:latest .
	docker save skyvault-backend:latest -o skyvault-backend.tar
	docker build -f docker/Dockerfile.frontend --build-arg VITE_API_BASE_URL="http://$EC2_IP:30080/api" -t skyvault-frontend:latest .
	docker save skyvault-frontend:latest -o skyvault-frontend.tar
fi
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no skyvault-backend.tar skyvault-frontend.tar "$EC2_USER@$EC2_IP:/home/ec2-user/"

# Load both images into K3s
echo ""
echo "Step 4/5: Loading both images into K3s..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "sudo k3s ctr images import /home/ec2-user/skyvault-backend.tar && sudo k3s ctr images import /home/ec2-user/skyvault-frontend.tar && sudo k3s ctr images ls | grep skyvault"

# Copy k8s manifests and apply
echo ""
echo "Step 5/5: Applying Kubernetes manifests..."
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no -r k8s/ "$EC2_USER@$EC2_IP:/home/ec2-user/"
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "chmod +x /home/ec2-user/k8s/apply-all.sh && /home/ec2-user/k8s/apply-all.sh"

echo ""
echo "===== Deployment Complete ====="
echo "Backend health: http://$EC2_IP:30080/api/health"
echo "Frontend app: http://$EC2_IP:30081"
echo ""
echo "Open http://$EC2_IP:30081 in your browser to verify."

