import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  detectLocale,
  getZCodeCopy,
  isUiLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
  type ZCodeCopy,
} from "../src/index.js";

describe("i18n catalog", () => {
  it("resolves supported, auto, and unknown locale values deterministically", () => {
    expect(DEFAULT_LOCALE).toBe("en-US");
    expect(resolveLocale("vi-VN")).toBe("vi-VN");
    expect(resolveLocale("auto", "vi_VN")).toBe("vi-VN");
    expect(resolveLocale("auto", "en-GB")).toBe("en-US");
    expect(resolveLocale("fr-FR")).toBe("en-US");
    expect(resolveLocale("en-US")).toBe("en-US");
    expect(getZCodeCopy("auto", "vi_VN.UTF-8").locale).toBe("vi-VN");
  });

  it("detects supported locales from adapter-provided OS hints", () => {
    expect(detectLocale({ env: { LC_ALL: "vi_VN.UTF-8" } })).toBe("vi-VN");
    expect(detectLocale({ env: { LC_ALL: "C.UTF-8", LC_MESSAGES: "en_GB.UTF-8" } })).toBe("en-US");
    expect(detectLocale({ env: { LANG: "fr_FR.UTF-8" }, intlLocale: "vi-VN" })).toBe("vi-VN");
    expect(detectLocale({ env: { LANGUAGE: "fr:vi_VN:en_US" } })).toBe("vi-VN");
    expect(detectLocale({ env: { LANG: "POSIX" }, intlLocale: "fr-FR" })).toBeUndefined();
    expect(detectLocale({ env: { LC_ALL: "zh_CN.UTF-8" } })).toBeUndefined();
  });

  it("validates UI locale config strings", () => {
    expect(isUiLocale("auto")).toBe(true);
    expect(isUiLocale("en-US")).toBe(true);
    expect(isUiLocale("vi-VN")).toBe(true);
    expect(isUiLocale("en-US")).toBe(false);
    expect(isUiLocale("fr-FR")).toBe(false);
  });

  it("keeps all locale catalogs shape-compatible", () => {
    const [firstLocale, ...rest] = SUPPORTED_LOCALES;
    const baseShape = catalogShape(getZCodeCopy(firstLocale));

    for (const locale of rest) {
      expect(catalogShape(getZCodeCopy(locale))).toEqual(baseShape);
    }
  });

  it("returns localized TUI and CLI copy", () => {
    const copy = getZCodeCopy("vi-VN");

    expect(copy.tui.status.ready).toBe("Ready.");
    expect(copy.tui.sidebar.sections.status).toBe("Status");
    expect(copy.tui.sidebar.sections.modifiedFiles).toBe("Modified Files");
    expect(copy.tui.loginRequired.message).toContain("No available models");
    expect(copy.tui.loginSetup.pending.help).toContain("Esc");
    expect(copy.tui.loginSetup.input.placeholder).toBe("Paste API key");
    expect(copy.tui.input.placeholder).toBe("Type a prompt");
    expect(copy.cli.help("1.0.0")).toContain("Usage:");
  });
});

function catalogShape(value: unknown): unknown {
  if (typeof value === "function") return "function";
  if (Array.isArray(value)) return value.map(catalogShape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        catalogShape(item),
      ]),
    );
  }
  return typeof value;
}

void ({} satisfies Partial<ZCodeCopy>);
