/**
 * HCode 旧账号 Provider（Z.AI / BigModel Coding Plan、Start Plan、闲时任务、OAuth）兼容层。
 *
 * 背景：HCode 已从 `@zcode/shared` 移除 Z.AI 账号体系（OAuth、权益、闲时任务等），但
 * 合并上游后 UI 里仍有若干惰性代码按这些稳定 ID 识别历史配置/旧选择。这里只保留
 * 纯文本标识与无副作用的判定函数，不发起任何网络请求，也不恢复账号能力：
 * HCode 不再装配账号 Provider，所以这些判定对真实 Provider 恒为 false / null，
 * 对应的 UI 分支保持休眠。
 *
 * 后续若彻底删除这些惰性 UI，应连同本文件一起删除。
 */
import {
  BUILTIN_MODEL_PROVIDER_IDS,
  buildBigModelApiUrl,
  ZCODE_ENV,
  type BuiltinModelProviderId,
  type RuntimeBigModelApiEnv,
} from "@zcode/shared";

// ---------------------------------------------------------------------------
// OAuth Provider ID（仅作历史标识）
// ---------------------------------------------------------------------------

export const BIGMODEL_PROVIDER_ID = "bigmodel" as const;
export const ZAI_PROVIDER_ID = "zai" as const;
export type LegacyOAuthProviderId = typeof BIGMODEL_PROVIDER_ID | typeof ZAI_PROVIDER_ID;

/** 旧 OAuth JWT 失效广播频道；HCode 不再发送该广播，订阅方永远不会收到消息。 */
export const ZCODE_JWT_INVALID_BROADCAST_CHANNEL = "auth:zcode-jwt-invalid";

// ---------------------------------------------------------------------------
// 内置账号 Provider ID 判定
// ---------------------------------------------------------------------------

export function isZaiCodingPlanProviderId(id: string): boolean {
  return (
    id === BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan ||
    id === BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan ||
    id === BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan
  );
}

export function isStartPlanModelProviderId(id: string): boolean {
  return (
    id === BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan ||
    id === BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan
  );
}

export function isIndividualCodingPlanModelProviderId(id: string): boolean {
  return (
    id === BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan ||
    id === BUILTIN_MODEL_PROVIDER_IDS.bigmodelIndividualCodingPlan
  );
}

export function isCodingPlanModelProviderId(id: string): boolean {
  return (
    isZaiCodingPlanProviderId(id) ||
    id === BUILTIN_MODEL_PROVIDER_IDS.bigmodelIndividualCodingPlan ||
    id === BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan ||
    id === BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan
  );
}

// ---------------------------------------------------------------------------
// Provider Family（zai / bigmodel）
// ---------------------------------------------------------------------------

export type ModelProviderFamilyId = "zai" | "bigmodel";
export type ProviderFamilyDomain = ModelProviderFamilyId;

export interface ModelProviderFamilySpec {
  id: ModelProviderFamilyId;
  label: string;
  rootDomain: string;
  oauthProviderId: LegacyOAuthProviderId;
  startPlanProviderId:
    | typeof BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan
    | typeof BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan;
  individualCodingPlanProviderId:
    | typeof BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan
    | typeof BUILTIN_MODEL_PROVIDER_IDS.bigmodelIndividualCodingPlan;
  teamCodingPlanProviderId:
    | typeof BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan
    | typeof BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan;
  teamCodingPlanManageUrl: string;
}

export function buildBigModelCodingPlanPersonalManageUrl(env: RuntimeBigModelApiEnv = {}): string {
  return buildBigModelApiUrl(env, "/coding-plan/personal/overview");
}

export function buildBigModelCodingPlanTeamManageUrl(env: RuntimeBigModelApiEnv = {}): string {
  return buildBigModelApiUrl(env, "/coding-plan/team/plans");
}

