/**
 * Abstracts TS → Python communication.
 * Local: HTTP to FastAPI.  AWS: direct Lambda invoke.
 * Switch is automatic — no code changes needed between environments.
 */

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";
const PYTHON_LAMBDA_ARN = process.env.PYTHON_LAMBDA_ARN;

export class PythonServiceClient {
  async get<T>(path: string): Promise<T> {
    return this._call<T>(path, "GET");
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this._call<T>(path, "POST", body);
  }

  private async _call<T>(path: string, method: string, body?: unknown): Promise<T> {
    if (PYTHON_LAMBDA_ARN && process.env.AWS_EXECUTION_ENV) {
      return this._invokeLambda<T>(path, method, body);
    }
    return this._callHttp<T>(path, method, body);
  }

  private async _callHttp<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${PYTHON_SERVICE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Python service ${method} ${path} → ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  private async _invokeLambda<T>(path: string, method: string, body?: unknown): Promise<T> {
    const { LambdaClient, InvokeCommand } = await import("@aws-sdk/client-lambda");
    const client = new LambdaClient({});
    const payload = {
      path,
      httpMethod: method,
      body: body !== undefined ? JSON.stringify(body) : null,
      headers: { "Content-Type": "application/json" },
    };
    const cmd = new InvokeCommand({
      FunctionName: PYTHON_LAMBDA_ARN,
      Payload: Buffer.from(JSON.stringify(payload)),
    });
    const response = await client.send(cmd);
    const raw = Buffer.from(response.Payload!).toString();
    const envelope = JSON.parse(raw);
    // Mangum wraps responses in API Gateway envelope
    return JSON.parse(envelope.body ?? raw) as T;
  }
}
