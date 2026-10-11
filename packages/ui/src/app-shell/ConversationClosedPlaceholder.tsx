import { useZCodeIntl } from "@/i18n/IntlProvider.js";

/**
 * 用户主动「关闭会话」后的主区空态：不挂载草稿输入框，也不创建新会话。
 * 选中会话或新建草稿时，父级会重新渲染 V4WorkspaceChatArea 并自动隐藏本组件。
 */
export function ConversationClosedPlaceholder() {
  const { intl } = useZCodeIntl();
  return (
    <div
      data-testid="conversation-closed-placeholder"
      className="flex h-full min-h-0 flex-col items-center justify-center gap-2 px-6 text-center"
    >
      <p className="text-ui-base font-medium text-foreground">
        {intl.formatMessage({ id: "conversation.closed.title" })}
      </p>
      <p className="text-ui-sm text-foreground-subtle">
        {intl.formatMessage({ id: "conversation.closed.description" })}
      </p>
    </div>
  );
}
