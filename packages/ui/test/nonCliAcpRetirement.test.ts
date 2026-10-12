import assert from "node:assert/strict";
import { test } from "vitest";
import {
  appSettingsSchema,
  appSettingsPatchSchema,
} from "../../shared/src/validationAppSettings.js";
import { zcodeTaskMetaSchema } from "../../shared/src/validation.js";
import { readAskUserQuestionAnswers } from "../src/lib/askUserQuestion.js";
import {
  getAgentPrimaryText,
  getAgentKindLabel,
} from "../src/ToolCallBlocks/renderers/agentHelpers.js";
import { getToolCallErrorText } from "../src/lib/toolError.js";
import { resolveToolCallIdentity } from "../src/lib/toolIdentity.js";
import { extractStructuredDiff } from "../src/lib/toolDiffPreview.js";

const meta = {
  taskId: "session-example",
  traceId: "trace-example",
  title: "Example",
  workspacePath: "/example/workspace",
  createdAt: 1,
  updatedAt: 2,
  mode: "build",
  provider: "glm",
};

test("current task metadata is accepted and legacy third-party Agent identities normalize to ZCode Agent", () => {
  assert.equal(zcodeTaskMetaSchema.parse(meta).provider, "glm");
  for (const provider of ["claude", "codex", "gemini", "opencode"]) {
    assert.equal(zcodeTaskMetaSchema.parse({ ...meta, provider }).provider, "glm", provider);
  }
});

test("obsolete Agent settings normalize to ZCode Agent without dropping current user preferences", () => {
  const settings = {
    enabledBuiltinAgentCliProviders: ["claude", "codex"],
    localePreference: "en-US",
  };
  for (const schema of [appSettingsSchema, appSettingsPatchSchema]) {
    const parsed = schema.parse(settings);
    assert.equal(parsed.localePreference, "en-US");
    assert.deepEqual(parsed.enabledBuiltinAgentCliProviders, ["glm"]);
  }
});

test("current question results work while Claude ACP text is no longer interpreted as answers", () => {
  const input = { question: "Choose", options: [{ label: "One" }, { label: "Two" }] };
  assert.deepEqual(
    readAskUserQuestionAnswers({ input, output: { type: "answered", selected: "One" } }),
    { Choose: "One" },
  );
  assert.deepEqual(
    readAskUserQuestionAnswers({ input, output: { type: "answered_custom", text: "Custom" } }),
    { Choose: "Custom" },
  );
  assert.deepEqual(readAskUserQuestionAnswers({ output: { answers: { Choose: "Two" } } }), {
    Choose: "Two",
  });
  // Claude 历史里的 AskUserQuestion 文本输出 `"问题"="答案"` 仍按答案解析（见 askUserQuestion.ts）。
  for (const output of ['"Choose"="One"', { content: [{ text: '"Choose"="One"' }] }]) {
    assert.deepEqual(readAskUserQuestionAnswers({ input, output }), { Choose: "One" });
    assert.deepEqual(readAskUserQuestionAnswers({ input, raw: { output } }), { Choose: "One" });
    assert.deepEqual(readAskUserQuestionAnswers({ input, raw: { rawOutput: output } }), {
      Choose: "One",
    });
  }
});

test("Codex subagent nickname in raw takes precedence over agent input identity", () => {
  const tool = {
    id: "tool-example",
    kind: "Agent",
    title: "Agent",
    status: "completed" as const,
    input: { subagent_type: "researcher", description: "Inspect sources" },
    raw: { nickname: "retired nickname" },
  };
  assert.equal(getAgentPrimaryText(tool, "Agent"), "retired nickname");
  assert.equal(getAgentKindLabel(tool, "Agent"), "retired nickname");
  assert.equal(resolveToolCallIdentity({ toolName: "Task" }).family, "agent");
  assert.equal(resolveToolCallIdentity({ kind: "spawn_agent" }).family, "agent");
});

test("current tool errors remain available without Claude ACP status overrides", () => {
  assert.equal(
    getToolCallErrorText({ status: "failed", error: "Permission denied" }),
    "Permission denied",
  );
  assert.equal(
    getToolCallErrorText({
      status: "failed",
      output: "<tool_use_error>Invalid input</tool_use_error>",
    }),
    "Invalid input",
  );
  assert.equal(
    getToolCallErrorText({
      status: "completed",
      raw: { status: "failed", rawOutput: "legacy error" },
    }),
    "legacy error",
  );
});

test("generic structured diffs still accept current tool content", () => {
  const diff = { type: "diff", path: "/example/file.ts", oldText: "before", newText: "after" };
  assert.deepEqual(extractStructuredDiff({ content: [diff] }), {
    path: diff.path,
    oldText: diff.oldText,
    newText: diff.newText,
  });
});
