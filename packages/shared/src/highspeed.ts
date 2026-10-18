/**
 * 加速卡（Highspeed Card）Provider Family 判定。
 *
 * 加速卡按 family 拆成多个隐藏 Provider（account:zai-highspeed-card、
 * account:bigmodel-highspeed-card，通配 account:*-highspeed-card）。判定必须用 Family
 * 谓词，不能和单个 provider id 常量比较，否则 BigModel 账号的加速轮会被判成普通轮。
 */
export function isHighspeedProviderId(providerId: string | undefined): boolean {
  return providerId?.startsWith("account:") === true && providerId.endsWith("-highspeed-card");
}
