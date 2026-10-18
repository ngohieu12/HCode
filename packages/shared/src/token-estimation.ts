/**
 * 字符数 → token 数的估算除数。
 *
 * 说明：该常量原先随 usage-stats.ts 一起导出，而 usage-stats.ts 的其余部分
 * （Coding Plan 额度、entitlement、远端 monitor 聚合）已随 Z.AI / BigModel 体系删除。
 * 常量本身只是本地粗估系数，与任何供应商无关，独立成模块继续供上下文/压缩链路使用。
 */
export const ESTIMATED_TOKEN_CHAR_DIVISOR = 3;
