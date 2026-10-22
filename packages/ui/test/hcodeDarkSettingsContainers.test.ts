import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

describe("HCode 深色主题设置页容器保留灰底", () => {
  it("定义只作用于 theme-zai-dark 的 hcode-dark variant", () => {
    expect(read("styles.css")).toContain(
      "@custom-variant hcode-dark (&:where(.theme-zai-dark, .theme-zai-dark *));",
    );
  });

  it.each([
    "settings/ShortcutSettingsSection.tsx",
    "settings/CommandForm.tsx",
    "settings/HookForm.tsx",
    "settings/McpServerForm.tsx",
    "settings/SubagentsSection.tsx",
    "settings/AutomationsSection.tsx",
    "settings/AutomationTemplateSkeletonGrid.tsx",
    "settings/MigrationCandidatesCard.tsx",
    "settings/saved-workflows/SavedWorkflowArgsTable.tsx",
    "settings/saved-workflows/SavedWorkflowRunHistoryPanel.tsx",
    "settings/saved-workflows/SavedWorkflowCard.tsx",
    "settings/saved-workflows/SavedWorkflowsSection.tsx",
  ])("%s 的带边框容器在纯黑背景上有灰底", (path) => {
    expect(read(path)).toContain("hcode-dark:bg-surface");
  });
});
