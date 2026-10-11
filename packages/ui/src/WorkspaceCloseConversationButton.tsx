import { XIcon } from "lucide-react";
import { cn } from "@/components/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { ControlHintTooltip } from "@/ControlHintTooltip.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { WINDOWS_CAPTION_CONTROL_CLASS } from "@/windowCaptionControls.js";
import { useZCodeSessionStore } from "@/store/zcodeSessionStore.js";

/**
 * 关闭当前会话：只把会话从主区移开，不归档、不删除，也不新建草稿。
 * 详见 docs/specs/startup-providers-and-branding.md 第 27 节。
 */
export function WorkspaceCloseConversationButton({
  workspaceAbsPath,
  workspaceIdentity,
  useWindowsCaptionSpacing = false,
}: {
  workspaceAbsPath: string;
  workspaceIdentity?: string;
  useWindowsCaptionSpacing?: boolean;
}) {
  const { intl } = useZCodeIntl();
  const closeActiveConversation = useZCodeSessionStore((state) => state.closeActiveConversation);
  const label = intl.formatMessage({ id: "conversation.close" });

  return (
    <ControlHintTooltip title={label} side="bottom">
      <Button
        type="button"
        variant="ghost"
        size="icon-md"
        data-testid="workspace-close-conversation"
        className={cn(
          "text-foreground hover:bg-hover hover:text-foreground [app-region:no-drag]",
          useWindowsCaptionSpacing && WINDOWS_CAPTION_CONTROL_CLASS,
        )}
        aria-label={label}
        onClick={() => closeActiveConversation(workspaceAbsPath, workspaceIdentity)}
      >
        <XIcon className="size-4" />
      </Button>
    </ControlHintTooltip>
  );
}
