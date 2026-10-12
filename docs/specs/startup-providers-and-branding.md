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

## 8. 编程 / 办公模式切换移到侧栏顶部

> **已被第 24 节取代**：编程 / 办公模式切换与 Office 专属功能已整体移除，本节内容仅作历史记录。

- 规则：界面模式切换（编程 / 办公）不再位于侧栏底部账户菜单的子菜单，而是侧栏最上方的第一组控件，位于「新建任务」之前，始终可见。
- 状态所有者：store 的 `interfaceMode`（`packages/ui/src/store/`），与设置页共用同一值，不新增状态。
- 唯一所有者：`packages/ui/src/WorkspaceInterfaceModeSwitch.tsx`；挂载于 `packages/ui/src/WorkspaceSidebar.tsx`。账户菜单（`WorkspaceSidebarFooter.tsx`）不再包含该子菜单。
- 文案：`settings.interfaceMode.coding` / `settings.interfaceMode.office`；越南语为「Lập trình」/「Văn phòng」。
- 验收：
  - 侧栏顶部显示两个按钮，当前模式高亮（`aria-pressed`）。
  - 点击切换后立即生效，设置页显示的模式同步变化。
  - 账户菜单中不再有「界面模式」子菜单。

## 9. 清理用户可见的 Z.ai / ZCode 文案

- 规则：
  - 删除 i18n 中已无任何代码引用的 Coding Plan / Z.ai 文案键（`settings.modelProvider.codingPlan.start.loginTrial`、`...dynamicUnsupportedDescription`、`...zaiOverseasPaymentRequired`、`...overseasPayment.description`、`...overseasPayment.authorizationPrefix`、`settings.usage.entitlementNotConfigured`、`settings.usage.codingPlanNotConfiguredDescription`、`settings.modelProvider.presetDescription`），en-US 与 zh-CN 同步删除。
  - 桌面端用户可见的 `ZCode` 文案改为 `HCode`：浏览器后端名称（`HCode In-app Browser`）与 Computer Use 权限错误提示。
- 保留（有实际影响，不在本次清理范围）：
  - 数据目录与路径：`.zcode/v2`、`ZCode Dev`、`zcode-embedded-browser` 等旧目录名，改动会丢失用户数据。
  - 本地存储键：`zcode-theme`、`zcode-interface-mode` 等，改动会重置用户设置。
  - 协议与内部标识：`x-zcode-*` 请求头、`ZCode Protocol/1`、`@zcode/*` 包名、`IZCode*` 等类型名。
  - 所有权标记：Linux 桌面文件 `Comment=ZCode Desktop App`，用于识别旧安装，改动会导致无法清理。
  - 错误码键：`zcode.error.*`，与运行时错误匹配。
  - CLI 中的 Z.AI 登录命令与文本（`apps/zcode-cli/packages/cli`）：属于 CLI 登录流程，需单独评估后再移除。
  - 内置插件的 `author` 元数据（`official-plugin-definitions.ts` 与随包 `plugin.json`）：**保持原样，不修改**（用户决定）。
  - `WelcomeScreen` 与 `LoginApiKeyForm` 中仍引用的 `login.oauth.button.zai`、`login.apiKey.provider.zai`：对应代码路径尚未移除。
- 验收：
  - 桌面端浏览器名称与 Computer Use 权限错误不再出现 `ZCode` 文案。
  - 上述删除的键在 en-US 与 zh-CN 中都不存在，且没有代码引用它们。

## 10. 自动更新暂时关闭（HCode 尚无独立 feed）

- 规则：`initAutoUpdater` 固定 `enabled: false`（`packages/desktop/src/main/index.ts`）。自动轮询与手动检查都被关闭，更新按钮不会发起请求。
- 原因：更新 manifest 请求的是 `DEFAULT_ZCODE_ENDPOINT_ORIGIN`（`https://zcode.z.ai`）下的 `/api/v1/releases/electron/manifest`，只携带 `platform`、`device_mid`、`channel`，不带应用身份。服务端返回的是 ZCode 的安装包，界面文案却显示 HCode，所以 HCode 可能会安装 ZCode。
- 恢复条件：HCode 配置独立的 manifest 端点（或服务端按 appId 区分），并在 spec 中更新本节。
- 验收：启动后日志出现 `auto-update disabled for this desktop product flavor`，且没有对 zcode.z.ai 的 manifest 请求。

## 11. 移除登录页，直接进入应用

