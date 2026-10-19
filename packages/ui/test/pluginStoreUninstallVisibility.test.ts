// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID } from "@zcode/shared";
import type { PluginStoreActions } from "../src/settings/PluginStoreCard.js";
import type { StorePluginItem } from "../src/settings/pluginStoreListing.js";

vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({
    locale: "en-US",
    intl: { formatMessage: ({ id }: { id: string }) => id },
  }),
}));
vi.mock("@/plugin-ui/index.js", () => ({
  useUiPluginRecommendations: () => ({ recommendations: [] }),
}));
vi.mock("@/settings/PluginStoreCard.js", () => ({
  PluginStoreCard: ({ item }: { item: StorePluginItem }) =>
    createElement("div", { "data-testid": "card", "data-plugin-id": item.id }, item.id),
}));
vi.mock("@/settings/PluginStoreAvatar.js", () => ({ PluginStoreAvatar: () => null }));
import { PluginStoreListView } from "../src/settings/PluginStoreListView.js";

let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  if (root) await act(() => root?.unmount());
  root = undefined;
});

const PLUGIN_ID = `plug@${ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID}`;

function summary(componentTypes: string[]): StorePluginItem["summary"] {
  return {
    id: PLUGIN_ID,
    name: "plug",
    marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    installed: false,
    componentTypes,
  };
}

/** 已安装的 UI 插件：运行时 info 带 uiSurfaces，目录条目只声明 mcp（未声明 ui）。 */
function installedUiItem(): StorePluginItem {
  return {
    id: PLUGIN_ID,
    name: "plug",
    marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    installed: true,
    restorable: false,
    orphaned: false,
    listing: { category: "utilities", publisherType: "official" },
    summary: summary(["mcp"]),
    info: {
      id: PLUGIN_ID,
      name: "plug",
      marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
      enabled: true,
      source: "cache",
      skillRootCount: 0,
      commandRootCount: 0,
      mcpServerNames: ["server"],
      rootPath: "/cache/plug",
      uiSurfaces: [
        {
          pluginId: PLUGIN_ID,
          pluginName: "plug",
          id: "panel",
          title: "Panel",
          server: "server",
          resourceUri: "ui://panel",
          availability: "session",
        },
      ],
    } as StorePluginItem["info"],
    installedMeta: {
      id: PLUGIN_ID,
      name: "plug",
      marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
      enabled: true,
      scope: "user",
      componentTypes: ["mcp", "ui"],
    } as StorePluginItem["installedMeta"],
  };
}

/** 卸载后的同一条目：info/installedMeta 消失，只剩目录 summary，必须仍在浏览列表中可见。 */
function uninstalledUiItem(): StorePluginItem {
  return {
    id: PLUGIN_ID,
    name: "plug",
    marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
    installed: false,
    restorable: false,
    orphaned: false,
    listing: { category: "utilities", publisherType: "official" },
    summary: summary(["mcp"]),
  };
}

function installedSkillItem(): StorePluginItem {
  return {
    ...uninstalledUiItem(),
    installed: true,
    summary: summary(["skill"]),
    info: {
      id: PLUGIN_ID,
      name: "plug",
      marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
      enabled: true,
      source: "cache",
      skillRootCount: 1,
      commandRootCount: 0,
      mcpServerNames: [],
      rootPath: "/cache/plug",
    } as StorePluginItem["info"],
  };
}

function uninstalledSkillItem(): StorePluginItem {
  return { ...uninstalledUiItem(), summary: summary(["skill"]) };
}

describe("plugin store uninstall visibility", () => {
  it.each([
    ["ui", installedUiItem, uninstalledUiItem],
    ["non-ui", installedSkillItem, uninstalledSkillItem],
  ] as const)(
    "keeps a %s plugin visible in the public browse list after uninstall, not only via search",
    async (_kind, makeInstalled, makeUninstalled) => {
      const container = document.createElement("div");
      root = createRoot(container);
      const render = (item: StorePluginItem, query = "") =>
        act(() =>
          root?.render(
            createElement(PluginStoreListView, {
              items: [item],
              marketplaces: [],
              actions: {} as PluginStoreActions,
              loading: false,
              query,
              segment: "public" as const,
              onQueryChange: vi.fn(),
              onSegmentChange: vi.fn(),
            }),
          ),
        );
      const cardIds = () =>
        [...container.querySelectorAll('[data-testid="card"]')].map((el) =>
          el.getAttribute("data-plugin-id"),
        );

      await render(makeInstalled());
      expect(cardIds()).toEqual([PLUGIN_ID]);

      // 卸载后条目失去运行时信息，但仍是市场目录条目：浏览列表（无搜索词）必须直接可见。
      await render(makeUninstalled());
      expect(cardIds()).toEqual([PLUGIN_ID]);

      await render(makeUninstalled(), "plug");
      expect(cardIds()).toEqual([PLUGIN_ID]);

      await render(makeUninstalled());
      expect(cardIds()).toEqual([PLUGIN_ID]);
    },
  );
});
