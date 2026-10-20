import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const SETUID_BIT = 0o4000;
const REQUIRED_HELPER_MODE = 0o4755;

function readProcFlag(path, readFile) {
  try {
    return readFile(path, "utf8").trim();
  } catch {
    return null;
  }
}

/**
 * 判断本机是否禁止非特权 user namespace（Ubuntu 23.10+ 的 AppArmor 默认限制、
 * 或内核关闭 unprivileged_userns_clone）。此时 Chromium 无法使用 namespace sandbox，
 * 只能回退到 SUID helper（chrome-sandbox）。
 */
export function describeUserNamespaceRestriction(readFile = readFileSync) {
  if (readProcFlag("/proc/sys/kernel/apparmor_restrict_unprivileged_userns", readFile) === "1") {
    return "kernel.apparmor_restrict_unprivileged_userns=1";
  }
  if (readProcFlag("/proc/sys/kernel/unprivileged_userns_clone", readFile) === "0") {
    return "kernel.unprivileged_userns_clone=0";
  }
  if (readProcFlag("/proc/sys/user/max_user_namespaces", readFile) === "0") {
    return "user.max_user_namespaces=0";
  }
  return null;
}

/**
 * Dev 启动 raw Electron 时，pnpm 安装的 node_modules/electron/dist/chrome-sandbox
 * 属于当前用户且没有 setuid 位。宿主禁止非特权 user namespace 时 Chromium 会回退到这个
 * SUID helper，并因权限不对直接 FATAL abort（"The SUID sandbox helper binary was found,
 * but is not configured correctly"）。打包产物由安装器修正权限，不受影响；这里只给本地
 * dev 启动补 --no-sandbox，并提示正确的修复方式。
 *
 * 覆盖方式：ZCODE_ELECTRON_NO_SANDBOX=1 强制关闭 sandbox，=0 永不自动关闭。
 */
export function resolveLinuxElectronSandboxArgs({
  platform = process.platform,
  electronBinary,
  env = process.env,
  stat = statSync,
  readFile = readFileSync,
} = {}) {
  if (platform !== "linux") {
    return { args: [], reason: null };
  }

  const override = env.ZCODE_ELECTRON_NO_SANDBOX?.trim();
  if (override === "1" || override === "true") {
    return { args: ["--no-sandbox"], reason: "ZCODE_ELECTRON_NO_SANDBOX=1" };
  }
  if (override === "0" || override === "false") {
    return { args: [], reason: null };
  }
  if (!electronBinary) {
    return { args: [], reason: null };
  }

  const helperPath = join(dirname(electronBinary), "chrome-sandbox");
  let helperStat;
  try {
    helperStat = stat(helperPath);
  } catch {
    return { args: [], reason: null };
  }

  const helperConfigured =
    helperStat.uid === 0 &&
    (helperStat.mode & SETUID_BIT) !== 0 &&
    (helperStat.mode & REQUIRED_HELPER_MODE) === REQUIRED_HELPER_MODE;
  if (helperConfigured) {
    return { args: [], reason: null };
  }

  const userNamespaceRestriction = describeUserNamespaceRestriction(readFile);
  if (!userNamespaceRestriction) {
    // namespace sandbox 可用时 Chromium 不会走 SUID helper，保持默认 sandbox。
    return { args: [], reason: null };
  }

  return {
    args: ["--no-sandbox"],
    reason: `${userNamespaceRestriction}; ${helperPath} is not owned by root with mode 4755`,
    helperPath,
  };
}

export function formatLinuxSandboxWarning({ reason, helperPath }) {
  const lines = [
    `[dev] Linux Electron sandbox unavailable (${reason}); starting Electron with --no-sandbox for local dev only.`,
  ];
  if (helperPath) {
    lines.push(
      "[dev] To keep the Chromium sandbox enabled, run once:",
      `[dev]   sudo chown root:root "${helperPath}" && sudo chmod 4755 "${helperPath}"`,
      "[dev] (pnpm install may reset it). Set ZCODE_ELECTRON_NO_SANDBOX=0 to disable this fallback.",
    );
  }
  return lines.join("\n");
}
