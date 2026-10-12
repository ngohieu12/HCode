/**
 * 设置页“通用”顶部的账户分组。
 * 原先这些操作（使用统计、升级/续费套餐、登录/退出）挂在侧栏账户按钮的下拉菜单里；
 * 菜单移除后统一迁入这里，保留原有 data-testid、升级对话框入口与漏斗埋点。
 */
import type { UserInfo } from "@zcode/shared";
import {
  TID_LOGIN_MENU_ITEM,
  TID_LOGOUT_BUTTON,
  TID_SIDEBAR_CODING_PLAN_USAGE_BUTTON,
} from "@zcode/shared";
import { Button } from "@/components/ui/button.js";
import {
  useWorkspaceSidebarFooterUsageSummaryState,
  WorkspaceSidebarFooterPlanBadge,
} from "@/WorkspaceSidebarFooterUsageSummary.js";
import type { SidebarUsageCodingPlanProviderId } from "@/lib/sidebarUsageCodingPlanProviderPreference.js";
import { isMaxCodingPlanSnapshot } from "@/lib/sidebarCodingPlanUpgrade.js";
import {
  createCodingPlanFunnelContext,
  resolveCodingPlanEntryPlanState,
  type CodingPlanFunnelContext,
} from "@/lib/codingPlanFunnelTelemetry.js";
import { setPendingSettingsUsageIntent } from "@/lib/settingsNavigation.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { useCodingPlanEntryGate } from "@/settings/CodingPlanEntryButton.js";
import { SettingsGroupCard, SettingsRow } from "@/settings/SettingsPageParts.js";

const TID_SIDEBAR_CODING_PLAN_UPGRADE_BUTTON = "sidebar-coding-plan-upgrade-button";

export function AccountSettingsGroup({
  user,
  workspacePath,
  workspaceIdentity,
  onLogin,
  onLogout,
  onOpenUsage,
  onUpgrade,
}: {
  user?: UserInfo | null;
  workspacePath?: string;
  workspaceIdentity?: string;
  onLogin?: () => void;
  onLogout?: () => void;
  onOpenUsage: () => void;
  onUpgrade: (
    providerId: SidebarUsageCodingPlanProviderId,
    funnelContext: CodingPlanFunnelContext,
  ) => void;
}) {
  const { intl } = useZCodeIntl();
  const entryGate = useCodingPlanEntryGate();
  const usageState = useWorkspaceSidebarFooterUsageSummaryState({
    enabled: true,
    workspaceIdentity,
    workspacePath,
  });
  const { providerEntitlements, upgradeTargetProviderId } = usageState;
  const upgradeProviderSnapshot =
    providerEntitlements.find((item) => item.providerId === upgradeTargetProviderId)?.snapshot ??
    null;
  const upgradeActionLabelId = isMaxCodingPlanSnapshot(upgradeProviderSnapshot)
    ? "sidebar.usage.plan.renew"
    : "sidebar.usage.plan.upgrade";
  const displayName = user?.displayName?.trim() || user?.username?.trim() || "HCode";
  const upgradeLoading = entryGate.status === "loading";

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h3 className="text-ui-lg font-semibold text-foreground">
          {intl.formatMessage({ id: "settings.account.title" })}
        </h3>
        <p className="mt-1 text-ui-base leading-6 text-foreground-subtle">
          {intl.formatMessage({ id: "settings.account.description" })}
        </p>
      </div>
      <SettingsGroupCard>
        <SettingsRow
          label={
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="truncate">
                {user ? displayName : intl.formatMessage({ id: "settings.account.notLoggedIn" })}
              </span>
              {user ? <WorkspaceSidebarFooterPlanBadge state={usageState} /> : null}
            </span>
          }
          control={
            user ? (
              onLogout ? (
                <Button
                  type="button"
                  variant="outline"
                  data-testid={TID_LOGOUT_BUTTON}
                  onClick={onLogout}
                >
                  {intl.formatMessage({ id: "app.logout" })}
                </Button>
              ) : null
            ) : onLogin ? (
              <Button
                type="button"
                variant="outline"
                data-testid={TID_LOGIN_MENU_ITEM}
                onClick={onLogin}
              >
                {intl.formatMessage({ id: "app.login" })}
              </Button>
            ) : null
          }
        />
        <SettingsRow
          label={intl.formatMessage({ id: "sidebar.usage.plan.openStats" })}
          description={intl.formatMessage({ id: "settings.account.usageDescription" })}
          control={
            <Button
              type="button"
              variant="outline"
              data-testid={TID_SIDEBAR_CODING_PLAN_USAGE_BUTTON}
              onClick={() => {
                setPendingSettingsUsageIntent();
                onOpenUsage();
              }}
            >
              {intl.formatMessage({ id: "settings.account.open" })}
            </Button>
          }
        />
        {/* 产品要求：升级入口始终显示；未解析出当前套餐时由当前 provider family 决定品牌。 */}
        <SettingsRow
          label={intl.formatMessage({ id: "settings.account.planLabel" })}
          description={intl.formatMessage({ id: "settings.account.upgradeDescription" })}
          control={
            <Button
              type="button"
              variant="outline"
              data-testid={TID_SIDEBAR_CODING_PLAN_UPGRADE_BUTTON}
              disabled={upgradeLoading}
              aria-busy={upgradeLoading}
              onClick={() => {
                if (entryGate.status !== "ready") {
                  entryGate.retry?.();
                  return;
                }
                onUpgrade(
                  upgradeTargetProviderId,
                  createCodingPlanFunnelContext({
                    providerId: upgradeTargetProviderId,
                    upgradeSource: "profile_menu",
                    eventRegion: "app.profile",
                    eventText: intl.formatMessage({ id: upgradeActionLabelId }),
                    entryPlanState: resolveCodingPlanEntryPlanState({
                      snapshot: upgradeProviderSnapshot,
                    }),
                  }),
                );
              }}
            >
              {entryGate.label ?? intl.formatMessage({ id: upgradeActionLabelId })}
            </Button>
          }
        />
      </SettingsGroupCard>
    </div>
  );
}
