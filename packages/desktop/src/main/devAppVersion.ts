import { app } from "electron";
import semver from "semver";
import { ZCODE_VERSION } from "@zcode/shared";

interface DevAppVersionTarget {
  isPackaged: boolean;
  getVersion?: () => string;
  setVersion?: (version: string) => void;
}

/**
 * 开发态直接用 raw Electron 启动 packages/desktop，而 package.json 没有 version 字段。
 * macOS/Windows 会回退到 Electron 可执行文件自带的版本号；Linux 的 raw 二进制没有版本
 * 资源，app.getVersion() 只剩 "0.0"。electron-updater 在首次访问 autoUpdater 时会用
 * app.version 构造 AppImageUpdater，并对非法 semver 直接抛错，导致 main 进程加载失败。
 * 这里只在未打包运行时，把非法版本修正为产品版本（构建期注入的 ZCODE_VERSION）。
 */
export function resolveDevAppVersionOverride(params: {
  isPackaged: boolean;
  currentVersion: string | null | undefined;
  productVersion: string | null | undefined;
}): string | null {
  if (params.isPackaged) return null;
  if (params.currentVersion && semver.valid(params.currentVersion)) return null;
  const productVersion = params.productVersion?.trim();
  if (!productVersion) return null;
  return semver.valid(productVersion) ?? semver.valid(semver.coerce(productVersion));
}

export function ensureValidDevAppVersion(
  target: DevAppVersionTarget = app,
  productVersion: string = ZCODE_VERSION,
): string | null {
  if (typeof target.getVersion !== "function" || typeof target.setVersion !== "function") {
    return null;
  }
  const override = resolveDevAppVersionOverride({
    isPackaged: target.isPackaged,
    currentVersion: target.getVersion(),
    productVersion,
  });
  if (override) {
    target.setVersion(override);
  }
  return override;
}
