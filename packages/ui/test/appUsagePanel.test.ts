// @vitest-environment jsdom
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppUsageModelUsage, AppUsageRange, AppUsageSnapshot } from "@zcode/shared";
import type { IServiceAccessor } from "@zcode/services";
import { ZCodeIntlProvider } from "@/i18n/IntlProvider.js";
import { ServiceProvider } from "@/hooks/useServices.js";
import {
  AppUsageLifetimeSummaryStrip,
  AppUsagePanel,
} from "@/settings/usage-stats/AppUsagePanel.js";
import {
  buildAppUsageModelRows,
  sortAppUsageModelRows,
  type AppUsageModelRow,
} from "@/settings/usage-stats/AppUsageModelTable.js";

vi.mock("@/ControlHintTooltip.js", () => ({
  ControlHintTooltip: ({ children, title }: { children: ReactNode; title: string }) =>
    createElement("span", { "data-tooltip-title": title }, children),
}));

function createSnapshot(
  overrides: Partial<AppUsageSnapshot> & { range?: AppUsageRange } = {},
): AppUsageSnapshot {
  return {
    range: overrides.range ?? "all",
    generatedAt: 0,
    timeZone: "UTC",
    source: "agent-db",
    summary: {
      totalTokens: 20_650_000_000,
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
      currentStreakDays: 5,
      longestSessionMs: 2 * 60 * 60 * 1000 + 15 * 60 * 1000,
      longestStreakDays: 34,
      peakDayTokens: 370_000_000,
      favoriteModel: null,
    },
    heatmap: {
      startDate: null,
      endDate: null,
      maxTokens: 370_000_000,
      weeks: [],
    },
    dailyModelUsage: [],
    models: [],
    tools: [],
    ...overrides,
  };
}

function createOneDayHeatmap(totalTokens: number): AppUsageSnapshot["heatmap"] {
  return {
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    maxTokens: totalTokens,
    weeks: [
      {
        weekIndex: 0,
        days: [
          {
            date: "2026-08-15",
            level: 1,
            totalTokens,
            turnCount: 1,
            toolCallCount: 0,
          },
        ],
      },
    ],
  };
}

function createModels(): AppUsageModelUsage[] {
  return [
    { modelId: "glm-4.6", totalTokens: 900, inputTokens: 0, outputTokens: 0, requestCount: 3, share: 0 },
    { modelId: "glm-5.3", totalTokens: 100, inputTokens: 0, outputTokens: 0, requestCount: 9, share: 0 },
    // 未记录 modelId 的归组行：有量就必须展示，回退成"未知模型"。
    { modelId: null, totalTokens: 40, inputTokens: 0, outputTokens: 0, requestCount: 2, share: 0 },
    // token 与请求数都是 0 的历史模型不应进表。
    { modelId: "glm-4.5-air", totalTokens: 0, inputTokens: 0, outputTokens: 0, requestCount: 0, share: 0 },
  ];
}

function createServices(): IServiceAccessor {
  return {
    appUsageService: {
      getAppUsageSnapshot: vi.fn(async ({ range }: { range: AppUsageRange }) =>
        createSnapshot({
          range,
          heatmap: range === "all" ? createOneDayHeatmap(99) : createOneDayHeatmap(10),
          models: createModels(),
          summary: {
            ...createSnapshot().summary,
            totalTokens: range === "all" ? 20_650_000_000 : 389_000,
            totalSessions: 4,
            totalTurns: 8,
            activeDays: 1,
            favoriteModel:
              range === "all"
                ? null
                : {
                    modelId: "glm-5.3",
                    totalTokens: 280_080,
                    share: 0.72,
                  },
          },
        }),
      ),
    },
  } as unknown as IServiceAccessor;
}

afterEach(() => {
  // vitest 未开 globals，testing-library 不会自动卸载上一轮的 DOM；
  // 不清理的话第二个用例会查到两份面板（findByText 命中多元素直接抛错）。
  cleanup();
  vi.restoreAllMocks();
});

