import { APIGatewayProxyHandler } from "aws-lambda";
import { PythonServiceClient } from "../client/python-service";
import type { UploadResponse } from "@gen-ai/shared";

const python = new PythonServiceClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // event.body contains the raw multipart payload forwarded as-is to Python
    const result = await python.post<UploadResponse>("/upload", event.body);
    return {
      statusCode: 202,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("upload handler error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Upload failed" }),
    };
  }
};
