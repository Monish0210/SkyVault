#!/bin/bash
set -euo pipefail

EC2_IP=${1:?"Usage: $0 <EC2_IP>"}
PEM_FILE=${PEM_FILE:-"$HOME/Downloads/labsuser.pem"}
EC2_USER="ec2-user"

echo "Step 1/5: Running backend tests..."
cd server
npm test -- --forceExit || {
	echo "Tests failed. Aborting."
	exit 1
}
cd ..

echo "Step 2/5: Building frontend production bundle..."
cd client
npm run build
cd ..

echo "Step 3/5: Building and transferring Docker images..."
docker build -f docker/Dockerfile.backend -t skyvault-backend:latest .
docker save skyvault-backend:latest -o skyvault-backend.tar
docker build -f docker/Dockerfile.frontend --build-arg VITE_API_BASE_URL="http://$EC2_IP:30080/api" -t skyvault-frontend:latest .
docker save skyvault-frontend:latest -o skyvault-frontend.tar
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no skyvault-backend.tar skyvault-frontend.tar "$EC2_USER@$EC2_IP:/home/ec2-user/"

echo "Step 4/5: Loading images and restarting K3s deployments..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "
	sudo k3s ctr images import /home/ec2-user/skyvault-backend.tar &&
	sudo k3s ctr images import /home/ec2-user/skyvault-frontend.tar &&
	sudo k3s kubectl rollout restart deployment/skyvault-backend -n skyvault &&
	sudo k3s kubectl rollout restart deployment/skyvault-frontend -n skyvault &&
	sudo k3s kubectl rollout status deployment/skyvault-backend -n skyvault --timeout=120s
"

echo "Step 5/5: Running health check..."
EC2_IP="$EC2_IP" ./deploy/health-check.sh

echo "Deploy complete. App: http://$EC2_IP:30081"

