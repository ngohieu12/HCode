import type { UiLocale, SupportedLocale } from "@zcode/contracts";
import { enUS } from "./locales/en-US.js";
import {
  DEFAULT_LOCALE,
  detectLocale,
  isSupportedLocale,
  isUiLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
} from "./locale.js";
import type { ZCodeCopy } from "./types.js";

export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  detectLocale,
  isSupportedLocale,
  isUiLocale,
  resolveLocale,
};
export type { LocaleDetectionInput } from "./locale.js";
export type { CliCopy, CommandCenterCopy, UiLocale, SupportedLocale, ZCodeCopy } from "./types.js";

// CLI 尚未提供越南语文案，先以英文兜底，避免出现未翻译的空界面；locale 仍标记为请求的界面语言。
const viVN: ZCodeCopy = { ...enUS, locale: "vi-VN" };

const CATALOGS: Record<SupportedLocale, ZCodeCopy> = {
  "en-US": enUS,
  "vi-VN": viVN,
};

export function getZCodeCopy(locale?: UiLocale | string, detected?: string | null): ZCodeCopy {
  return CATALOGS[resolveLocale(locale, detected)];
}
