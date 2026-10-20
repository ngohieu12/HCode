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
 * 本机 Linux 打包时各 target 需要宿主工具链（Ubuntu/Debian 默认都未安装）：
 * - rpm → rpmbuild（apt install rpm）
 * - pacman → bsdtar 生成 .MTREE、zstd 压缩 .pkg.tar.zst（apt install libarchive-tools zstd）
 * 缺失时 electron-builder 会在 fpm 阶段以 exit 127 失败。用户未显式指定
 * ZCODE_LINUX_TARGETS 时自动跳过缺少工具链的 target，而不是打到一半失败。
 */
const LINUX_TARGET_HOST_REQUIREMENTS = {
  rpm: { commands: ["rpmbuild"], aptPackages: ["rpm"] },
  pacman: { commands: ["bsdtar", "zstd"], aptPackages: ["libarchive-tools", "zstd"] },
};

export function resolveHostLinuxTargetPlan({
  env = process.env,
  hasCommand = hasCommandOnPath,
} = {}) {
  if (env.ZCODE_LINUX_TARGETS?.trim()) {
    return { targets: resolveLinuxTargets(env.ZCODE_LINUX_TARGETS), skipped: [] };
  }
  const skipped = [];
  const targets = DEFAULT_LINUX_TARGETS.filter((target) => {
    const requirement = LINUX_TARGET_HOST_REQUIREMENTS[target];
    if (!requirement) return true;
    const missing = requirement.commands.filter((command) => !hasCommand(command));
    if (missing.length === 0) return true;
    skipped.push({
      target,
      missing,
      reason: `${missing.join(", ")} not found (sudo apt install ${requirement.aptPackages.join(" ")})`,
    });
    return false;
  });
  return { targets, skipped };
}
