import { describe, expect, it } from "vitest";
import { getRemovedAccountService } from "@/lib/removedAccountServices.js";

describe("getRemovedAccountService", () => {
  it("HCode accessor 不含已删除的账号服务时返回 undefined，而不是抛错", () => {
    const services = { settingService: {} };
    expect(getRemovedAccountService(services, "oauthService")).toBeUndefined();
    expect(getRemovedAccountService(services, "codingPlanSubscriptionService")).toBeUndefined();
    expect(getRemovedAccountService(services, "usageStatsService")).toBeUndefined();
    expect(getRemovedAccountService(services, "offPeakTaskService")).toBeUndefined();
    expect(getRemovedAccountService(services, "highspeedCardService")).toBeUndefined();
    expect(getRemovedAccountService(null, "oauthService")).toBeUndefined();
    expect(getRemovedAccountService(undefined, "oauthService")).toBeUndefined();
  });

  it("旧 host / 测试 double 仍注入同名服务时原样透传", () => {
    const oauthService = { getActiveProvider: async () => null };
    expect(getRemovedAccountService({ oauthService }, "oauthService")).toBe(oauthService);
  });

  it("非对象值不当作服务", () => {
    expect(getRemovedAccountService({ oauthService: "x" }, "oauthService")).toBeUndefined();
  });
});
