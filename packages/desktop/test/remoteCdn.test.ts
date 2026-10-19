import { afterEach, describe, expect, it, vi } from "vitest";
import { isUtcPlusEightTimeZone, resolveRemoteCdnBaseUrls } from "../src/main/remoteCdn.js";

afterEach(() => vi.unstubAllGlobals());

describe("remoteCdn", () => {
  it("uses explicitly configured build roots and never appends upstream mirrors", () => {
    vi.stubGlobal("__ZCODE_REMOTE_CDN_RELEASE_ROOTS__", ["https://assets.example.test/releases/"]);
    expect(resolveRemoteCdnBaseUrls({ version: "1.2.3" })).toEqual([
      "https://assets.example.test/releases/1.2.3",
    ]);
    expect(
      resolveRemoteCdnBaseUrls({ overrideBaseUrl: "https://override.example.test/v2" }),
    ).toEqual(["https://override.example.test/v2"]);
  });

  it.each([
    { env: "production" as const, locale: "zh-CN", timeZone: "Asia/Shanghai" },
    { env: "production" as const, locale: "en-US", timeZone: "America/Los_Angeles" },
    { env: "test" as const, locale: "vi-VN", timeZone: "Asia/Ho_Chi_Minh" },
  ])("has no upstream CDN fallback for %j", (options) => {
    expect(resolveRemoteCdnBaseUrls({ ...options, version: "0.0.0-test" })).toEqual([]);
  });

  it("东八区判断应按 UTC 偏移而不是固定城市名单", () => {
    expect(isUtcPlusEightTimeZone("Asia/Shanghai")).toBe(true);
    expect(isUtcPlusEightTimeZone("Asia/Singapore")).toBe(true);
    expect(isUtcPlusEightTimeZone("Asia/Tokyo")).toBe(false);
  });

  it("显式覆盖 CDN 基址时不再按产品环境选择默认值", () => {
    expect(
      resolveRemoteCdnBaseUrls({
        env: "test",
        overrideBaseUrl: "https://cdn.example.com/releases///",
        version: "0.0.0-test",
      }),
    ).toEqual(["https://cdn.example.com/releases"]);
  });
});
