import type { ZCodePluginInfo } from "@zcode/shared";

const PROTOCOL_USER_CONFIG_TYPES = new Set(["string", "number", "boolean", "directory", "file"]);

function isProtocolOptionValue(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

/**
 * 修复原因：userConfig 直接取自第三方 plugin.json，可能带协议未定义的字段
 * （如 Claude Code 插件的 `options` 枚举列表）或非法类型。协议 schema 是 strict 的，
 * 任何一个插件多出一个键都会让整个插件列表解析失败，插件市场整页报错。
 * 这里只投影协议支持的字段，未知字段丢弃、非法值省略，不影响插件本身加载。
 */
export function toProtocolUserConfig(
  userConfig: unknown,
): ZCodePluginInfo["userConfig"] | undefined {
  if (!userConfig || typeof userConfig !== "object" || Array.isArray(userConfig)) return undefined;
  const result: NonNullable<ZCodePluginInfo["userConfig"]> = {};
  for (const [key, raw] of Object.entries(userConfig as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const option = raw as Record<string, unknown>;
    result[key] = {
      ...(isProtocolOptionValue(option.default) ? { default: option.default } : {}),
      ...(typeof option.description === "string" ? { description: option.description } : {}),
      ...(typeof option.required === "boolean" ? { required: option.required } : {}),
      ...(typeof option.sensitive === "boolean" ? { sensitive: option.sensitive } : {}),
      ...(typeof option.title === "string" ? { title: option.title } : {}),
      ...(typeof option.type === "string" && PROTOCOL_USER_CONFIG_TYPES.has(option.type)
        ? { type: option.type as NonNullable<ZCodePluginInfo["userConfig"]>[string]["type"] }
        : {}),
    };
  }
  return result;
}
