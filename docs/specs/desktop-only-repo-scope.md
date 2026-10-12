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
  - CLI 发行包的其余部分（TUI、Agent、安装脚本、`scripts/zcode-distribution/`）：本次不处理，见第 5 节。

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

- 独立 CLI 发行流水线（`scripts/build-zcode.mjs`、`scripts/zcode-distribution/`、`install.sh`）仍保留。它服务于命令行版本的分发，不是 Desktop 运行所必需；是否整体删除需要用户确认。
- 删除后的发行包（Desktop 安装包与 CLI 发行包）的实际启动，需要打包后人工验证。
- 对话分享落地页、Web 登录页迁出后的部署方式，需要仓库外负责人确认。

## 6. 无消费者环境变量的清理（2026-10-12）

- `ZCODE_SERVER_WORKSPACE`：唯一读取点在 `packages/server/src/http.ts` 的 `resolveServerWorkspaces`，只影响 `GET /api/server-info` 返回的工作区元数据，而 Desktop 连接远端 Server 时只使用 `serverId` 与 `capabilities`（`packages/desktop/src/host/index.ts`），Web 客户端已删除。现已删除该读取：默认工作区固定为 `process.cwd()`，程序接口 `HttpServerOptions.workspaces` 仍然生效。
- `ZCODE_CDN_BASE_URL`：仓库内没有任何消费者，从 `.env.example` 删除该示例行；远端资源地址继续由 `ZCODE_REMOTE_ASSET_CDN_BASE_URL` 提供。
- 文档：README 的配置表删除 `ZCODE_SERVER_WORKSPACE` 行，并删除版本「Cập nhật / Updates」段落。
- 已删除的失效脚本（目标对象或被测模式已不在仓库中）：
  - `scripts/zcode-distribution.test.mjs`：5 个用例中 4 个针对已移除的 `zcode --web`；发行包启动器仍由 `scripts/zcode-distribution-smoke.mjs` 在仓库外验证。
  - `scripts/test-web-app-gateway-reset.mjs`：依赖不存在的 `docker/web-app/start.mjs`。
  - `scripts/dev-web-share-env.mjs`：依赖已删除的 `@zcode/web-share` 包与 `build:web-share` 脚本。
- `specs/zcode-unified-distribution.md` 已按当前仓库重写（2026-10-12）：删掉 `zcode --web`、Web 资源、`build:lite` 与进程用例的描述，补上发行包结构、安装器行为、已知缺口和本次真实的验证状态；旧的验证记录保留为「Web 移除前」的历史章节。
