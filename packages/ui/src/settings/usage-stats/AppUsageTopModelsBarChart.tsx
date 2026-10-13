import { useCallback, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import type { AppUsageSnapshot } from "@zcode/shared";
import type { ChartConfig } from "@/components/ui/chart.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import {
  APP_USAGE_TOP_MODELS_LIMIT,
  buildAppUsageTopModelsChartViewModel,
  type AppUsageTopModelsBar,
  type AppUsageTopModelsMetric,
} from "@/settings/usage-stats/appUsageTopModelsBarChartViewModel.js";
import {
  UsageEmptyState,
  formatCompactNumber,
  formatCompactTokenUsage,
  formatPercent,
} from "@/settings/usage-stats/usageStatsUiParts.js";

// 横向柱状图的数值标签画在柱子右侧，右侧留白要大于标签宽度，否则末尾会被 SVG 裁掉。
const APP_USAGE_TOP_MODELS_CHART_MARGIN = {
  top: 4,
  right: 56,
  bottom: 4,
  left: 4,
} as const;
const APP_USAGE_TOP_MODELS_MAX_BAR_SIZE = 18;
const APP_USAGE_TOP_MODELS_AXIS_WIDTH = 124;
const APP_USAGE_TOP_MODELS_LABEL_MAX_LENGTH = 18;
// 榜长最多 10 行，但用户可能只用过 2~3 个模型；固定 h-80 会把少量柱子摊成大片空白，
// 因此按实际行数算高度，并夹在可读区间内。
const APP_USAGE_TOP_MODELS_ROW_HEIGHT = 30;
const APP_USAGE_TOP_MODELS_MIN_CHART_HEIGHT = 120;
const APP_USAGE_TOP_MODELS_MAX_CHART_HEIGHT = 320;

/**
 * 单指标榜用单一色相：每行已经用轴标签写明模型名，颜色不承载额外信息，
 * 再沿用饼图的 6 色轮转会让第 7~10 名出现重复色，反而像同一模型。
 */
const APP_USAGE_TOP_MODELS_METRIC_COLOR: Record<AppUsageTopModelsMetric, string> = {
  tokens: "var(--color-usage-chart-1)",
  requests: "var(--color-usage-chart-2)",
};

