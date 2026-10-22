import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ProviderSettingsFormProvider } from "@/lib/providerSettingsFormTypes.js";
import {
  HCODE_BUILTIN_PROVIDERS_VISIBLE,
  PRESET_PROVIDER_SPECS,
} from "@/settings/model-provider-section/constants.js";

vi.mock("@/i18n/IntlProvider.js", () => ({
  useZCodeIntl: () => ({
    intl: { formatMessage: ({ id }: { id: string }) => id },
  }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: vi.fn(),
    useMemo: (factory: () => unknown) => factory(),
  };
});

function createCustomProvider(): ProviderSettingsFormProvider {
  return {
    providerId: "custom-provider",
    executable: true,
    enabled: true,
    hasPersonalConfig: true,
    personalConfig: { group: "standard-personal", personalModelIds: ["gpt-demo"] },
    config: {
      label: "Custom Provider",
      group: "standard-personal",
      access: { type: "api-key", apiKey: "sk-demo" },
      api: { type: "openai-chat-completions", baseUrl: "https://example.com/v1" },
      personalModelIds: ["gpt-demo"],
    },
    models: [{ modelId: "gpt-demo", config: {}, hasPersonalConfig: true }],
  };
}

const intl = { formatMessage: ({ id }: { id: string }) => id };

describe("HCode 不显示内置 provider", () => {
  it("默认关闭 Z.ai / BigModel / Start Plan 内置 provider", () => {
    expect(HCODE_BUILTIN_PROVIDERS_VISIBLE).toBe(false);
    // 规格表保留给旧数据反查使用，只是不再进入导航。
    expect(PRESET_PROVIDER_SPECS.length).toBeGreaterThan(0);
  });

  it("导航只包含用户自己添加的 provider，不生成 Start Plan / Coding Plan 入口", async () => {
    const { useModelProviderNavigation } =
      await import("@/settings/model-provider-section/useModelProviderNavigation.js");

    const result = useModelProviderNavigation({
      presetProviders: [],
      modelProviders: [createCustomProvider()],
      codingPlanEntitlements: {},
      selectedNodeKey: null,
      setSelectedNodeKey: vi.fn(),
      intl,
    });

    expect(result.navigationItems.map((item) => item.type)).toEqual(["custom"]);
    expect(result.navigationGroups.find((group) => group.id === "preset")?.items ?? []).toEqual([]);
  });

  it("一个 provider 都没有时导航为空", async () => {
    const { useModelProviderNavigation } =
      await import("@/settings/model-provider-section/useModelProviderNavigation.js");

    const result = useModelProviderNavigation({
      presetProviders: [],
      modelProviders: [],
      codingPlanEntitlements: {},
      selectedNodeKey: null,
      setSelectedNodeKey: vi.fn(),
      intl,
    });

    expect(result.navigationItems).toEqual([]);
    expect(result.selectedNavItem).toBeNull();
  });

  it("空态卡片引导用户添加 provider", async () => {
    const { ModelProviderEmptyCard } =
      await import("@/settings/model-provider-section/StatusCards.js");
    const markup = renderToStaticMarkup(
      createElement(ModelProviderEmptyCard, { onAddProvider: vi.fn() }),
    );

    expect(markup).toContain('data-model-provider-empty="true"');
    expect(markup).toContain("settings.modelProvider.emptyAll.title");
    expect(markup).toContain("settings.modelProvider.emptyAll.description");
    expect(markup).toContain("settings.modelProvider.addProviderAction");
  });
});
