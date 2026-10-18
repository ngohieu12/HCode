import type { CuaPermissionKind, Locale } from "@zcode/shared";

export interface CuaPermissionPanelMessages {
  documentTitle: string;
  dragTitle: string;
  hintPrefix: string;
  permissionLabel: string;
  hintSuffix: string;
  completion: string;
}

const MESSAGES: Record<
  Locale,
  Omit<CuaPermissionPanelMessages, "permissionLabel"> & Record<CuaPermissionKind, string>
> = {
  "en-US": {
    documentTitle: "ZCode Computer Use Permissions",
    dragTitle: "Drag me to the permission list above",
    hintPrefix: "Drag the icon on the left into the ",
    hintSuffix: " list above",
    completion: "Release to grant access—no need to toggle the switch",
    accessibility: "Accessibility",
    screen_recording: "Screen Recording",
  },
  // 越南语暂无独立文案，先复用英文，保证面板不会出现中文。
  "vi-VN": {
    documentTitle: "ZCode Computer Use Permissions",
    dragTitle: "Drag me to the permission list above",
    hintPrefix: "Drag the icon on the left into the ",
    hintSuffix: " list above",
    completion: "Release to grant access—no need to toggle the switch",
    accessibility: "Accessibility",
    screen_recording: "Screen Recording",
  },
};

export function resolveCuaPermissionPanelMessages(
  locale: Locale,
  permission: CuaPermissionKind,
): CuaPermissionPanelMessages {
  const messages = MESSAGES[locale];
  return {
    documentTitle: messages.documentTitle,
    dragTitle: messages.dragTitle,
    hintPrefix: messages.hintPrefix,
    permissionLabel: messages[permission],
    hintSuffix: messages.hintSuffix,
    completion: messages.completion,
  };
}