- 规则：不再渲染 `WelcomeScreen`（Z.AI / BigModel 登录页），也不再渲染 `LoginApiKeyForm`。`packages/ui/src/WelcomeScreen.tsx`、`packages/ui/src/login/LoginApiKeyForm.tsx`、`LoginApiKeyForm.helpers.ts` 已删除。
- 覆盖的所有打开路径：启动门禁（`startup-provider-required`）、JWT 失效（`session-expired`）、登出后无 provider（`logout-provider-required`）、provider 请求（`provider-request`）、手动登录（`manual-login`）。这些路径都不再打开登录页。
- `Root.tsx` 中 `welcomeScreenOpenReason` 状态与相关 effect / 回调已删除。`onLogin` 固定为 `undefined`，侧栏与设置里不再出现登录入口。`onReauthenticationRequired` 为空函数，JWT 失效后保持在工作区。
- `rootStartupGate.ts` 的 `shouldShowRootStartupLoading` 与 `launchToInputReport.ts` 的 `shouldReportLaunchToInput` 不再接收 `welcomeScreenOpen`。
- 遗留：`zcodeJwtInvalidRestartMarker` 的标记不再被消费（已不再读取），标记本身不会被清理；`login.*` i18n 键暂未删除，待确认无引用后再清理。
- 验收：启动、登出、JWT 失效后直接进入工作区，不出现 Z.AI 登录页。`pnpm typecheck` 与 `pnpm lint` 通过，`packages/ui` 下 `rootStartupGate`、`viVNLocale` 等测试通过。

## 12. Settings 开关默认全部开启（仅新安装）

- 规则：新安装时，设置页中的功能开关默认开启。改动位于 `packages/shared/src/validationAppSettings.ts` 的 schema 默认值，并同步 UI 与主进程中 `?? false` 的兜底值，避免加载前后显示不一致。
- 已开启的开关：`taskAutoArchiveEnabled`、`keepAwakeWhileRunning`、`messageStreamShowTodos`、`toolGroupingChangesEnabled`、`memoryEnabled`（原默认 false，改为 true；`memoryEnabled` 由用户在确认后单独改为开启）。
- 电脑控制输入框入口：`computerUseComposerEntryHidden` 默认改为 `false`，即默认展示。UI 只把显式 `true` 视为隐藏（`ComputerUseSection.tsx`、`useCuaComposerEntry.ts`）。
- 不改默认值的开关（用户确认排除）：
  - 安全与隐私：`embeddedBrowserAllowInsecureCertificates`（允许不安全证书）、`modelIoFullRetentionEnabled`（保留完整模型 I/O）。
  - 更新：`autoDownloadAndInstallUpdates`、`receivePreviewUpdates`。自动更新已关闭（见第 10 节），这两个开关没有效果。
  - 迁移或已忽略标记：`*MigrationInitialized`、`providerFamilyDomainMigrated`、`startPlanRecommendationDismissed`，不是设置页的开关。
- 范围：只影响新安装。已存在的 `~/.zcode/v2/setting.json` 保留用户当前值，不做覆盖。
- 插件开关：插件列表中默认未启用的插件（`android-emulator`、`ios-simulator`、`restore-legacy-sessions`、`computer-use`）不在本节范围，仍保持 `defaultEnabled` 的原值。用户已确认保持不变；`computer-use` 为产品决策默认关闭（见 `official-plugin-definitions.ts`）。
- 验收：全新 `HOME` 启动后，上述开关在设置页显示为开。`pnpm typecheck`、`pnpm lint` 通过。

## 13. 输入框“完全访问”模式按钮使用常规颜色

- 规则：输入框（`V4ComposerModeControls.tsx`）中权限模式为 `yolo`（界面显示为“完全访问”）时，触发按钮保持常规文字颜色，不再套用 `text-warning`。
- 范围：只改输入框的模式按钮。`chat-input-toolbar/display.tsx` 中的高权限 warning 样式保留，它被设置页的自动化与 Off-peak 表单复用，不在本次范围内。
- 验收：权限模式切到“完全访问”后，输入框按钮文字与其他模式颜色一致。`pnpm typecheck`、`pnpm lint` 通过。

## 14. 文件树从左侧栏移到右侧 side pane

