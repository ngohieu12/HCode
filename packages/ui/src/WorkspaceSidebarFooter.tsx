import type { UserInfo } from "@zcode/shared";
import { memo } from "react";
import { TID_LOGIN_TRIGGER, TID_TASK_SETTINGS_BUTTON } from "@zcode/shared";
import { ControlHintTooltip } from "@/ControlHintTooltip.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.js";
import { cn } from "@/components/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { Loader2, Settings, User } from "lucide-react";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { useZCodeStore } from "@/store/StoreProvider.js";
import { WorkspaceWebRemoteControlTrigger } from "@/WorkspaceWebRemoteControlTrigger.js";
import {
  WorkspaceSidebarFooterPlanBadge,
  useWorkspaceSidebarFooterUsageSummaryState,
} from "@/WorkspaceSidebarFooterUsageSummary.js";

function getSidebarProfileName(user?: UserInfo | null): string {
  const displayName = user?.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const username = user?.username?.trim();
  if (username) {
    return username;
  }

  return "HCode";
}

function getSidebarProfileBadge(
  user: UserInfo | null | undefined,
  formatMessage: ReturnType<typeof useZCodeIntl>["intl"]["formatMessage"],
): string {
  if (user) {
    return getSidebarProfileName(user);
  }

  return formatMessage({ id: "sidebar.profile.notLoggedIn" });
}

function getAvatarFallbackText(user: UserInfo | null | undefined): string {
  const source = user?.displayName?.trim() || user?.username?.trim() || "Z";
  return source[0]?.toUpperCase() ?? "Z";
}

/**
 * 侧栏底部账户区。账户按钮不再弹出菜单：点击只调用 `onAccountClick`，
 * 语言、主题、缩放、用量、升级、登录/退出都已迁入设置页。
 */
export const WorkspaceSidebarFooter = memo(function WorkspaceSidebarFooterComponent({
  onSettingsButtonClick,
  onAccountClick,
  settingsButtonMode = "settings",
  user,
  workspacePath,
  workspaceIdentity,
  isDesktop = false,
  className,
}: {
  onSettingsButtonClick?: () => void;
  onAccountClick?: () => void;
  settingsButtonMode?: "settings" | "back";
  user?: UserInfo | null;
  workspacePath?: string;
  workspaceIdentity?: string;
  isDesktop?: boolean;
  className?: string;
}) {
  const { intl } = useZCodeIntl();
  const isRestoringOAuthSession = useZCodeStore((state) => state.isRestoringOAuthSession);
  const profileBadge = getSidebarProfileBadge(user, intl.formatMessage);
  const avatarFallbackText = getAvatarFallbackText(user);
  const avatarKey = user?.avatarUrl ?? user?.id ?? "guest";
  const showAuthRestoreLoading = !user && isRestoringOAuthSession;
  const usageSummaryState = useWorkspaceSidebarFooterUsageSummaryState({
    enabled: true,
    workspaceIdentity,
    workspacePath,
  });
  const settingsButtonLabel =
    settingsButtonMode === "back"
      ? intl.formatMessage({ id: "workspace.backToWorkspace" })
      : intl.formatMessage({ id: "settings.title" });

  return (
    // footer 被 Settings 复用，页面专属边距由调用方传入，避免修改共享默认样式。
    <footer className={cn("flex shrink-0 flex-col gap-2.5 px-4 pt-2 pb-4", className)}>
      <div className="flex min-w-0 gap-2">
        {/* Button 默认 shrink-0 且带 whitespace-nowrap，超长用户名会把 footer 撑出 sidebar。
            这里让触发按钮和文本列都允许收缩，并只在用户名自身做单行截断。 */}
        <Button
          type="button"
          variant="ghost"
          size={"lg"}
          className="min-w-0 flex-1 justify-start gap-2 overflow-hidden rounded-tl-2xl rounded-bl-2xl border-0 pl-0"
          data-testid={TID_LOGIN_TRIGGER}
          aria-label={profileBadge}
          disabled={!onAccountClick}
          onClick={onAccountClick}
        >
          <Avatar key={avatarKey} size="default">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={profileBadge} /> : null}
            <AvatarFallback className="bg-background text-foreground">
              {user ? (
                avatarFallbackText
              ) : showAuthRestoreLoading ? (
                <>
                  {/* OAuth 启动恢复未落定前，footer 之前会直接显示未登录头像，
                      用户很容易把“还在校验”误判成“已经退出”。
                      这里用 loading 图标明确表达“状态确认中”，等恢复成功或失败后再展示最终状态。 */}
                  <Loader2 className="size-4 animate-spin" />
                  <span className="sr-only">{intl.formatMessage({ id: "common.loading" })}</span>
                </>
              ) : (
                <User className="size-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden text-left">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate text-ui-base font-semibold text-foreground">
                {profileBadge}
              </span>
              {user ? <WorkspaceSidebarFooterPlanBadge state={usageSummaryState} /> : null}
            </div>
          </div>
        </Button>
        <div className="flex shrink-0 items-center gap-1.5">
          {isDesktop && workspacePath ? (
            <WorkspaceWebRemoteControlTrigger
              workspacePath={workspacePath}
              workspaceIdentity={workspaceIdentity}
              compact
            />
          ) : null}
          <ControlHintTooltip title={settingsButtonLabel}>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              data-testid={TID_TASK_SETTINGS_BUTTON}
              aria-label={settingsButtonLabel}
              disabled={!onSettingsButtonClick}
              onClick={onSettingsButtonClick}
            >
              <Settings className="size-4" />
            </Button>
          </ControlHintTooltip>
        </div>
      </div>
    </footer>
  );
});