export const MODEL_PROVIDER_FAMILY_SPECS = [
  {
    id: "zai",
    label: "Z.ai",
    rootDomain: "z.ai",
    oauthProviderId: ZAI_PROVIDER_ID,
    startPlanProviderId: BUILTIN_MODEL_PROVIDER_IDS.zaiStartPlan,
    individualCodingPlanProviderId: BUILTIN_MODEL_PROVIDER_IDS.zaiIndividualCodingPlan,
    teamCodingPlanProviderId: BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan,
    teamCodingPlanManageUrl: "https://z.ai/manage-apikey/subscription",
  },
  {
    id: "bigmodel",
    label: "BigModel",
    rootDomain: "bigmodel.cn",
    oauthProviderId: BIGMODEL_PROVIDER_ID,
    startPlanProviderId: BUILTIN_MODEL_PROVIDER_IDS.bigmodelStartPlan,
    individualCodingPlanProviderId: BUILTIN_MODEL_PROVIDER_IDS.bigmodelIndividualCodingPlan,
    teamCodingPlanProviderId: BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan,
    teamCodingPlanManageUrl: buildBigModelCodingPlanTeamManageUrl({ ZCODE_ENV }),
  },
] as const satisfies readonly ModelProviderFamilySpec[];

const MODEL_PROVIDER_FAMILY_SPEC_BY_ID = new Map<ModelProviderFamilyId, ModelProviderFamilySpec>(
  MODEL_PROVIDER_FAMILY_SPECS.map((spec) => [spec.id, spec]),
);

const MODEL_PROVIDER_FAMILY_ID_BY_PROVIDER_ID = new Map<string, ModelProviderFamilyId>(
  MODEL_PROVIDER_FAMILY_SPECS.flatMap((spec) =>
    [
      spec.startPlanProviderId,
      spec.individualCodingPlanProviderId,
      spec.teamCodingPlanProviderId,
    ].map((providerId) => [providerId, spec.id] as const),
  ),
);

export function getModelProviderFamilySpec(
  familyId: ModelProviderFamilyId,
): ModelProviderFamilySpec {
  return MODEL_PROVIDER_FAMILY_SPEC_BY_ID.get(familyId)!;
}

export function resolveModelProviderFamilyIdByProviderId(
  providerId: string,
): ModelProviderFamilyId | null {
  return MODEL_PROVIDER_FAMILY_ID_BY_PROVIDER_ID.get(providerId as BuiltinModelProviderId) ?? null;
}

export function resolveModelProviderFamilySpecByProviderId(
  providerId: string,
): ModelProviderFamilySpec | null {
  const familyId = resolveModelProviderFamilyIdByProviderId(providerId);
  return familyId ? getModelProviderFamilySpec(familyId) : null;
}

export function normalizeProviderFamilyDomain(
  value: string | null | undefined,
): ProviderFamilyDomain | null {
  return value === "zai" || value === "bigmodel" ? value : null;
}

export function resolveProviderFamilyDomainFromOAuthProvider(
  provider: string | null | undefined,
): ProviderFamilyDomain | null {
  if (provider === ZAI_PROVIDER_ID) {
    return "zai";
  }
  if (provider === BIGMODEL_PROVIDER_ID) {
    return "bigmodel";
  }
  return null;
}

// ---------------------------------------------------------------------------
// 账号访问 / 套餐身份
// ---------------------------------------------------------------------------

export interface ZCodeProviderAccountAccess {
  type: "zhipu-account";
  accountType: "zai" | "bigmodel";
  mode: "start-plan" | "individual-coding-plan" | "team-coding-plan" | "off-peak" | "highspeed";
  entitled: boolean;
}

const ACCOUNT_ACCESS_MODES = new Set<string>([
  "start-plan",
  "individual-coding-plan",
  "team-coding-plan",
  "off-peak",
  "highspeed",
]);

function parseProviderAccountAccess(
  value: unknown,
): { success: true; data: ZCodeProviderAccountAccess } | { success: false } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false };
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  const allowedKeys = new Set(["type", "accountType", "mode", "entitled"]);
  if (keys.some((key) => !allowedKeys.has(key))) {
    return { success: false };
  }
  if (
    record.type !== "zhipu-account" ||
    (record.accountType !== "zai" && record.accountType !== "bigmodel") ||
    typeof record.mode !== "string" ||
    !ACCOUNT_ACCESS_MODES.has(record.mode) ||
    typeof record.entitled !== "boolean"
  ) {
    return { success: false };
  }
  return { success: true, data: record as unknown as ZCodeProviderAccountAccess };
}

