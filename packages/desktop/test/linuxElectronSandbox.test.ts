import { describe, expect, it } from "vitest";
import {
  formatLinuxSandboxWarning,
  resolveLinuxElectronSandboxArgs,
} from "../scripts/linuxElectronSandbox.mjs";

const electronBinary = "/repo/node_modules/electron/dist/electron";

function procFiles(values: Record<string, string>) {
  return (path: string) => {
    if (path in values) return values[path];
    throw new Error(`ENOENT ${path}`);
  };
}

const restrictedUserns = procFiles({
  "/proc/sys/kernel/apparmor_restrict_unprivileged_userns": "1\n",
});
const unrestrictedUserns = procFiles({
  "/proc/sys/kernel/apparmor_restrict_unprivileged_userns": "0\n",
});
const userOwnedHelper = () => ({ uid: 1000, mode: 0o100755 });
const rootSetuidHelper = () => ({ uid: 0, mode: 0o104755 });

describe("resolveLinuxElectronSandboxArgs", () => {
  it("adds --no-sandbox when userns is restricted and chrome-sandbox is not root 4755", () => {
    const result = resolveLinuxElectronSandboxArgs({
      platform: "linux",
      electronBinary,
      env: {},
      stat: userOwnedHelper,
      readFile: restrictedUserns,
    });
    expect(result.args).toEqual(["--no-sandbox"]);
    expect(result.helperPath).toBe("/repo/node_modules/electron/dist/chrome-sandbox");
    expect(formatLinuxSandboxWarning(result)).toContain("sudo chmod 4755");
  });

  it("keeps the sandbox when the SUID helper is configured", () => {
    const result = resolveLinuxElectronSandboxArgs({
      platform: "linux",
      electronBinary,
      env: {},
      stat: rootSetuidHelper,
      readFile: restrictedUserns,
    });
    expect(result.args).toEqual([]);
  });

  it("keeps the sandbox when unprivileged user namespaces are available", () => {
    const result = resolveLinuxElectronSandboxArgs({
      platform: "linux",
      electronBinary,
      env: {},
      stat: userOwnedHelper,
      readFile: unrestrictedUserns,
    });
    expect(result.args).toEqual([]);
  });

  it("honors ZCODE_ELECTRON_NO_SANDBOX overrides", () => {
    expect(
      resolveLinuxElectronSandboxArgs({
        platform: "linux",
        electronBinary,
        env: { ZCODE_ELECTRON_NO_SANDBOX: "0" },
        stat: userOwnedHelper,
        readFile: restrictedUserns,
      }).args,
    ).toEqual([]);
    expect(
      resolveLinuxElectronSandboxArgs({
        platform: "linux",
        electronBinary,
        env: { ZCODE_ELECTRON_NO_SANDBOX: "1" },
        stat: rootSetuidHelper,
        readFile: unrestrictedUserns,
      }).args,
    ).toEqual(["--no-sandbox"]);
  });

  it("does nothing outside Linux", () => {
    expect(
      resolveLinuxElectronSandboxArgs({
        platform: "darwin",
        electronBinary,
        env: { ZCODE_ELECTRON_NO_SANDBOX: "1" },
        stat: userOwnedHelper,
        readFile: restrictedUserns,
      }).args,
    ).toEqual([]);
  });
});
