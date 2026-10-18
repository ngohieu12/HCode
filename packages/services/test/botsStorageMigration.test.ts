import { botsStateFileSchema } from "@zcode/shared";
import { describe, expect, it } from "vitest";
import { importLegacyBotState } from "../src/bots/storageMigration.js";

async function migrate(options: unknown) {
  const raw = {
    version: 2,
    bots: {
      bot: {
        botId: "bot",
        workspacePath: "/workspace",
        mode: "draft",
        activeTaskId: null,
        draftOptions: { provider: "glm", ...(options as object) },
        updatedAt: 1,
      },
    },
  };
  return botsStateFileSchema.parse(importLegacyBotState(raw)).bots.bot?.draftOptions;
}
describe("Bot 一次性旧身份转换", () => {
  it("旧选择原样搬入 v3：内置供应商已下线，不再改写 ID 或规范模型名大小写", async () => {
    // Bug 根因：内置供应商体系下线后 builtin:* 已无迁移落点，改写只会把用户明确的选择
    // 换成一个不存在的供应商；保留原值让用户下次手动重选，比静默换供应商安全。
    for (const providerId of ["builtin:zai-start-plan", "personal-proxy"]) {
      expect(
        (await migrate({ model: `${providerId}/glm-5.3-flash`, thoughtLevel: "high" }))
          ?.modelSelection,
      ).toEqual({
        providerId,
        modelId: "glm-5.3-flash",
        options: { reasoningLevel: "high" },
      });
    }
  });
  it.each(["deepseek/model", "custom:deepseek:model"])("保留明确的旧身份 %s", async (model) => {
    expect((await migrate({ model, thoughtLevel: "high" }))?.modelSelection).toEqual({
      providerId: "deepseek",
      modelId: "model",
      options: { reasoningLevel: "high" },
    });
  });
  it("裸模型名没有供应商身份，不猜 Agent Provider", async () => {
    expect((await migrate({ model: "model" }))?.modelSelection).toBeUndefined();
  });
  it.each(["missing/model", "custom:missing:model", "glm/model"])(
    "候选没有 %s 也保留明确身份",
    async (model) => {
      const providerId = model.startsWith("glm/") ? "glm" : "missing";
      expect((await migrate({ model, thoughtLevel: "future-level" }))?.modelSelection).toEqual({
        providerId,
        modelId: "model",
        options: { reasoningLevel: "future-level" },
      });
    },
  );
  it("已有新选择不让旧字段覆盖；损坏新选择也不回读旧字段", async () => {
    const modelSelection = {
      providerId: "deepseek",
      modelId: "model",
      options: { reasoningLevel: "low" },
    };
    expect((await migrate({ modelSelection, thoughtLevel: "high" }))?.modelSelection).toEqual(
      modelSelection,
    );
    expect(
      (await migrate({ modelSelection: null, model: "deepseek/model", thoughtLevel: "high" }))
        ?.modelSelection,
    ).toBeUndefined();
  });
  it("旧 Coding Plan 身份不再改写为 account:*，旧列与新列都原样保留", async () => {
    const options = { model: "builtin:bigmodel-coding-plan/GLM", thoughtLevel: "high" };
    expect((await migrate(options))?.modelSelection?.providerId).toBe(
      "builtin:bigmodel-coding-plan",
    );
    expect(
      (
        await migrate({
          modelSelection: { providerId: "builtin:bigmodel-coding-plan", modelId: "GLM" },
        })
      )?.modelSelection?.providerId,
    ).toBe("builtin:bigmodel-coding-plan");
  });
});
