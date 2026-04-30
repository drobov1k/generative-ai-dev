import { APIGatewayProxyHandler } from "aws-lambda";
import type { UploadResponse } from "@gen-ai/shared";

// TODO: wire to the document ingestion backend once the architecture is decided
export const handler: APIGatewayProxyHandler = async () => {
  const body: UploadResponse = {
    document_id: "not-implemented",
    status: "processing",
    message: "Upload handler not yet wired to a backend",
  };
  return {
    statusCode: 202,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
};
