import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import enUS from "@/i18n/locales/en-US.js";
import { ZCodeIntlProvider } from "@/i18n/IntlProvider.js";
import zhCN from "./fixtures/zhCNLegacy.js";
import {
  ConversationDraftEmptyState,
  getChatEmptyGreetingMessageId,
  getNextChatEmptyGreetingDelayMs,
} from "@/v4/ConversationDraftEmptyState.js";

const localDateAt = (hour: number, minute = 0) => new Date(2026, 5, 15, hour, minute);

describe("chat empty time greeting i18n", () => {
  it("下午和夜深问候保持自然、克制的关怀语气", () => {
    expect(zhCN["chat.empty.greeting.afternoon"]).toBe("下午好呀，接下来交给我吧");
    expect(zhCN["chat.empty.greeting.lateNight"]).toBe("夜深啦，别忘了照顾好自己哦");
  });

  it("英文问候与中文保持相同意图并使用本地化表达", () => {
    expect(enUS["chat.empty.greeting.afternoon"]).toBe("Good afternoon! Leave the rest to me.");
    expect(enUS["chat.empty.greeting.lateNight"]).toBe(
      "It's late—remember to take care of yourself.",
    );
  });

  it("HCode 草稿态不渲染问候语", () => {
    const html = renderToStaticMarkup(
      createElement(
        ZCodeIntlProvider,
        { initialLocale: "en-US" },
        createElement(ConversationDraftEmptyState),
      ),
    );

    expect(html).toBe("");
    expect(html).not.toContain("Good afternoon");
  });

  it.each([
    [4, 59, "chat.empty.greeting.lateNight"],
    [5, 0, "chat.empty.greeting.morningEarly"],
    [9, 0, "chat.empty.greeting.morning"],
    [12, 0, "chat.empty.greeting.noon"],
    [14, 0, "chat.empty.greeting.afternoon"],
    [18, 0, "chat.empty.greeting.evening"],
    [23, 0, "chat.empty.greeting.lateNight"],
  ] as const)("uses the greeting for local time %i:%i", (hour, minute, messageId) => {
    expect(getChatEmptyGreetingMessageId(localDateAt(hour, minute))).toBe(messageId);
  });

  it("schedules the next greeting refresh at the nearest time boundary", () => {
    expect(getNextChatEmptyGreetingDelayMs(localDateAt(8, 30))).toBe(30 * 60 * 1000);
    expect(getNextChatEmptyGreetingDelayMs(localDateAt(23, 30))).toBe(5.5 * 60 * 60 * 1000);
  });
});
