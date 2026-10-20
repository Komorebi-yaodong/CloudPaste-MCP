#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const server = createServer(config);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("cloudpaste-mcp-server 已通过 stdio 启动");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "启动失败";
  console.error(`cloudpaste-mcp-server 启动失败：${message}`);
  process.exitCode = 1;
});
