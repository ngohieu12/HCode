import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";

import { desktopProductIdentities } from "../scripts/desktop-product-identity.mjs";
import { installFinderOpenFolderWorkflow } from "../src/main/desktopFinderOpenFolderWorkflow.ts";

const LEGACY_ZCODE_APP_IDS = new Set(["dev.zcode.app", "dev.zcode.app.preview"]);
const LEGACY_ZCODE_LINUX_NAMES = new Set(["zcode", "zcode-preview"]);

describe("HCode 与 ZCode 的安装身份隔离", () => {
  it("正式版与 Preview 的 appId、Linux 可执行文件名、包名都不与 ZCode 冲突", () => {
    for (const identity of Object.values(desktopProductIdentities)) {
      assert.equal(LEGACY_ZCODE_APP_IDS.has(identity.appId), false, identity.appId);
      assert.equal(LEGACY_ZCODE_LINUX_NAMES.has(identity.linuxExecutableName), false);
      assert.equal(LEGACY_ZCODE_LINUX_NAMES.has(identity.linuxPackageName), false);
    }
  });

  it("正式版与 Preview 之间也互不冲突", () => {
    const { production, preview } = desktopProductIdentities;
    assert.notEqual(production.appId, preview.appId);
    assert.notEqual(production.linuxExecutableName, preview.linuxExecutableName);
    assert.notEqual(production.linuxPackageName, preview.linuxPackageName);
  });

  it("Finder 服务按产品名分目录安装，HCode 不覆盖 ZCode 的服务", () => {
    const homeDir = mkdtempSync(join(tmpdir(), "hcode-finder-"));
    const logger = { info: () => {}, warn: () => {} };
    const install = (productName: string) =>
      installFinderOpenFolderWorkflow({
        platform: "darwin",
        locale: "en-US",
        productName,
        homeDir,
        logger,
        refreshServicesIndex: () => {},
      });

    install("ZCode");
    install("HCode");

    const zcodeWorkflow = join(homeDir, "Library", "Services", "Open in ZCode.workflow");
    const hcodeWorkflow = join(homeDir, "Library", "Services", "Open in HCode.workflow");
    assert.equal(existsSync(zcodeWorkflow), true);
    assert.equal(existsSync(hcodeWorkflow), true);

    const zcodePlist = readFileSync(join(zcodeWorkflow, "Contents", "Info.plist"), "utf8");
    const hcodePlist = readFileSync(join(hcodeWorkflow, "Contents", "Info.plist"), "utf8");
    assert.match(zcodePlist, /Open in ZCode/);
    assert.match(hcodePlist, /Open in HCode/);
    const bundleIdOf = (plist: string) =>
      /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)</.exec(plist)?.[1];
    assert.notEqual(bundleIdOf(zcodePlist), bundleIdOf(hcodePlist));
  });
});
