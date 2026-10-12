import assert from "node:assert/strict";
import { test } from "vitest";
import {
  COMPOSER_ENTER_PRESET_BINDINGS,
  DEFAULT_COMPOSER_ENTER_BEHAVIOR,
  getDefaultShortcutBindings,
} from "@zcode/shared";
import { resolveEffectiveShortcutBindings } from "../src/shortcuts/bindings.js";
import {
  resolveComposerKeyAction,
  shouldBareEnterFallThroughToNewline,
} from "../src/shortcuts/composerShortcuts.js";

// 固定平台为非 Apple，使 CmdOrCtrl 解析为 Ctrl，测试结果与运行机器无关。
const NON_APPLE = { platform: "Win32", userAgent: "Windows NT 10.0" };

const bareEnter = {
  key: "Enter",
  code: "Enter",
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
};
const shiftEnter = { ...bareEnter, shiftKey: true };
const ctrlEnter = { ...bareEnter, ctrlKey: true };

test("默认 Enter 模式为换行（newline）", () => {
  assert.equal(DEFAULT_COMPOSER_ENTER_BEHAVIOR, "newline");
  const effective = resolveEffectiveShortcutBindings(undefined);
  assert.deepEqual([...effective.composerSend], ["CmdOrCtrl+Enter"]);
  assert.deepEqual([...effective.composerInsertNewline], ["Enter", "Shift+Enter"]);
});

test("newline 模式：Enter 换行，Ctrl+Enter 发送", () => {
  const effective = resolveEffectiveShortcutBindings(undefined, "newline");
  assert.equal(resolveComposerKeyAction(bareEnter, effective, NON_APPLE), "newline");
  assert.equal(resolveComposerKeyAction(shiftEnter, effective, NON_APPLE), "newline");
  assert.equal(resolveComposerKeyAction(ctrlEnter, effective, NON_APPLE), "send");
  assert.equal(shouldBareEnterFallThroughToNewline(effective), true);
});

test("send 模式：Enter 发送，Shift+Enter 换行（与改动前一致）", () => {
  const effective = resolveEffectiveShortcutBindings(undefined, "send");
  assert.deepEqual([...effective.composerSend], ["Enter"]);
  assert.deepEqual([...effective.composerInsertNewline], ["Shift+Enter"]);
  assert.equal(resolveComposerKeyAction(bareEnter, effective, NON_APPLE), "send");
  assert.equal(resolveComposerKeyAction(shiftEnter, effective, NON_APPLE), "newline");
  assert.equal(shouldBareEnterFallThroughToNewline(effective), false);
});

test("用户覆盖优先于模式默认", () => {
  const overrides = { composerSend: ["F9"] };
  const newline = resolveEffectiveShortcutBindings(overrides, "newline");
  assert.deepEqual([...newline.composerSend], ["F9"]);
  // 未覆盖的 composerInsertNewline 仍按模式默认
  assert.deepEqual([...newline.composerInsertNewline], ["Enter", "Shift+Enter"]);
  // 覆盖的命令不受模式切换影响
  const send = resolveEffectiveShortcutBindings(overrides, "send");
  assert.deepEqual([...send.composerSend], ["F9"]);
});

test("getDefaultShortcutBindings 随模式返回对应默认，非 composer 命令不变", () => {
  assert.deepEqual([...getDefaultShortcutBindings("composerSend", "send")], ["Enter"]);
  assert.deepEqual([...getDefaultShortcutBindings("composerSend")], ["CmdOrCtrl+Enter"]);
  assert.deepEqual(
    [...getDefaultShortcutBindings("newTask", "send")],
    [...getDefaultShortcutBindings("newTask", "newline")],
  );
});

test("两种模式的预设互不重叠（同一键不会同时绑定发送与换行）", () => {
  for (const mode of ["newline", "send"] as const) {
    const preset = COMPOSER_ENTER_PRESET_BINDINGS[mode];
    const send = new Set(preset.composerSend ?? []);
    for (const binding of preset.composerInsertNewline ?? []) {
      assert.equal(send.has(binding), false, `${mode} 模式下 ${binding} 同时用于发送与换行`);
    }
  }
});
