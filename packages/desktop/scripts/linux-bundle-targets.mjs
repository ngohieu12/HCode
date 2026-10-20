import { spawnSync } from "node:child_process";

export const DEFAULT_LINUX_TARGETS = ["AppImage", "deb", "rpm", "pacman"];

const canonicalLinuxTargets = new Map(
  DEFAULT_LINUX_TARGETS.map((target) => [target.toLowerCase(), target]),
);

/**
 * ZCODE_LINUX_TARGETS=AppImage,deb 可以只打部分 Linux 产物。
 * 未设置时保持原有四种 target，CI 行为不变。
 */
export function resolveLinuxTargets(rawTargets) {
  const raw = rawTargets?.trim();
  if (!raw) return [...DEFAULT_LINUX_TARGETS];

  const targets = [];
  for (const item of raw.split(",")) {
    const name = item.trim();
    if (!name) continue;
    const canonical = canonicalLinuxTargets.get(name.toLowerCase());
    if (!canonical) {
      throw new Error(
        `Unsupported ZCODE_LINUX_TARGETS entry: ${name} (allowed: ${DEFAULT_LINUX_TARGETS.join(", ")})`,
      );
    }
    if (!targets.includes(canonical)) targets.push(canonical);
  }
  if (targets.length === 0) {
    throw new Error("ZCODE_LINUX_TARGETS must list at least one target");
  }
  return targets;
}

function hasCommandOnPath(command) {
  const result = spawnSync("sh", ["-c", `command -v ${command}`], { stdio: "ignore" });
  return result.status === 0;
}

/**
 * 本机 Linux 打包时，rpm target 依赖 rpmbuild（Ubuntu/Debian 默认未安装）。
 * 用户未显式指定 ZCODE_LINUX_TARGETS 时自动跳过缺少工具链的 target，而不是让
 * electron-builder 打到一半失败。
 */
export function resolveHostLinuxTargetPlan({
  env = process.env,
  hasCommand = hasCommandOnPath,
} = {}) {
  if (env.ZCODE_LINUX_TARGETS?.trim()) {
    return { targets: resolveLinuxTargets(env.ZCODE_LINUX_TARGETS), skipped: [] };
  }
  const skipped = [];
  const targets = DEFAULT_LINUX_TARGETS.filter((target) => {
    if (target === "rpm" && !hasCommand("rpmbuild")) {
      skipped.push({ target, reason: "rpmbuild not found (install the rpm package)" });
      return false;
    }
    return true;
  });
  return { targets, skipped };
}
