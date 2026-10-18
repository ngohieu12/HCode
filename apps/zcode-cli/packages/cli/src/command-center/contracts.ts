import type { ModelSelection, ZCodeModelOption } from "@zcode/shared";
import type {
  CollaborationMode,
  InputDelivery,
  ModelUsageSummary,
  PermissionBrokerRequest,
  PermissionBrokerRequestOptions,
  PermissionBrokerResult,
  SessionEvent,
  SessionProjection,
  SupportedLocale,
  ToolResultDisplayPayload,
  TurnId,
  TurnSteerResult,
  UiThemePreference,
} from "@zcode/contracts";

/**
 * Command-center contracts.
 *
 * These types used to live in the terminal UI package. The command center is
 * still shared by headless prompt runs, so the structural contracts stay in the
 * CLI while the terminal renderer is gone.
 */

export type CliContextUsage = Pick<SessionProjection, "contextUsed" | "contextWindow">;

export type CliPromptAttachment = {
  type: "file" | "image" | "pdf" | "url";
  path?: string;
  content?: string;
};

export type CliPromptInput =
  | string
  | {
      text: string;
      attachments?: CliPromptAttachment[];
      /** Model picker commands retain the reference separately from their display text. */
      modelSelection?: ModelSelection;
    };

export type CliSelectionInput = {
  cancelStatus?: string;
  clearStatus?: string;
  emptyStatus?: string;
  help?: string;
  mask?: boolean;
  placeholder?: string;
  primary: string;
  secondary?: string;
  status?: string;
  submitStatus?: string;
};

export type CliSelectionPending = {
  cancelStatus?: string;
  help?: string;
  primary: string;
  secondary?: string;
  status?: string;
};

export type CliSelectionItem = {
  command: string;
  disabledReason?: string;
  id: string;
  input?: CliSelectionInput;
  keywords?: readonly string[];
  meta?: string;
  pending?: CliSelectionPending;
  primary: string;
  secondary?: string;
};

export type CliSelection = {
  emptyMessage: string;
  filterable?: boolean;
  help?: string;
  items: CliSelectionItem[];
  placement?: "action" | "composer";
  prompt: string;
  selectedIndex?: number;
  title: string;
};

export type CliRestoredTranscriptPart =
  | {
      text: string;
      type: "text";
    }
  | {
      text: string;
      type: "thought";
    }
  | {
      error?: string;
      input: Record<string, unknown>;
      output?: string;
      resultDisplay?: ToolResultDisplayPayload;
      status: "pending" | "running" | "completed" | "failed";
      title?: string;
      toolCallId: string;
      toolName: string;
      type: "tool";
    };

export type CliSubmitPromptResult = {
  effortOptions?: readonly CliEffortOption[];
  modelOptions?: readonly CliModelOption[];
  locale?: SupportedLocale;
  loginRequired?: boolean;
  mode?: CollaborationMode;
  model?: string;
  theme?: UiThemePreference;
  projection?: Partial<CliContextUsage>;
  response: string;
  resetSessionProjection?: boolean;
  restoredMessages?: Array<{
    id?: string;
    content: string;
    parts?: CliRestoredTranscriptPart[];
    role: "agent" | "system" | "user";
  }>;
  selection?: CliSelection;
  sessionId?: string;
  thoughtLevel?: string;
  traceId?: string;
  turnId?: string;
  usage?: ModelUsageSummary;
};

export type CliRequestPermission = (
  request: PermissionBrokerRequest,
  options?: PermissionBrokerRequestOptions,
) => Promise<PermissionBrokerResult>;

export type CliSubmitPrompt = (
  prompt: CliPromptInput,
  options: {
    abortSignal: AbortSignal;
    onEvent?: (event: SessionEvent) => void | Promise<void>;
    requestPermission?: CliRequestPermission;
  },
) => Promise<CliSubmitPromptResult>;

export type CliSendInputResult =
  | {
      kind: "started_turn";
      result: CliSubmitPromptResult;
    }
  | {
      kind: "command_result";
      result: CliSubmitPromptResult;
    }
  | TurnSteerResult;

export type CliSendInput = (
  input: CliPromptInput,
  options: {
    abortSignal?: AbortSignal;
    delivery?: InputDelivery;
    expectedTurnId?: TurnId;
    onEvent?: (event: SessionEvent) => void | Promise<void>;
    requestPermission?: CliRequestPermission;
  },
) => Promise<CliSendInputResult>;

export type CliReadSubagents = (input?: {
  endedCursor?: string;
  endedLimit?: number;
}) => Promise<import("@zcode/shared").ZCodeSessionSubagentsResult>;

export type CliSubagentTranscriptSnapshot = {
  sessionId: string;
  sequenceNumber: number;
  messages: NonNullable<CliSubmitPromptResult["restoredMessages"]>;
  events: SessionEvent[];
  replayMessageIds: string[];
};

export type CliReadSubagentTranscript = (
  childSessionId: string,
) => Promise<CliSubagentTranscriptSnapshot>;

export type CliSlashCommandSuggestion = {
  aliases?: readonly string[];
  name: string;
  summary: string;
  usage: string;
};

export type CliModelOption = ZCodeModelOption;

export type CliEffortOption = {
  description?: string;
  id: string;
  label: string;
};
