import { describe, expect, it } from "vitest";
import type { IntlInstance } from "@/i18n/IntlProvider.js";
import { formatMemoryUpdatedAt } from "@/settings/memoryUpdatedAt.js";

const messages: Record<string, string> = {
  "settings.memory.viewer.updated.justNow": "Just now",
  "settings.memory.viewer.updated.minutesAgo": "{count} minutes ago",
  "settings.memory.viewer.updated.today": "Today {time}",
  "settings.memory.viewer.updated.yesterday": "Yesterday {time}",
  "settings.memory.viewer.updated.weekday": "{weekday} {time}",
  "settings.memory.viewer.updated.date": "{date} {time}",
};

const formatMessage: IntlInstance["formatMessage"] = ({ id }, values) => {
  let message = messages[id] ?? id;
  for (const [key, value] of Object.entries(values ?? {})) {
    message = message.replaceAll(`{${key}}`, String(value));
  }
  return message;
};

const now = new Date(2026, 7, 7, 22, 32).getTime();

function format(value: Date): string {
  return formatMemoryUpdatedAt({
    formatMessage,
    locale: "en-US",
    now,
    updatedAt: value.getTime(),
  });
}

describe("formatMemoryUpdatedAt", () => {
  it.each([
    [new Date(2026, 7, 7, 22, 31, 31), "Just now"],
    [new Date(2026, 7, 7, 22, 20), "12 minutes ago"],
    [new Date(2026, 7, 7, 22, 2), "Today 22:02"],
    [new Date(2026, 7, 6, 22, 32), "Yesterday 22:32"],
    [new Date(2026, 7, 3, 9, 5), "Mon 09:05"],
    [new Date(2026, 6, 20, 9, 5), "Jul 20 09:05"],
    [new Date(2025, 11, 18, 9, 5), "Dec 18, 2025 09:05"],
  ])("formats elapsed time by range %s", (updatedAt, expected) => {
    expect(format(updatedAt)).toBe(expected);
  });

  it("treats future timestamps as just now", () => {
    expect(format(new Date(2026, 7, 7, 22, 40))).toBe("Just now");
  });
});
