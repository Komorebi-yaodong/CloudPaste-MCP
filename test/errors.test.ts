import assert from "node:assert/strict";
import test from "node:test";

import { CloudPasteApiError, redactSensitiveText, toSafeErrorMessage } from "../src/errors.js";

test("错误文本会脱敏 API Key、Bearer、token、password 和 secret", () => {
  const message = redactSensitiveText(
    "Authorization: ApiKey cloudpaste-secret token=abc password=hunter2 Bearer jwt-secret secret: value",
  );

  assert.doesNotMatch(message, /cloudpaste-secret|jwt-secret|hunter2|abc|value/);
  assert.match(message, /Authorization=\*\*\*/);
  assert.match(message, /Bearer \*\*\*/);
  assert.match(message, /token=\*\*\*/);
  assert.match(message, /password=\*\*\*/);
  assert.match(message, /secret=\*\*\*/);
});

test("CloudPaste API 错误返回脱敏后的安全消息", () => {
  const message = toSafeErrorMessage(new CloudPasteApiError("ApiKey should-not-leak", 401));

  assert.equal(message, "CloudPaste 请求失败（HTTP 401）：ApiKey ***");
});
