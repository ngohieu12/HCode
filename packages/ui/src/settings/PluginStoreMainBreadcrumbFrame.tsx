import { useState, type ReactNode } from "react";
import { DesktopWindowControls } from "@/DesktopWindowControls.js";
import { WorkspaceHelpMenuButton } from "@/WorkspaceHelpMenuButton.js";
import { cn } from "@/components/lib/utils.js";
import {
  SettingsBreadcrumbProvider,
  SettingsHeaderBreadcrumb,
  type SettingsBreadcrumbItem,
} from "@/settings/SettingsHeaderBreadcrumb.js";

/**
 * Plugin Marketplace 主视图复用设置页的面包屑合同，桌面端在右上角补回
 * 最小化/最大化/关闭三件套，保持与 Automation 主视图一致的窗口 chrome。
 */
export function PluginStoreMainBreadcrumbFrame({
  ariaLabel,
  children,
  isDesktop,
  isMacDesktop,
  isWindowsDesktop,
  sectionLabel,
}: {
  ariaLabel: string;
  children: ReactNode;
  isDesktop: boolean;
  isMacDesktop?: boolean;
  isWindowsDesktop?: boolean;
  sectionLabel: string;
}) {
  const [items, setItems] = useState<readonly SettingsBreadcrumbItem[]>([]);
  const isLinuxDesktop = Boolean(isDesktop && !isMacDesktop && !isWindowsDesktop);
  const usesInlineWindowControls = Boolean(isWindowsDesktop || isLinuxDesktop);

  return (
    <SettingsBreadcrumbProvider onItemsChange={setItems} sectionLabel={sectionLabel}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        {isDesktop ? (
          <>
            {usesInlineWindowControls ? (
              <div className="absolute right-1 top-1 z-30 mt-px mr-px flex h-12 items-center gap-0.5 px-2 pointer-events-auto [app-region:no-drag]">
                <WorkspaceHelpMenuButton isDesktop={Boolean(isDesktop)} />
                <DesktopWindowControls />
              </div>
            ) : (
              <div className="absolute right-0 top-0 z-30 h-10 w-10 pointer-events-auto [app-region:no-drag]">
                <div className="absolute right-2.5 top-2.5 pointer-events-auto [app-region:no-drag]">
                  <WorkspaceHelpMenuButton isDesktop={Boolean(isDesktop)} />
                </div>
              </div>
            )}
            <div
              className={cn(
                "flex h-12 shrink-0",
                usesInlineWindowControls ? "mr-[134px]" : "mr-12",
              )}
              data-testid="plugin-marketplace-main-header"
            >
              <div
                className="min-w-0 flex-1 [app-region:drag]"
                data-testid="plugin-marketplace-main-drag-region"
              >
                <SettingsHeaderBreadcrumb ariaLabel={ariaLabel} items={items} />
              </div>
            </div>
          </>
        ) : null}
        {children}
      </div>
    </SettingsBreadcrumbProvider>
  );
}
