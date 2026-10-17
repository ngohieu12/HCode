import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppUsageModelUsage, AppUsageSnapshot } from "@zcode/shared";
import { cn } from "@/components/lib/utils.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import {
  formatCompactNumber,
  formatCompactTokenUsage,
  UsageEmptyState,
} from "@/settings/usage-stats/usageStatsUiParts.js";

/**
 * 模型用量表：把原先的「每日趋势图 + 两张 Top10 柱状图」换成一张可排序的表格。
 *
 * 替换原因：图表只能回答「谁最多」，且 Top10 把长尾模型折叠掉；表格能在同一屏
 * 给出每个模型的 token 与请求数，并支持按这两个指标任一列排序。
 * 这里刻意不再截断前 10 名——表格行高固定、纵向可滚动，长尾模型不再需要被隐藏。
 */
export type AppUsageModelSortKey = "tokens" | "requests";
export type AppUsageModelSortDirection = "desc" | "asc";

export interface AppUsageModelRow {
  key: string;
  /** 模型展示名；未记录 modelId 时回退到"未知模型"。 */
  label: string;
  totalTokens: number;
  requestCount: number;
}

interface UsageIntl {
  formatMessage: (descriptor: { id: string }) => string;
}

/**
 * 只保留有量模型：token 与请求数都为 0 的历史模型（例如只被选中过、从未真正调用）
 * 会让表里出现一片全 0 噪声行，把真正产生消耗的模型挤到下面。
 */
export function hasAppUsageModelVolume(model: AppUsageModelUsage): boolean {
  return model.totalTokens > 0 || model.requestCount > 0;
}

export function buildAppUsageModelRows({
  intl,
  snapshot,
}: {
  intl: UsageIntl;
  snapshot: AppUsageSnapshot;
}): AppUsageModelRow[] {
  return snapshot.models
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => hasAppUsageModelVolume(model))
    .map(({ model, index }) => ({
      key: `model-${index}`,
      label: model.modelId?.trim() || intl.formatMessage({ id: "settings.usage.unknownModel" }),
      totalTokens: model.totalTokens,
      requestCount: model.requestCount,
    }));
}

function resolveAppUsageModelSortValue(
  row: AppUsageModelRow,
  key: AppUsageModelSortKey,
): number {
  return key === "tokens" ? row.totalTokens : row.requestCount;
}

export function sortAppUsageModelRows(
  rows: readonly AppUsageModelRow[],
  key: AppUsageModelSortKey,
  direction: AppUsageModelSortDirection,
): AppUsageModelRow[] {
  const factor = direction === "desc" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const diff =
        resolveAppUsageModelSortValue(left.row, key) -
        resolveAppUsageModelSortValue(right.row, key);
      // 同分时沿用协议顺序（协议已按 token 降序），避免每次刷新表内顺序抖动。
      return diff !== 0 ? diff * factor : left.index - right.index;
    })
    .map(({ row }) => row);
}

export function AppUsageModelTable({ snapshot }: { snapshot: AppUsageSnapshot }) {
  const { intl, locale } = useZCodeIntl();
  const [sortKey, setSortKey] = useState<AppUsageModelSortKey>("tokens");
  const [direction, setDirection] = useState<AppUsageModelSortDirection>("desc");

  const rows = useMemo(
    () => sortAppUsageModelRows(buildAppUsageModelRows({ intl, snapshot }), sortKey, direction),
    [direction, intl, snapshot, sortKey],
  );
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          totalTokens: acc.totalTokens + row.totalTokens,
          requestCount: acc.requestCount + row.requestCount,
        }),
        { totalTokens: 0, requestCount: 0 },
      ),
    [rows],
  );

  const columns: Array<{ key: AppUsageModelSortKey; label: string }> = [
    { key: "tokens", label: intl.formatMessage({ id: "settings.usage.modelTable.tokens" }) },
    { key: "requests", label: intl.formatMessage({ id: "settings.usage.modelTable.requests" }) },
  ];

  function toggleSort(key: AppUsageModelSortKey) {
    // 换列时默认从大到小（"谁吃得最多"是打开这张表的默认问题）；
    // 点同一列则在升/降之间切换。
    if (key === sortKey) {
      setDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setDirection("desc");
  }

  return (
    <section className="space-y-3 rounded-xl bg-surface p-4">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="truncate text-ui-base font-medium text-foreground">
          {intl.formatMessage({ id: "settings.usage.modelTableTitle" })}
        </h3>
        <div className="shrink-0 text-ui-sm text-foreground-subtle">
          {intl.formatMessage(
            { id: "settings.usage.modelTable.modelCount" },
            { count: rows.length },
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <UsageEmptyState
          title={intl.formatMessage({ id: "settings.usage.emptyTitle" })}
          description={intl.formatMessage({
            id: "settings.usage.emptyDescription",
          })}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-ui-base">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="px-2 py-2 text-left font-medium text-foreground-subtle"
                >
                  {intl.formatMessage({ id: "settings.usage.modelTable.model" })}
                </th>
                {columns.map((column) => {
                  const active = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        active ? (direction === "desc" ? "descending" : "ascending") : "none"
                      }
                      className="px-2 py-2 text-right font-medium text-foreground-subtle"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        title={intl.formatMessage(
                          { id: "settings.usage.modelTable.sortBy" },
                          { metric: column.label },
                        )}
                        className={cn(
                          "ml-auto flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-foreground",
                          active ? "text-foreground" : "text-foreground-subtle",
                        )}
                      >
                        <span>{column.label}</span>
                        {active ? (
                          direction === "desc" ? (
                            <ArrowDown className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowUp className="size-3" aria-hidden="true" />
                          )
                        ) : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  data-testid="app-usage-model-row"
                  className="border-b border-border/60 last:border-b-0"
                >
                  <th
                    scope="row"
                    className="max-w-[18rem] truncate px-2 py-2 text-left font-normal text-foreground"
                    title={row.label}
                  >
                    {row.label}
                  </th>
                  <td className="px-2 py-2 text-right font-mono text-ui-sm tabular-nums text-foreground">
                    {formatCompactTokenUsage(locale, row.totalTokens)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-ui-sm tabular-nums text-foreground">
                    {formatCompactNumber(locale, row.requestCount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <th
                  scope="row"
                  className="px-2 py-2 text-left font-medium text-foreground-subtle"
                >
                  {intl.formatMessage({ id: "settings.usage.modelTable.total" })}
                </th>
                <td className="px-2 py-2 text-right font-mono text-ui-sm font-medium tabular-nums text-foreground">
                  {formatCompactTokenUsage(locale, totals.totalTokens)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-ui-sm font-medium tabular-nums text-foreground">
                  {formatCompactNumber(locale, totals.requestCount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
