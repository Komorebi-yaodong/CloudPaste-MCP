import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeForModel } from "../src/sanitize.js";

test("递归剔除 CloudPaste 响应中的密码、密钥和令牌字段", () => {
  const sanitized = sanitizeForModel({
    id: "file_1",
    filename: "report.pdf",
    plain_password: "should-not-leak",
    password: "should-not-leak",
    nested: {
      token: "should-not-leak",
      downloadUrl: "https://copy.example.com/api/s/demo?down=true",
    },
    files: [{ api_key: "should-not-leak", slug: "demo" }],
  });

  assert.deepEqual(sanitized, {
    id: "file_1",
    filename: "report.pdf",
    nested: {
      downloadUrl: "https://copy.example.com/api/s/demo?down=true",
    },
    files: [{ slug: "demo" }],
  });
});
