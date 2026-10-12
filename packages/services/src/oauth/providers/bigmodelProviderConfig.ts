import { BIGMODEL_PROVIDER_ID, buildBigModelApiUrl } from "@zcode/shared";
import type { OAuthProviderRuntimeConfig } from "../runtimeConfig.js";
import {
  buildDesktopOAuthRedirectUriFromEnv,
  buildZCodeApiUrlFromEnv,
  readBoolean,
  readEnv,
} from "./configUtils.js";

const BIGMODEL_USERINFO_PATH = "/api/biz/customer/getCustomerInfo";
const BIGMODEL_AUTHORIZE_PATH = "/login";

// 当前产品只保留 Z.ai 登录与 Provider 集合，BigModel 默认关闭：登录列表不再展示它，
// 已登录的 BigModel 会话在启动恢复时被清理。需要临时恢复时设置 BIGMODEL_OAUTH_ENABLED=true。
const BIGMODEL_OAUTH_PROVIDER_CONFIG: Omit<OAuthProviderRuntimeConfig, "appSecret"> = {
  id: BIGMODEL_PROVIDER_ID,
  displayName: "BigModel",
  enabled: false,
  order: 0,
  authorizeUrl: "https://bigmodel.cn/login",
  tokenUrl: "https://zcode.z.ai/api/v1/oauth/token",
  userinfoUrl: buildBigModelApiUrl({ ZCODE_ENV: "production" }, BIGMODEL_USERINFO_PATH),
  appId: "zcode",
  redirectUri: "zcode://oauth/callback",
};

export function createBigModelProviderRuntimeConfig(
  env: NodeJS.ProcessEnv,
): OAuthProviderRuntimeConfig {
  return {
    ...BIGMODEL_OAUTH_PROVIDER_CONFIG,
    enabled: readBoolean(env, "BIGMODEL_OAUTH_ENABLED", BIGMODEL_OAUTH_PROVIDER_CONFIG.enabled),
    authorizeUrl:
      readEnv(env, "BIGMODEL_OAUTH_AUTHORIZE_URL") ??
      buildBigModelApiUrl(env, BIGMODEL_AUTHORIZE_PATH),
    tokenUrl:
      readEnv(env, "BIGMODEL_OAUTH_TOKEN_URL") ??
      buildZCodeApiUrlFromEnv(env, "/api/v1/oauth/token"),
    userinfoUrl: resolveBigModelUserinfoUrl(env),
    appId: readEnv(env, "BIGMODEL_OAUTH_APP_ID") ?? BIGMODEL_OAUTH_PROVIDER_CONFIG.appId,
    redirectUri: buildDesktopOAuthRedirectUriFromEnv(env),
    // 历史 fallback secret 已废弃，不能再把内置密钥打进运行时配置。
    // 当前 BigModel callback 只消费 zcode OAuth token 路由，显式 appSecret 仅保留给
    // 旧接口兼容场景，缺失时必须保持 undefined。
    appSecret: readEnv(env, "BIGMODEL_OAUTH_APP_SECRET"),
  };
}

export function resolveBigModelUserinfoUrl(env: NodeJS.ProcessEnv): string {
  return (
    readEnv(env, "BIGMODEL_OAUTH_USERINFO_URL") ?? buildBigModelApiUrl(env, BIGMODEL_USERINFO_PATH)
  );
}
