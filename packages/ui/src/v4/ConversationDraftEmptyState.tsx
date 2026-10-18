/*
 * 草稿态欢迎区只保留按本地时间变化的问候语；字号和窄屏换行交给设计令牌与浏览器排版。
 */
import { useEffect, useState } from "react";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";

const GREETING_BOUNDARY_HOURS = [5, 9, 12, 14, 18, 23] as const;

export type ChatEmptyGreetingMessageId =
  | "chat.empty.greeting.morningEarly"
  | "chat.empty.greeting.morning"
  | "chat.empty.greeting.noon"
  | "chat.empty.greeting.afternoon"
  | "chat.empty.greeting.evening"
  | "chat.empty.greeting.lateNight";

export function getChatEmptyGreetingMessageId(date: Date = new Date()): ChatEmptyGreetingMessageId {
  const hour = date.getHours();

  if (hour >= 5 && hour < 9) return "chat.empty.greeting.morningEarly";
  if (hour >= 9 && hour < 12) return "chat.empty.greeting.morning";
  if (hour >= 12 && hour < 14) return "chat.empty.greeting.noon";
  if (hour >= 14 && hour < 18) return "chat.empty.greeting.afternoon";
  if (hour >= 18 && hour < 23) return "chat.empty.greeting.evening";

  return "chat.empty.greeting.lateNight";
}

export function getNextChatEmptyGreetingDelayMs(date: Date = new Date()) {
  const nextBoundary = GREETING_BOUNDARY_HOURS.map((hour) => {
    const boundary = new Date(date);
    boundary.setHours(hour, 0, 0, 0);
    return boundary;
  }).find((boundary) => boundary.getTime() > date.getTime());

  if (nextBoundary) {
    return Math.max(1, nextBoundary.getTime() - date.getTime());
  }

  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(GREETING_BOUNDARY_HOURS[0], 0, 0, 0);
  return Math.max(1, tomorrow.getTime() - date.getTime());
}

export function ConversationDraftEmptyState() {
  const { intl } = useZCodeIntl();
  const [greetingDate, setGreetingDate] = useState(() => new Date());
  const greeting = intl.formatMessage({
    id: getChatEmptyGreetingMessageId(greetingDate),
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setGreetingDate(new Date());
    }, getNextChatEmptyGreetingDelayMs(greetingDate));

    return () => window.clearTimeout(timeout);
  }, [greetingDate]);

  return (
    <div className="mb-6 w-full max-w-2xl">
      <p
        data-v4-draft-greeting="true"
        className="px-4 text-center text-ui-xl leading-tight font-medium text-foreground"
      >
        {greeting}
      </p>
    </div>
  );
}
