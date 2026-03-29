# SkyVault

## 1. Project Overview and Feature List

SkyVault is a full-stack cloud file management platform built for AWS Academy sandbox constraints. It supports secure authentication, file uploads, storage quota tracking, version history, restore workflows, and expiring share links.

### Core features

- JWT-based user authentication (register/login)
- File upload to AWS S3 (metadata in MongoDB Atlas)
- Personal storage tracking and quota awareness
- Soft delete (trash), restore, and permanent delete
- File version history and restore-to-new-version workflow
- Expiring file share links
- Request logging with Winston
- Containerized deployment with K3s on EC2

## 2. Architecture Description

SkyVault uses a split architecture:

- Frontend: React + Vite SPA
- Backend: Node.js + Express REST API
- Database: MongoDB Atlas
- Object storage: AWS S3
- Orchestration: K3s on EC2 `t2.micro`
- Public access via NodePorts:
	- Backend API: `30080`
	- Frontend UI: `30081`

### Runtime flow

1. User opens frontend on EC2 NodePort `30081`.
2. Frontend calls backend API on NodePort `30080`.
3. Backend validates JWT and applies business rules (quota/version/share).
4. File binaries are stored in S3; metadata/state is stored in MongoDB Atlas.

## 3. Tech Stack with Versions

### Backend (`server/package.json`)

- Node.js target: `22.x`
- express `^5.2.1`
- mongoose `^8.23.0`
- jsonwebtoken `^9.0.3`
- bcryptjs `^2.4.3`
- multer `^1.4.4`
- @aws-sdk/client-s3 `^3.1018.0`
- @aws-sdk/s3-request-presigner `^3.1018.0`
- winston `^3.19.0`
- jest `^29.7.0`
- supertest `^7.2.2`
- mongodb-memory-server `^10.4.3`

### Frontend (`client/package.json`)

- react `^19.2.4`
- react-dom `^19.2.4`
- vite `^8.0.1`
- react-router-dom `^7.13.2`
- @tanstack/react-query `^5.95.2`
- axios `^1.13.6`
- tailwindcss `^4.2.2`
- @tailwindcss/vite `^4.2.2`
- shadcn `^4.1.1`
- lucide-react `^1.7.0`
- sonner `^2.0.7`
- vitest `^2.1.9`
- @testing-library/react `^16.3.2`

### Deployment/tooling

- Docker image build/save/load workflow
- K3s on EC2 (`containerd` image import)
- Nginx for frontend container serving

## 4. Local Setup

### Prerequisites

- Node.js `22.x`
- npm
- Docker Desktop (for image build/deploy workflows)
- MongoDB Atlas cluster
- AWS sandbox credentials (Access Key, Secret Key, Session Token)

### Environment variables

Create `server/.env` from `server/.env.example` and fill all values:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`
- `S3_BUCKET_NAME`

Optional frontend env:

- `client/.env` with `VITE_API_BASE_URL=http://localhost:5000/api`

### Install

```bash
cd server && npm install
cd ../client && npm install
```

### Run locally

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

### Test

Backend:

```bash
cd server
npm test
```

Frontend:

```bash
cd client
npx vitest run
```

## 5. AWS Academy Sandbox Deployment

No ECR is used. Images are transferred via SCP and imported into K3s containerd.

### A. Session-start flow (new sandbox session)

```bash
bash deploy/session-start.sh <EC2_PUBLIC_IP>
```

What it does:

1. Waits for EC2 SSH readiness
2. Installs K3s
3. Copies `server/.env` to EC2 as `skyvault.env`
4. Builds/transfers backend + frontend images (if missing tar files)
5. Imports images into K3s and applies manifests

### B. Code-change deploy flow

```bash
bash deploy/deploy.sh <EC2_PUBLIC_IP>
```

What it does:

1. Runs backend tests
2. Builds frontend production bundle
3. Builds/transfers backend + frontend images
4. Imports images + restarts K3s deployments
5. Runs health check

### C. Health check flow

```bash
EC2_IP=<EC2_PUBLIC_IP> bash deploy/health-check.sh
```