- 规则：工作区文件树不再是左侧栏内的覆盖层（`WorkspaceSidebar` 中的 `isFileTreeOpen` 面板已删除），改为右侧 side pane 的一个 tab（`type: "file-tree"`，固定 id `file-tree`）。
- 状态：`WorkspaceSidePaneTab` 新增 `FileTreeSidePaneTab`，携带 `target`（`workspacePath`、`workspaceName`、`workspaceIdentity`、`workspaceRemoteSessionId`、`revealPath`、`temporaryExternalDirectory`）。`openFileTreeSidePane` 复用已存在的 file-tree tab 并替换 target，因此同一时间只保留一个文件树。
- 可见性：`file-tree` 归入 `WORKSPACE_GLOBAL_SIDE_PANE_TAB_TYPES`，与 `git` 一致，在同一工作区的对话间共享。
- 入口：侧栏里所有“打开文件树”的操作（工作区项、置顶任务、Git 变更“在文件树中显示”、Markdown 文件链接）都经 `handleOpenFileTree`（`useAppPanels.ts`）打开 side pane tab，并在 side pane 收起时自动展开。
- 行为：文件树内的预览仍通过 `onOpenCodeViewer` 打开到 code-viewer tab；`activePreviewPath` 由 side pane 当前激活的 code-viewer 计算。
- 验收：点击任一文件树入口后，文件树出现在右侧 side pane 的 tab 中；左侧栏不再出现覆盖层。`pnpm typecheck`、`pnpm lint` 通过。

## 15. 动效提速，无右侧面板时居中草稿全宽

- 动效时长：侧栏、右侧 side pane、底部终端、顶部浮层、工作区头 padding 统一为 `duration-150`，缓动 `cubic-bezier(0.2,0,0,1)`（快速起步、平稳停止）。`useAnimatedResizablePanel` 的 flex-grow 过渡同步为 150ms，兜底定时器 180ms。
- 折叠内容（`collapsible`）从 300ms 降到 200ms。
- 不改动：流式文字、提醒、反应等装饰性动画，它们的时长是功能语义的一部分。
- 居中草稿宽度：`WorkspaceShellLayout` 在 side pane 收起时给会话区 `section` 加 `data-workspace-side-pane-hidden="true"`。草稿态的问候语（`ConversationTimeline` 的空态）和输入框（`ConversationComposer`）带 `data-centered-draft="true"`。收起时 CSS 去掉 `max-w-2xl`，整列放开；side pane 展开时保留 `max-w-2xl`。
- 验收：关闭右侧 side pane 后，草稿页问候语与输入框占满会话列宽；打开后恢复 672px 宽。关闭动画不超过 150ms。`pnpm typecheck`、`pnpm lint` 通过。

## 16. 删除首次引导（onboarding）界面

- 规则：删除 `packages/ui/src/onboarding/` 全部引导 UI，包括欢迎页、职业选择、界面模式、AGENTS.md 步骤，以及引导内的 Claude 会话与设置迁移向导。同时删除只被引导使用的 `packages/ui/src/settings-sync/` 与 `hooks/useSettingsSync.ts`。
- 启动：不再自动弹出引导。`Root.tsx` 直接渲染主界面，去掉原 `OccupationOnboarding` 包裹层；原来“settings 未加载前不渲染”的门控随之取消。
- 设置页：删除两个“引导”入口（侧栏按钮与常规分组中的按钮）。store 删除 `newUserOnboardingOpen`、`onboardingDialogRequested` 及其 setter。
- 资源：`onboarding/assets/{finder,terminal,feishu}.png` 被输入框建议（`featureSuggestedPrompts.ts`）使用，迁移到 `packages/ui/src/assets/suggested-prompts/` 后再删除原目录。
- 保留：`IOnboardingRecordService` 后端与 `onboarding-record.json`，因为主动建议与输入框建议仍读取；`onboardingOccupation`、`memoryEnabled`、`interfaceMode` 字段及已存数据不动；`settingsSyncService` 后端保留；设置页的 Claude 会话迁移（`MigrationSection`）保留。
- 未清理：`occupationOnboarding.*`、`settings.onboarding*` 等 i18n 键暂留，后续单独清理。
- 验收：全新 `HOME` 启动直接进入主界面，无引导弹窗；设置页无引导入口；`pnpm typecheck`、`pnpm lint` 通过。

## 17. 移除代码配色选择，统一使用默认高亮主题

