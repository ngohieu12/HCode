import type { IServiceAccessor } from "@zcode/services";
import { type ProviderFamilyDomain } from "@/lib/legacyAccountProviderCompat.js";
import type { EnterpriseCodingPlanPricingProduct } from "@zcode/shared";
import { logger } from "@/logger.js";
import { getRemovedAccountService } from "@/lib/removedAccountServices.js";

type EnterprisePricingProductsResult =
  | { status: "success"; productList: EnterpriseCodingPlanPricingProduct[] }
  | { status: "error" };

export async function getEnterprisePricingProducts(
  services: IServiceAccessor,
  domain: ProviderFamilyDomain,
): Promise<EnterprisePricingProductsResult> {
  // 两个账号域均须按自身 Family 查询；失败与明确空列表分开，不能据此自动改掉已有连接。
  const codingPlanSubscriptionService = getRemovedAccountService(
    services,
    "codingPlanSubscriptionService",
  );
  // HCode 不装配 Coding Plan 订阅服务：按“查询失败”处理，调用方不会据此改动已有连接。
  if (!codingPlanSubscriptionService) return { status: "error" };
  try {
    const pricing = await codingPlanSubscriptionService.getEnterprisePricing({
      authenticated: true,
      family: domain,
    });
    return { status: "success", productList: pricing.productList };
  } catch (error) {
    logger.warn("[Root] 刷新登录后团队套餐失败", { domain, error });
    return { status: "error" };
  }
}

export async function getEnterprisePricingProductsOrEmpty(
  services: IServiceAccessor,
  domain: ProviderFamilyDomain,
): Promise<EnterpriseCodingPlanPricingProduct[]> {
  const pricing = await getEnterprisePricingProducts(services, domain);
  return pricing.status === "success" ? pricing.productList : [];
}
