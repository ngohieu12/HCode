import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";

// 应用为 BYOK 纯化：随包内置 Provider 不再包含任何模板、账号计划或 Z.AI/BigModel 相关规则。
// 用户只能自行填写 API Key 添加 Provider。该测试直接读取随包基线文件。
const here = dirname(fileURLToPath(import.meta.url));
const builtinPath = resolve(here, "../../../config/provider/zcode-builtin.json");

interface BuiltinConfig {
  config: {
    providerConfigRules: {
      templateRules: unknown[];
      providerRules: unknown[];
    };
    modelConfigRules: {
      modelRules: Array<{ modelMatch?: string }>;
      modelApiRules: Array<{ modelMatch?: string }>;
      providerSiteRules: Array<{ baseUrlMatch?: string }>;
      templateModelRules: unknown[];
      builtinProviderModelRules: unknown[];
    };
  };
}

const raw = readFileSync(builtinPath, "utf8");
const builtin = JSON.parse(raw) as BuiltinConfig;
const { providerConfigRules, modelConfigRules } = builtin.config;

test("built-in provider templates and account providers are empty (BYOK only)", () => {
  assert.deepEqual(providerConfigRules.templateRules, []);
  assert.deepEqual(providerConfigRules.providerRules, []);
  assert.deepEqual(modelConfigRules.templateModelRules, []);
  assert.deepEqual(modelConfigRules.builtinProviderModelRules, []);
});

test("no provider site rules target Z.AI or BigModel endpoints", () => {
  assert.deepEqual(modelConfigRules.providerSiteRules, []);
  assert.doesNotMatch(raw, /z\\\\\.ai|bigmodel|zhipu/i);
});

test("no model rules are specific to GLM / Z.AI models", () => {
  for (const rule of [...modelConfigRules.modelRules, ...modelConfigRules.modelApiRules]) {
    assert.doesNotMatch(rule.modelMatch ?? "", /glm-5|glm-4|GLM-5|GLM-4/);
  }
});
