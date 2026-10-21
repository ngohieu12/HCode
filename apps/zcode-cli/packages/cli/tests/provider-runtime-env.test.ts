import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV,
  ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV,
} from "@zcode/provider-node";
import { prepareCliProviderRuntimeEnv } from "../src/provider-runtime-env.js";

const temporaryDirectories: string[] = [];

test.afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

test("preserves explicitly injected provider runtime paths", async () => {
  const prepared = await prepareCliProviderRuntimeEnv({
    argv: ["--prompt", "hello"],
    env: {
      [ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: "/injected/zcode-builtin.json",
      [ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: "/injected/personal.json",
    },
  });

  assert.deepEqual(prepared, {
    [ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV]: "/injected/zcode-builtin.json",
    [ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV]: "/injected/personal.json",
  });
});

test("resolves the bundled ZCode Built-in Config and the shared Personal Config", async () => {
  const root = await temporaryDirectory();
  const entrypoint = join(root, "apps/zcode-cli/packages/cli/src/main.ts");
  const zcodeBuiltinFilePath = join(root, "config/provider/zcode-builtin.json");
  await mkdir(dirname(entrypoint), { recursive: true });
  await mkdir(dirname(zcodeBuiltinFilePath), { recursive: true });
  // 随包配置按入口真实路径（解析软链接后）定位，入口文件必须真实存在。
  await writeFile(entrypoint, "");
  await writeFile(zcodeBuiltinFilePath, "{}");

  const prepared = await prepareCliProviderRuntimeEnv({
    argv: ["app-server"],
    dataBaseDir: join(root, "home"),
    entrypoint,
    env: {},
  });

  // 临时目录本身可能经过软链接（macOS 的 /tmp、/var），随包配置报告的是真实路径。
  assert.equal(
    prepared[ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV],
    await realpath(zcodeBuiltinFilePath),
  );
  assert.equal(
    prepared[ZCODE_PERSONAL_PROVIDER_CONFIG_FILE_ENV],
    join(root, "home/.hcode/v2/provider_config.json"),
  );

  for (const argv of [["login"], ["logout"]]) {
    const next = await prepareCliProviderRuntimeEnv({
      argv,
      dataBaseDir: join(root, "home"),
      entrypoint,
      env: {},
    });
    assert.equal(
      next[ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV],
      prepared[ZCODE_BUILTIN_PROVIDER_CONFIG_FILE_ENV],
    );
  }
});

test("does not resolve provider assets for commands that do not run Core", async () => {
  assert.deepEqual(
    await prepareCliProviderRuntimeEnv({
      argv: ["doctor", "--json"],
      env: {},
    }),
    {},
  );
  for (const flag of ["--help", "-h", "--version", "-v"]) {
    assert.deepEqual(
      await prepareCliProviderRuntimeEnv({
        argv: [flag],
        env: {},
      }),
      {},
    );
  }
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "zcode-cli-provider-runtime-"));
  temporaryDirectories.push(directory);
  return directory;
}
