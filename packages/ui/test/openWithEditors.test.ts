import { describe, expect, it } from "vitest";
import type { EditorInfo } from "@zcode/shared";
import { isFileManagerOpenTarget, sortInstalledEditorsForOpenWith } from "@/lib/openWithEditors.js";

function makeEditor(id: string): EditorInfo {
  return {
    id,
    name: id,
    iconDataUrl: `data:image/png;base64,${id}`,
  };
}

describe("open-with editor ordering", () => {
  it("pins file managers before regular editors in a stable shared order", () => {
    const sortedEditors = sortInstalledEditorsForOpenWith([
      makeEditor("cursor"),
      makeEditor("qspace-pro"),
      makeEditor("vscode"),
      makeEditor("explorer"),
      makeEditor("qspace"),
      makeEditor("finder"),
    ]);

    expect(sortedEditors.map((editor) => editor.id)).toEqual([
      "finder",
      "qspace",
      "qspace-pro",
      "explorer",
      "cursor",
      "vscode",
    ]);
  });
});