- 规则：删除设置页“外观”中的“浅色代码主题”“深色代码主题”两个选择器，以及 `CODE_PREVIEW_THEME_OPTIONS`、`ThemeSelect`、`getThemeOptionLabel`。代码高亮固定使用默认主题：浅色 `github-light`，深色 `github-dark`。
- 数据模型：`CodePreviewSettings` 删除 `lightTheme`、`darkTheme` 字段，只保留 `showLineNumbers`、`wrapLongLines`、`fontSizePx`。两个主题常量导出自 `lib/codePreviewSettings.ts`，所有渲染入口（预览面板、Git 变更卡片、工具调用 inline diff、代码块、diff worker 池）直接引用常量。
- 存量数据：`localStorage["zcode-code-preview-settings"]` 中旧的 `lightTheme`、`darkTheme` 字段读取时被忽略，并在下一次写入时被丢弃。
- 保留：行号、自动换行、字号等其余代码预览设置不变；`isDarkCodePreviewTheme` 保留，用于按主题判断明暗。
- 未清理：`settings.lightTheme*`、`settings.darkTheme*` i18n 键暂留。
- 验收：设置页“外观”不再出现代码主题选择；代码预览、Git 变更与工具调用 diff 使用默认主题显示；`pnpm typecheck`、`pnpm lint` 通过。

## 18. 输入框 Enter 行为可选：换行或发送

- 规则：设置页“交互行为”分组新增“Enter 键行为”选择器，两个选项：
  - `newline`（**默认**）：Enter 换行，Ctrl/Cmd+Enter 发送。
  - `send`：Enter 发送，Shift+Enter 换行（即改动前的行为）。
- 数据模型：`AppSettings.composerEnterBehavior: "newline" | "send"`，共享设置 schema 默认 `"newline"`，patch schema 为可选。缺省视为 `newline`，老用户也会按新默认生效。
- 快捷键联动：不新增第二套键位逻辑，复用已有 composer 作用域命令 `composerSend` / `composerInsertNewline`。模式只决定“未被用户覆盖”时的默认绑定：
  - `newline`：`composerSend = [CmdOrCtrl+Enter]`，`composerInsertNewline = [Enter, Shift+Enter]`。
  - `send`：`composerSend = [Enter]`，`composerInsertNewline = [Shift+Enter]`。
- 覆盖优先：用户在快捷键设置页改过的 `shortcutBindings` 仍优先于模式默认。恢复默认与冲突检测都按当前模式计算。
- 提示：发送按钮 tooltip 的键位取生效表 `composerSend` 的首个绑定，并经统一格式化显示，与实际行为一致。`ConversationComposer` 与 `ChatPromptEditor` 不再硬编码 `Enter`。
- 不变：手机视口门禁、反转投递（Ctrl+Enter 的 `modifiedEnterReversesDelivery`）、IME 组合中不拦截。
- 清理：`lib/mobileTextInput.ts` 中仅服务于硬编码 Enter 的 `resolveChatEnterShortcut` 随之删除。
- 验收：新安装时 Enter 换行、Ctrl/Cmd+Enter 发送；切到“Enter 发送”后 Enter 发送、Shift+Enter 换行；发送按钮 tooltip 随模式显示正确键位；用户自定义键位不被模式覆盖。`pnpm typecheck`、`pnpm lint` 通过。

## 19. Appearance 移除代码设置与代码预览，固定使用默认代码显示

- 规则：设置页“外观”删除“代码”分组（行号、自动换行、字号三个开关/输入框）以及“预览”分组（浅色/深色 `ThemePreviewCard`）。外观页只保留“界面主题”与“界面字号”。
- 默认模式：代码显示固定使用 `DEFAULT_CODE_PREVIEW_SETTINGS`，即显示行号、不自动换行、代码字号 12px。`loadCodePreviewSettings` 不再读取 `localStorage["zcode-code-preview-settings"]`，旧存量数据被忽略，不再写入。
- store：`codePreviewSettings` 直接取默认常量，删除 `setCodePreviewSettings`。消费方（预览面板、工具调用 diff、Git 变更卡片等）读取行为不变。
- 埋点：删除 `settings.appearance` 下 `toggle_code_line_numbers`、`toggle_code_line_wrap`、`change_code_font_size` 三个动作。
- 删除：`ThemePreviewCard`、`settings.appearance.code*`、`settings.previewSectionTitle`、`settings.previewDescription`、`settings.previewLight/Dark` 等仅此处使用的展示逻辑。i18n 键暂留，后续统一清理。
- 验收：设置页“外观”只剩主题与界面字号两项；代码块默认显示行号、不换行、12px；`pnpm typecheck`、`pnpm lint` 通过。

## 20. 插件页移除 MCP / Skills 标签（二者已有独立分区）

