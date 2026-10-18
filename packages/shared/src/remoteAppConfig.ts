import type { Locale } from "./protocol.js";

interface RemoteAppConfigLike {
  feedback_url?: unknown;
  feedback_api_base?: unknown;
  feedback_use_external_form?: unknown;
  community_urls?: unknown;
  forceUpdate?: unknown;
}

type LocaleUrlMap = Partial<Record<Locale, string>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null;
}

function sanitizeUrl(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export function getFeedbackUrlFromConfig(config: unknown): string | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  return sanitizeUrl((config as RemoteAppConfigLike).feedback_url);
}

export function getFeedbackApiBaseFromConfig(config: unknown): string | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  return sanitizeUrl((config as RemoteAppConfigLike).feedback_api_base);
}

export function getFeedbackUseExternalFormFromConfig(config: unknown): boolean {
  if (!isRecord(config)) {
    return false;
  }

  const value = (config as RemoteAppConfigLike).feedback_use_external_form;
  return value === true || value === "true";
}

export function getCommunityUrlsFromConfig(config: unknown): LocaleUrlMap {
  if (!isRecord(config)) {
    return {};
  }

  const rawCommunityUrls = (config as RemoteAppConfigLike).community_urls;
  if (!isRecord(rawCommunityUrls)) {
    return {};
  }

  const enUS = sanitizeUrl(rawCommunityUrls["en-US"]);
  return enUS ? { "en-US": enUS } : {};
}

export function getCommunityUrlFromConfig(config: unknown, locale: Locale): string | undefined {
  const communityUrls = getCommunityUrlsFromConfig(config);
  return communityUrls[locale];
}

export function getCommunityUrlFromConfigs(
  remoteConfig: unknown,
  localConfig: unknown,
  locale: Locale,
): string | undefined {
  const remoteUrls = getCommunityUrlsFromConfig(remoteConfig);
  const localUrls = getCommunityUrlsFromConfig(localConfig);

  // 社群渠道具有语言边界。越南语没有独立社群入口，回落到英文站；
  // 两种语言都缺失时保持隐藏。
  return remoteUrls[locale] ?? remoteUrls["en-US"] ?? localUrls[locale] ?? localUrls["en-US"];
}

export function getForceUpdateMinimalVersionFromConfig(config: unknown): string | undefined {
  if (!isRecord(config)) {
    return undefined;
  }

  const forceUpdate = (config as RemoteAppConfigLike).forceUpdate;
  if (!isRecord(forceUpdate)) {
    return undefined;
  }

  const minimalVersion = forceUpdate.minimalVersion;
  return typeof minimalVersion === "string" && minimalVersion.trim() !== ""
    ? minimalVersion.trim()
    : undefined;
}
