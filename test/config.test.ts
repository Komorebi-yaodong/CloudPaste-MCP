import assert from "node:assert/strict";
import test from "node:test";

import { loadConfig } from "../src/config.js";

test("加载配置时规范化 URL 并应用 24 小时默认有效期", () => {
  const config = loadConfig({
    CLOUDPASTE_URL: "https://copy.example.com/",
    CLOUDPASTE_API_KEY: "test-key",
  });

  assert.equal(config.baseUrl, "https://copy.example.com");
  assert.equal(config.defaultExpiresHours, 24);
  assert.equal(config.defaultPath, undefined);
});

test("拒绝缺少 API Key 与非 http(s) 服务地址", () => {
  assert.throws(
    () => loadConfig({ CLOUDPASTE_URL: "https://copy.example.com" }),
    /CLOUDPASTE_API_KEY/,
  );

  assert.throws(
    () =>
      loadConfig({
        CLOUDPASTE_URL: "file:///tmp/cloudpaste",
        CLOUDPASTE_API_KEY: "test-key",
      }),
    /仅支持 http/,
  );
});
