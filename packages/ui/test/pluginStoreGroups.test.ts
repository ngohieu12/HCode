// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID } from "@zcode/shared";
import type { PluginStoreActions } from "../src/settings/PluginStoreCard.js";
import type { StorePluginItem } from "../src/settings/pluginStoreListing.js";

const state = vi.hoisted(() => ({ locale: "zh-CN" }));
vi.mock("@/hooks/useInterfaceMode.js", () => ({ useIsOfficeMode: () => false }));
vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({
    locale: state.locale,
    intl: { formatMessage: ({ id }: { id: string }) => id },
  }),
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

describe.each(["zh-CN", "en-US"])("unified plugin groups in %s", (locale) => {
  it("shows official and personal plugins together and retains manual group toggles", async () => {
    state.locale = locale;
    const personalMarketplace = "my-market";
    const items: StorePluginItem[] = [
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `official-${index}@${ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID}`,
        name: `official-${index}`,
        marketplace: ZCODE_OFFICIAL_PLUGIN_MARKETPLACE_ID,
        installed: false,
        restorable: false,
        orphaned: false,
        listing: { category: "utilities" },
      })),
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `personal-${index}@${personalMarketplace}`,
        name: `personal-${index}`,
        marketplace: personalMarketplace,
        installed: false,
        restorable: false,
        orphaned: false,
        listing: { category: "utilities" },
      })),
    ];
    const container = document.createElement("div");
    root = createRoot(container);
    const render = (query = "") =>
      act(() =>
        root?.render(
          createElement(PluginStoreListView, {
            items,
            marketplaces: [],
            actions: {} as PluginStoreActions,
            loading: false,
            query,
            onQueryChange: vi.fn(),
            onOpenManage: vi.fn(),
          }),
        ),
      );
    const count = () => container.querySelectorAll('[data-testid="card"]').length;
    const toggle = (groupKey: string) =>
      act(() =>
        container
          .querySelector<HTMLButtonElement>(
            `[data-testid="plugin-store-group-toggle"][data-group-key="${groupKey}"]`,
          )!
          .click(),
      );

    await render();
    expect(count()).toBe(16);
    expect(container.querySelector('[data-testid="plugin-store-segment-public"]')).toBeNull();
    expect(container.querySelector('[data-testid="plugin-store-segment-personal"]')).toBeNull();
    expect(container.querySelector('[data-testid="plugin-store-official-catalog"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="plugin-store-personal-catalog"]')).not.toBeNull();
    expect(
      container.querySelector('[data-plugin-id="official-0@zcode-plugins-official"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-plugin-id="personal-0@my-market"]')).not.toBeNull();

    await toggle("category:utilities");
    expect(count()).toBe(14);
    await render("personal-7@my-market");
    expect(count()).toBe(1);
    expect(container.querySelector('[data-plugin-id="personal-7@my-market"]')).not.toBeNull();

    await render();
    expect(count()).toBe(14);
    await toggle("category:utilities");
    expect(count()).toBe(16);
    await toggle(`marketplace:${personalMarketplace}`);
    expect(count()).toBe(14);
    await toggle(`marketplace:${personalMarketplace}`);
    expect(count()).toBe(16);
  });
});
