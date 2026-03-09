// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "dashrock",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const region = process.env.AWS_REGION || "us-east-2";
    const logGroup = process.env.DASHROCK_LOG_GROUP || "bedrock-logs";
    const domainName = process.env.DASHROCK_DOMAIN;
    const domainZone = process.env.DASHROCK_ZONE_ID;
    const authUser = new sst.Secret("DashrockUser");
    const authPass = new sst.Secret("DashrockPass");

    // S3 bucket for aggregated dashboard data
    const dataBucket = new sst.aws.Bucket("DashrockData", {
      access: "cloudfront",
    });

    const collectorPermissions = [
      {
        actions: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
        resources: [$interpolate`${dataBucket.arn}`, $interpolate`${dataBucket.arn}/*`],
      },
      {
        actions: [
          "logs:StartQuery",
          "logs:GetQueryResults",
          "logs:FilterLogEvents",
        ],
        resources: [
          $interpolate`arn:aws:logs:${region}:${aws.getCallerIdentityOutput().accountId}:log-group:${logGroup}:*`,
        ],
      },
    ];

    const collectorEnv = {
      DATA_BUCKET: dataBucket.name,
      LOG_GROUP: logGroup,
      AWS_REGION_NAME: region,
    };

    // EventBridge scheduled rule: run collector every hour
    new sst.aws.Cron("CollectorSchedule", {
      schedule: "rate(1 hour)",
      job: {
        handler: "functions/collector.handler",
        runtime: "nodejs20.x",
        timeout: "5 minutes",
        memory: "512 MB",
        environment: collectorEnv,
        permissions: collectorPermissions,
      },
    });

    // Basic auth via CloudFront function (optional, set via `npx sst secret set`)
    const basicAuth = $resolve([authUser.value, authPass.value]).apply(
      ([user, pass]) =>
        Buffer.from(`${user}:${pass}`).toString("base64"),
    );

    // Next.js dashboard
    const site = new sst.aws.Nextjs("Dashboard", {
      edge: {
        viewerRequest: {
          injection: $interpolate`
            if (
                !event.request.headers.authorization
                  || event.request.headers.authorization.value !== "Basic ${basicAuth}"
               ) {
              return {
                statusCode: 401,
                headers: {
                  "www-authenticate": { value: "Basic" }
                }
              };
            }`,
        },
      },
      environment: {
        DATA_BUCKET: dataBucket.name,
        AWS_REGION_NAME: region,
      },
      permissions: [
        {
          actions: ["s3:GetObject", "s3:ListBucket"],
          resources: [$interpolate`${dataBucket.arn}`, $interpolate`${dataBucket.arn}/*`],
        },
      ],
      domain: domainName
        ? {
            name: domainName,
            redirects: [`www.${domainName}`],
            dns: domainZone
              ? sst.aws.dns({ zone: domainZone })
              : sst.aws.dns(),
          }
        : undefined,
    });

    return {
      url: site.url,
      bucket: dataBucket.name,
    };
  },
});
