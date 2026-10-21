/**
 * HCode 已移除的 Z.AI 账号服务（OAuth、Coding Plan 订阅、用量/权益、闲时任务、高速卡）。
 *
 * 背景：HCode 从 `IServiceAccessor` 删掉了这些服务，renderer 运行时也不再装配它们；
 * 但合并上游后仍有 UI 代码直接写 `services.oauthService.xxx()`。属性在运行时是
 * `undefined`，一旦在渲染期或 effect 里同步解引用就会触发错误边界
 * （例如 "Cannot read properties of undefined (reading 'onDidChangeSession')"）。
 *
 * 所有读取都必须经过 `getRemovedAccountService`：返回值类型带 `undefined`，
 * 调用方被 strictNullChecks 强制处理“服务不存在”的分支——按未登录 / 功能不可用降级，
 * 绝不伪造账号能力。旧 host 或测试 double 若仍注入同名服务，按原样透传。
 *
 * 后续彻底删除这些惰性 UI 时，应连同本文件一起删除。
 */

export type RemovedAccountServiceName =
  | "oauthService"
  | "codingPlanSubscriptionService"
  | "usageStatsService"
  | "offPeakTaskService"
  | "highspeedCardService";

/**
 * 已删除服务的类型契约随服务一起删除，这里只保留“任意方法集合”这一最小形状。
 * 成员为 any（原接口已不存在），但服务本身带 `undefined`，调用前必须先判空。
 */
// oxlint-disable-next-line typescript/no-explicit-any -- 原接口已删除，仅用于惰性兼容
export type RemovedAccountService = Readonly<Record<string, any>>;

export function getRemovedAccountService(
  services: object | null | undefined,
  name: RemovedAccountServiceName,
): RemovedAccountService | undefined {
  if (!services) return undefined;
  const candidate = (services as Readonly<Record<string, unknown>>)[name];
  // 断连远端 accessor 是 Proxy，任意键都返回 RPC 代理（调用会被拒绝）；照常透传。
  return candidate && (typeof candidate === "object" || typeof candidate === "function")
    ? (candidate as RemovedAccountService)
    : undefined;
}
