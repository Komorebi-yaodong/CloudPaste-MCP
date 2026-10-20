import * as z from "zod/v4";

const DEFAULT_EXPIRES_HOURS = 24;

const environmentSchema = z.object({
  CLOUDPASTE_URL: z.string().trim().min(1, "缺少 CLOUDPASTE_URL"),
  CLOUDPASTE_API_KEY: z.string().trim().min(1, "缺少 CLOUDPASTE_API_KEY"),
  CLOUDPASTE_DEFAULT_PATH: z.string().trim().optional(),
  CLOUDPASTE_STORAGE_CONFIG_ID: z.string().trim().optional(),
  CLOUDPASTE_DEFAULT_EXPIRES_HOURS: z.string().trim().optional(),
});

export interface CloudPasteConfig {
  baseUrl: string;
  apiKey: string;
  defaultPath?: string;
  defaultStorageConfigId?: string;
  defaultExpiresHours: number;
}

function normalizeBaseUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("CLOUDPASTE_URL 必须是合法的 http(s) URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("CLOUDPASTE_URL 仅支持 http:// 或 https://");
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function parseExpiresHours(rawValue: string | undefined): number {
  if (!rawValue) return DEFAULT_EXPIRES_HOURS;

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 24 * 365) {
    throw new Error("CLOUDPASTE_DEFAULT_EXPIRES_HOURS 必须是 1 到 8760 之间的整数");
  }

  return parsed;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): CloudPasteConfig {
  if (!environment.CLOUDPASTE_URL?.trim()) {
    throw new Error("CloudPaste MCP 配置无效：缺少 CLOUDPASTE_URL");
  }
  if (!environment.CLOUDPASTE_API_KEY?.trim()) {
    throw new Error("CloudPaste MCP 配置无效：缺少 CLOUDPASTE_API_KEY");
  }

  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.message).join("；");
    throw new Error(`CloudPaste MCP 配置无效：${missing}`);
  }

  const values = parsed.data;
  return {
    baseUrl: normalizeBaseUrl(values.CLOUDPASTE_URL),
    apiKey: values.CLOUDPASTE_API_KEY,
    defaultPath: values.CLOUDPASTE_DEFAULT_PATH || undefined,
    defaultStorageConfigId: values.CLOUDPASTE_STORAGE_CONFIG_ID || undefined,
    defaultExpiresHours: parseExpiresHours(values.CLOUDPASTE_DEFAULT_EXPIRES_HOURS),
  };
}
