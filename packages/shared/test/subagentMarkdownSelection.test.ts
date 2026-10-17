import { describe, expect, it } from "vitest";
import {
  parseSubagentMarkdownSelection,
  formatSubagentMarkdownModel,
} from "../src/subagent-markdown-selection.js";

describe("Subagent 正式 Markdown 字段", () => {
  it("只读取 model/thoughtLevel，不读取未发布中间字段或结构化 model", () => {
    expect(
      parseSubagentMarkdownSelection({ modelSelection: { providerId: "p", modelId: "m" } }),
    ).toBeUndefined();
    expect(
      parseSubagentMarkdownSelection({ model: { providerId: "p", modelId: "m" } }),
    ).toBeUndefined();
    expect(
      parseSubagentMarkdownSelection({
        model: "p/m",
        thoughtLevel: "high",
        modelSelection: { providerId: "wrong", modelId: "wrong" },
      }),
    ).toEqual({ providerId: "p", modelId: "m", options: { reasoningLevel: "high" } });
  });
  it.each(["plain", "vendor/model", "model$variant", "模型:% /x"])(
    "模型 ID 无损往返 %s",
    (modelId) => {
      const selection = {
        providerId: "my-provider",
        modelId,
        options: { reasoningLevel: "high" },
      };
      expect(
        parseSubagentMarkdownSelection({
          model: formatSubagentMarkdownModel(selection),
          thoughtLevel: "high",
        }),
      ).toEqual(selection);
    },
  );
  it("普通读取不做任何身份迁移，读到什么就是什么", () => {
    // 内置供应商已下线，不再把历史 builtin:* 改写成别的身份：改写只会把用户的明确
    // 选择换成一个不存在的 provider，重选必须留给用户。
    expect(parseSubagentMarkdownSelection({ model: "my-provider/GLM" })?.providerId).toBe(
      "my-provider",
    );
    expect(parseSubagentMarkdownSelection({ model: "builtin:legacy/GLM" })?.providerId).toBe(
      "builtin:legacy",
    );
  });
  it.each(["custom:my-provider", "vendor/provider"])("Provider ID 无损往返 %s", (providerId) => {
    const selection = { providerId, modelId: "model" };
    expect(
      parseSubagentMarkdownSelection({ model: formatSubagentMarkdownModel(selection) }),
    ).toEqual(selection);
  });
  it("继承值与非法编码值都不产生选择", () => {
    for (const value of ["inherit", "main", "sonnet", "opus", "haiku", "   ", "custom::nomodel"]) {
      expect(parseSubagentMarkdownSelection({ model: value })).toBeUndefined();
    }
  });
});
