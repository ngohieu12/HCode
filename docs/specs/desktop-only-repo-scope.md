# 仓库范围收敛：仅保留桌面应用所需代码

## 1. 规则

- 仓库只保留 Desktop 应用及其运行时依赖。
- 删除：
  - `packages/web`：网页客户端入口，包含对话分享落地页、网页 Z.AI 登录与 Web 构建。
  - `packages/zcode-server-cli`：独立 Server 启动与打包工具（`@zcode/server-cli`），Desktop 不依赖它。
  - 与上述两者相关的脚本、类型检查目标、架构策略条目、第三方素材清单和文档说明。
  - CLI 发行包中的 `zcode --web` 模式及其 Server 暂存：该模式只为托管网页服务而存在，网页删除后没有可托管的内容。
- 保留：
  - `apps/zcode-cli`：Desktop 通过 `apps/zcode-cli/packages/cli/dist/zcode.cjs` 运行 Agent，整体保留。
  - `packages/server`：Desktop 依赖它（`@zcode/server/remote`）。其静态托管能力（`ZCODE_WEB_STATIC_ROOT`）是通用 HTTP 能力，不绑定 `packages/web`，本次不删除。
  - CLI 发行包的其余部分（TUI、Agent、安装脚本、`scripts/zcode-distribution/`）：已在 2026-10-18 处理，见第 7 节。

## 2. 影响

- 根脚本 `dev:web` 删除；`typecheck` 不再包含 `packages/web` 与 `packages/zcode-server-cli`。
- `mise.toml` 的 `dev:web` 任务删除。
- `scripts/bootstrap.mjs` 不再构建 `@zcode/web`。
- `scripts/build-zcode.mjs` 不再构建或暂存 Web 资源，也不再构建和暂存 `packages/server` 的 dist；CLI 发行包不再附带网页和 `--web` 模式。
- `scripts/zcode-distribution/runner.mjs` 只保留 `--version` 与转交 Agent CLI 两条路径。`zcode-distribution-smoke.mjs` 不再检查网页部分。
- 对话分享：Desktop 仍会生成分享链接，但仓库内不再提供公开分享落地页，对应页面需在仓库外维护。
- 网页登录（Z.AI Web OAuth）随 `packages/web` 一并移除；Desktop 的登录不受影响。
- 第三方清单：`third-party/inventory.json`、`third-party/copied-components.json`、`THIRD-PARTY-NOTICES.md` 去掉 web 与 server-cli 路径；Material Icon Theme 仍由 `packages/desktop` 使用，条目保留。npm 生产依赖集合不变（两个包的依赖仍被其他 workspace 使用）。
- 文档：`AGENTS.md`、`README.md`、`README.en.md`、`NOTICE.md` 中的 Web 开发、`--web` 与包表格说明同步删除。
- 因 `scripts/licenses.mjs notices` 需要当前平台以外的 optional 原生包且运行环境为 Node 24，本次第三方清单通过编辑后重算哈希完成，`readVerifiedNotices` 校验通过；下次有完整环境时应重新运行生成脚本确认。

## 3. 唯一所有者

- 包清单：根 `pnpm-workspace.yaml` 的 `packages/*` 通配。
- 架构边界：`architecture-policy.yaml`。
- 第三方声明：`third-party/inventory.json`（由 `scripts/licenses.mjs notices` 生成）。

## 4. 验收

- `packages/web` 与 `packages/zcode-server-cli` 目录不存在。
- 仓库源码、脚本与配置中不再引用这两个包名或 `dev:web`（`skills-lock.json` 中指向上游仓库的 `skillPath` 除外）。
- `pnpm-lock.yaml` 通过 `pnpm install --frozen-lockfile --ignore-scripts`。
- `pnpm typecheck`、`pnpm lint`、`pnpm architecture:check -- --changed` 通过。
- Desktop 相关测试（`packages/desktop/test`）与 UI 测试不回归。

## 5. 未处理与待确认

- 删除后的 Desktop 安装包实际启动需要打包后人工验证。
- 对话分享落地页、Web 登录页迁出后的部署方式，需要仓库外负责人确认。

## 6. 无消费者环境变量的清理（2026-10-12）

- `ZCODE_SERVER_WORKSPACE`：唯一读取点在 `packages/server/src/http.ts` 的 `resolveServerWorkspaces`，只影响 `GET /api/server-info` 返回的工作区元数据，而 Desktop 连接远端 Server 时只使用 `serverId` 与 `capabilities`（`packages/desktop/src/host/index.ts`），Web 客户端已删除。现已删除该读取：默认工作区固定为 `process.cwd()`，程序接口 `HttpServerOptions.workspaces` 仍然生效。
- `ZCODE_CDN_BASE_URL`：仓库内没有任何消费者，从 `.env.example` 删除该示例行；远端资源地址继续由 `ZCODE_REMOTE_ASSET_CDN_BASE_URL` 提供。
- 文档：README 的配置表删除 `ZCODE_SERVER_WORKSPACE` 行，并删除版本「Cập nhật / Updates」段落。
- 已删除的失效脚本（目标对象或被测模式已不在仓库中）：
  - `scripts/zcode-distribution.test.mjs`：5 个用例中 4 个针对已移除的 `zcode --web`；发行包启动器随后也随 CLI 发行包一并移除，见第 7 节。
  - `scripts/test-web-app-gateway-reset.mjs`：依赖不存在的 `docker/web-app/start.mjs`。
  - `scripts/dev-web-share-env.mjs`：依赖已删除的 `@zcode/web-share` 包与 `build:web-share` 脚本。
