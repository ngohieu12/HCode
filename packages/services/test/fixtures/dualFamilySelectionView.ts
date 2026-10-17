import type { ModelSelectionView } from "@zcode/provider";

/**
 * 两个自定义供应商同时存在的模型选择视图。
 *
 * 原文件名/常量都绑在已删除的 Off-Peak 体系（OFF_PEAK_PROVIDER_IDS 属于内置供应商），
 * 这里只保留「两个供应商、模型名部分重叠」这一形状供运行时配置类用例使用。
 */
export function dualFamilySelectionView(
  values: readonly string[] = ["disabled", "high", "max"],
): ModelSelectionView {
  return {
    revision: 1,
    providers: (["provider-a", "provider-b"] as const).map((family) => ({
      providerId: `custom:${family}`,
      config: { visibility: "hidden" },
      models: [family === "provider-a" ? "A-only" : "B-only", "shared-model"].map((modelId) => ({
        modelId,
        config: {
          enabled: true,

          properties: {
            requiresMfjsToolSchema: false,
            contextWindow: 200000,
            inputFormat: {
              supportsText: true,
              supportsImage: false,
              supportsVideo: false,
              supportsAudio: false,
              supportsPdf: false,
            },
            outputFormat: { supportsText: true },
            supportsToolCall: true,
            supportsJsonSchemaOutput: false,
            supportsNativeWebSearch: false,
            supportsMidConversationSystem: false,
          },
          optionSpecs: {
            reasoningLevel: { values, map: "{}" },
            maxOutputTokens: { max: 32000, map: "{}" },
          },
        },
      })),
    })),
  };
}
