# 侧栏任务组织方式：仅保留按项目

## 1. 规则

- 侧栏任务区只保留「项目」视图（`project`）：按 workspace 分组展示任务，是唯一视图。
- 已移除「分组」（`grouped`，用户自建任务分组）与「时间线」（`chronological`，平铺任务列表）两种视图。
  - 一级视图切换（`Group / Project` 分段控件）整体移除。
  - 「视图」下拉菜单中的「按项目 / 时间线」单选组移除。排序（创建时间 / 更新时间）保留。
- 归档视图（`archived`）保持不变，它是独立的显示状态，不属于组织方式。

## 2. 偏好存储

- 偏好键 `zcode-sidebar-task-preferences` 由 `packages/ui/src/lib/sidebarTaskPreferences.ts` 统一读写。
- 组织方式字段只剩 `project`。历史值 `grouped` 或 `chronological` 读取时回落为 `project`，下次持久化时被覆盖。
- 排序字段 `sortBy` 不变。

## 3. 不变更

- 任务数据层的 membership 名称 `timeline`（`useWorkspaceTaskLists`、`taskQueryCacheStore`、协议 `TaskListMembershipKind`）是数据语义，「项目」视图仍依赖它，不做改名或删除。
- 对话区块「Tasks」仍使用 `WorkspaceTimelineTasksSection`（`taskRowVariant="default"`）。
- 任务分组的数据与服务端能力不在本次范围内。

## 4. 唯一所有者

- `packages/ui/src/WorkspaceSidebar.tsx`：视图模式解析与侧栏任务区渲染。
- `packages/ui/src/lib/sidebarTaskPreferences.ts`：组织方式与排序偏好的类型与校验。

## 5. 验收

- 侧栏任务区只显示按项目的列表，没有 Group / Project 切换与时间线选项。
- 历史偏好 `grouped` 或 `chronological` 启动后显示「项目」视图。
- 测试：`packages/ui/test/sidebarTaskPreferences.test.ts`。
