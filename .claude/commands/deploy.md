---
description: Build and deploy the stack to AWS via CDK
---

Deploy the Document Q&A stack to AWS.

Steps:
1. **Pre-flight checks**
   - Confirm AWS credentials are configured: `aws sts get-caller-identity`
   - Check CDK bootstrap: `npx cdk bootstrap --show-template` (only needed once per account/region)

2. **Build TypeScript API**
   - `npm run build --workspace=apps/api`
   - Show any build errors and stop if they exist

3. **Build shared types**
   - `npm run build --workspace=packages/shared`

4. **CDK synth** (dry run — no AWS calls)
   - `npm run cdk:synth` from repo root
   - Show the resource summary from the synth output

5. **Confirm before deploying**
   - Ask the user: "Ready to deploy to AWS? This will create/update Lambda functions, API Gateway, and S3 bucket."
   - Only proceed if the user confirms

6. **CDK deploy**
   - `npm run cdk:deploy`
   - Show the CloudFormation outputs (ApiUrl, DocumentBucketName, PythonFunctionArn)

7. **Smoke test the deployed API**
   - Hit the `ApiUrl/health` endpoint and show the response

If $ARGUMENTS is `--dry-run`, stop after step 4 without prompting to deploy.
