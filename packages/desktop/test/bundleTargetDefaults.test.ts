import { describe, expect, it, vi } from "vitest";

vi.mock("../../../scripts/intranetDefaults.mjs", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
}));

const bundle = await import("../scripts/bundle.mjs");
const linuxTargets = await import("../scripts/linux-bundle-targets.mjs");

describe("bundle default target", () => {
  it("defaults to the host OS instead of always macOS", () => {
    expect(bundle.resolveDefaultTargetOs("linux")).toBe("linux");
    expect(bundle.resolveDefaultTargetOs("win32")).toBe("win");
    expect(bundle.resolveDefaultTargetOs("darwin")).toBe("mac");
  });

  it("defaults to the host CPU architecture", () => {
    expect(bundle.resolveDefaultTargetArch("x64")).toBe("x64");
    expect(bundle.resolveDefaultTargetArch("arm64")).toBe("arm64");
  });

  it("rejects macOS packaging on non-macOS hosts with an actionable message", () => {
    expect(() => bundle.assertTargetOsSupportedOnHost("mac", "linux")).toThrow(
      /pnpm bundle:desktop -- linux/,
    );
    expect(() => bundle.assertTargetOsSupportedOnHost("mac", "darwin")).not.toThrow();
    expect(() => bundle.assertTargetOsSupportedOnHost("linux", "linux")).not.toThrow();
  });
});

describe("linux bundle targets", () => {
  it("keeps the four default targets when unset", () => {
    expect(linuxTargets.resolveLinuxTargets(undefined)).toEqual([
      "AppImage",
      "deb",
      "rpm",
      "pacman",
    ]);
  });

  it("parses ZCODE_LINUX_TARGETS case-insensitively and rejects unknown entries", () => {
    expect(linuxTargets.resolveLinuxTargets("appimage, DEB,deb")).toEqual(["AppImage", "deb"]);
    expect(() => linuxTargets.resolveLinuxTargets("snap")).toThrow(/snap/);
  });

  it("skips rpm when rpmbuild is missing on the host", () => {
    const plan = linuxTargets.resolveHostLinuxTargetPlan({
      env: {},
      hasCommand: () => false,
    });
    expect(plan.targets).toEqual(["AppImage", "deb", "pacman"]);
    expect(plan.skipped.map((entry: { target: string }) => entry.target)).toEqual(["rpm"]);
  });

  it("respects an explicit ZCODE_LINUX_TARGETS", () => {
    const plan = linuxTargets.resolveHostLinuxTargetPlan({
      env: { ZCODE_LINUX_TARGETS: "rpm" },
      hasCommand: () => false,
    });
    expect(plan).toEqual({ targets: ["rpm"], skipped: [] });
  });
});
