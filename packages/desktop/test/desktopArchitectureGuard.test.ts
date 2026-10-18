import { describe, expect, it } from "vitest";
import {
  detectArchitectureMismatch,
  formatArchitectureMismatchDialogText,
  resolveArchitectureDownloadUrl,
} from "../src/main/desktopArchitectureGuard.js";

describe("detectArchitectureMismatch", () => {
  it("Apple 芯片上运行 x64 包（Rosetta 转译）应判定为不匹配", () => {
    expect(
      detectArchitectureMismatch({
        platform: "darwin",
        binaryArch: "x64",
        runningUnderARM64Translation: true,
      }),
    ).toEqual({ binaryArch: "x64", nativeArch: "arm64" });
  });

  it("Windows on ARM 上转译运行也应判定为不匹配", () => {
    expect(
      detectArchitectureMismatch({
        platform: "win32",
        binaryArch: "x64",
        runningUnderARM64Translation: true,
      }),
    ).toEqual({ binaryArch: "x64", nativeArch: "arm64" });
  });

  it("原生运行（未转译）应返回 null", () => {
    expect(
      detectArchitectureMismatch({
        platform: "darwin",
        binaryArch: "arm64",
        runningUnderARM64Translation: false,
      }),
    ).toBeNull();
  });

  it("非 macOS/Windows 平台即使报告转译也不误报", () => {
    expect(
      detectArchitectureMismatch({
        platform: "linux",
        binaryArch: "x64",
        runningUnderARM64Translation: true,
      }),
    ).toBeNull();
  });
});

describe("resolveArchitectureDownloadUrl", () => {
  it("统一指向官网英文下载页", () => {
    expect(resolveArchitectureDownloadUrl("en-US")).toBe("https://zcode.z.ai/en");
    expect(resolveArchitectureDownloadUrl("vi-VN")).toBe("https://zcode.z.ai/en");
  });
});

describe("formatArchitectureMismatchDialogText", () => {
  const mismatch = { binaryArch: "x64", nativeArch: "arm64" } as const;

  it("越南语文案包含运行架构与推荐架构", () => {
    const text = formatArchitectureMismatchDialogText(mismatch, "vi-VN");
    expect(text.title).toBe("Architecture Mismatch");
    expect(text.detail).toContain("x64");
    expect(text.detail).toContain("arm64");
    expect(text.downloadButton).toBe("Download");
  });

  it("英文文案包含运行架构与推荐架构", () => {
    const text = formatArchitectureMismatchDialogText(mismatch, "en-US");
    expect(text.title).toBe("Architecture Mismatch");
    expect(text.detail).toContain("x64");
    expect(text.detail).toContain("arm64");
    expect(text.downloadButton).toBe("Download");
  });
});