Expected URLs after successful deploy:

- Backend health: `http://<EC2_PUBLIC_IP>:30080/api/health`
- Frontend app: `http://<EC2_PUBLIC_IP>:30081`

## 6. Script Reference

- `deploy/session-start.sh`
	- Use at start of each new AWS sandbox session.
	- Full bootstrap: K3s + env transfer + image transfer + manifest apply.

- `deploy/deploy.sh`
	- Use after code changes.
	- Test, build, transfer, restart, and health-check in one flow.

- `deploy/health-check.sh`
	- Retries backend health endpoint for up to 60 seconds.
	- Use after deploy or for quick status checks.

- `deploy/build-and-transfer.sh`
	- Manual image build/save/transfer/import flow.
	- Useful for troubleshooting image sync.

- `k8s/apply-all.sh`
	- Applies namespace, secrets (from env file), deployments/services, rollout waits.

## 7. API Endpoint Summary

Base prefix: `/api`

### Health

- `GET /health`

### Auth

- `POST /auth/register`
- `POST /auth/login`

### User

- `GET /users/me`

### Files

- `POST /files/upload`
- `GET /files`
- `GET /files/trash`
- `GET /files/:id/download`
- `DELETE /files/:id`
- `POST /files/:id/restore`
- `DELETE /files/:id/permanent`

### Versions

- `GET /files/:id/versions`
- `POST /files/:id/restore-version`

### Sharing

- `POST /files/:id/share`
- `GET /files/:id/shares`

## 8. Troubleshooting

### AWS token expiry / S3 auth failures

- Symptom: `InvalidClientTokenId` or S3 auth errors
- Fix:
	1. Refresh sandbox credentials
	2. Update `server/.env`
	3. Re-copy to EC2 as `/home/ec2-user/skyvault.env`
	4. Redeploy

### Image pull / missing image in cluster

- Symptom: pod fails due to image availability
- Notes: `imagePullPolicy: Never` means image must exist locally in K3s runtime.
- Fix: rerun `deploy/build-and-transfer.sh <EC2_PUBLIC_IP>` or `deploy/deploy.sh <EC2_PUBLIC_IP>`.

### Pod OOMKilled

- Symptom: pod restarts with OOMKilled
- Fix:
	1. Keep `replicas: 1`
	2. Verify resource requests/limits in Kubernetes manifests
	3. Avoid large concurrent uploads on `t2.micro`

### MongoDB connection refused

- Symptom: backend cannot connect to Atlas
- Fix:
	1. Verify `MONGODB_URI`
	2. Atlas Network Access includes `0.0.0.0/0` (sandbox-safe temporary rule)

## 9. CloudWatch Monitoring Setup

Use the detailed guide:

- `docs/cloudwatch-setup.md`

Quick summary:

1. SSH into EC2
2. Install CloudWatch Agent
3. Add agent config for `/var/log/containers/*skyvault-backend*.log`
4. Start + enable agent
5. Verify log group `/skyvault/backend` in AWS Console

CloudWatch is for backend observability and debugging; it is not displayed in the website UI.

## 10. Demo Recording Checklist

Before recording:

1. New sandbox session started
2. `session-start.sh` completed successfully
3. Health endpoint returns `200`
4. Frontend loads at NodePort `30081`

During recording, show this order:

1. Register
2. Login
3. Upload file
4. List file on dashboard
5. Download file
6. Soft delete to trash
7. Restore from trash
8. Upload another version and open version history
9. Restore a previous version
10. Generate and copy share link
11. Optional: quick CloudWatch log proof in AWS Console

After recording:

1. Confirm final health check
2. Keep script outputs/screenshots if evaluator requests evidence

## 11. Limitations and Assumptions

- Designed for AWS Academy sandbox constraints (ephemeral infrastructure).
- Temporary AWS credentials must be rotated and updated manually each session.
- No ECR usage; images are transferred via SCP tar workflow.
- EC2 target profile: `t2.micro`, so resource limits and replica count are conservative.
- NodePort exposure is used for simplicity in sandbox.
- CloudWatch setup is optional for UI demo but recommended for observability.

