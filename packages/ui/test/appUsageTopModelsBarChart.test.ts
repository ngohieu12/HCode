import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AppUsageSnapshot } from "@zcode/shared";
import {
  APP_USAGE_TOP_MODELS_LIMIT,
  buildAppUsageTopModelsChartViewModel,
  resolveAppUsageMetricValue,
} from "@/settings/usage-stats/appUsageTopModelsBarChartViewModel.js";
import { truncateAppUsageModelLabel } from "@/settings/usage-stats/AppUsageTopModelsBarChart.js";

function createSnapshot(models: AppUsageSnapshot["models"]): AppUsageSnapshot {
  const totalTokens = models.reduce((sum, model) => sum + model.totalTokens, 0);
  return {
    range: "30d",
    generatedAt: 0,
    timeZone: "UTC",
    source: "agent-db",
    summary: {
      totalTokens,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      cacheHitRate: 0,
      totalSessions: 0,
      totalTurns: 0,
      toolCallCount: 0,
      toolErrorRate: 0,
      modelErrorRate: 0,
      avgTimeToFirstTokenMs: null,
      avgTurnDurationMs: null,
      activeDays: 0,
      currentStreakDays: 0,
      longestSessionMs: 0,
      longestStreakDays: 0,
      peakDayTokens: 0,
      favoriteModel: null,
    },
    heatmap: {
      startDate: null,
      endDate: null,
      maxTokens: 0,
      weeks: [],
    },
    dailyModelUsage: [],
    models,
    tools: [],
  };
}

function createModel(
  modelId: string,
  totalTokens: number,
  requestCount: number,
): AppUsageSnapshot["models"][number] {
  return {
    modelId,
    totalTokens,
    inputTokens: 0,
    outputTokens: 0,
    requestCount,
    share: 0,
  };
}

const intl = {
  formatMessage(descriptor: { id: string }) {
    if (descriptor.id === "settings.usage.unknownModel") {
      return "Unknown model";
    }
    return descriptor.id;
  },
};

