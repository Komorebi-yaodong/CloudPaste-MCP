# CloudPaste MCP Server

通过 [Model Context Protocol](https://modelcontextprotocol.io/) 将 CloudPaste 接入 MCP Client。它提供本地文件上传、默认 1 天受控下载分享、云端文件查询、详情获取与物理删除能力。

> 删除工具会同时删除 CloudPaste 分享记录和底层 WebDAV/S3 文件对象，**不可恢复**；只有在明确传入 `confirm: true` 时才会执行。

## 功能

- `test_connection`：验证 CloudPaste URL 和 API Key。
- `upload_file`：流式上传指定本地文件，默认 24 小时过期，并返回受控下载直链。
- `list_files`：分页查询当前 API Key 自己创建的文件。
- `get_file`：查询文件详情和最新受控下载链接。
- `delete_files`：物理删除当前 API Key 自己创建的文件、分享记录及底层对象。

所有上游响应会在交给模型前过滤密码、API Key、令牌和密钥字段。

## CloudPaste API Key 权限

请在 CloudPaste 中创建一个专用 API Key，最小权限值为：

```text
FILE_SHARE  = 2
FILE_MANAGE = 8
总权限值     = 10
```

建议同时通过 Storage ACL 仅授权 MCP 所需的存储配置。使用 API Key 时，CloudPaste 仅允许它管理该 Key 自己创建的文件。

## MCP Client 配置

发布到 npm 后，在 MCP Client 中使用：

```json
{
  "mcpServers": {
    "cloudpaste": {
      "command": "npx",
      "args": ["-y", "cloudpaste-mcp-server@0.1.0"],
      "env": {
        "CLOUDPASTE_URL": "https://copy.example.com",
        "CLOUDPASTE_API_KEY": "your-dedicated-cloudpaste-api-key",
        "CLOUDPASTE_DEFAULT_PATH": "/CloudPaste/MCP",
        "CLOUDPASTE_STORAGE_CONFIG_ID": "",
        "CLOUDPASTE_DEFAULT_EXPIRES_HOURS": "24"
      }
    }
  }
}
```

不要把真实密钥写入项目文件、Git 仓库、日志或聊天记录。建议在 MCP Client 的安全配置界面中维护环境变量。

## 环境变量

| 名称 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `CLOUDPASTE_URL` | 是 | - | CloudPaste 根地址，只允许 `http(s)`。 |
| `CLOUDPASTE_API_KEY` | 是 | - | 专用 API Key，最小权限为 10。 |
| `CLOUDPASTE_DEFAULT_PATH` | 否 | 不设置 | 默认上传目录。 |
| `CLOUDPASTE_STORAGE_CONFIG_ID` | 否 | CloudPaste 默认存储 | 默认目标存储配置 ID。 |
| `CLOUDPASTE_DEFAULT_EXPIRES_HOURS` | 否 | `24` | 默认分享有效期，范围为 1–8760 小时。 |

可复制 `.env.example` 作为本地参考，但不要提交真实 `.env` 文件。

## 工具说明

### `upload_file`

输入：

```json
{
  "file_path": "E:\\TMP\\example.zip",
  "expires_in_hours": 24,
  "path": "/CloudPaste/MCP",
  "storage_config_id": "optional-storage-id",
  "remark": "optional note",
  "slug": "optional-short-link"
}
```

上传使用 CloudPaste `PUT /api/upload-direct/:filename`。MCP 固定传入：

```text
use_proxy=1
expires_in=24（未显式覆盖时）
```

因此返回的 `downloadUrl` 是 CloudPaste 受控代理链接，会遵循分享过期时间。

### `list_files` / `get_file`

仅查询当前 API Key 创建的文件。`get_file` 默认返回最新下载链接，但敏感字段会被过滤。

### `delete_files`

```json
{
  "file_ids": ["file_xxx"],
  "confirm": true
}
```

该操作固定使用 `delete_mode: "both"`，同时删除分享记录及 WebDAV/S3 底层对象，无法撤销。调用前必须先得到用户明确授权。

## 本地开发

```powershell
Set-Location "E:\Programming\CloudPaste-MCP"
pnpm install
pnpm check
pnpm test
pnpm build
```

使用本地源码调试：

```powershell
$env:CLOUDPASTE_URL = "https://copy.example.com"
$env:CLOUDPASTE_API_KEY = "your-api-key"
pnpm dev
```

## 发布

发布前检查包内容与质量：

```powershell
pnpm prepublishOnly
npm pack --dry-run
npm publish --access public --provenance
```

发布前请再次确认 `cloudpaste-mcp-server` 名称可用；若已被占用，请修改 `package.json` 中的 `name`、README 的 `npx` 命令和 MCP Client 示例。

## License

[Apache-2.0](./LICENSE)
