// edit/retry 的 canonical intent 重发原语：rewind 截断之后，把 projection resolver 解析出的
// canonical user intent（含附件引用、模型 Selection、goal 命令语义）重新发起为一轮。
// 从 fork-edit-retry.ts 抽出：editUserQuery 与 retryTurn 共用，forkAssistant 不经过这里
// （fork 只做 conversation-only copy，不 rewind、不重发）。
import type { CommandEnvelope, CommandPayloadMap } from "@zcode/shared/zcode-protocol-v4";
import { isHighspeedProviderId } from "@zcode/shared";
import type { ModelSelection } from "@zcode/shared";
import type { mapAttachmentRefsToTurnAttachments } from "../attachment-refs.js";
import {
  resolveOrdinaryQueueModelSelection,
  resolveSessionFallbackModelSelection,
} from "../input-admission.js";
import { inputIntentMetadataFromCanonical } from "../input-intent.js";
import { preflightPromptTurn, startPreflightedPromptTurn } from "../prompt-turn.js";
import type { V4CommandCoreHost, V4SessionRecordView } from "../types.js";
import { applyGoalCommand } from "./goal-compact.js";
import type { ConversationEditTarget } from "../../product-projection.js";

const EDIT_QUEUE_FALLBACK_REASON = "edit.admissionRace";

export function stableAttachmentRefs(editTarget: ConversationEditTarget) {
  return editTarget.intent.attachments?.flatMap((attachment) =>
    attachment.ref ? [{ ...attachment, ref: attachment.ref }] : [],
  );
}

function buildCanonicalIntent(
  record: V4SessionRecordView,
  envelope: CommandEnvelope,
  editTarget: ConversationEditTarget,
  text: string,
  attachmentRefs: ReturnType<typeof stableAttachmentRefs>,
  requireQueue: boolean,
  modelSelectionOverride?: ModelSelection,
) {
  const intent = inputIntentMetadataFromCanonical(
    envelope,
    {
      kind: editTarget.intent.kind,
      conversationQuotes:
        envelope.type === "editUserQuery"
          ? ((envelope.payload as CommandPayloadMap["editUserQuery"]).conversationQuotes ??
            editTarget.intent.conversationQuotes)
          : editTarget.intent.conversationQuotes,
      text: editTarget.intent.text,
      sourceCommandId: editTarget.intent.sourceCommandId,
      clientId: editTarget.intent.clientId,
      queueItemId: editTarget.intent.queueItemId,
      requestedDelivery: editTarget.intent.requestedDelivery,
      admittedDelivery: editTarget.intent.admittedDelivery,
      fallbackReasonCode: editTarget.intent.fallbackReasonCode,
      // HCode: edit 按新的主动发送处理，调用方传入本次提交的 Selection 时优先，
      // 不沿用被 rewind 那轮 pin 的旧模型；retry 不传则保留历史 Selection。
      modelSelection: modelSelectionOverride ?? editTarget.intent.modelSelection,
      mode: editTarget.intent.mode,
      planEnabled: editTarget.intent.planEnabled,
      attachmentRefs,
      provenance: editTarget.intent.provenance,
    },
    text,
  );
  if (isHighspeedProviderId(intent.modelSelection?.providerId)) {
    // Bug 根因：retry/edit 都没有本轮加速执行材料，却沿用了被 rewind 那轮持久化的 account:*-highspeed-card Selection。加速 Selection 只有与同一轮
    // requestAuth 成对才有效：单独保留会让 Core 以 ModelRequestAuthMissing 失败，还会被固定进新的
    // canonical intent，让后续普通发送继续携带无法使用的加速 Provider。与队列提升共用同一 resolver
    // 退回会话常驻 Selection，只改本轮 intent、不改 session 模型（spec §3 规则 13）。
    intent.modelSelection = resolveSessionFallbackModelSelection(record);
  }
  if (requireQueue) {
    intent.modelSelection = resolveOrdinaryQueueModelSelection(record, intent.modelSelection);
    intent.requestedDelivery = "queue";
    intent.admittedDelivery = "queue";
    intent.fallbackReasonCode = EDIT_QUEUE_FALLBACK_REASON;
  }
  return intent;
}

/** destructive edit/retry 在提交 branch cut 前调用；只检查模型，不接纳输入。 */
export async function preflightCanonicalIntent(
  host: V4CommandCoreHost,
  record: V4SessionRecordView,
  envelope: CommandEnvelope,
  editTarget: ConversationEditTarget,
  text: string,
  attachmentRefs: ReturnType<typeof stableAttachmentRefs>,
  attachments: Awaited<ReturnType<typeof mapAttachmentRefsToTurnAttachments>>,
): Promise<void> {
  if (editTarget.intent.kind === "sendGoalCommand") return;
  const intent = buildCanonicalIntent(
    record,
    envelope,
    editTarget,
    text,
    attachmentRefs,
    false,
  );
  await preflightPromptTurn(host, record, {
    content: text,
    inputId: envelope.commandId,
    intent,
    ...(attachments ? { attachments } : {}),
  });
}

export async function startCanonicalIntent(
  host: V4CommandCoreHost,
  record: V4SessionRecordView,
  envelope: CommandEnvelope,
  editTarget: ConversationEditTarget,
  text: string,
  attachmentRefs: ReturnType<typeof stableAttachmentRefs>,
  attachments: Awaited<ReturnType<typeof mapAttachmentRefsToTurnAttachments>>,
  options?: { requireQueue?: boolean; modelSelection?: ModelSelection },
): Promise<void> {
  const requireQueue = options?.requireQueue === true;
  const intent = buildCanonicalIntent(
    record,
    envelope,
    editTarget,
    text,
    attachmentRefs,
    requireQueue,
    options?.modelSelection,
  );
  if (editTarget.intent.kind === "sendGoalCommand") {
    await applyGoalCommand(host, record, {
      inputId: envelope.commandId,
      objective: text,
      intent,
    });
    return;
  }
  const started = await startPreflightedPromptTurn(host, record, {
    content: text,
    inputId: envelope.commandId,
    intent,
    ...(requireQueue ? { requireQueue: true } : {}),
    ...(attachments ? { attachments } : {}),
  });
  if (requireQueue && started.admission.kind !== "queued") {
    throw new Error("edited input was not admitted to the queue");
  }
}
