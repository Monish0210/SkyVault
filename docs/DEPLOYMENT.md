# SkyVault Deployment Guide

## Section 1: Prerequisites

- AWS Academy sandbox account with active EC2 instance.
- Key pair file at `$HOME/Downloads/labsuser.pem` (or set `PEM_FILE`).
- Docker available on local machine for image builds.
- Node.js dependencies installed in `server/` and `client/`.
- MongoDB Atlas URI configured in `server/.env` and copied to EC2 as `skyvault.env`.

## Section 2: Sandbox Session Workflow (Every Session)

1. Start a fresh sandbox and launch a new EC2 instance.
2. Run `deploy/session-start.sh <EC2_PUBLIC_IP>`.
3. Confirm backend health at `http://<EC2_PUBLIC_IP>:30080/api/health`.
4. Open app at `http://<EC2_PUBLIC_IP>:30081`.
5. If AWS credentials rotated, update `server/.env` and re-copy to EC2 as `/home/ec2-user/skyvault.env`.

## Section 3: First-Time Setup (Phases 0-6)

1. Clone repository and install dependencies in `server/` and `client/`.
2. Configure `server/.env` with MongoDB, JWT, and AWS sandbox credentials.
3. Build and transfer images once using `deploy/build-and-transfer.sh <EC2_PUBLIC_IP>`.
4. Apply Kubernetes manifests in `k8s/`.
5. Verify NodePort services:
	 - Backend: `30080`
	 - Frontend: `30081`

## Section 4: Code Change Deploy Workflow (Use deploy.sh)

After code changes:

1. Run `deploy/deploy.sh <EC2_PUBLIC_IP>`.
2. Script automatically:
	 - runs backend tests,
	 - builds frontend bundle,
	 - builds/saves/transfers backend and frontend images,
	 - imports images into K3s,
	 - restarts deployments,
	 - runs health check.

## Section 5: Troubleshooting

- ImagePullBackOff:
	- With `imagePullPolicy: Never`, this usually means image is not loaded in K3s.
	- Re-run `deploy/build-and-transfer.sh <EC2_PUBLIC_IP>`.
- Pod OOMKilled:
	- Check resource limits in Kubernetes manifests.
	- Ensure `replicas: 1` for both frontend and backend on t2.micro.
- S3 InvalidClientTokenId:
	- Sandbox credentials expired.
	- Update `server/.env` and `/home/ec2-user/skyvault.env` on EC2.
- MongoDB connection refused:
	- Ensure Atlas Network Access allows `0.0.0.0/0`.

## Section 6: Post-Submission

No cleanup is required. The sandbox environment auto-deletes all resources when the session ends.

