/*
 * 草稿态欢迎区。HCode 不渲染问候语，只保留按本地时间选择文案 id 的工具函数。
 */
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

/**
 * HCode：草稿态不再显示按时间变化的问候语（如 "Good afternoon! Leave the rest to me."）。
 * 保留组件与问候语工具函数，供 SessionPane 的空态插槽和现有测试继续引用；
 * 空态插槽本身仍然存在，因此草稿态 composer 的居中布局不受影响。
 */
export function ConversationDraftEmptyState() {
  return null;
}
