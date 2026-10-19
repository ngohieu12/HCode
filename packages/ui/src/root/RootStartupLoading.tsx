import type { ReactNode } from "react";
import { LoaderIcon } from "lucide-react";

interface RootStartupLoadingProps {
  label: string;
  children?: ReactNode;
  busy?: boolean;
}

export function RootStartupLoading({ label, children, busy = true }: RootStartupLoadingProps) {
  return (
    <div
      // Web 端全局 html/body/#root 为 Electron 透明背景让路，React 接管后会替换 HTML 启动壳。
      // 这里必须由阻塞态自身承接主题背景，否则远控链接会在 Root 恢复期间继续露出浏览器白底。
      className="flex h-full min-h-dvh flex-col items-center justify-center gap-6 bg-background text-foreground"
      role="status"
      aria-busy={busy}
      aria-label={label}
      data-testid="root-startup-loading"
    >
      <StartupLoadingIndicator />
      {children}
    </div>
  );
}

/**
 * 启动阻塞态只保留品牌中性的加载指示：旧品牌（ZCode）标志已随品牌更名整体移除，
 * 深色圆角壳沿用原有尺寸与配色，保证首屏的视觉重量和 HTML 启动壳保持一致。
 */
function StartupLoadingIndicator() {
  return (
    <div className="relative flex size-24 items-center justify-center rounded-3xl bg-[linear-gradient(180deg,#000000_0%,#151718_100%)] text-[#ffffff] shadow-xl/20 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-[rgba(255,255,255,0.1)] before:content-['']">
      <LoaderIcon className="size-7 animate-spin" aria-hidden="true" />
    </div>
  );
}

/**
 * 顶栏/引导共用的品牌徽标壳：HCode 已移除旧品牌字形，这里只保留与启动壳一致的
 * 深色圆角底（titlebar 尺寸不放字形），保证布局占位与视觉重量不变。
 */
export function ZCodeStartupLogoBadge({
  animated = true,
  size = "default",
}: {
  animated?: boolean;
  size?: "default" | "titlebar";
}) {
  if (size === "titlebar") {
    return (
      <div
        data-desktop-logo-badge="true"
        className="relative flex size-5 items-center justify-center rounded bg-[linear-gradient(180deg,#000000_0%,#151718_100%)] text-[#ffffff] shadow-sm/20 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-white/20 before:content-['']"
      />
    );
  }
  return (
    <div className="relative flex size-24 items-center justify-center rounded-3xl bg-[linear-gradient(180deg,#000000_0%,#151718_100%)] text-[#ffffff] shadow-xl/20 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-[rgba(255,255,255,0.1)] before:content-['']">
      {animated ? <LoaderIcon className="size-7 animate-spin" aria-hidden="true" /> : null}
    </div>
  );
}