- 规则：设置页“插件”分区（`mode="plugin"`）只保留插件列表。顶部的 MCP、Skills 标签页删除，标签栏因此不再需要；页头改为与独立分区一致的只读标题（“插件”+数量）。
- 独立入口：MCP 与 Skills 继续使用各自的设置分区（`mode="mcp"`、`mode="skill"`），不再在插件页内嵌渲染。
- 跳转：快捷菜单等处的 `setPendingSettingsPluginIntent("mcps" | "skills")` 已映射到 `mcp` / `skill` 分区，行为不变。`SettingsPage` 不再把 `pluginTab` 传给插件页，相关状态一并删除。
- 清理：删除插件页内 `PluginTab`、`normalizePluginTab`、`getPluginTabCountClass` 及标签切换状态；`SkillsSection` 的 `reportDetailBreadcrumb` 仅在插件页内使用，随之移除。
- 保留：`settings.plugin.tab.*` i18n 键仍被独立分区页头使用；`settingsNavigation` 中的 tab 意图字段暂留，不影响新行为。
- 验收：插件分区只显示“插件”标题与列表，没有 MCP/Skills 标签；从快捷菜单打开 Skills / MCP 能直达对应独立分区；`pnpm typecheck`、`pnpm lint` 通过。

## 21. 移除账户弹窗，功能迁入设置页

- 规则：点击侧栏账户按钮不再弹出下拉菜单。按钮改为直接打开设置页的“通用”分区（侧栏与设置页内均如此）。
- 迁移明细：
  - 语言：已在“通用”分区，保持不变。
  - 主题：已在“外观”分区，保持不变。
  - 界面缩放（仅桌面端）：迁入“外观”分区，提供缩小、重置、放大三个按钮。快捷键 Ctrl/Cmd +、-、0 仍由菜单与全局键盘分发，不受影响。
  - 账户：新增“通用”顶部的账户分组，展示用户名与套餐徽标；包含“使用统计”（进入 Usage 分区）、“升级/续费套餐”（沿用原有升级对话框与漏斗埋点）、“退出登录”（已登录时）、“登录”（仅当宿主提供 `onLogin` 时）。
- 侧栏：账户按钮仍显示用户名与套餐徽标，但不再承载菜单；设置页内的同一按钮跳转到“通用”分区。
- 清理：删除菜单专用的 `WorkspaceSidebarFooterUsageSummaryContent`；`WorkspaceSidebarFooter` 去掉 theme、语言、主题、用量、升级、登录、退出相关 props，新增 `onAccountClick`。无用的回调与 props 随之清理。
- 保留：`useWorkspaceSidebarFooterUsageSummaryState`（套餐徽标依赖）与 `WorkspaceSidebarFooterPlanBadge`。
- 验收：点击账户按钮不再出现下拉菜单；设置页“通用”顶部可看到账户分组，桌面端“外观”可缩放界面；`pnpm typecheck`、`pnpm lint` 通过。


## 22. General 移除引导记录回写

> **部分被第 24 节取代**：`ProactiveSuggestionsSetting`（主动建议开关）已随 Office 模式一并移除；本节对 General 的记录写入约束仍然有效。

- 规则：设置页“通用”分区不再回写 onboarding 完成记录（`onboardingRecordService.updateRecordPreferences`）。引导流程已删除，该记录不再被任何界面读取，继续回写没有意义。
- 影响范围：
  - `SettingsPage` 的记忆开关处理函数不再回写记录，只更新共享设置。
  - `ProactiveSuggestionsSetting`（“主动任务建议”开关）不再回写记录，只更新共享设置。
- 保留：General 中的界面模式、主动任务建议等设置行保持不变；`useOnboardingRecordService` 仍被对话草稿建议组件使用，不在本次范围内。
- 验收：切换记忆、主动任务建议时只写 `settings`，不调用 `onboardingRecordService`；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 23. 自动化页移除「Scheduled task template」（定时模板）区块

- 规则：自动化设置页不再展示「定时模板」（`automations.moreIdeas`）区块，包括 Scheduled 标签与无任务首页中的该区块。
- 保留：闲时模板（Idle / off-peak）区块保持不变，其显示条件与分隔线逻辑仅去掉定时模板分支。
- 暂不处理：`useAutomationTemplates` 中的 `scheduled` 数据与目录条目仍保留，待确认后再清理。
- 验收：Scheduled 标签与无任务首页不再出现「Scheduled task template」；闲时模板区块仍按原规则显示；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 24. 移除 Office 界面模式，仅保留 Coding Agent