describe("buildAppUsageTopModelsChartViewModel", () => {
  it("按 token 降序取前 10，并记录未入榜模型数量", () => {
    const models = Array.from({ length: 13 }, (_, index) =>
      createModel(`model-${index}`, (13 - index) * 100, (13 - index) * 2),
    );
    const snapshot = createSnapshot(models);

    const viewModel = buildAppUsageTopModelsChartViewModel({
      intl,
      snapshot,
      metric: "tokens",
    });

    expect(APP_USAGE_TOP_MODELS_LIMIT).toBe(10);
    expect(viewModel.bars).toHaveLength(10);
    expect(viewModel.bars.map((bar) => bar.label)).toEqual([
      "model-0",
      "model-1",
      "model-2",
      "model-3",
      "model-4",
      "model-5",
      "model-6",
      "model-7",
      "model-8",
      "model-9",
    ]);
    expect(viewModel.bars[0]).toMatchObject({ rank: 1, value: 1300, totalTokens: 1300 });
    expect(viewModel.hiddenModelCount).toBe(3);
    // 占比分母是全部有量模型（13 个），top 10 之和小于 100%。
    expect(viewModel.total).toBe(9100);
    expect(viewModel.bars.reduce((sum, bar) => sum + bar.share, 0)).toBeLessThan(1);
    expect(viewModel.maxValue).toBe(1300);
  });

  it("按请求数排名时不再被 token 顺序左右", () => {
    const snapshot = createSnapshot([
      // token 高但请求少：按请求排名时应落到后面。
      createModel("few-big-calls", 9000, 2),
      createModel("many-small-calls", 100, 40),
      createModel("zero-request-model", 500, 0),
    ]);

    const byRequests = buildAppUsageTopModelsChartViewModel({
      intl,
      snapshot,
      metric: "requests",
    });

    expect(byRequests.bars.map((bar) => bar.label)).toEqual(["many-small-calls", "few-big-calls"]);
    expect(byRequests.bars[0]).toMatchObject({ value: 40, totalTokens: 100, requestCount: 40 });
    expect(byRequests.bars[0]?.share).toBeCloseTo(40 / 42);

    const byTokens = buildAppUsageTopModelsChartViewModel({
      intl,
      snapshot,
      metric: "tokens",
    });

    expect(byTokens.bars.map((bar) => bar.label)).toEqual([
      "few-big-calls",
      "zero-request-model",
      "many-small-calls",
    ]);
  });

  it("过滤掉当前指标为 0 的模型并把未知 modelId 显示为未知模型", () => {
    const snapshot = createSnapshot([
      createModel("model-a", 0, 0),
      createModel(null, 120, 3),
      createModel("  ", 0, 7),
    ]);

    const byTokens = buildAppUsageTopModelsChartViewModel({
      intl,
      snapshot,
      metric: "tokens",
    });
    const byRequests = buildAppUsageTopModelsChartViewModel({
      intl,
      snapshot,
      metric: "requests",
    });

    expect(byTokens.bars).toHaveLength(1);
    expect(byTokens.bars[0]).toMatchObject({ label: "Unknown model", value: 120, share: 1 });
    // 空白 modelId 同样归为未知模型，但两个指标的条目不互相污染。
    expect(byRequests.bars).toHaveLength(2);
    expect(byRequests.bars.map((bar) => bar.label)).toEqual(["Unknown model", "Unknown model"]);
    expect(byRequests.bars.map((bar) => bar.value)).toEqual([7, 3]);
  });

  it("空数据返回空榜而不是抛错", () => {
    const viewModel = buildAppUsageTopModelsChartViewModel({
      intl,
      snapshot: createSnapshot([]),
      metric: "tokens",
    });

    expect(viewModel.bars).toEqual([]);
    expect(viewModel.maxValue).toBe(0);
    expect(viewModel.total).toBe(0);
    expect(viewModel.hiddenModelCount).toBe(0);
  });

  it("resolveAppUsageMetricValue 按指标取值", () => {
    const model = createModel("model-a", 500, 4);

    expect(resolveAppUsageMetricValue("tokens", model)).toBe(500);
    expect(resolveAppUsageMetricValue("requests", model)).toBe(4);
  });
});

describe("AppUsageTopModelsBarChart 渲染", () => {
  const source = readFileSync(
    resolve(process.cwd(), "packages/ui/src/settings/usage-stats/AppUsageTopModelsBarChart.tsx"),
    "utf8",
  );

  it("按实际榜长计算图表高度，少量模型时不留大片空白", () => {
    expect(source).toContain("style={{ height: chartHeight }}");
    expect(source).toContain("APP_USAGE_TOP_MODELS_ROW_HEIGHT = 30");
    expect(source).toContain("APP_USAGE_TOP_MODELS_MIN_CHART_HEIGHT = 120");
    // 满榜 10 行仍落在上限内：10 * 30 + 8 = 308。
    expect(source).toContain("APP_USAGE_TOP_MODELS_MAX_CHART_HEIGHT = 320");
  });

  it("使用横向柱状图，不再出现饼图组件", () => {
    expect(source).toContain('layout="vertical"');
    expect(source).toContain("<BarChart");
    expect(source).toContain('type="category"');
    expect(source).toContain('dataKey="value"');
    expect(source).toContain("<LabelList");
    expect(source).not.toContain("PieChart");
    // 横向柱状图的 YAxis 默认从绘图区顶部往下排（实测 reversed 会把第一名压到最底部），
    // 排名榜必须保持第 1 名在最上面，因此不能加 reversed。
    expect(source).not.toContain("reversed");
    expect(source).not.toContain("<Pie");
    expect(source).not.toContain("innerRadius");
  });

  it("长模型名在轴标签上截断，避免挤压绘图区", () => {
    expect(source).toContain("tickFormatter={formatAxisLabel}");
    expect(truncateAppUsageModelLabel("short-model")).toBe("short-model");
    expect(truncateAppUsageModelLabel("a".repeat(40))).toBe(`${"a".repeat(17)}…`);
    expect(truncateAppUsageModelLabel("a".repeat(40))).toHaveLength(18);
  });
});
