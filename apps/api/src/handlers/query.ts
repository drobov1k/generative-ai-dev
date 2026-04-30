import { APIGatewayProxyHandler } from "aws-lambda";
import type { QueryRequest, QueryResponse } from "@gen-ai/shared";

// TODO: wire to the RAG backend once the architecture is decided
export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body ?? "{}") as QueryRequest;
  if (!body.question?.trim()) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "question is required" }),
    };
  }
  const response: QueryResponse = {
    answer: "Query handler not yet wired to a backend",
    question: body.question,
    sources: [],
  };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(response),
  };
};
