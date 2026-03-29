#!/bin/bash
set -euo pipefail

ENV_FILE="/home/ec2-user/skyvault.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

echo "Applying namespace..."
sudo k3s kubectl apply -f k8s/namespace.yaml

echo "Creating/updating secrets from env file..."
sudo k3s kubectl create secret generic skyvault-secrets --from-env-file="$ENV_FILE" -n skyvault --dry-run=client -o yaml | sudo k3s kubectl apply -f -

sudo k3s kubectl apply -f k8s/backend-deployment.yaml
sudo k3s kubectl apply -f k8s/backend-service.yaml
sudo k3s kubectl apply -f k8s/frontend-deployment.yaml
sudo k3s kubectl apply -f k8s/frontend-service.yaml

echo "Waiting for backend rollout..."
sudo k3s kubectl rollout status deployment/skyvault-backend -n skyvault --timeout=120s
echo "Waiting for frontend rollout..."
sudo k3s kubectl rollout status deployment/skyvault-frontend -n skyvault --timeout=120s
sudo k3s kubectl get pods -n skyvault

echo "Done. Backend: http://$(curl -s ifconfig.me):30080/api/health"
echo " Frontend: http://$(curl -s ifconfig.me):30081"

