import assert from "node:assert/strict";
import { test } from "vitest";
import { DEFAULT_LOCALE, resolveLocaleFromSystemLanguage, toZhEnLocale } from "@zcode/shared";
import enUS from "../src/i18n/locales/en-US.js";
import viVN from "../src/i18n/locales/vi-VN.js";

test("越南语是默认界面语言", () => {
  assert.equal(DEFAULT_LOCALE, "vi-VN");
});

test("系统语言为英文时使用英文，其余（含中文系统）使用越南语", () => {
  assert.equal(resolveLocaleFromSystemLanguage("en-GB"), "en-US");
  assert.equal(resolveLocaleFromSystemLanguage("en"), "en-US");
  assert.equal(resolveLocaleFromSystemLanguage("zh-CN"), "vi-VN");
  assert.equal(resolveLocaleFromSystemLanguage("zh-Hant-TW"), "vi-VN");
  assert.equal(resolveLocaleFromSystemLanguage("fr-FR"), "vi-VN");
});

test("只支持中英文的接口把越南语回落为英文", () => {
  assert.equal(toZhEnLocale("vi-VN"), "en-US");
  assert.equal(toZhEnLocale("en-US"), "en-US");
  assert.equal(toZhEnLocale("zh-CN"), "zh-CN");
});

test("越南语译文的键都存在于英文文案中，避免出现无效键", () => {
  const unknown = Object.keys(viVN).filter((key) => !(key in enUS));
  assert.deepEqual(unknown, []);
});
