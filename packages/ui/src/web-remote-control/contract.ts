import type { IPlatformService, WebRemoteControlAuthStateChange } from "@zcode/shared";
import type { WebRemoteControlWorkspaceSwitcherApi } from "@/root/types.js";

export type WebRemoteControlDeviceNavigation = NonNullable<
  WebRemoteControlWorkspaceSwitcherApi["deviceNavigation"]
>;
export type WebRemoteControlAuthPlatform = Pick<
  IPlatformService,
  "notifyWebRemoteControlAuthStateChanged"
>;
/**
 * OAuth owner 的会话完成事件。HCode 已删除 `IOAuthService`，这里只保留 Web 远控
 * 订阅所需的最小结构；HCode 运行时不提供该服务。
 */
export interface WebRemoteControlAuthEvents {
  onDidChangeSession(listener: (state: WebRemoteControlAuthStateChange["state"]) => void): {
    dispose(): void;
  };
}
export type { WebRemoteControlMobileTaskView } from "@zcode/shared";
export type WebRemoteControlTaskViewSwitcher = Pick<
  WebRemoteControlWorkspaceSwitcherApi,
  "updateMobileTaskView" | "updateMobileViewState"
>;
