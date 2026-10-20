import type { CloudPasteConfig } from "./config.js";
import { CloudPasteApiError } from "./errors.js";
import type { LocalUploadFile } from "./file-upload.js";
import { sanitizeForModel } from "./sanitize.js";

interface CloudPasteEnvelope<T> {
  code?: number;
  message?: string;
  success?: boolean;
  data?: T;
}

export interface UploadOptions {
  expiresInHours: number;
  path?: string;
  storageConfigId?: string;
  remark?: string;
  slug?: string;
}

export interface ListFilesOptions {
  limit: number;
  offset: number;
  search?: string;
}

export class CloudPasteClient {
  public constructor(
    private readonly config: CloudPasteConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  public async testConnection(): Promise<unknown> {
    return this.requestJson("/api/test/api-key");
  }

  public async uploadFile(file: LocalUploadFile, options: UploadOptions): Promise<unknown> {
    const endpoint = new URL(`/api/upload-direct/${encodeURIComponent(file.filename)}`, this.config.baseUrl);
    endpoint.searchParams.set("expires_in", String(options.expiresInHours));
    endpoint.searchParams.set("use_proxy", "1");

    if (options.path) endpoint.searchParams.set("path", options.path);
    if (options.storageConfigId) endpoint.searchParams.set("storage_config_id", options.storageConfigId);
    if (options.remark) endpoint.searchParams.set("remark", options.remark);
    if (options.slug) endpoint.searchParams.set("slug", options.slug);

    return this.requestJson(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.size),
      },
      body: file.stream,
      // Node.js fetch requires this for streaming request bodies.
      duplex: "half",
    } as RequestInit);
  }

  public async listFiles(options: ListFilesOptions): Promise<unknown> {
    const endpoint = new URL("/api/files", this.config.baseUrl);
    endpoint.searchParams.set("limit", String(options.limit));
    endpoint.searchParams.set("offset", String(options.offset));
    if (options.search) endpoint.searchParams.set("search", options.search);

    return this.requestJson(endpoint);
  }

  public async getFile(fileId: string, includeLinks: boolean): Promise<unknown> {
    const endpoint = new URL(`/api/files/${encodeURIComponent(fileId)}`, this.config.baseUrl);
    if (includeLinks) endpoint.searchParams.set("include", "links");

    return this.requestJson(endpoint);
  }

  public async deleteFiles(fileIds: string[]): Promise<unknown> {
    return this.requestJson("/api/files/batch-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: fileIds,
        delete_mode: "both",
      }),
    });
  }

  private async requestJson(pathOrUrl: string | URL, init: RequestInit = {}): Promise<unknown> {
    const endpoint = typeof pathOrUrl === "string" ? new URL(pathOrUrl, this.config.baseUrl) : pathOrUrl;
    const headers = new Headers(init.headers);
    headers.set("Authorization", `ApiKey ${this.config.apiKey}`);
    headers.set("Accept", "application/json");

    let response: Response;
    try {
      response = await this.fetchImplementation(endpoint, { ...init, headers });
    } catch {
      throw new CloudPasteApiError("无法连接 CloudPaste 服务，请检查 CLOUDPASTE_URL 与网络状态", 0);
    }

    const payload = await this.readJson(response);
    if (!response.ok || payload.success === false) {
      throw new CloudPasteApiError(payload.message || "CloudPaste 请求失败", response.status, String(payload.code || ""));
    }

    return sanitizeForModel(payload.data ?? payload);
  }

  private async readJson(response: Response): Promise<CloudPasteEnvelope<unknown>> {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = (await response.text()).slice(0, 500);
      return { message: text || `服务返回非 JSON 响应（HTTP ${response.status}）` };
    }

    try {
      return (await response.json()) as CloudPasteEnvelope<unknown>;
    } catch {
      return { message: `服务返回了无法解析的 JSON（HTTP ${response.status}）` };
    }
  }
}
