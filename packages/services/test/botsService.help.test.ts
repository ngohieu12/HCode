import { describe, expect, it } from "vitest";
import * as f from "./botsService.fixtures.js";

const actor = {
  provider: "webhook" as const,
  botId: "webhook-1",
  providerUserId: "user-1",
  chatType: "private" as const,
};

describe("botsService help", () => {
  it("shows command help after binding succeeds", async () => {
    const repo = f.createMemoryRepo(f.baseConfig);
    const service = f.createBotsService({
      credentialService: f.createCredentialService({ "secret-1": "secret" }),
      legacyTaskService: f.createLegacyTaskService(),
      repo: repo as never,
    });

    const code = await service.createBindCode({ botId: "webhook-1" });
    const replies = await service.handleInboundMessage({
      botId: "webhook-1",
      text: `/bind ${code.code}`,
      actor,
    });

    expect(replies[0]?.text).toBe(
      [
        "Bound successfully. Send **/help** to see available commands.",
        "",
        "ZCode bot commands:",
        "**/help** — Show this guide",
        "**/status** — Show workspace, model, and task status",
        "/new or /clear — Start a new task draft",
        "**/project** — Switch workspace",
        "**/model** — Switch model",
        "**/mode** — Switch run mode",
        "**/think** — Switch thought level",
        "**/reply** — Switch reply detail",
        "**/bind <code>** — Bind this chat",
      ].join("\n"),
    );
    service.disposeAll();
  });

  it("returns concise command help for /help", async () => {
    const repo = f.createMemoryRepo(f.baseConfig);
    const service = f.createBotsService({
      credentialService: f.createCredentialService({ "secret-1": "secret" }),
      legacyTaskService: f.createLegacyTaskService(),
      repo: repo as never,
    });

    const code = await service.createBindCode({ botId: "webhook-1" });
    await service.handleInboundMessage({
      botId: "webhook-1",
      text: `/bind ${code.code}`,
      actor,
    });
    const replies = await service.handleInboundMessage({
      botId: "webhook-1",
      text: "/help",
      actor,
    });

    expect(replies[0]?.text).toBe(
      [
        "ZCode bot commands:",
        "**/help** — Show this guide",
        "**/status** — Show workspace, model, and task status",
        "/new or /clear — Start a new task draft",
        "**/project** — Switch workspace",
        "**/model** — Switch model",
        "**/mode** — Switch run mode",
        "**/think** — Switch thought level",
        "**/reply** — Switch reply detail",
        "**/bind <code>** — Bind this chat",
      ].join("\n"),
    );
    service.disposeAll();
  });

  it("returns English command help with new or clear wording", async () => {
    const repo = f.createMemoryRepo(f.baseConfig);
    const service = f.createBotsService({
      credentialService: f.createCredentialService({ "secret-1": "secret" }),
      legacyTaskService: f.createLegacyTaskService(),
      repo: repo as never,
      settingService: f.createSettingService({
        locale: "en-US",
        lastWorkspaceSession: [
          {
            kind: "remote",
            workspacePath: "/tmp/workspace",
            workspaceIdentity: "ssh://host/tmp/workspace",
          },
        ],
      }),
    });

    const code = await service.createBindCode({ botId: "webhook-1" });
    await service.handleInboundMessage({
      botId: "webhook-1",
      text: `/bind ${code.code}`,
      actor,
    });
    const replies = await service.handleInboundMessage({
      botId: "webhook-1",
      text: "/help",
      actor,
    });

    expect(replies[0]?.text).toContain("/new or /clear — Start a new task draft");
    service.disposeAll();
  });
});