- 规则：应用只保留单一的 coding agent 形态。移除 `interfaceMode`（office / coding）及其全部分支，所有界面按原 coding 分支渲染。
- 移除范围：
  - Store：`interfaceMode`、`setInterfaceMode`、`zcode-interface-mode` 读取、跨窗口广播字段 `interfaceMode`。
  - 侧栏顶部的模式切换（`WorkspaceInterfaceModeSwitch`）与快捷键 `toggleInterfaceMode`。
  - 设置 > 通用中的「界面模式」行。
  - Office 专属的「主动任务建议」开关（设置项 `proactiveSuggestionsEnabled`、`ProactiveSuggestionsSetting`）及草稿页的 proactive 变体。
  - Office 专属的推荐提示词池与空白页问候语。
  - Office 模式下对终端、审阅、Git、编辑器列表、工具调用折叠、插件预览的隐藏与替换逻辑。
- 保留：`onboardingOccupation` 中的 `office` 选项是职业选择，不属于界面模式，保留不动。插件市场排序仍按 coding 顺序（`order.code`）；`order.work` 配置字段保留以兼容已保存的设置，不再读取。
- 兼容：旧 localStorage 中的 `zcode-interface-mode` 不再读取；旧快捷键覆盖中的 `toggleInterfaceMode` 被忽略。
- 清理：仅服务于 Office 推荐池的 `featureSuggestedPrompts.ts`、`featureSuggestedPromptRotation.ts` 及 `assets/suggested-prompts/`（finder / terminal / feishu 图标）一并删除。`WorkspacePluginPreview.tsx` 删除。onboarding 记录的后端服务与 `interfaceMode`、`proactiveSuggestionsEnabled` 字段（`packages/shared/src/onboardingRecord.ts`）暂保留以兼容已存数据，UI 不再读写这两个字段。
- 验收：界面中不再出现界面模式、Office 相关入口与提示；终端、审阅、Git 与编辑器列表行为与原 coding 模式一致；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 25. Automations 页移除保持唤醒提示条

- 规则：Automations 页不再展示 keep-awake 提示条（文案「Keep your computer awake while HCode is running a chat.」及其开关）。该开关已在设置页「常规」中提供（`keepAwakeWhileRunning`），重复展示没有必要。
- 移除范围：
  - 列表态与空态中的 `AutomationKeepAwakeNotice` 提示条及其 `updateSharedSettings` 回调。
  - 定时 / 闲时编辑页「设置」标签底部的同一句文案（`offPeak.keepAwakeBanner`）。
  - `AutomationKeepAwakeNotice` 组件及 `offPeak.keepAwakeBanner` i18n 键（en-US、zh-CN）。
- 保留：`keepAwakeWhileRunning` 设置与桌面端 powerSaveBlocker 逻辑不变。编辑表单中的开关已在第 26 节移除。
- 验收：Automations 页不再出现该句；设置页的 keep-awake 开关仍可正常切换；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 26. 保持电脑运行只保留设置页一处

- 规则：「保持电脑运行」（Keep computer running）只在 设置 > 常规 中保留一个开关，说明文案为「Prevent the system from sleeping due to idle. You can still sleep manually or by closing the lid. Desktop only.」，仅桌面端显示。
- 移除范围：定时 / 闲时编辑表单中的同功能开关（`offPeak.form.keepAwakeLabel` 及其提示 `offPeak.form.keepAwakeHint`）；未被引用的 `scheduledPreview.keepAwake*` 文案键。
- 验收：Automations 与编辑表单中不再出现保持唤醒开关；设置页开关可正常切换并写入 `keepAwakeWhileRunning`；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 27. 新增「关闭当前会话」按钮（不新开会话）

- 背景：当前关闭（归档）会话后 `activeTaskId` 会变为 `null`，主区立即回到草稿输入框，等同于“打开了一个新会话”。用户需要的是只把当前会话从主区移开，不创建也不展示新草稿。
- 规则：
  - 任务页头部（`variant=task`）在分享按钮旁新增「关闭会话」图标按钮；只在存在 `activeTaskId` 时显示。
  - 点击后仅将当前 workspace 的 `activeTaskId` 置空，并置位新状态 `conversationClosed = true`。不归档、不删除、不停止运行中的任务，无需确认。
  - `conversationClosed = true` 时主区显示「无打开的会话」空态，不挂载草稿输入框（`V4WorkspaceChatArea`）。
  - 以下操作会清除该状态，恢复正常草稿/会话展示：`setActiveTaskId`（选中会话或显式设为 null）、`startDraft`（新建会话、对话 +、Cmd/Ctrl+N 等）。
  - 状态按 workspace 独立，仅保存在内存中，不写入持久化；重启后按原有逻辑恢复。
