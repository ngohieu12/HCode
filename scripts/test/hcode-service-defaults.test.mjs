import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (file) => readFile(resolve(root, file), "utf8");
const upstream =
  /https?:\/\/(?:[\w-]+\.)*(?:z\.ai|bigmodel\.cn|codegeex\.cn)(?:[/:"\s]|$)|client_P8X5CMWmlaRO9gyO-KSqtg/i;

test("checked-in endpoint environments have no upstream service defaults", async () => {
  for (const file of [".env.example", ".env.development", ".env.production"]) {
    assert.doesNotMatch(await read(file), upstream, file);
  }
});

test("shared endpoint and desktop asset defaults do not use upstream services", async () => {
  for (const file of [
    "packages/shared/src/zcodeEndpoint.ts",
    "apps/zcode-cli/packages/adapters/src/auth/coding-plan-api-key.ts",
    "apps/zcode-cli/packages/adapters/src/auth/cli-oauth.ts",
    "packages/ui/src/lib/productDocs.ts",
    "packages/desktop/src/main/remoteCdn.ts",
    "packages/shared/src/plugin-marketplaces.ts",
    "apps/zcode-cli/packages/bootstrap/src/app/official-plugin-definitions.ts",
    "apps/zcode-cli/packages/adapters/src/plugins/marketplace.ts",
  ]) {
    // Author URLs are provenance, not a service default.
    const content = (await read(file)).replace(/^.*const ZAI_AUTHOR =.*$/gm, "");
    assert.doesNotMatch(content, upstream, file);
  }
});

test("help defaults belong to the fork", async () => {
  const config = JSON.parse(await read("config/default.json"));
  assert.equal(config.feedback_url, "https://github.com/ngohieu12/HCode/issues");
  for (const url of Object.values(config.community_urls)) {
    assert.equal(url, "https://github.com/ngohieu12/HCode/discussions");
  }
});
