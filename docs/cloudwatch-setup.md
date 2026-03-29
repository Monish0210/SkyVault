# CloudWatch Setup (Post-Phase 6)

This guide configures log shipping for SkyVault backend logs after Kubernetes deployment on EC2.

## Step 1: Install CloudWatch agent

```bash
sudo dnf install -y amazon-cloudwatch-agent
```

## Step 2: Create agent config

Create this file:

`/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`

```json
{
	"logs": {
		"logs_collected": {
			"files": {
				"collect_list": [
					{
						"file_path": "/var/log/containers/*skyvault-backend*.log",
						"log_group_name": "/skyvault/backend",
						"log_stream_name": "{instance_id}",
						"timezone": "UTC"
					}
				]
			}
		}
	}
}
```

## Step 3: Start agent

```bash
sudo systemctl start amazon-cloudwatch-agent
```

## Step 4: Enable on boot

```bash
sudo systemctl enable amazon-cloudwatch-agent
```

## Step 5: Verify in AWS Console

Open CloudWatch and confirm the log group appears:

`/skyvault/backend`

## Notes

- `LabInstanceProfile` already has CloudWatch permissions.
- No AWS credentials need to be configured on the EC2 host.
- Backend production logs are structured JSON on stdout (Winston), which CloudWatch agent tails from container log files.

