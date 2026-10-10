# 启动门禁、内置 Provider 与应用名称规格

本规格记录当前分支的产品规则、状态所有者与验收场景。

## 1. 启动时不展示 Z.AI 登录门禁

- 规则：Desktop 启动不进入 Provider 可用性登录引导（WelcomeScreen 的 Z.AI 登录入口）。
- 状态所有者：`packages/ui/src/lib/rootStartupGate.ts` 的 `shouldEnableProviderAvailabilityLoginEntryGuard`，当前恒为 `false`。
- 验收：
  - 启动 Desktop 后不出现 WelcomeScreen 的 Z.AI 登录界面。
  - 测试：`packages/ui/test/rootStartupGate.test.ts`。

## 2. 不再内置任何 Provider（BYOK 纯化）

- 规则：应用不再附带任何内置（官方/托管）Provider。Desktop 与 CLI 都只提供用户自行填写 API Key 的 Provider（BYOK）。
- 已移除：Z.AI 默认 Provider（`zai-api`、`zai-standard-api` 模板与 `account:zai-*` 四条 providerRule）、Z.AI 登录、Coding Plan（OAuth 与 webview）、Z.AI 配额/用量、off-peak、GLM 默认模型、BigModel OAuth。
- 配置文件：`config/provider/zcode-builtin.json` 不再包含任何 Provider 模板或账号规则；`config/default.json` 按 `config/README.md` 保留。
- 远端配置：Desktop 与 CLI 不再从 CDN 拉取内置 Provider 配置。`ZCODE_BUILTIN_PROVIDER_CONFIG_FILE` 指向随包文件。
- 影响：旧版本保存的 Z.AI / BigModel 会话与 active provider 在启动时会被清除（适配器未注册的 provider 会被清理），需要用户自行添加 API Key Provider。
- 验收：
  - Provider 列表中只剩用户自建的 API Key Provider，没有 Z.AI / BigModel 条目。
  - 配置中不再有 `zai` / `bigmodel` 的模板或 providerRule。
  - 测试与未验证项：以 `pnpm typecheck`、`pnpm lint`、`pnpm architecture:check --changed` 及相关 test 的实际结果为准（见本次交付说明）。

## 3. 应用显示名称改为 HCode，并与 ZCode 并存安装

- 规则：用户可见的产品名称为 `HCode`（Preview 为 `HCode Preview`，开发态为 `HCode Dev`）。覆盖范围：安装包 productName、窗口与进程标题、About、强制升级提示、i18n 文案、Web 页面标题与分享页、Finder/资源管理器的“在 HCode 中打开”。
- 安装身份（与 ZCode 互不覆盖，可同时安装）：
  - 正式版 `appId` 为 `dev.hcode.app`，Preview 为 `dev.hcode.app.preview`。Windows AUMID 与 macOS bundle id 随 appId 隔离。
  - Linux 可执行文件与包名：正式版 `hcode`，Preview `hcode-preview`。
  - Linux 桌面入口文件为 `<executable>.desktop`，图标名与可执行文件名一致。
  - Finder 服务目录为 `Open in <productName>.workflow`，bundle id 带产品名 slug。
  - Windows 右键菜单注册表键名由产品名派生（如 `HCode.OpenInHCode`）。
- 数据目录：正式版使用 `HCode`，Preview 使用 `HCode Preview`（`runtimeApplicationName`，同时用于 userData/sessionData 与单实例锁）。开发态仍为 `ZCode Dev`。
  - 与 ZCode 共用数据目录会触发同一单实例锁并共享会话库，因此必须隔离。
  - 新目录不会自动读取 ZCode 的历史会话与设置。迁移未实现，需要单独设计。
- 不变更：
  - `zcode://` 协议仍由两个应用共用。最后注册的应用成为默认处理器，这是已知限制。
  - CLI（`apps/zcode-cli`）的命令名与文案。
  - 与运行时错误文本做字符串匹配的常量，以及 `ZCode Protocol/1` 等协议字段。
  - Computer Use 辅助程序的名称。
- 唯一所有者：`packages/desktop/scripts/desktop-product-identity.mjs`（安装包身份）与 `packages/desktop/src/main/desktopRuntimeEnv.ts`（`runtimeApplicationName`、`runtimeDisplayName`、`runtimeLinuxExecutableName`）。
- 验收：
  - 正式版与 ZCode 可同时安装，两者 appId、Linux 包名与可执行文件名均不同。
  - 测试：`packages/desktop/test/productIdentityCoexistence.test.ts`（3/3）。
  - 未验证：真实 Windows/macOS/Linux 安装包上的并存行为，需要打包后人工验证。

## 4. 草稿态空态不展示 Z 形背景

- 规则：草稿态欢迎区只显示问候语，不再渲染 Z 形线框或深色 Z 图片。
- 唯一所有者：`packages/ui/src/v4/ConversationDraftEmptyState.tsx`。
- 已删除资源：`packages/ui/src/assets/Z.svg`（仅此组件引用）。
- 验收：草稿页在浅色与深色主题下均无 Z 形背景，问候语布局保持居中。

## 5. 工作流与插件市场迁入设置页

