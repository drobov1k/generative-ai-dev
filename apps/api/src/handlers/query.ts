import { APIGatewayProxyHandler } from "aws-lambda";
import { PythonServiceClient } from "../client/python-service";
import type { QueryRequest, QueryResponse } from "@gen-ai/shared";

const python = new PythonServiceClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}") as QueryRequest;
    if (!body.question?.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "question is required" }),
      };
    }
    const result = await python.post<QueryResponse>("/query", body);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("query handler error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Query failed" }),
    };
  }
};
