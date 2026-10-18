# v2 设计文档

> 2026-10-18：TUI（`@zcode/tui`）与 CLI 发行包（统一 `zcode` 分发包、安装脚本、SEA 打包）已从仓库移除。
>
> 本目录保留的是历史设计记录。文中提到 TUI composer、全屏布局、粘贴/滚动、TUI 专属 i18n 与 SEA 发行步骤的内容，描述的是已删除的实现；当前 CLI 只是 Desktop 使用的无界面 Agent 运行时（`dist/zcode.cjs`），命令语义与 command center 契约仍然有效，见 [`commands.md`](./commands.md) 与 [`architecture.md`](./architecture.md)。