- 规则：
  - 「插件市场」不再是 workspace 主视图，成为设置页分区 `pluginStore`（常驻）。
  - 「工作流」不再是定时任务页的顶级标签，成为设置页分区 `workflow`，仍受动态工作流灰度控制（灰度未命中时不出现）。
  - 侧栏删除「插件市场」按钮（`plugin-store-sidebar-open`），保留「定时任务」按钮。
  - 定时任务页只剩「自动化」标题与原有内容，不再有「自动化 / 工作流」切换。
  - 旧入口全部转到设置页对应分区：推荐提示词或深链携带的 `automationTab: "workflow"`、`requestPluginStoreOpen`、`handleOpenPluginStoreForScope`、office 模式的插件预览入口。
  - 插件页来自插件市场时，其返回按钮回到「插件市场」分区，而不是离开设置层。
  - 工作流页中需要 workspace 外壳的动作（运行后切到会话、查看运行实例、打开产物、通过对话创建）由外壳注册的实现执行，见 `packages/ui/src/settings/saved-workflows/workspaceWorkflowActionsBridge.ts`。执行后关闭设置层。没有 workspace 时这些动作为 no-op。
  - 工作流与插件市场的导航历史条目（`plugin-store` 类型）已移除，不再写入。
- 分区隐藏规则：`automations` 与 `plugins` 仍在 `HIDDEN_SETTINGS_SECTIONS` 中，作为旧 id 的兼容保留；只新增 `workflow` 与 `pluginStore`。这与本次迁移相反的旧决定已在此记录。
- 唯一所有者：`packages/ui/src/settings/settingsPageConfig.ts`（分区列表与灰度）；`packages/ui/src/App.tsx` 的 `handleNavigateToAutomationsMain` 与 `handleOpenPluginStoreForScope`。
- 验收：
  - 侧栏没有插件市场按钮；定时任务页没有工作流标签。
  - 设置页始终有「插件市场」分区；「工作流」分区仅在灰度命中时出现。
  - 测试：`packages/ui/test/settingsWorkflowMarketplaceSections.test.ts`（4/4）。
  - 未验证：工作流页在真实 workspace 中的运行、跳转与产物打开，需要手工验证。

## 6. 默认界面语言改为越南语

- 规则：
  - `Locale` 为 `zh-CN | en-US | vi-VN`，`DEFAULT_LOCALE` 为 `vi-VN`（唯一所有者：`packages/shared/src/protocol.ts`）。
  - 系统语言解析（`resolveLocaleFromSystemLanguage`）：英文系统 → `en-US`；其余（包括中文系统）→ `vi-VN`。原先中文系统解析为 `zh-CN`，现不再如此。
  - 切换器循环顺序为 `vi-VN → en-US → zh-CN`。用户仍可手动选择中文，中文没有被移除。
  - `vi-VN` 文案位于 `packages/ui/src/i18n/locales/vi-VN.ts`，只翻译了常用部分（通用按钮、侧栏、工作区、设置分区标题、自动化与工作流页）。`IntlProvider` 将其与 `en-US` 合并，未翻译的键显示英文，不显示中文。
  - 只支持中英文的接口、webview 与页面（反馈表单、Coding Plan webview、模型服务模板、社区链接、会话分享页）使用 `toZhEnLocale`：越南语映射为英文。
  - 边界错误页的兜底文案：`zh-CN` 用中文，其余用英文或越南语合并表。
- 未变更：
  - `en-US` 与 `zh-CN` 的完整文案。
  - Web 登录页（`packages/web/src/auth/webAuthLocale.ts`）已随 `packages/web` 删除，不再需要接入越南语（见 `desktop-only-repo-scope.md`）。
  - 大量 `startsWith("zh")` 分支（如提交信息生成、模型服务的内容选择）越南语会走英文分支。
- 唯一所有者：`packages/shared/src/protocol.ts`（语言类型、默认值、解析与映射）；`packages/ui/src/i18n/IntlProvider.tsx`（合并表）。
- 验收：
  - 测试：`packages/ui/test/viVNLocale.test.ts`（4/4）。
  - `vi-VN` 文案中的键都存在于 `en-US`，没有无效键。
  - 未验证：完整界面的越南语覆盖率（仅为部分翻译），以及桌面端、Web 端和 CLI 的语言行为是否需要统一。

## 7. 图标改为 H、界面背景改为纯黑

- 规则：
  - 所有应用图标（安装包、应用、Windows 与 macOS 图标、DMG/NSIS 安装图标、`public/logo/icons`）的字母由 Z 改为 H，字形与位置沿用原 Z 的外框。
  - 主题 `zai-dark` 的 `--color-background` 与 `--color-sidebar` 改为 `#000000`。
  - `--color-header`、`--color-panel` 保持 `#202020`；`--color-card`、`--color-popover`、`--color-input` 保持 `#2b2b2b`。主题名称不变。
- 唯一所有者：`packages/desktop/build/`（图标源）、`public/logo/icons/`（网页/文档图标）、`packages/ui/src/styles.css`（`.theme-zai-dark` 颜色令牌）。
- 验收：
  - 安装后应用图标与安装器图标显示 H，不再显示 Z。
  - 深色主题下应用背景与侧栏为纯黑，面板与卡片颜色不变。
  - 未验证：真实 Windows/macOS/Linux 图标缓存、DMG 与 NSIS 安装界面需要打包后人工确认。
  - 已知限制：`packages/desktop/build/icon_installer.png` 的 H 背景由 Z 区域的列/行填充得到，放大后可能看到极轻微的色块边界，需人工确认。
