import type { AppUsageModelUsage, AppUsageSnapshot } from "@zcode/shared";

/**
 * 模型榜长度。
 *
 * 饼图时代是 6 等分色板 + "其他模型" 合并，超过 6 个模型就被压缩成一个"其他"扇区，
 * 看不到谁在吃 token。改成横向柱状图后色板不再限制榜长，统一展示前 10 个模型。
 */
export const APP_USAGE_TOP_MODELS_LIMIT = 10;

/** 模型榜指标：按 token 用量或按请求次数排名。 */
export type AppUsageTopModelsMetric = "tokens" | "requests";

interface UsageIntl {
  formatMessage: (descriptor: { id: string }) => string;
}

export interface AppUsageTopModelsBar {
  key: string;
  /** 模型展示名；未记录 modelId 时回退到"未知模型"。 */
  label: string;
  /** 1 起的排名。 */
  rank: number;
  /** 当前指标的数值。 */
  value: number;
  totalTokens: number;
  requestCount: number;
  /** 占该指标总量（全部有量模型，不只是榜上前 10）的比例。 */
  share: number;
}

export function resolveAppUsageMetricValue(
  metric: AppUsageTopModelsMetric,
  model: AppUsageModelUsage,
): number {
  return metric === "tokens" ? model.totalTokens : model.requestCount;
}

function resolveBarModelLabel(intl: UsageIntl, modelId: string | null): string {
  return modelId?.trim() || intl.formatMessage({ id: "settings.usage.unknownModel" });
}

export function buildAppUsageTopModelsChartViewModel({
  intl,
  snapshot,
  metric,
}: {
  intl: UsageIntl;
  snapshot: AppUsageSnapshot;
  metric: AppUsageTopModelsMetric;
}) {
  const valueOf = (model: AppUsageModelUsage) => resolveAppUsageMetricValue(metric, model);

  // 两个榜单各自按自己的指标过滤：token 为 0 或请求数为 0 的模型不占榜位，
  // 否则"没有产生请求"的历史模型会把有请求的模型挤出前 10。
  const ranked = snapshot.models
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => valueOf(model) > 0)
    .sort((left, right) => {
      const diff = valueOf(right.model) - valueOf(left.model);
      // 同分时沿用协议顺序（协议已按 token 降序），避免每次刷新榜内顺序抖动。
      return diff !== 0 ? diff : left.index - right.index;
    });

  // 占比分母取该指标下全部有量模型，保证 top 10 的占比之和在模型较多时小于 100%。
  const total = ranked.reduce((sum, { model }) => sum + valueOf(model), 0);
  const visible = ranked.slice(0, APP_USAGE_TOP_MODELS_LIMIT);
  const bars: AppUsageTopModelsBar[] = visible.map(({ model }, rank) => {
    const value = valueOf(model);
    return {
      key: `model${rank}`,
      label: resolveBarModelLabel(intl, model.modelId),
      rank: rank + 1,
      value,
      totalTokens: model.totalTokens,
      requestCount: model.requestCount,
      share: total > 0 ? value / total : 0,
    };
  });

  return {
    bars,
    total,
    maxValue: bars.reduce((max, bar) => Math.max(max, bar.value), 0),
    hiddenModelCount: Math.max(0, ranked.length - bars.length),
  };
}