- `specs/zcode-unified-distribution.md` 已按当前仓库重写（2026-10-12）：删掉 `zcode --web`、Web 资源、`build:lite` 与进程用例的描述，补上发行包结构、安装器行为、已知缺口和本次真实的验证状态；旧的验证记录保留为「Web 移除前」的历史章节。

## 7. TUI 与 CLI 发行包移除（2026-10-18）

### 7.1 删除范围

- `apps/zcode-cli/packages/tui`：终端 UI 包。`@zcode/tui` 不再出现在 workspace 依赖中。
- `apps/zcode-cli/packages/cli/src/tui-*.ts`、`clipboard-*.ts`、`sea-playwright-runtime.ts`、`sea-runtime-tools.ts`：TUI 入口、剪贴板、SEA 资产加载。
- `apps/zcode-cli/packages/cli/scripts/*` 中的 SEA/上传脚本（`build-sea.mjs`、`sea-*.mjs`、`upload-sea-smb.mjs`、`windows-authenticode.mjs` 等）。
- `scripts/build-zcode.mjs`、`scripts/zcode-distribution/`、`scripts/zcode-distribution-smoke.mjs`、`scripts/test-sea-runtime-tools-e2e.mjs`、`scripts/test/cli-release.test.mjs`、`specs/zcode-unified-distribution.md`。
- 根与 `@zcode/cli` 的 `build:zcode`、`build:sea`、`build:sea:all`、`test:sea-runtime-tools:e2e`、`release:cli`、`release:cli:dry`、`sea`、`upload:sea` 脚本。
- `apps/zcode-cli/.release-it.json`、TUI/SEA/Ink 设计文档、`.agents/skills/opentui` 与 `skills-lock.json` 中的 opentui 条目。
- `apps/zcode-cli/pnpm-workspace.yaml` 与 `apps/zcode-cli/pnpm-lock.yaml`：CLI 已并入根 workspace，嵌套 workspace 无法解析根包，且 lock 仍引用 TUI；统一使用根 `pnpm-lock.yaml`。
- TUI、剪贴板、SEA 专属测试；`cli.unit.test.ts` 中依赖 TUI 运行时的用例。

### 7.2 保留与替代

- Desktop 仍通过 `apps/zcode-cli/packages/cli/dist/zcode.cjs` 启动 Agent；`pnpm --filter @zcode/cli... build` 只构建该 bundle 及其 workspace 依赖。
- `zcode` 不再有 TUI：无参数时打印 help；`--prompt/--target`、`app-server`、`agent-server`、`login/logout`、`doctor`、`plugins`、`skills`、`commands` 等无界面入口保留。
- command center 仍是 headless slash command 的实现；原先从 `@zcode/tui` 引入的契约改到 `src/command-center/contracts.ts`，类型名统一为 `Cli*`。
- `@zcode/i18n` 的 `tui` copy 命名空间改为 `commandCenter`；`vi-VN` 继续以英文文案兜底，但 `copy.locale` 保留 `vi-VN`。
- Playwright 从 `src/playwright-runtime.ts` 直接动态导入 `playwright-core`，不再经过 SEA 资产层。

### 7.3 验证（Node 22.22.3，仓库要求 24.14.0）

- `pnpm install --frozen-lockfile --ignore-scripts`：通过；锁文件去掉 343 行 TUI/opentui 条目。
- `pnpm --filter @zcode/cli... build`：通过。
- `node scripts/build-desktop-agent-cli.mjs`：通过，产出 `packages/desktop/bundled-agents/linux-x64/glm/zcode.cjs`。
- `pnpm --filter @zcode/cli typecheck`：通过。
- `@zcode/cli` 测试：340 项中 334 通过、0 失败、6 个 `cancelledByParent`（watchdog/关闭时序用例，Node 版本不匹配所致）。
- `@zcode/i18n` vitest：5/5 通过；`@zcode/provider` 的 `m2-completion-boundary` 39/39 通过。
- `node apps/zcode-cli/packages/cli/dist/zcode.cjs`：打印 help，退出码 0；`zcode tui` 报 `Unknown command`，退出码 1。
- `pnpm lint`：112 warnings、1 error，均为既有问题（`packages/ui/test/fixtures/zhCNLegacy.ts` 超 `max-lines`）。
- `pnpm typecheck`：失败，均为既有问题（`packages/services/src/bots/botsService.ts:2268` 未定义 `isEnglish`，随后默认堆上限 OOM）；本次改动涉及的包已单独 typecheck 通过。
- `pnpm architecture:check`：1 条既有违规 `packages/services/src/gen-ui` 缺少 `contract.test.ts`。
- `packages/core` 的 `tests/io-boundary.test.ts` 仍有既有失败（`packages/adapters/src/mcp/network.ts` 不在允许列表）。
- 未执行：Desktop E2E 与打包产物启动验证（需要完整 Node 24 环境、Electron 与打包资源）。
