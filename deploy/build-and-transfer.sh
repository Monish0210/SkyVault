#!/bin/bash
set -euo pipefail

# Usage: ./deploy/build-and-transfer.sh <EC2_PUBLIC_IP>
# Example: ./deploy/build-and-transfer.sh 54.123.45.67
# Builds BOTH backend and frontend Docker images and transfers them to EC2.

EC2_IP=${1:?"ERROR: EC2 public IP required. Usage: $0 <EC2_IP>"}
PEM_FILE=${PEM_FILE:-"$HOME/Downloads/labsuser.pem"}
EC2_USER="ec2-user"

# The EC2 IP is needed at build time so nginx can proxy /api/ calls correctly
VITE_API_URL="http://$EC2_IP:30080/api"

if [ ! -f "$PEM_FILE" ]; then
  echo "ERROR: PEM file not found at $PEM_FILE"
  echo "Download labsuser.pem from sandbox Details panel and set PEM_FILE env var"
  exit 1
fi

# Step 1: Build backend image
echo "Step 1/6: Building backend Docker image..."
docker build -f docker/Dockerfile.backend -t skyvault-backend:latest .

# Step 2: Build frontend image (pass EC2 IP as build arg so API URL is correct)
echo "Step 2/6: Building frontend Docker image (VITE_API_BASE_URL=$VITE_API_URL)..."
docker build -f docker/Dockerfile.frontend --build-arg VITE_API_BASE_URL="$VITE_API_URL" -t skyvault-frontend:latest .

# Step 3: Save both images to tar files
echo "Step 3/6: Saving images to tar files..."
docker save skyvault-backend:latest -o skyvault-backend.tar
docker save skyvault-frontend:latest -o skyvault-frontend.tar
echo "Backend size: $(du -sh skyvault-backend.tar | cut -f1)"
echo "Frontend size: $(du -sh skyvault-frontend.tar | cut -f1)"

# Step 4: Transfer both tars to EC2
echo "Step 4/6: Copying images to EC2 at $EC2_IP (takes 2-4 minutes)..."
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no skyvault-backend.tar skyvault-frontend.tar "$EC2_USER@$EC2_IP:/home/ec2-user/"

# Step 5: Load both images into K3s containerd
echo "Step 5/6: Loading images into K3s..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
  sudo k3s ctr images import /home/ec2-user/skyvault-backend.tar
  sudo k3s ctr images import /home/ec2-user/skyvault-frontend.tar
  echo 'Images loaded:'
  sudo k3s ctr images ls | grep skyvault
"

echo ""
echo "Step 6/6: Done."
echo "SUCCESS: Both images transferred and loaded into K3s"
echo "Now run ./deploy/session-start.sh $EC2_IP to apply K8s manifests"
