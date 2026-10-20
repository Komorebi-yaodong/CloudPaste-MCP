import * as z from "zod/v4";

export const uploadFileInputSchema = z.object({
  file_path: z.string().trim().min(1).describe("要上传的本地普通文件绝对路径"),
  expires_in_hours: z.number().int().min(1).max(24 * 365).optional().describe("分享有效期（小时）；未提供时使用配置默认值 24 小时"),
  path: z.string().trim().min(1).optional().describe("CloudPaste 目标目录；未提供时使用 CLOUDPASTE_DEFAULT_PATH"),
  storage_config_id: z.string().trim().min(1).optional().describe("目标存储配置 ID；未提供时使用 CLOUDPASTE_STORAGE_CONFIG_ID"),
  remark: z.string().trim().max(1000).optional().describe("可选文件备注"),
  slug: z.string().trim().regex(/^[A-Za-z0-9_-]+$/, "slug 只能包含字母、数字、下划线和横杠").max(128).optional().describe("可选自定义短链"),
});

export const listFilesInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(30).describe("每页数量，1 到 100，默认 30"),
  offset: z.number().int().min(0).default(0).describe("分页偏移量，默认 0"),
  search: z.string().trim().min(1).max(200).optional().describe("按文件名等字段搜索；未提供时列出最新文件"),
});

export const getFileInputSchema = z.object({
  file_id: z.string().trim().min(1).describe("CloudPaste 文件 ID"),
  include_links: z.boolean().default(true).describe("是否返回受控预览和下载链接，默认 true"),
});

export const deleteFilesInputSchema = z.object({
  file_ids: z.array(z.string().trim().min(1)).min(1).max(50).describe("要物理删除的 CloudPaste 文件 ID，单次最多 50 个"),
  confirm: z.literal(true).describe("必须明确传 true，表示已获得用户授权并确认同时删除底层存储对象"),
});
