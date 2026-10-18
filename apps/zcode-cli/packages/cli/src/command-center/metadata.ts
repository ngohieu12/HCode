import type { CliPromptInput, CliSubmitPromptResult } from "./contracts.js";
import type { CommandCenterApp, CommandCenterDeps } from "./types.js";

export function normalizeCliPromptInput(input: CliPromptInput): Exclude<CliPromptInput, string> {
  if (typeof input === "string") return { text: input };
  return input;
}

export function attachCurrentSessionMetadata(
  result: CliSubmitPromptResult,
  deps: CommandCenterDeps,
  app?: CommandCenterApp,
): CliSubmitPromptResult {
  return {
    ...result,
    locale: result.locale ?? app?.getLocale?.(),
    mode: result.mode ?? deps.getMode?.(),
    model: result.model ?? app?.getModel?.(),
    theme: result.theme ?? app?.getTheme?.(),
    thoughtLevel: result.thoughtLevel ?? app?.getThoughtLevel?.(),
  };
}
