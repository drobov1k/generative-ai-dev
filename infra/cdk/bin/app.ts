import * as cdk from "aws-cdk-lib";
import { DocQaStack } from "../lib/stack";

const app = new cdk.App();

new DocQaStack(app, "DocQaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
  tags: {
    Project: "generative-ai-dev",
    ManagedBy: "cdk",
  },
});
