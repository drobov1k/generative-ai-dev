import { APIGatewayProxyHandler } from "aws-lambda";
import type { HealthResponse } from "@gen-ai/shared";

export const handler: APIGatewayProxyHandler = async () => {
  const body: HealthResponse = {
    status: "ok",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
};