export function truncateAppUsageModelLabel(
  label: string,
  maxLength: number = APP_USAGE_TOP_MODELS_LABEL_MAX_LENGTH,
): string {
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.slice(0, maxLength - 1)}…`;
}

function formatMetricValue(locale: string, metric: AppUsageTopModelsMetric, value: number): string {
  return metric === "tokens"
    ? formatCompactTokenUsage(locale, value)
    : formatCompactNumber(locale, value);
}

export function AppUsageTopModelsBarChart({
  metric,
  snapshot,
}: {
  metric: AppUsageTopModelsMetric;
  snapshot: AppUsageSnapshot;
}) {
  const { intl, locale } = useZCodeIntl();
  const { bars, maxValue, total, hiddenModelCount } = useMemo(
    // Recharts 会把 data / config 镜像进内部 store；稳定派生结果可避免设置页刷新时重复派发。
    () => buildAppUsageTopModelsChartViewModel({ intl, snapshot, metric }),
    [intl, snapshot, metric],
  );

  const chartHeight = useMemo(
    () =>
      Math.min(
        APP_USAGE_TOP_MODELS_MAX_CHART_HEIGHT,
        Math.max(
          APP_USAGE_TOP_MODELS_MIN_CHART_HEIGHT,
          bars.length * APP_USAGE_TOP_MODELS_ROW_HEIGHT + 8,
        ),
      ),
    [bars.length],
  );

  const metricColor = APP_USAGE_TOP_MODELS_METRIC_COLOR[metric];
  const valueLabel = intl.formatMessage({
    id:
      metric === "tokens"
        ? "settings.usage.modelChart.metric.tokens"
        : "settings.usage.modelChart.metric.requests",
  });
  const secondaryLabel = intl.formatMessage({
    id:
      metric === "tokens"
        ? "settings.usage.modelChart.metric.requests"
        : "settings.usage.modelChart.metric.tokens",
  });
  const tokenUnit = intl.formatMessage({ id: "settings.usage.tokenUnit" });
  const requestUnit = intl.formatMessage({ id: "settings.usage.modelChart.requestUnit" });

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      value: {
        label: valueLabel,
        color: metricColor,
      },
    }),
    [metricColor, valueLabel],
  );

  const formatSecondary = useCallback(
    (bar: AppUsageTopModelsBar) => {
      const secondaryValue = metric === "tokens" ? bar.requestCount : bar.totalTokens;
      const formatted = formatMetricValue(
        locale,
        metric === "tokens" ? "requests" : "tokens",
        secondaryValue,
      );
      return `${formatted} ${metric === "tokens" ? requestUnit : tokenUnit}`;
    },
    [locale, metric, requestUnit, tokenUnit],
  );

  const formatTooltipItem = useCallback(
    (value: unknown, _name: unknown, item: { payload?: unknown }) => {
      const bar = item.payload as AppUsageTopModelsBar | undefined;
      const numericValue = typeof value === "number" ? value : (bar?.value ?? 0);
      const share = bar?.share ?? 0;
      return (
        <>
          <span
            className="size-2 shrink-0 self-center rounded-full"
            style={{ backgroundColor: metricColor }}
          />
          <div className="grid min-w-0 flex-1 gap-1">
            <div className="truncate text-foreground-subtle">{bar?.label ?? String(_name)}</div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-baseline gap-1 text-foreground">
                <span className="font-mono font-medium tabular-nums">
                  {formatMetricValue(locale, metric, numericValue)}
                </span>
                <span className="text-foreground-subtle">
                  {metric === "tokens" ? tokenUnit : requestUnit}
                </span>
              </span>
              <span className="font-mono text-foreground-subtle tabular-nums">
                {formatPercent(locale, share)}
              </span>
            </div>
            {bar ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-foreground-subtle">{secondaryLabel}</span>
                <span className="font-mono text-foreground-subtle tabular-nums">
                  {formatSecondary(bar)}
                </span>
              </div>
            ) : null}
          </div>
        </>
      );
    },
    [formatSecondary, locale, metric, metricColor, requestUnit, secondaryLabel, tokenUnit],
  );

  const tooltipContent = useMemo(
    () => (
      <ChartTooltipContent hideLabel hideIndicator indicator="line" formatter={formatTooltipItem} />
    ),
    [formatTooltipItem],
  );

  const formatAxisLabel = useCallback(
    (value: unknown) => truncateAppUsageModelLabel(String(value ?? "")),
    [],
  );
  const formatBarValueLabel = useCallback(
    (value: unknown) => {
      const numericValue = typeof value === "number" ? value : Number(value);
      return Number.isFinite(numericValue) ? formatMetricValue(locale, metric, numericValue) : "";
    },
    [locale, metric],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="text-ui-base font-medium text-foreground">
          {intl.formatMessage(
            {
              id:
                metric === "tokens"
                  ? "settings.usage.modelChart.topByTokens"
                  : "settings.usage.modelChart.topByRequests",
            },
            { count: APP_USAGE_TOP_MODELS_LIMIT },
          )}
        </h4>
        <span className="font-mono text-ui-sm text-foreground-subtle tabular-nums">
          {formatMetricValue(locale, metric, total)} {metric === "tokens" ? tokenUnit : requestUnit}
        </span>
      </div>
      {bars.length === 0 || maxValue <= 0 ? (
        <UsageEmptyState
          title={intl.formatMessage({ id: "settings.usage.emptyTitle" })}
          description={intl.formatMessage({
            id:
              metric === "tokens"
                ? "settings.usage.modelChart.tokensEmptyDescription"
                : "settings.usage.modelChart.requestsEmptyDescription",
          })}
        />
      ) : (
        <>
          <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
            <BarChart
              accessibilityLayer
              layout="vertical"
              data={bars}
              margin={APP_USAGE_TOP_MODELS_CHART_MARGIN}
              barCategoryGap="28%"
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide domain={[0, maxValue]} />
              <YAxis
                type="category"
                dataKey="label"
                width={APP_USAGE_TOP_MODELS_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tickFormatter={formatAxisLabel}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-foreground)", opacity: 0.06 }}
                content={tooltipContent}
              />
              <Bar
                dataKey="value"
                name={valueLabel}
                fill="var(--color-value)"
                radius={[0, 4, 4, 0]}
                maxBarSize={APP_USAGE_TOP_MODELS_MAX_BAR_SIZE}
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  offset={8}
                  fill="var(--color-foreground-subtle)"
                  fontSize={11}
                  formatter={formatBarValueLabel}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
          {hiddenModelCount > 0 ? (
            <p className="text-ui-sm text-foreground-subtle">
              {intl.formatMessage(
                { id: "settings.usage.modelChart.hiddenModels" },
                { count: hiddenModelCount },
              )}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
