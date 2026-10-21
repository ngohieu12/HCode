// 中枢发往对话的三段文案（docs/dynamic-workflow/launch.md「Create and revise in chat」）。
import { describe, expect, it } from "vitest";
import {
  buildSavedWorkflowCreatePrompt,
  buildSavedWorkflowPromotePrompt,
  buildSavedWorkflowRevisePrompt,
} from "@/settings/saved-workflows/savedWorkflowLaunchPrompt.js";

describe("revise / create prompts", () => {
  it("revise prompt carries name and path and ends with a colon", () => {
    expect(
      buildSavedWorkflowRevisePrompt({
        name: "x",
        path: "/repo/.hcode/workflows/x.dwf.ts",
        locale: "vi-VN",
      }),
    ).toBe('Please revise the saved workflow "x" (/repo/.hcode/workflows/x.dwf.ts): ');
  });

  it("global revise adds keep scope: global; project does not", () => {
    const globalPrompt = buildSavedWorkflowRevisePrompt({
      name: "x",
      path: "/p",
      locale: "vi-VN",
      scope: "global",
    });
    expect(globalPrompt).toContain('keep scope: "global" when saving');
    expect(
      buildSavedWorkflowRevisePrompt({ name: "x", path: "/p", locale: "vi-VN", scope: "project" }),
    ).toBe(buildSavedWorkflowRevisePrompt({ name: "x", path: "/p", locale: "vi-VN" }));
  });

  it("create prompt targets the project", () => {
    expect(buildSavedWorkflowCreatePrompt("vi-VN")).toContain("save it to this project");
    expect(buildSavedWorkflowCreatePrompt("en-US")).toBe(buildSavedWorkflowCreatePrompt("vi-VN"));
  });

  it("global create prompt saves as a global workflow; project default unchanged", () => {
    expect(buildSavedWorkflowCreatePrompt("vi-VN", "global")).toContain(
      'save it as a global workflow (scope: "global")',
    );
    expect(buildSavedWorkflowCreatePrompt("vi-VN", "project")).toBe(
      buildSavedWorkflowCreatePrompt("vi-VN"),
    );
  });
});

// 「提升为全局」（docs/dynamic-workflow/launch.md「Promote to global」）：自动发送的完整指令。
describe("promote prompt", () => {
  const input = {
    name: "release-check",
    path: "/repo/.hcode/workflows/release-check.dwf.ts",
    locale: "vi-VN",
  };

  it("carries name and path, requires scope global, allows rename, keeps original file, allows refusal", () => {
    const prompt = buildSavedWorkflowPromotePrompt(input);
    expect(prompt).toContain('"release-check" (/repo/.hcode/workflows/release-check.dwf.ts)');
    expect(prompt).toContain('scope: "global"');
    expect(prompt).toContain("`args`");
    expect(prompt).toContain("Keep the name or pick a better one");
    expect(prompt).toContain("Do not modify the original project workflow file");
    expect(prompt).toContain("stop without saving");
    // 不内嵌脚本：模型自己读文件。
    expect(prompt).not.toContain("export default");
  });
});