- 验收：关闭后不出现草稿输入框且没有新会话被创建；重新点击会话或「新建会话」可恢复；运行中的会话继续在后台运行；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 28. 新会话默认权限模式改为 Full access（yolo）

- 背景：新会话（含新建草稿、CLI 运行时默认值）默认模式为 `build`（Ask before changes）。用户要求默认改为完全访问。
- 规则：
  - 新建草稿的默认 mode 为 `yolo`（界面文案 Full access），包括 `initializeNewTaskDraft` 的回退值、`draftWorkspaceDefaults` 的回退值，以及导入新任务时的初始化回退值。
  - 最近使用的模式（Recent，按 workspace 记忆）仍优先于默认值；用户已显式选择过的 workspace 不会被强制改回。
  - CLI 运行时 `DefaultRuntimeConfig.permission.mode` 与 projection 初始配置的默认值同步改为 `yolo`。
- 验收：新 workspace 首次打开的草稿显示 Full access；`pnpm typecheck`、`pnpm lint`、UI 测试通过。

## 29. 合并上游 v3.15.1：兼容修正与暂不移植的部分

- 背景：从 `zai-org/ZCode` `main`（v3.15.1）合并后端、桌面、CLI、shared 代码。UI（`packages/ui`）保持本分支版本，上游 UI 变更尚未移植（见下方「暂不包含」）。
- 规则（兼容修正，仅为让本分支类型检查通过并保持既有产品决定）：
  - `RemoteTarget` 新增 `server` 种类：UI 不提供 server 连接表单，因此 UI 中的 `server` 分支只做展示、标识与快照字段的无损保留；快照与恢复都不携带 token（与 SSH 密码同样不落盘）。
  - 工作流通知 `hole`（留白）行：本 UI 未移植上游的留白行组件，`WorkflowNotificationToolRow` 对 `hole` 不渲染；其余三种通知（terminal / escalation / stall）不变。
  - `McpConfig` 补齐上游新增的 CLI MCP 字段（`claudeclimcp` / `geminiclimcp` / `codexclimcp` / `opencodemcp`），默认为空。
  - 旧 provider 值（claude / codex / gemini / opencode）在读取时归一为 ZCode Agent（`glm`），与上游一致；不会再以第三方身份存在。
  - 测试期望对齐本分支默认值：Memory、消息流 Todo、工具分组 Changes 新装默认开启；Computer Use 入口默认展示；Enter 默认换行（Ctrl/Cmd+Enter 发送）。
- 暂不包含（需单独决定）：上游 UI（web 远程控制侧栏、Shell、v4 会话、留白行 UI 等）；内置 provider 目录（本分支 BYOK，`config/provider/zcode-builtin.json` 保持空 providers）；上游 BigModel OAuth 默认启用（本分支保持关闭）。
- 验收：`pnpm typecheck` 通过；`apps/zcode-cli` 各包 typecheck 通过；`pnpm lint` 0 错误；`packages/ui` 测试全部通过（node:test 方式运行）；`packages/shared` 测试仅余 PRT-026（依赖未包含的 `docs/monitoring` 文档）。

## 30. Xoá prompt mẫu (prompt template) khỏi trang New task

> Mục này được viết bằng tiếng Việt theo yêu cầu chuyển tài liệu sang tiếng Việt.

