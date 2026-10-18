import type { Locale } from "@zcode/shared";

/** 营销触达与奖励页使用的语言子集；应用语言只有 vi-VN / en-US，统一回落到 en-US。 */
export type MarketingLocale = "en-US";

export function toMarketingLocale(_locale: Locale): MarketingLocale {
  return "en-US";
}
