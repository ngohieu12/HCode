import { useEffect, useRef } from "react";
import type {
  WebRemoteControlAuthPlatform,
  WebRemoteControlAuthEvents,
} from "@/web-remote-control/contract.js";

/**
 * 初始恢复同步一次投影；运行中的认证变更只消费 OAuth owner 的凭据完成事件。
 * HCode 不装配 OAuth 服务（`oauth` 为 undefined）：不订阅实时事件，只按 userId 投影一次。
 */
export function useWebRemoteControlAuthSync(
  platform: WebRemoteControlAuthPlatform,
  oauth: WebRemoteControlAuthEvents | undefined,
  userId: string | undefined,
  restoring: boolean,
): void {
  const initialStateSynced = useRef(false);
  useEffect(() => {
    initialStateSynced.current = false;
    if (!platform.notifyWebRemoteControlAuthStateChanged || !oauth) return;
    const subscription = oauth.onDidChangeSession((state) => {
      // 实时凭据事实优先于迟到的初始 UI 投影；无需在 renderer 保存第二份认证状态。
      initialStateSynced.current = true;
      platform.notifyWebRemoteControlAuthStateChanged?.({ state });
    });
    return () => subscription.dispose();
  }, [platform, oauth]);

  useEffect(() => {
    if (restoring || initialStateSynced.current) return;
    initialStateSynced.current = true;
    platform.notifyWebRemoteControlAuthStateChanged?.({
      state: userId ? "signed-in" : "signed-out",
    });
  }, [platform, oauth, userId, restoring]);
}
