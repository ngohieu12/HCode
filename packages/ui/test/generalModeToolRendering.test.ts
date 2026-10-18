import { createElement } from "react";
import zhCNLegacy from "./fixtures/zhCNLegacy.js";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZCodeIntlProvider } from "@/i18n/IntlProvider.js";
import { ExecuteToolCallBlock } from "@/ToolCallBlocks/renderers/execute.js";
import { ExecuteGroupToolCallBlock } from "@/ToolCallBlocks/renderers/execute-group.js";
import { EditToolCallBlock } from "@/ToolCallBlocks/renderers/edit.js";
import type { ToolCallBlockRenderContext } from "@/ToolCallBlocks/fileSummaryTypes.js";

function context(general: boolean, failed = false): ToolCallBlockRenderContext {
  return {
    isOfficeMode: general,
    toolCallNode: {
      toolCall: {
        toolId: "mode-execute",
        kind: "execute",
        title: "MODE_PRIVATE_COMMAND",
        input: { command: "echo MODE_PRIVATE_COMMAND" },
        output: { stdout: "MODE_PRIVATE_OUTPUT", exitCode: failed ? 1 : 0 },
        status: failed ? "failed" : "completed",
      },
      childToolCalls: [],
    },
    workspacePath: "/workspace",
    displayModel: {
      inlinePreview: { type: "none" },
      planResult: null,
      viewerSource: null,
      viewerLabelId: "codeViewer.viewCode",
      showSummaryFileLink: true,
      showInput: false,
      showOutput: true,
      showKind: false,
    },
    viewerSource: null,
    rawFileSummaries: [],
    isRunning: false,
    statusLabel: failed ? "失败" : "已完成",
    errorText: failed ? "MODE_PRIVATE_ERROR" : undefined,
    childToolList: null,
    forceOpen: true,
    canToggle: true,
  };
}

function renderTool(component: typeof ExecuteToolCallBlock, props: ToolCallBlockRenderContext) {
  return renderToStaticMarkup(
    createElement(ZCodeIntlProvider, { initialLocale: "vi-VN", messages: zhCNLegacy }, createElement(component, props)),
  );
}

describe("通用模式工具展示", () => {

  it("编辑保留文件入口但不渲染 Diff 正文", () => {
    const props = context(true);
    props.toolCallNode.toolCall.kind = "edit";
    props.rawFileSummaries = [
      {
        path: "/workspace/demo.py",
        filePath: "/workspace/",
        fileName: "demo.py",
        fileIconSrc: "/python.svg",
        actionLabel: "Edited",
        operationKind: "update",
        changeStat: { added: 1, removed: 1 },
        patch: "--- a/demo.py\n+++ b/demo.py\n@@ -1 +1 @@\n-old_value\n+MODE_NEW_VALUE",
      },
    ];
    props.onOpenCodeViewer = () => {};
    const html = renderTool(EditToolCallBlock, props);
    expect(html).toContain("demo.py");
    expect(html).not.toContain("MODE_NEW_VALUE");
    expect(html).not.toContain('aria-expanded="true"');
    expect(props.rawFileSummaries[0]?.patch).toContain("MODE_NEW_VALUE");
  });
});
