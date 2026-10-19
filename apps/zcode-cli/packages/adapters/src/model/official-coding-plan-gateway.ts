import type {
  ProviderEndpointRoutingDecision,
  ProviderEndpointRoutingPort,
} from "@zcode/contracts";

/** HCode BYOK: never forward a user-selected model endpoint or credentials to a product gateway. */
export function createStaticProviderEndpointRoutingPort(
  _endpointOrigin: string,
): ProviderEndpointRoutingPort {
  return {
    async resolve(requestUrl): Promise<ProviderEndpointRoutingDecision> {
      // 修复原因：旧版会按提供商 URL 隐式转发用户请求和认证头；BYOK 必须直连所选端点。
      return { routed: false, url: requestUrl };
    },
  };
}
