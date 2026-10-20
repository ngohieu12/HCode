import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: { isPackaged: false, getVersion: () => "0.0", setVersion: vi.fn() },
}));

import {
  ensureValidDevAppVersion,
  resolveDevAppVersionOverride,
} from "../src/main/devAppVersion.js";

describe("resolveDevAppVersionOverride", () => {
  it("replaces the raw Linux Electron version 0.0 with the product version in dev", () => {
    expect(
      resolveDevAppVersionOverride({
        isPackaged: false,
        currentVersion: "0.0",
        productVersion: "3.16.1",
      }),
    ).toBe("3.16.1");
  });

  it("keeps a valid semver app version", () => {
    expect(
      resolveDevAppVersionOverride({
        isPackaged: false,
        currentVersion: "41.0.0",
        productVersion: "3.16.1",
      }),
    ).toBeNull();
  });

  it("never touches packaged builds", () => {
    expect(
      resolveDevAppVersionOverride({
        isPackaged: true,
        currentVersion: "0.0",
        productVersion: "3.16.1",
      }),
    ).toBeNull();
  });

  it("coerces non-strict product versions", () => {
    expect(
      resolveDevAppVersionOverride({
        isPackaged: false,
        currentVersion: "0.0",
        productVersion: "3.16",
      }),
    ).toBe("3.16.0");
  });
});

describe("ensureValidDevAppVersion", () => {
  it("calls app.setVersion with the override", () => {
    const setVersion = vi.fn();
    const result = ensureValidDevAppVersion(
      { isPackaged: false, getVersion: () => "0.0", setVersion },
      "3.16.1",
    );
    expect(result).toBe("3.16.1");
    expect(setVersion).toHaveBeenCalledWith("3.16.1");
  });

  it("is a no-op when the Electron app mock lacks version APIs", () => {
    expect(ensureValidDevAppVersion({ isPackaged: false }, "3.16.1")).toBeNull();
  });
});
