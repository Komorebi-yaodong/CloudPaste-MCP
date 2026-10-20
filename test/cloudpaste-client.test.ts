import assert from "node:assert/strict";
import test from "node:test";

import { CloudPasteClient } from "../src/cloudpaste-client.js";
import type { CloudPasteConfig } from "../src/config.js";

const config: CloudPasteConfig = {
  baseUrl: "https://copy.example.com",
  apiKey: "super-secret-key",
  defaultExpiresHours: 24,
};

const createClient = (handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) =>
  new CloudPasteClient(config, handler as typeof fetch);

test("上传固定使用 24 小时和受控代理链接，并且不暴露密码字段", async () => {
  let capturedUrl = "";
  let capturedHeaders: Headers | undefined;

  const client = createClient(async (input, init) => {
    capturedUrl = String(input);
    capturedHeaders = new Headers(init?.headers);
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: "file_1",
          downloadUrl: "https://copy.example.com/api/s/share?down=true",
          plain_password: "must-not-leak",
        },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  });

  const result = await client.uploadFile(
    {
      absolutePath: "E:\\TMP\\demo.txt",
      filename: "demo.txt",
      size: 3,
      contentType: "text/plain",
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    },
    { expiresInHours: 24 },
  );

  const url = new URL(capturedUrl);
  assert.equal(url.pathname, "/api/upload-direct/demo.txt");
  assert.equal(url.searchParams.get("expires_in"), "24");
  assert.equal(url.searchParams.get("use_proxy"), "1");
  assert.equal(capturedHeaders?.get("Authorization"), "ApiKey super-secret-key");
  assert.deepEqual(result, {
    id: "file_1",
    downloadUrl: "https://copy.example.com/api/s/share?down=true",
  });
});

test("删除固定请求 both 模式", async () => {
  let capturedMethod = "";
  let capturedBody = "";

  const client = createClient(async (_input, init) => {
    capturedMethod = init?.method || "GET";
    capturedBody = String(init?.body || "");
    return new Response(JSON.stringify({ success: true, data: { success: 2, failed: [] } }), {
      headers: { "Content-Type": "application/json" },
    });
  });

  const result = await client.deleteFiles(["file_1", "file_2"]);

  assert.equal(capturedMethod, "DELETE");
  assert.deepEqual(JSON.parse(capturedBody), {
    ids: ["file_1", "file_2"],
    delete_mode: "both",
  });
  assert.deepEqual(result, { success: 2, failed: [] });
});
