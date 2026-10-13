# App Usage 模型用量：饼图改为 Top 10 横向柱状图

## 1. 规则

- 设置页 Usage → App Usage 的「模型用量」不再使用环形饼图，改为同一小节内上下排列的两张横向柱状图：
  - 按 Token 用量取前 10 的模型（`metric="tokens"`）。
  - 按请求数取前 10 的模型（`metric="requests"`）。
- 榜长固定为 10（`APP_USAGE_TOP_MODELS_LIMIT`），两个榜共用同一个 `AppUsageSnapshot`。
- 排名与过滤按各自指标独立进行：
  - 过滤：当前指标为 0 的模型不占榜位（只有 token 的历史模型不会把有请求的模型挤出请求榜）。
  - 排序：按当前指标降序；同分时沿用协议顺序（协议侧已按 token 降序），避免刷新后榜内顺序抖动。
  - 占比 `share` 的分母是该指标下**全部**有量模型之和，不是榜内 10 项之和，因此模型较多时占比之和小于 100%。
- 超过 10 个模型时，榜下用一行说明还有多少模型未展示，不再合并成「其他模型」扇区。
- 配色：每个榜使用单一色相（token → `--color-usage-chart-1`，请求数 → `--color-usage-chart-2`）。模型名已经画在 Y 轴刻度上，颜色不承载模型身份，轮转 6 色会让第 7~10 名出现重复色。
- 名称截断：Y 轴刻度超过 18 个字符时截断为 `前 17 字符 + …`，完整名称只在 tooltip 中出现，避免长模型名挤压绘图区。
- 空态：任一指标在当前时间范围内没有任何模型数据时，对应榜显示空态文案（沿用 `settings.usage.emptyTitle`）。

## 2. 不变更

- 聚合与协议不变：`AppUsageModelUsage` 仍由 `buildAppUsageSnapshot` 从 `model_usage` 表产出，`models` 仍按 token 降序下发；请求数榜在 UI 侧重排，不改 SQL。
- 「每日 Token 趋势图」仍为折线图，其 top 6 模型图例与 6 色轮转保持不变。
- 其余 App Usage 区块（累计摘要、Token 活动热力图、时间范围切换）不变。

## 3. 唯一所有者

- `packages/ui/src/settings/usage-stats/appUsageTopModelsBarChartViewModel.ts`：过滤、排序、截断榜长与占比计算。
- `packages/ui/src/settings/usage-stats/AppUsageTopModelsBarChart.tsx`：单个榜的标题、总量、横向柱状图、tooltip 与空态。
- `packages/ui/src/settings/usage-stats/AppUsagePanel.tsx`：`AppUsageModelTopCharts` 组合两个榜，并复用原有 lazy + `UsageChartLoadBoundary` 边界。
- 文案：`packages/ui/src/i18n/locales/{en-US,zh-CN,vi-VN}.ts` 的 `settings.usage.modelChart.*`。

## 4. 验收

- 「模型用量」小节内先是按 token 的 Top 10，再是按请求数的 Top 10；第 1 名在最上方。
- 同一模型在两个榜中的排名可以不同（token 高 ≠ 请求多）。
- 模型超过 10 个时显示「另有 N 个模型未展示」，不出现「其他模型」扇区。
- 测试：
  - `packages/ui/test/appUsageTopModelsBarChart.test.ts`（排序、过滤、截断、占比、渲染方式）。
  - `packages/ui/test/appUsagePanel.test.ts`（饼图已替换为两张横向柱状图）。
  - `packages/desktop/test/e2e/usage-stats/usage-stats-app-usage.test.ts`（三语标题断言）。
