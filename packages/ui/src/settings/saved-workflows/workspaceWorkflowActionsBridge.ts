import type { ComponentProps } from "react";
import type { SavedWorkflowsSection } from "@/settings/saved-workflows/SavedWorkflowsSection.js";

type SavedWorkflowsSectionProps = ComponentProps<typeof SavedWorkflowsSection>;

/**
 * 工作流页里需要 workspace shell 才能完成的动作：运行后切到新会话、打开运行实例、
 * 打开产物、通过对话创建。
 *
 * 设置页与 workspace shell 是兄弟层，设置页无法直接拿到 shell 内的会话/侧栏处理函数。
 * 因此由 shell 挂载时注册一份实现，设置页在动作时读取；shell 不存在（无项目）时为 null，
 * 对应动作退化为 no-op。
 */
export type WorkspaceWorkflowActions = Pick<
  SavedWorkflowsSectionProps,
  "onNavigateToLaunchedRun" | "onCreateViaChat" | "onOpenWorkflowRun" | "onOpenWorkflowArtifact"
>;

let registeredActions: WorkspaceWorkflowActions | null = null;

export function registerWorkspaceWorkflowActions(actions: WorkspaceWorkflowActions): () => void {
  registeredActions = actions;
  return () => {
    if (registeredActions === actions) {
      registeredActions = null;
    }
  };
}

export function getWorkspaceWorkflowActions(): WorkspaceWorkflowActions | null {
  return registeredActions;
}
