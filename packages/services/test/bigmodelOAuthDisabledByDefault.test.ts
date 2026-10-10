import assert from "node:assert/strict";
import test from "node:test";
import { createBigModelProviderRuntimeConfig } from "../src/oauth/providers/bigmodelProviderConfig.js";
import { createZaiProviderRuntimeConfig } from "../src/oauth/providers/zaiProviderConfig.js";

test("BigModel OAuth is disabled by default while Z.ai stays enabled", () => {
  assert.equal(createBigModelProviderRuntimeConfig({}).enabled, false);
  assert.equal(createZaiProviderRuntimeConfig({}).enabled, true);
});

test("BIGMODEL_OAUTH_ENABLED=true re-enables the BigModel OAuth provider", () => {
  assert.equal(
    createBigModelProviderRuntimeConfig({ BIGMODEL_OAUTH_ENABLED: "true" }).enabled,
    true,
  );
});
