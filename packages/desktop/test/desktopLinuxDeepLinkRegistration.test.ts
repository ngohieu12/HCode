import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

type CommandCall = { command: string; args: string[] };

function readPngSize(path: string): { width: number; height: number } {
  const png = readFileSync(path);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe("desktop Linux deep link registration helpers", () => {
  it("prefers the AppImage path for protocol desktop entry Exec", async () => {
    const { createLinuxDeepLinkDesktopEntry, resolveLinuxDeepLinkCommand } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    const command = resolveLinuxDeepLinkCommand({
      env: { APPIMAGE: "/home/alice/Downloads/HCode-2.8.0-linux-x64.AppImage" },
      executablePath: "/tmp/.mount_ZCode/hcode",
    });
    const entry = createLinuxDeepLinkDesktopEntry(command);

    expect(command.executablePath).toBe("/home/alice/Downloads/HCode-2.8.0-linux-x64.AppImage");
    expect(entry).toContain('Exec="/home/alice/Downloads/HCode-2.8.0-linux-x64.AppImage" %U');
    expect(entry).toContain("MimeType=x-scheme-handler/zcode;");
  });

  it("keeps AppImage sandbox and GPU launch switches for protocol callbacks", async () => {
    const { createLinuxDeepLinkDesktopEntry, resolveLinuxDeepLinkCommand } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    const command = resolveLinuxDeepLinkCommand({
      env: { APPIMAGE: "/home/alice/Applications/HCode.AppImage" },
      executablePath: "/tmp/.mount_ZCode/hcode",
      argv: [
        "/tmp/.mount_ZCode/hcode",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--use-gl=swiftshader",
        "--remote-debugging-port=9229",
        "zcode://oauth/callback?code=1&state=s",
        "/home/alice/project",
      ],
    });
    const entry = createLinuxDeepLinkDesktopEntry(command);

    expect(command.args).toEqual([
      "--no-sandbox",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--use-gl=swiftshader",
    ]);
    expect(entry).toContain(
      'Exec="/home/alice/Applications/HCode.AppImage" "--no-sandbox" "--disable-gpu" "--disable-software-rasterizer" "--use-gl=swiftshader" %U',
    );
    expect(entry).not.toContain("remote-debugging-port");
    expect(entry).not.toContain("oauth/callback");
    expect(entry).not.toContain("/home/alice/project");
  });

  it("does not persist launch switches for non-AppImage Linux installs", async () => {
    const { createLinuxDeepLinkDesktopEntry, resolveLinuxDeepLinkCommand } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    const command = resolveLinuxDeepLinkCommand({
      env: {},
      executablePath: "/opt/HCode/hcode",
      argv: ["/opt/HCode/hcode", "--no-sandbox", "--disable-gpu"],
    });
    const entry = createLinuxDeepLinkDesktopEntry(command);

    expect(command).toEqual({ executablePath: "/opt/HCode/hcode", args: [] });
    expect(entry).toContain('Exec="/opt/HCode/hcode" %U');
  });

  it("escapes desktop Exec paths before writing user-level handlers", async () => {
    const { createLinuxDeepLinkDesktopEntry } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    const entry = createLinuxDeepLinkDesktopEntry({
      executablePath: '/home/alice/Downloads/HCode "Nightly".AppImage',
    });

    expect(entry).toContain('Exec="/home/alice/Downloads/HCode \\"Nightly\\".AppImage" %U');
  });

  it("writes the Preview product name into the shared Linux protocol handler", async () => {
    const { createLinuxDeepLinkDesktopEntry } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    const entry = createLinuxDeepLinkDesktopEntry({
      executablePath: "/opt/HCode Preview/hcode-preview",
      productName: "HCode Preview",
    });

    expect(entry).toContain("Name=HCode Preview");
    expect(entry).toContain("StartupWMClass=HCode Preview");
    expect(entry).toContain('Exec="/opt/HCode Preview/hcode-preview" %U');
    expect(entry).toContain("MimeType=x-scheme-handler/zcode;");
  });

  it("escapes AppImage callback switches before writing desktop Exec", async () => {
    const { createLinuxDeepLinkDesktopEntry } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    const entry = createLinuxDeepLinkDesktopEntry({
      executablePath: "/home/alice/Downloads/HCode.AppImage",
      args: ['--disable-features=UseOzonePlatform,"Quoted"'],
    });

    expect(entry).toContain(
      'Exec="/home/alice/Downloads/HCode.AppImage" "--disable-features=UseOzonePlatform,\\"Quoted\\"" %U',
    );
  });

  it("uses XDG_DATA_HOME for user-level desktop entries and icons", async () => {
    const { resolveLinuxUserDataDir } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    expect(
      resolveLinuxUserDataDir({
        env: { XDG_DATA_HOME: "/tmp/xdg-data" },
        homeDir: "/home/alice",
      }),
    ).toBe("/tmp/xdg-data");
    expect(resolveLinuxUserDataDir({ env: { XDG_DATA_HOME: " " }, homeDir: "/home/alice" })).toBe(
      join("/home/alice", ".local", "share"),
    );
  });

  it("resolves system application dirs from XDG_DATA_DIRS with spec defaults", async () => {
    const { resolveLinuxSystemApplicationDirs } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");

    expect(
      resolveLinuxSystemApplicationDirs({
        XDG_DATA_DIRS: " /opt/custom/share :/usr/share: ",
      }),
    ).toEqual([join("/opt/custom/share", "applications"), join("/usr/share", "applications")]);
    expect(resolveLinuxSystemApplicationDirs({ XDG_DATA_DIRS: "::" })).toEqual([
      join("/usr/local/share", "applications"),
      join("/usr/share", "applications"),
    ]);
    expect(resolveLinuxSystemApplicationDirs()).toEqual([
      join("/usr/local/share", "applications"),
      join("/usr/share", "applications"),
    ]);
  });

  it("still writes the user-level entry when no system-level entry exists", async () => {
    const { registerLinuxDeepLinkProtocol } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");
    const tempRoot = mkdtempSync(join(tmpdir(), "hcode-linux-no-system-"));
    const homeDir = join(tempRoot, "home");
    const desktopFilePath = join(homeDir, ".local", "share", "applications", "hcode.desktop");

    try {
      registerLinuxDeepLinkProtocol({
        executablePath: "/opt/HCode/hcode",
        homeDir,
        env: {},
        systemApplicationDirs: [join(tempRoot, "empty-system-applications")],
        logger: { info: () => undefined, warn: () => undefined },
        runCommand: () => ({ status: 0, stderr: "" }),
      });

      expect(existsSync(desktopFilePath)).toBe(true);
      expect(readFileSync(desktopFilePath, "utf8")).toContain('Exec="/opt/HCode/hcode" %U');
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("ignores non-regular system-level paths when probing for shadow entries", async () => {
    const { registerLinuxDeepLinkProtocol } =
      await import("../src/main/desktopLinuxDeepLinkRegistration.js");
    const tempRoot = mkdtempSync(join(tmpdir(), "hcode-linux-dir-system-"));
    const homeDir = join(tempRoot, "home");
    // 系统目录下的 hcode.desktop 是一个目录而非普通文件，不得视为有效系统条目。
    const systemApplicationsDir = join(tempRoot, "system", "applications");
    const desktopFilePath = join(homeDir, ".local", "share", "applications", "hcode.desktop");

    try {
      mkdirSync(join(systemApplicationsDir, "hcode.desktop"), { recursive: true });
      registerLinuxDeepLinkProtocol({
        executablePath: "/opt/HCode/hcode",
        homeDir,
        env: {},
        systemApplicationDirs: [systemApplicationsDir],
        logger: { info: () => undefined, warn: () => undefined },
        runCommand: () => ({ status: 0, stderr: "" }),
      });

      // 病态路径不抑制用户级注册。
      expect(existsSync(desktopFilePath)).toBe(true);
    } finally {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

});
