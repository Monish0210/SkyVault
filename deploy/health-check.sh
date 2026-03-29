#!/bin/bash

EC2_IP=${EC2_IP:-localhost}
URL="http://$EC2_IP:30080/api/health"

for i in $(seq 1 12); do
	STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")
	[ "$STATUS" -eq 200 ] && echo "Health check passed (attempt $i)" && exit 0
	echo "Attempt $i/12: HTTP $STATUS, retrying in 5s..."
	sleep 5
done

echo "ERROR: Health check failed after 60 seconds"
exit 1

