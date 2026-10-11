import type { Locale } from "@zcode/shared";

/** 营销触达与奖励页使用的语言子集；应用语言含 vi-VN 时回落到 en-US。 */
export type MarketingLocale = "zh-CN" | "en-US";

export function toMarketingLocale(locale: Locale): MarketingLocale {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}
