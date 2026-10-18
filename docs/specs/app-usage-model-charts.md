# App Usage 模型用量：图表改为可排序表格

> 变更历史：本页原先规定「饼图改为 Top 10 横向柱状图」。图表现已整体移除，
> 模型用量改为一张可按 Token / 请求数排序的表格，因此全文按当前实现重写。

## 1. 规则

- 设置页 Usage → App Usage 不再渲染任何图表（每日 Token 趋势图、两张 Top 10 柱状图、Token 活动热力图均已删除），
  模型用量以表格呈现：一行一个模型，列为「模型 / Token 用量 / 请求数」。
- 行过滤：token 与请求数都为 0 的历史模型不进表（`hasAppUsageModelVolume`），
  否则只被选中过、从未真正调用的模型会占满表格，把真正产生消耗的模型挤下去。
- 排序：点击「Token 用量」或「请求数」表头按钮排序；
  - 切换到另一列时默认降序（打开这张表的默认问题是「谁吃得最多」）。
  - 点击当前排序列在升 / 降之间切换，表头显示对应方向箭头并用 `aria-sort` 暴露状态。
  - 同分时沿用协议顺序（协议侧已按 token 降序），避免刷新后表内顺序抖动。
- 不再截断前 10：表格行高固定、横向滚动，长尾模型不需要被折叠成「其他模型」。
- 表尾「合计」行给出当前筛选结果下的 Token 与请求数总和。
- 空态：当前时间范围内没有任何有量模型时显示空态文案，不渲染表头。
- 未记录 `modelId` 的归组行回退显示为「未知模型」，`title` 属性保留完整名称。

## 2. 不变更

- 聚合与协议不变：`AppUsageModelUsage` 仍由 `buildAppUsageSnapshot` 从 `model_usage` 表产出，
  `models` 仍按 token 降序下发；两个维度的排序都在 UI 侧完成，不改 SQL。
- 「App Usage」的时间范围切换（全部 / 近 7 日 / 近 30 日）与顶部累计摘要条不变。
- 用量数据仍来自 CLI 侧 session 库，经 `v4/usage/stats` 读取
  （服务面：`packages/services/src/usage/appUsageService.ts`）。

## 3. 唯一所有者

- `packages/ui/src/settings/usage-stats/AppUsageModelTable.tsx`：
  `buildAppUsageModelRows`（过滤 + 名称回退）、`sortAppUsageModelRows`（双指标排序与稳定同分）、
  以及表格组件本体（表头排序按钮、合计行、空态）。
- `packages/ui/src/settings/usage-stats/AppUsagePanel.tsx`：累计摘要条 + 时间范围 + 模型用量表 + 刷新。
- 文案：`packages/ui/src/i18n/locales/{en-US,zh-CN,vi-VN}.ts` 的 `settings.usage.modelTable*`。

## 4. 验收

- App Usage 页面没有图表：查不到「每日 Token 趋势图」「Token 活动」等旧标题。
- 表格默认按 Token 用量降序；点「请求数」后按请求数降序，再点一次变升序，点回「Token 用量」恢复 token 降序。
- token 与请求数都为 0 的模型不出现在表中；未记录 `modelId` 的行显示「未知模型」。
- 表尾合计等于所有可见行之和。
- 测试：
  - `packages/ui/test/appUsagePanel.test.ts`（渲染顺序、图表已移除、表头排序交互、排序纯函数）。
