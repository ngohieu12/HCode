import { describe, expect, it } from "vitest";
import {
  getCommunityUrlFromConfig,
  getCommunityUrlFromConfigs,
  getForceUpdateMinimalVersionFromConfig,
} from "../src/remoteAppConfig.js";

describe("remoteAppConfig", () => {
  it("读取 feedback_url", () => {
    expect(
      getFeedbackUrlFromConfig({
        feedback_url: "https://example.com/feedback",
      }),
    ).toBe("https://example.com/feedback");
  it("越南语界面只读取对应社群地址", () => {
    expect(
      getCommunityUrlFromConfig(
        {
          community_urls: {
            "vi-VN": "https://example.com/vi-community",
            "en-US": "https://example.com/en-community",
          },
        },
        "vi-VN",
      ),
    ).toBe("https://example.com/vi-community");

    expect(
      getCommunityUrlFromConfig(
        {
          community_urls: {
            "en-US": "https://example.com/en-community",
          },
        },
        "vi-VN",
      ),
    ).toBeUndefined();
  });

  it("英文界面只读取英文社群地址", () => {
    expect(
      getCommunityUrlFromConfig(
        {
          community_urls: {
            "en-US": "https://example.com/en-community",
          },
        },
        "en-US",
      ),
    ).toBe("https://example.com/en-community");

    expect(
      getCommunityUrlFromConfig(
        {
          community_urls: {
            "en-US": "https://example.com/en-community",
          },
        },
        "vi-VN",
      ),
    ).toBeUndefined();
  });

  it("社群入口缺失时返回 undefined", () => {
    expect(getCommunityUrlFromConfig({}, "en-US")).toBeUndefined();
  });

  it("远端缺少当前语言时优先使用内置同语言入口", () => {
    expect(
      getCommunityUrlFromConfigs(
        {
          community_urls: {
            "en-US": "https://remote.example.com/feishu",
          },
        },
        {
          community_urls: {
            "en-US": "https://local.example.com/discord",
          },
        },
        "en-US",
      ),
    ).toBe("https://remote.example.com/feishu");

    expect(
      getCommunityUrlFromConfigs(
        {},
        {
          community_urls: {
            "en-US": "https://local.example.com/discord",
          },
        },
        "vi-VN",
      ),
    ).toBe("https://local.example.com/discord");
  });

  it("读取 forceUpdate minimalVersion", () => {
    expect(
      getForceUpdateMinimalVersionFromConfig({
        forceUpdate: {
          minimalVersion: " 4.0.0 ",
        },
      }),
    ).toBe("4.0.0");

    expect(getForceUpdateMinimalVersionFromConfig({})).toBeUndefined();
    expect(
      getForceUpdateMinimalVersionFromConfig({
        forceUpdate: {
          minimalVersion: "",
        },
      }),
    ).toBeUndefined();
  });
});
