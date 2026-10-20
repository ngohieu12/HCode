import type { RequestVerificationReason } from "@zcode/shared";
import { RequestVerificationRetry } from "./request-security-edition/recovery.js";
import type { AiSdkModelTextRequest, ResolvedAiSdkModel } from "./runner-runtime.js";

/**
 * 单次模型请求的鉴权重试编排。
 *
 * 只保留请求安全校验（request verification）失败后的刷新重放。Z.AI / BigModel 账号的
 * 项目令牌（PAT）恢复链路已随账号框架下线，不再在这里识别或刷新项目令牌。
 */
export class AccountRequestRetry {
  readonly #verification: RequestVerificationRetry;

  constructor(request: AiSdkModelTextRequest, model: ResolvedAiSdkModel) {
    this.#verification = new RequestVerificationRetry(request, model);
  }

  get extraAttempts(): number {
    return this.#verification.extraAttempts;
  }

  takeReason(): RequestVerificationReason {
    return this.#verification.takeReason();
  }

  claim(error: unknown, blocked = false): boolean {
    return this.#verification.claim(error, blocked);
  }
}
