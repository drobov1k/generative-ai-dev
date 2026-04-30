import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class DocQaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Storage ---
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // --- Python Lambda (Docker image) ---
    const pythonFn = new lambda.DockerImageFunction(this, "PythonService", {
      code: lambda.DockerImageCode.fromImageAsset("../../services/llm-python"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      environment: {
        DOCUMENT_BUCKET: documentBucket.bucketName,
        VECTOR_STORE: "opensearch",
        MOCK_EMBEDDINGS: "false",
        MOCK_GENERATION: "false",
      },
    });

    documentBucket.grantReadWrite(pythonFn);

    // --- TypeScript Lambda (Node.js bundled handlers) ---
    const commonEnv: Record<string, string> = {
      PYTHON_LAMBDA_ARN: pythonFn.functionArn,
    };

    const makeNodeFn = (id: string, handler: string) =>
      new lambda.Function(this, id, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code: lambda.Code.fromAsset("../../apps/api/dist"),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: commonEnv,
      });

    const healthFn = makeNodeFn("HealthHandler", "handlers/health.handler");
    const uploadFn = makeNodeFn("UploadHandler", "handlers/upload.handler");
    const queryFn = makeNodeFn("QueryHandler", "handlers/query.handler");

    pythonFn.grantInvoke(uploadFn);
    pythonFn.grantInvoke(queryFn);

    // --- API Gateway ---
    const api = new apigateway.RestApi(this, "DocQaApi", {
      restApiName: "Document Q&A API",
      deployOptions: { stageName: "prod" },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    api.root
      .addResource("health")
      .addMethod("GET", new apigateway.LambdaIntegration(healthFn));

    api.root
      .addResource("upload")
      .addMethod("POST", new apigateway.LambdaIntegration(uploadFn));

    api.root
      .addResource("query")
      .addMethod("POST", new apigateway.LambdaIntegration(queryFn));

    // --- Outputs ---
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
    new cdk.CfnOutput(this, "DocumentBucketName", { value: documentBucket.bucketName });
    new cdk.CfnOutput(this, "PythonFunctionArn", { value: pythonFn.functionArn });
  }
}
