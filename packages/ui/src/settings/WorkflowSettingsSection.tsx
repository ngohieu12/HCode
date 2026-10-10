import { useCallback, type ComponentProps } from "react";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import {
  SavedWorkflowsSection,
  type SavedWorkflowProjectTarget,
} from "@/settings/saved-workflows/SavedWorkflowsSection.js";
import { getWorkspaceWorkflowActions } from "@/settings/saved-workflows/workspaceWorkflowActionsBridge.js";

type SavedWorkflowsSectionProps = ComponentProps<typeof SavedWorkflowsSection>;

interface WorkflowSettingsSectionProps {
  workspacePath?: string | null;
  workspaceIdentity?: string;
  /**
   * 需要切到工作区会话/侧栏的动作完成后调用，用来关闭设置层，让结果露出来。
   */
  onLeaveSettings?: () => void;
}

/**
 * 设置页「工作流」分区：原先是定时任务页的一个标签，现在是正式设置分区。
 * 列表/详情/编辑仍由 SavedWorkflowsSection 承担；会切走工作区视图的动作经
 * workspaceWorkflowActionsBridge 交给 shell 执行。
 */
export function WorkflowSettingsSection({
  workspacePath,
  workspaceIdentity,
  onLeaveSettings,
}: WorkflowSettingsSectionProps) {
  const { intl } = useZCodeIntl();

  const handleNavigateToLaunchedRun = useCallback<
    NonNullable<SavedWorkflowsSectionProps["onNavigateToLaunchedRun"]>
  >(
    (target, sessionId) => {
      const actions = getWorkspaceWorkflowActions();
      if (!actions?.onNavigateToLaunchedRun) return;
      actions.onNavigateToLaunchedRun(target, sessionId);
      onLeaveSettings?.();
    },
    [onLeaveSettings],
  );

  const handleCreateViaChat = useCallback(
    (prompt: string, target: SavedWorkflowProjectTarget) => {
      const actions = getWorkspaceWorkflowActions();
      if (!actions?.onCreateViaChat) return;
      actions.onCreateViaChat(prompt, target);
      onLeaveSettings?.();
    },
    [onLeaveSettings],
  );

  const handleOpenWorkflowRun = useCallback<
    NonNullable<SavedWorkflowsSectionProps["onOpenWorkflowRun"]>
  >(
    (params) => {
      const actions = getWorkspaceWorkflowActions();
      if (!actions?.onOpenWorkflowRun) return;
      actions.onOpenWorkflowRun(params);
      onLeaveSettings?.();
    },
    [onLeaveSettings],
  );

  const handleOpenWorkflowArtifact = useCallback<
    NonNullable<SavedWorkflowsSectionProps["onOpenWorkflowArtifact"]>
  >(
    (params) => {
      const actions = getWorkspaceWorkflowActions();
      if (!actions?.onOpenWorkflowArtifact) return;
      actions.onOpenWorkflowArtifact(params);
      onLeaveSettings?.();
    },
    [onLeaveSettings],
  );

  const header = (
    <div className="flex flex-col gap-3">
      <h1 className="text-[30px] font-medium leading-[34px] tracking-[0.114px] text-foreground">
        {intl.formatMessage({ id: "automations.pageTab.workflow" })}
      </h1>
      <p className="text-ui-base leading-5 text-foreground-subtlest">
        {intl.formatMessage({ id: "workflows.hub.description" })}
      </p>
    </div>
  );

  return (
    <SavedWorkflowsSection
      header={header}
      workspacePath={workspacePath}
      workspaceIdentity={workspaceIdentity}
      onNavigateToLaunchedRun={handleNavigateToLaunchedRun}
      onCreateViaChat={handleCreateViaChat}
      onOpenWorkflowRun={handleOpenWorkflowRun}
      onOpenWorkflowArtifact={handleOpenWorkflowArtifact}
    />
  );
}
