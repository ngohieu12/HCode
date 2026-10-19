import { describe, expect, it } from "vitest";
import enUS from "../src/i18n/locales/en-US.js";

describe("HCode visible branding", () => {
  it("does not advertise the upstream app or its download site", () => {
    for (const text of Object.values(enUS)) {
      expect(text).not.toMatch(/\bZCode\b|https:\/\/zcode\.z\.ai/);
    }
    expect(enUS["settings.modelProvider.namePlaceholder"]).toBe("e.g. My model provider");
  });

  it("has no unused upstream login buttons or API-key labels", () => {
    for (const key of [
      "login.oauth.button.zai",
      "login.oauth.button.bigmodel",
      "login.apiKey.provider.zai",
      "login.apiKey.provider.bigmodel",
    ]) {
      expect(enUS).not.toHaveProperty(key);
    }
  });
});
