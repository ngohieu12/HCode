import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installFinderOpenFolderWorkflow } from "../src/main/desktopFinderOpenFolderWorkflow.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("desktopFinderOpenFolderWorkflow", () => {

  it("非 macOS 不安装 Finder 服务", () => {
    const homeDir = createTempHome();
    const refreshServicesIndex = vi.fn();

    installFinderOpenFolderWorkflow({
      platform: "linux",
      locale: "en-US",
      homeDir,
      logger: { info: vi.fn(), warn: vi.fn() },
      refreshServicesIndex,
    });

    expect(refreshServicesIndex).not.toHaveBeenCalled();
  });
});

function createTempHome(): string {
  const dir = mkdtempSync(join(tmpdir(), "zcode-finder-workflow-"));
  tempDirs.push(dir);
  return dir;
}

function readInfoPlist(homeDir: string): string {
  return readFileSync(
    join(homeDir, "Library", "Services", "Open in HCode.workflow", "Contents", "Info.plist"),
    "utf8",
  );
}
