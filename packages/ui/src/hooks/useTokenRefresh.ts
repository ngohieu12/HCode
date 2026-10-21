/**
 * useTokenRefresh —— Token 刷新 hook（常驻层）
 *
 * 挂载在 Root 或 App 组件中，确保 401 刷新在任何时候都能工作。
 * 监听全局的 401 事件，调用 oauthService.refreshToken 刷新 token。
 */
import { useCallback } from "react";
import { logger } from "../logger.js";
import { getRemovedAccountService } from "../lib/removedAccountServices.js";
import { useServices } from "./useServices.js";

export function useTokenRefresh() {
  // HCode 不装配 OAuth 服务：没有可刷新的 token，也没有可清除的账号凭据。
  const oauthService = getRemovedAccountService(useServices(), "oauthService");

  /** 尝试刷新 token，失败则返回 false */
  const tryRefresh = useCallback(async (): Promise<boolean> => {
    if (!oauthService) return false;
    try {
      await oauthService.refreshToken();
      logger.info("[useTokenRefresh] token 刷新成功");
      return true;
    } catch (err) {
      logger.error("[useTokenRefresh] token 刷新失败:", err);
      return false;
    }
  }, [oauthService]);

  /** 清除所有 provider 凭据 */
  const clearCredentials = useCallback(async () => {
    await oauthService?.logoutAll();
  }, [oauthService]);

  return { tryRefresh, clearCredentials };
}
