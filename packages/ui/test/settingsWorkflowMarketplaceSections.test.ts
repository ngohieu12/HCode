import assert from "node:assert/strict";
import test from "node:test";
import {
  registerWorkspaceWorkflowActions,
  getWorkspaceWorkflowActions,
} from "../src/settings/saved-workflows/workspaceWorkflowActionsBridge.js";
import { createSettingsPageConfig, SETTINGS_SECTIONS } from "../src/settings/settingsPageConfig.js";
import { resolveSettingsSection } from "../src/lib/settingsNavigation.js";

test("工作流分区受动态工作流灰度控制，关闭时不出现在设置页", () => {
  const off = createSettingsPageConfig({ isDesktop: true });
  assert.equal(
    off.settingsSections.some((section) => section.id === "workflow"),
    false,
  );
  const on = createSettingsPageConfig({ isDesktop: true, showWorkflow: true });
  assert.equal(
    on.settingsSections.some((section) => section.id === "workflow"),
    true,
  );
  assert.equal(
    SETTINGS_SECTIONS.some((section) => section.id === "workflow"),
    false,
  );
});

test("插件市场分区常驻设置页，并与插件分区同属能力分组", () => {
  const { settingsSections } = createSettingsPageConfig();
  const store = settingsSections.find((section) => section.id === "pluginStore");
  assert.ok(store);
  assert.equal(store.groupId, "agentCapabilities");
  assert.ok(settingsSections.some((section) => section.id === "plugin"));
});

test("深链到工作流/插件市场分区时保留目标分区，不回退到 general", () => {
  assert.equal(resolveSettingsSection("pluginStore"), "pluginStore");
  assert.equal(resolveSettingsSection("workflow"), "workflow");
});

test("工作区动作桥：注册后可读取，卸载只清理自己注册的实现", () => {
  const first = { onCreateViaChat: () => {} };
  const second = { onCreateViaChat: () => {} };
  assert.equal(getWorkspaceWorkflowActions(), null);

  const unregisterFirst = registerWorkspaceWorkflowActions(first);
  assert.equal(getWorkspaceWorkflowActions(), first);

  const unregisterSecond = registerWorkspaceWorkflowActions(second);
  assert.equal(getWorkspaceWorkflowActions(), second);

  // 旧 shell 晚于新 shell 卸载时，不能把新注册的实现清掉。
  unregisterFirst();
  assert.equal(getWorkspaceWorkflowActions(), second);

  unregisterSecond();
  assert.equal(getWorkspaceWorkflowActions(), null);
});