describe("AppUsageLifetimeSummaryStrip", () => {
  it("renders all-time app usage metrics independent of the selected range", () => {
    const html = renderToStaticMarkup(
      createElement(
        ZCodeIntlProvider,
        { initialLocale: "zh-CN" },
        createElement(AppUsageLifetimeSummaryStrip, {
          snapshot: createSnapshot(),
        }),
      ),
    );

    expect(html).toContain("累计 Token 数");
    expect(html).toContain("峰值 Token 数");
    expect(html).toContain("最长聊天时长");
    expect(html).toContain("当前连续天数");
    expect(html).toContain("最长连续天数");
    expect(html).toContain("206.5 亿");
    expect(html).toContain("3.7 亿");
    expect(html).toContain("2 小时 15 分");
    expect(html).toContain("5 天");
    expect(html).toContain("34 天");
    expect(html).toContain("rounded-xl");
    expect(html).toContain("h-7");
    expect(html).toContain("w-px");
    expect(html).not.toContain("border-border");
    expect(html).not.toContain("border-t");
    expect(html).not.toContain("sm:border-l");
  });

  it("renders the lifetime strip, range tabs and a sortable model table without charts", async () => {
    render(
      createElement(
        ServiceProvider,
        { services: createServices() },
        createElement(ZCodeIntlProvider, { initialLocale: "zh-CN" }, createElement(AppUsagePanel)),
      ),
    );

    // 先等表格出现（累计摘要条在快照到达前就已渲染，不能作为数据就绪的信号）。
    expect(await screen.findByRole("button", { name: "Token 用量" }, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getByText("累计 Token 数")).toBeTruthy();
    // 图表已整体移除：趋势图、模型柱状图与热力图都不应再出现。
    expect(screen.queryByText("每日 Token 趋势图")).toBeNull();
    expect(screen.queryByText("Token 活动")).toBeNull();
    expect(screen.queryByText("正在统计中")).toBeNull();
    // 表格表头：模型 / Token 用量 / 请求数，两列数值都可点按排序。
    expect(screen.getByRole("button", { name: "请求数" })).toBeTruthy();
    expect(screen.getByText("时间范围")).toBeTruthy();
    expect(screen.getByText("近 7 日").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("近 30 日").getAttribute("aria-selected")).toBe("false");

    const rows = screen.getAllByTestId("app-usage-model-row");
    expect(rows).toHaveLength(3);
    // 默认按 Token 用量降序。
    expect(rows[0]?.textContent).toContain("glm-4.6");
    expect(rows[1]?.textContent).toContain("glm-5.3");
    expect(rows[2]?.textContent).toContain("未知模型");
    // 合计行仍然给出全量口径。
    expect(screen.getByText("合计")).toBeTruthy();
  });

  it("sorts the model table by tokens or requests from the column headers", async () => {
    render(
      createElement(
        ServiceProvider,
        { services: createServices() },
        createElement(ZCodeIntlProvider, { initialLocale: "zh-CN" }, createElement(AppUsagePanel)),
      ),
    );

    const modelNames = () =>
      screen
        .getAllByTestId("app-usage-model-row")
        .map((row) => row.querySelector("th")?.textContent ?? "");

    await screen.findByRole("button", { name: "请求数" }, { timeout: 10_000 });
    expect(modelNames()).toEqual(["glm-4.6", "glm-5.3", "未知模型"]);

    // 点「请求数」切到请求维度（默认降序）：glm-5.3 请求最多。
    fireEvent.click(screen.getByRole("button", { name: "请求数" }));
    expect(modelNames()).toEqual(["glm-5.3", "glm-4.6", "未知模型"]);

    // 再点同一列切换升/降序。
    fireEvent.click(screen.getByRole("button", { name: "请求数" }));
    expect(modelNames()).toEqual(["未知模型", "glm-4.6", "glm-5.3"]);

    // 切回「Token 用量」列重新按 token 降序。
    fireEvent.click(screen.getByRole("button", { name: "Token 用量" }));
    expect(modelNames()).toEqual(["glm-4.6", "glm-5.3", "未知模型"]);
  });

  it("builds model rows from the snapshot and drops zero-volume models", () => {
    const intl = { formatMessage: ({ id }: { id: string }) => id };
    const rows = buildAppUsageModelRows({ intl, snapshot: createSnapshot({ models: createModels() }) });

    expect(rows.map((row) => row.label)).toEqual(["glm-4.6", "glm-5.3", "settings.usage.unknownModel"]);
    expect(rows.map((row) => row.totalTokens)).toEqual([900, 100, 40]);
    expect(rows.map((row) => row.requestCount)).toEqual([3, 9, 2]);
  });

  it("sorts rows by either metric in both directions with a stable tie-break", () => {
    const rows: AppUsageModelRow[] = [
      { key: "a", label: "a", totalTokens: 10, requestCount: 1 },
      { key: "b", label: "b", totalTokens: 30, requestCount: 1 },
      { key: "c", label: "c", totalTokens: 30, requestCount: 5 },
    ];

    expect(sortAppUsageModelRows(rows, "tokens", "desc").map((row) => row.key)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(sortAppUsageModelRows(rows, "tokens", "asc").map((row) => row.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
    // 请求数同分时沿用协议顺序（a 在 b 之前）。
    expect(sortAppUsageModelRows(rows, "requests", "desc").map((row) => row.key)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(sortAppUsageModelRows(rows, "requests", "asc").map((row) => row.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
