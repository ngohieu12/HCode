import type { AppUsageRequest, AppUsageSnapshot } from "@zcode/shared";
import { ServiceChannels } from "@zcode/shared";
import { createServiceDescriptor } from "../descriptors.js";
import type { IZCodeAgentService } from "../zcode-agent/zcodeAgent.js";

/**
 * App Usage 服务：本地 session 库聚合的用量（model_usage/turn_usage/tool_usage）。
 *
 * 事实源在 CLI 侧，经 ZCode Protocol `v4/usage/stats` 读取；这里只做一层装配，
 * 让 UI 不直接依赖 agent 服务。原先的 usage-stats 服务同时承担 Coding Plan 的
 * 远端 monitor 聚合、权益与额度读取，那部分已随 Z.AI / BigModel 体系整体删除。
 */
export interface IAppUsageService {
  getAppUsageSnapshot(request: AppUsageRequest): Promise<AppUsageSnapshot>;
}

export const IAppUsageService = createServiceDescriptor<IAppUsageService>(
  ServiceChannels.UsageStats,
);

export function createAppUsageService(dependencies: {
  zcodeAgentService: Pick<IZCodeAgentService, "getAppUsageStats">;
}): IAppUsageService {
  return {
    async getAppUsageSnapshot(request: AppUsageRequest): Promise<AppUsageSnapshot> {
      return dependencies.zcodeAgentService.getAppUsageStats({
        range: request.range,
        timeZone: request.timeZone,
      });
    },
  };
}