/**
 * 旧 Active Model 账号访问类别的最小 schema 替身（只实现 UI 用到的 safeParse / parse），
 * 用于识别历史持久化数据；HCode 不会再生成这类数据。
 */
export const zcodeProviderAccountAccessSchema = {
  safeParse(value: unknown) {
    return parseProviderAccountAccess(value);
  },
  parse(value: unknown): ZCodeProviderAccountAccess {
    const result = parseProviderAccountAccess(value);
    if (!result.success) {
      throw new Error("Invalid provider account access");
    }
    return result.data;
  },
};

export type PlanIdentityStatus = "unknown" | "coding_plan" | "start_plan" | "no_plan";

export interface PlanIdentitySnapshot {
  generatedAt: number;
  planStatus: PlanIdentityStatus;
  planProductId: string;
}

/** HCode 没有账号权益来源，套餐身份恒为 unknown。 */
export function resolvePlanIdentitySnapshot(input: {
  providerFamilyDomain?: ProviderFamilyDomain | null;
  now: number;
  [key: string]: unknown;
}): PlanIdentitySnapshot {
  return { generatedAt: input.now, planStatus: "unknown", planProductId: "" };
}

/** Coding Plan 订阅服务繁忙的历史错误码。 */
export const CODING_PLAN_SYSTEM_BUSY = "coding_plan_system_busy" as const;

/** Coding Plan 官网 webview（已移除 preload）的历史 ipc 频道名。 */
export const CodingPlanWebviewChannels = {
  PurchaseComplete: "zcode:coding-plan-purchase-complete",
} as const;

// ---------------------------------------------------------------------------
// 闲时任务（Off-Peak）
// ---------------------------------------------------------------------------

/** 闲时任务会话默认分组的历史固定 id；HCode 不再创建该分组。 */
export const OFF_PEAK_DEFAULT_GROUP_ID = "zcode-default-group-off-peak";

export const OFF_PEAK_TERMINAL_STATUSES = ["completed", "failed", "cancelled"] as const;

export function isOffPeakTerminalStatus(
  status: string,
): status is (typeof OFF_PEAK_TERMINAL_STATUSES)[number] {
  return (OFF_PEAK_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export const OFF_PEAK_TICKET_EXPIRED_MARKER = "off-peak-ticket-expired";

export function isOffPeakTicketExpiredError(message: string | undefined): boolean {
  return Boolean(message?.includes(OFF_PEAK_TICKET_EXPIRED_MARKER));
}

/** 只看持久 meta 标记；HCode 不再产生闲时任务，历史数据仍可被识别。 */
export function isOffPeakTask(task: { offPeakTaskId?: string | null }): boolean {
  return Boolean(task.offPeakTaskId);
}

// ---------------------------------------------------------------------------
// 历史 test id（e2e 已不再覆盖这些惰性入口）
// ---------------------------------------------------------------------------

export const TID_LOGIN_MENU_ITEM = "login-menu-item";
export const TID_LOGOUT_BUTTON = "logout-button";
export const TID_SIDEBAR_CODING_PLAN_USAGE_BUTTON = "sidebar-coding-plan-usage-button";
export const TID_START_PLAN_RECOMMENDATION_DIALOG = "start-plan-recommendation-dialog";
export const TID_OFFPEAK_CREATE_BUTTON = "offpeak-create-button";
export const TID_OFFPEAK_CARD = "offpeak-card";
export const TID_OFFPEAK_CARD_SESSION = "offpeak-card-session";
export const TID_OFFPEAK_CARD_MENU = "offpeak-card-menu";
export const TID_OFFPEAK_EDIT_VIEW = "offpeak-edit-view";
export const TID_OFFPEAK_EDIT_SUBMIT = "offpeak-edit-submit";
export const TID_OFFPEAK_FORM_TITLE = "offpeak-form-title";
export const TID_OFFPEAK_FORM_INSTRUCTIONS = "offpeak-form-instructions";
export const TID_OFFPEAK_ACTION_PAUSE = "offpeak-action-pause";
export const TID_OFFPEAK_ACTION_CONTINUE = "offpeak-action-continue";
export const TID_OFFPEAK_ACTION_DELETE = "offpeak-action-delete";
export const TID_OFFPEAK_TAB = "offpeak-tab";
