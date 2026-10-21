import { useEffect } from "react";
import type { AppSettings } from "@zcode/shared";
import { useServices } from "@/hooks/useServices.js";
import { getRemovedAccountService } from "@/lib/removedAccountServices.js";
import { useOffPeakTaskStore } from "@/store/offPeakTaskStore.js";

/** 两个闲时入口共享初始化/连接/Registry 通知边界，不在组件中另存资格。 */
export function useOffPeakEligibility(
  settings: AppSettings | null | undefined,
  registryRevision: number | undefined,
): void {
  // HCode 不装配闲时任务 / Coding Plan 订阅服务；缺失时不初始化，Store 保持“无资格”初始态。
  const services = useServices();
  const offPeakTaskService = getRemovedAccountService(services, "offPeakTaskService");
  const codingPlanSubscriptionService = getRemovedAccountService(
    services,
    "codingPlanSubscriptionService",
  );
  const initialize = useOffPeakTaskStore((state) => state.initialize);
  const refresh = useOffPeakTaskStore((state) => state.refreshCodingPlanSupport);
  const family = settings?.providerFamilyDomain;
  const connection = family ? settings?.providerFamilyConnectionSelections?.[family] : undefined;
  const freshnessKey = settings
    ? JSON.stringify([registryRevision, family, connection])
    : undefined;

  useEffect(() => {
    if (!offPeakTaskService || !codingPlanSubscriptionService) return;
    void initialize({ offPeakTaskService, codingPlanSubscriptionService });
  }, [initialize, offPeakTaskService, codingPlanSubscriptionService]);

  useEffect(() => {
    if (freshnessKey === undefined || !offPeakTaskService) return;
    // Settings 变化只是失效信号；ProviderSettings View revision 来自 Registry 已完成发布。
    // 即使选择没变，账号稍后就绪也会重查；相同 key 的双入口通知由 Store 去重。
    void refresh(offPeakTaskService, freshnessKey);
  }, [freshnessKey, offPeakTaskService, refresh]);
}
