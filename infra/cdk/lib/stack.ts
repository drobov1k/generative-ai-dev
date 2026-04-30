import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
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

    // --- Auth: Cognito User Pool with Google federation ---
    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const googleIdP = new cognito.UserPoolIdentityProviderGoogle(this, "GoogleIdP", {
      userPool,
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecretValue: cdk.SecretValue.unsafePlainText(
        process.env.GOOGLE_CLIENT_SECRET ?? ""
      ),
      scopes: ["email", "profile", "openid"],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          "http://localhost:3000/api/auth/callback/cognito",
        ],
        logoutUrls: [
          "http://localhost:3000/login",
        ],
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
    });

    // Ensure Google IdP is registered before the client is created
    userPoolClient.node.addDependency(googleIdP);

    const userPoolDomain = new cognito.UserPoolDomain(this, "UserPoolDomain", {
      userPool,
      cognitoDomain: { domainPrefix: "gen-ai-dev" },
    });

    // --- RAG Lambda (Docker image) ---
    // Owns all RAG logic: ingestion, embeddings, retrieval, generation
    const ragFn = new lambda.DockerImageFunction(this, "RagService", {
      code: lambda.DockerImageCode.fromImageAsset("../../services/rag-service"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      environment: {
        DOCUMENT_BUCKET: documentBucket.bucketName,
        VECTOR_STORE: "opensearch",
        MOCK_EMBEDDINGS: "false",
        MOCK_GENERATION: "false",
      },
    });

    documentBucket.grantReadWrite(ragFn);

    // --- TypeScript Lambda (Node.js bundled handlers) ---
    // TODO: integration pattern between TS handlers and Python service is TBD
    const makeNodeFn = (id: string, handler: string) =>
      new lambda.Function(this, id, {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code: lambda.Code.fromAsset("../../apps/api/dist"),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
      });

    const healthFn = makeNodeFn("HealthHandler", "handlers/health.handler");
    const uploadFn = makeNodeFn("UploadHandler", "handlers/upload.handler");
    const queryFn = makeNodeFn("QueryHandler", "handlers/query.handler");

    // --- API Gateway ---
    const api = new apigateway.RestApi(this, "DocQaApi", {
      restApiName: "Document Q&A API",
      deployOptions: { stageName: "prod" },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuth",
      { cognitoUserPools: [userPool] }
    );

    api.root
      .addResource("health")
      .addMethod("GET", new apigateway.LambdaIntegration(healthFn));

    api.root
      .addResource("upload")
      .addMethod("POST", new apigateway.LambdaIntegration(uploadFn), {
        authorizer: cognitoAuthorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

    api.root
      .addResource("query")
      .addMethod("POST", new apigateway.LambdaIntegration(queryFn), {
        authorizer: cognitoAuthorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

    // --- Outputs ---
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
    new cdk.CfnOutput(this, "DocumentBucketName", { value: documentBucket.bucketName });
    new cdk.CfnOutput(this, "RagServiceFunctionArn", { value: ragFn.functionArn });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, "CognitoDomain", {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
    });
  }
}
