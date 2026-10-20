import { McpServer } from "@modelcontextprotocol/server";

import type { CloudPasteConfig } from "./config.js";
import { CloudPasteClient } from "./cloudpaste-client.js";
import { toSafeErrorMessage } from "./errors.js";
import { openLocalUploadFile } from "./file-upload.js";
import {
  deleteFilesInputSchema,
  getFileInputSchema,
  listFilesInputSchema,
  uploadFileInputSchema,
} from "./schemas.js";

const toToolResult = (payload: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
});

const toToolError = (error: unknown) => ({
  content: [{ type: "text" as const, text: toSafeErrorMessage(error) }],
  isError: true,
});

export function createServer(config: CloudPasteConfig): McpServer {
  const server = new McpServer({
    name: "cloudpaste-mcp-server",
    version: "0.1.0",
  });
  const client = new CloudPasteClient(config);

  server.registerTool(
    "test_connection",
    {
      description:
        "验证 CloudPaste URL 与 API Key 是否有效，并返回当前密钥的非敏感权限摘要。不会返回或记录 API Key。",
    },
    async () => {
      try {
        return toToolResult(await client.testConnection());
      } catch (error) {
        return toToolError(error);
      }
    },
  );

  server.registerTool(
    "upload_file",
    {
      description:
        "上传调用方明确指定的本地普通文件，并创建远程分享。默认有效期为 24 小时且强制使用 CloudPaste 受控代理下载链接；成功后返回下载直链、文件 ID 与过期时间。",
      inputSchema: uploadFileInputSchema,
    },
    async ({ file_path, expires_in_hours, path, storage_config_id, remark, slug }) => {
      try {
        const file = await openLocalUploadFile(file_path);
        const result = await client.uploadFile(file, {
          expiresInHours: expires_in_hours ?? config.defaultExpiresHours,
          path: path ?? config.defaultPath,
          storageConfigId: storage_config_id ?? config.defaultStorageConfigId,
          remark,
          slug,
        });
        return toToolResult(result);
      } catch (error) {
        return toToolError(error);
      }
    },
  );

  server.registerTool(
    "list_files",
    {
      description:
        "分页查询当前 CloudPaste API Key 自己创建的远程文件。支持按关键词搜索；不会返回密码、密钥或其他敏感字段。",
      inputSchema: listFilesInputSchema,
    },
    async ({ limit, offset, search }) => {
      try {
        return toToolResult(await client.listFiles({ limit, offset, search }));
      } catch (error) {
        return toToolError(error);
      }
    },
  );

  server.registerTool(
    "get_file",
    {
      description:
        "查询当前 API Key 自己创建的一个 CloudPaste 文件的详情；默认返回最新受控预览与下载链接，并且过滤任何密码或密钥字段。",
      inputSchema: getFileInputSchema,
    },
    async ({ file_id, include_links }) => {
      try {
        return toToolResult(await client.getFile(file_id, include_links));
      } catch (error) {
        return toToolError(error);
      }
    },
  );

  server.registerTool(
    "delete_files",
    {
      description:
        "不可恢复地删除当前 API Key 自己创建的 CloudPaste 文件：同时删除分享记录和底层 WebDAV/S3 对象。仅在已经获得用户明确删除授权后调用，且必须传 confirm=true。",
      inputSchema: deleteFilesInputSchema,
    },
    async ({ file_ids }) => {
      try {
        return toToolResult(await client.deleteFiles(file_ids));
      } catch (error) {
        return toToolError(error);
      }
    },
  );

  return server;
}
