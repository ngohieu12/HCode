import { describe, expect, it } from "vitest";
import type { StorePluginItem } from "@/settings/pluginStoreListing.js";
import {
  buildPluginStoreTryMention,
  buildPluginStoreTryPrompt,
} from "@/settings/pluginStoreTryPrompt.js";

function pluginItem(overrides: Partial<StorePluginItem> = {}): StorePluginItem {
  return {
    id: "demo-plugin@demo-market",
    name: "demo-plugin",
    marketplace: "demo-market",
    installed: true,
    restorable: false,
    orphaned: false,
    listing: {
      displayName: "Demo [Plugin]",
      displayNameI18n: { "vi-VN": "Plugin minh họa" },
      icon: "https://cdn.example.com/demo-plugin.png",
    },
    ...overrides,
  };
}

describe("Plugin Store try prompt", () => {
  it("prefills only the shared canonical Plugin reference for Try now", () => {
    expect(
      buildPluginStoreTryPrompt({
        item: pluginItem(),
        locale: "en-US",
        prompt: "",
      }),
    ).toBe("[@Demo \\[Plugin\\]](plugin://demo-plugin@demo-market)");
  });

  it("prefills the shared canonical Plugin reference before the example prompt", () => {
    expect(
      buildPluginStoreTryPrompt({
        item: pluginItem(),
        locale: "en-US",
        prompt: "  Summarize this workspace.  ",
      }),
    ).toBe(
      "[@Demo \\[Plugin\\]](plugin://demo-plugin@demo-market) Summarize this workspace.",
    );
  });

  it("uses the localized display label without changing the stable destination", () => {
    expect(
      buildPluginStoreTryPrompt({
        item: pluginItem(),
        locale: "vi-VN",
        prompt: "Kiểm tra cấu hình",
      }),
    ).toBe("[@Plugin minh họa](plugin://demo-plugin@demo-market) Kiểm tra cấu hình");
  });

  it("builds the same structured Plugin mention used by the @ picker", () => {
    expect(
      buildPluginStoreTryMention({
        item: pluginItem(),
        locale: "vi-VN",
      }),
    ).toEqual({
      id: "plugin:demo-plugin@demo-market",
      category: "plugins",
      label: "Plugin minh họa",
      value: "demo-plugin@demo-market",
      markdown: "[@Plugin minh họa](plugin://demo-plugin@demo-market)",
      data: {
        pluginId: "demo-plugin@demo-market",
        icon: "https://cdn.example.com/demo-plugin.png",
      },
    });
  });
});
