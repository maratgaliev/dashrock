# Dashrock

Open-source analytics dashboard for AWS Bedrock. Deploy to your own AWS account and get visibility into AI adoption, token usage, cost, and performance across your organization.

## What you get

- **Adoption** — Which teams, apps, and models are active
- **Usage** — Token consumption breakdown by model, team, and app
- **Cost** — Spend analysis with automatic per-model pricing
- **Performance** — Latency percentiles, error rates, throughput

Dashrock runs entirely in your AWS account. No data leaves your infrastructure.

## Prerequisites

- **AWS account** with credentials configured (`aws sts get-caller-identity` should work)
- **Bedrock model invocation logging** enabled to CloudWatch Logs ([how to enable](#1-enable-bedrock-logging))
- **Node.js** 20+

## Quick start

```bash
git clone https://github.com/maratgaliev/dashrock.git
cd dashrock
npm install
AWS_PROFILE=your-profile npm run deploy
```

Replace `your-profile` with your AWS CLI profile name. If you use default credentials, you can omit `AWS_PROFILE`:

```bash
npm run deploy
```

This deploys to the `production` stage by default. When it finishes, you'll see:

```
✓  Complete
   url: https://d1abc2def3.cloudfront.net
   bucket: dashrock-production-dashrockdata-abc123
```

Open the URL — that's your dashboard. The collector runs every hour and pulls data from CloudWatch Logs automatically.

## AWS setup

### 1. Enable Bedrock logging

Go to **Amazon Bedrock > Settings > Model invocation logging** in the AWS Console:

1. Enable **CloudWatch Logs**
2. Set the log group name (default: `bedrock-logs`)
3. Select a service role (create one if prompted)
4. Save

Any Bedrock API call made after this will be logged and picked up by the collector.

### 2. IAM permissions

**For deploying**, the IAM user or role running `npm run deploy` needs broad permissions (CloudFormation, Lambda, S3, IAM, CloudFront, EventBridge, etc.). See [`iam-policy.json`](iam-policy.json) for the full policy.

**At runtime**, SST automatically creates scoped roles for the Lambda functions. The collector only needs CloudWatch Logs read access and S3 read/write to its own bucket. See [`iam-policy-runtime.json`](iam-policy-runtime.json) for reference.

**AWS SSO users:**

```bash
aws sso login --profile my-profile
AWS_PROFILE=my-profile npm run deploy
```

### 3. Verify it works

After deploy, trigger the collector manually to pull any existing logs:

```bash
aws lambda invoke \
  --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'CollectorSchedule')].FunctionName" --output text) \
  /tmp/dashrock-out.json && cat /tmp/dashrock-out.json
```

You should see `"Processed N new events"`. Refresh the dashboard to see data.

## Configure team and app mappings

Map IAM principals (user ARNs, role ARNs) to human-readable team and app names:

```bash
cp dashrock.config.example.yaml dashrock.config.yaml
```

Edit `dashrock.config.yaml`:

```yaml
teams:
  engineering:
    - arn:aws:iam::123456789012:role/engineering-role
    - arn:aws:iam::123456789012:user/alice
  data-science:
    - arn:aws:iam::123456789012:role/ds-role

apps:
  my-chatbot:
    - arn:aws:iam::123456789012:role/chatbot-role
  internal-tools:
    - arn:aws:iam::123456789012:role/tools-role
```

Upload it to the S3 bucket:

```bash
npm run upload-config
```

The collector reads this config from S3 on every run. Update and re-upload anytime — no redeploy needed. Unmapped ARNs appear as their IAM username.

Default model pricing is built-in for Claude, Titan, and other common models. Override or add models in the `pricing` section of the config.

## Architecture

```
CloudWatch Logs (Bedrock invocation logs)
        |
  EventBridge (hourly)
        |
  Lambda collector  -->  S3 bucket (raw + daily/monthly aggregates)
                              |
                       Next.js dashboard (CloudFront + Lambda)
```

All resources are serverless. Monthly cost is near zero for typical usage.

## Configuration

| Variable | Default | Description |
|---|---|---|
| `AWS_PROFILE` | _(default)_ | AWS CLI profile to use for deployment |
| `DASHROCK_LOG_GROUP` | `bedrock-logs` | CloudWatch Logs group where Bedrock logs are written |
| `AWS_REGION` | `us-east-2` | Region where Bedrock logging is configured |
| `DASHROCK_DOMAIN` | _(none)_ | Optional custom domain (e.g. `analytics.example.com`) |
| `DASHROCK_ZONE_ID` | _(auto)_ | Route 53 hosted zone ID, only needed if auto-detection fails |

Example with custom region and log group:

```bash
AWS_REGION=us-west-2 DASHROCK_LOG_GROUP=my-bedrock-logs AWS_PROFILE=my-profile npm run deploy
```

### HTTP basic auth (optional)

Protect the dashboard with basic auth via SST secrets. Auth is enabled when both secrets are set:

```bash
npx sst secret set DashrockUser my-username --stage production
npx sst secret set DashrockPass my-password --stage production
npm run deploy
```

To disable auth, remove the secrets and redeploy.

## Local development

```bash
npm run dev
```

Runs Next.js on `localhost:3000`. Without a `DATA_BUCKET` env var, the dashboard shows an empty state. To develop against real data, set `DATA_BUCKET` to your S3 bucket name and ensure AWS credentials are configured.

## Stack

- [Next.js](https://nextjs.org) — Dashboard UI
- [SST](https://sst.dev) — Infrastructure as code
- [Chart.js](https://www.chartjs.org) — Visualizations
- [daub.dev](https://daub.dev) — UI components
- AWS Lambda, S3, CloudFront, EventBridge

## License

MIT