- Bối cảnh: trang New task (draft) hiển thị một hàng chip prompt mẫu ngay dưới ô nhập (`Weekly Summary`, `Error Fix`, `PPT Creation`, `Idle-time task`…). Người dùng yêu cầu xoá prompt mẫu.
- Quy tắc: trang draft chỉ còn lời chào theo giờ + ô nhập (composer). Không còn truy vấn Client Scenes cho scene `draft-suggestion`, không còn chip gợi ý và không còn luồng tự cài/bật plugin khi bấm chip.
- Phạm vi xoá (xoá hẳn, không ẩn):
  - UI: `packages/ui/src/v4/ConversationDraftSuggestedPrompts.tsx`, `ConversationDraftSuggestedPromptsContainer.tsx`, `ConversationDraftSuggestedPluginFlow.tsx`.
  - Dữ liệu và hook: `draftSuggestedPromptItems.ts`, `draftSuggestedPromptPrefill.ts`, `useDraftSuggestedPromptItems.ts`, `useDraftSuggestedPluginActionPopover.ts`, `officeSuggestedPrompts.ts` (pool prompt mẫu cũ, đã không còn nơi dùng).
  - Telemetry: `packages/ui/src/lib/promptTemplateTelemetry.ts` (sự kiện `prompt_template_ck`).
  - Điểm render: `packages/ui/src/v4/SessionPane.tsx` — bỏ khối `<ConversationDraftSuggestedPromptsContainer />` khỏi `conversationBottomDockContent` cùng import tương ứng.
  - i18n: 20 khoá `chat.draft.suggestedPrompt.*` trong `en-US.ts` và `zh-CN.ts` (`vi-VN.ts` chưa từng có các khoá này).
  - Test: xoá `v4ConversationDraftSuggestedPrompts.test.ts`, `v4ConversationDraftSuggestedPromptsContainer.test.ts`, `draftSuggestedPromptItems.test.ts`, `draftSuggestedPromptPrefill.test.ts`, `promptTemplateTelemetry.test.ts`; gỡ mock/khẳng định liên quan trong `offPeakFigmaLayout.test.ts`, `highspeedVisibilityRefresh.test.ts`, `v4SessionPaneComposerContinuity.test.ts`, `v4SessionPaneLayoutParity.test.ts`, `v4SessionPaneModelSwitchRecovery.test.ts` và `packages/desktop/test/e2e/ui-shell/side-pane-tabs-responsive-interactions.test.ts` (selector `data-v4-draft-suggested-prompts-slot`).
  - Tham chiếu: `zcode-feature-graph.yaml` đánh dấu node `surface.new-task-suggested-prompts` là `status: "removed"`.
- Giữ nguyên: `IClientScenesService` và các scene `scheduled-task` / `off-peak-task` vẫn dùng cho trang Automations và `OffPeakNewTaskEntry`; `ConversationDraftEmptyState` (lời chào theo giờ) không đổi.
- Nghiệm thu: trang New task không còn hàng chip prompt mẫu; `pnpm typecheck`, `pnpm lint` và test UI không còn tham chiếu tới module đã xoá. Lưu ý: phiên soạn này không có `node_modules` trong sandbox nên chưa chạy được typecheck/lint/test — cần chạy lại trên máy có môi trường.

## 31. Bỏ placeholder ở ô nhập (composer) và đổi tên sản phẩm trong README

- Bối cảnh: ô nhập chat hiển thị văn bản gợi ý động (`Ask HCode anything, @ to add context, / for commands or capabilities` và các biến thể theo trạng thái). Người dùng yêu cầu bỏ placeholder. Đồng thời README còn dùng tên cũ `ZCode`.
- Quy tắc: ô nhập không còn văn bản gợi ý ở mọi trạng thái (draft mới, đang xử lý, hỏi tiếp, và bản mobile remote); `ContentEditable` của Lexical luôn nhận `placeholder: null`.
- Phạm vi xoá:
  - `packages/ui/src/lib/chatPlaceholder.ts` (`resolveChatPlaceholderKey`, `shouldDeferChatPlaceholder`) và `packages/ui/test/chatPlaceholder.test.ts`.
  - `packages/ui/src/v4/ConversationComposer.tsx`: bỏ `placeholder`, `compactMobilePlaceholder` và prop `compactPlaceholder` truyền xuống editor.
  - `packages/ui/src/prompt-editor/ChatPromptEditor.tsx` và `packages/ui/src/LexicalChatInput.tsx`: bỏ prop `placeholder` / `compactPlaceholder` cùng nhánh render placeholder.
  - i18n: 5 khoá `chat.placeholder.newTask` / `newTaskMobile` / `followUpAsk` / `followUpQueue` / `loading` trong `en-US.ts`, `zh-CN.ts`.
- Giữ nguyên: `avoidIosInputFocusZoom` (chống zoom iOS trên mobile remote) và `resolveMobileInputTextSizeClassName`; các placeholder khác (tìm kiếm, model, quyền…) không đổi.
- Tài liệu: `README.md` (tiếng Việt) và `README.en.md` dùng tên sản phẩm `HCode`; giữ nguyên định danh kỹ thuật: lệnh `zcode`, gói `@zcode/*`, biến `ZCODE_*`, thư mục `apps/zcode-cli`, `~/.zcode`, `dist/zcode/`.
- Nghiệm thu: ô nhập không còn câu gợi ý; README không còn chuỗi `ZCode` cho tên sản phẩm. Chưa chạy được `pnpm typecheck` / `pnpm lint` / test trong phiên soạn (sandbox không có `node_modules`).
