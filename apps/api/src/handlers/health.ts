import { APIGatewayProxyHandler } from "aws-lambda";
import { PythonServiceClient } from "../client/python-service";
import type { HealthResponse } from "@gen-ai/shared";

const python = new PythonServiceClient();

export const handler: APIGatewayProxyHandler = async () => {
  const data = await python.get<HealthResponse>("/health");
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
};
