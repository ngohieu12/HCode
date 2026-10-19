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
 * 工作区 Automations 不经过 SettingsPage，编辑页的面包屑上报需要 Provider 接收，
 * 所以桌面顶栏只剩空拖拽区；这里让工作区入口复用设置页的同一套面包屑合同。
 * Windows/Linux 需要在右上角补回最小化/最大化/关闭三件套，保持与设置页一致的可拖拽与可点击分区。
 */
export function AutomationsMainBreadcrumbFrame({
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
              data-testid="automations-main-header"
            >
              <div
                className="min-w-0 flex-1 [app-region:drag]"
                data-testid="automations-main-drag-region"
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
