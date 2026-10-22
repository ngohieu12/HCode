import { describe, expect, it } from "vitest";
import { zcodePluginUserConfigOptionSchema } from "@zcode/shared";
import { z } from "zod";
import { toProtocolUserConfig } from "../src/zcode-protocol/plugin-user-config.js";

const protocolUserConfigSchema = z.record(z.string(), zcodePluginUserConfigOptionSchema);

describe("toProtocolUserConfig", () => {
  it("drops manifest fields the strict protocol schema does not define", () => {
    // 现场：第三方插件 userConfig.guard 带 options 枚举，插件市场整页报 unrecognized_keys。
    const projected = toProtocolUserConfig({
      guard: {
        type: "string",
        title: "Guard mode",
        default: "strict",
        options: ["strict", "relaxed"],
      },
    });

    expect(projected).toEqual({
      guard: { type: "string", title: "Guard mode", default: "strict" },
    });
    expect(protocolUserConfigSchema.safeParse(projected).success).toBe(true);
  });

  it("omits invalid values instead of failing the whole plugin list", () => {
    const projected = toProtocolUserConfig({
      mode: { type: "select", default: ["a"], required: "yes", sensitive: true },
      broken: "not-an-object",
      list: [1, 2],
    });

    expect(projected).toEqual({ mode: { sensitive: true } });
    expect(protocolUserConfigSchema.safeParse(projected).success).toBe(true);
  });

  it("keeps every supported field unchanged", () => {
    const option = {
      default: 3,
      description: "Retries",
      required: true,
      sensitive: false,
      title: "Retry count",
      type: "number" as const,
    };

    expect(toProtocolUserConfig({ retries: option })).toEqual({ retries: option });
  });

  it("returns undefined for a missing or non-object userConfig", () => {
    expect(toProtocolUserConfig(undefined)).toBeUndefined();
    expect(toProtocolUserConfig(null)).toBeUndefined();
    expect(toProtocolUserConfig(["x"])).toBeUndefined();
  });
});
