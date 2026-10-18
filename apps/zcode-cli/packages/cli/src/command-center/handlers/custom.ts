import type { CliSubmitPromptResult } from "../contracts.js";
import { buildCustomCommandPrompt } from "../../command-center-custom.js";
import { attachCurrentSessionMetadata } from "../metadata.js";
import type { CommandCenterDeps, CliSubmitOptions } from "../types.js";

export async function handleCustomCommand(
  name: string,
  args: string,
  deps: CommandCenterDeps,
  options: CliSubmitOptions,
): Promise<CliSubmitPromptResult | undefined> {
  const prompt = await buildCustomCommandPrompt(name, args, deps);
  if (!prompt) return undefined;
  const app = await deps.getApp();
  const result = await app.submitPrompt(prompt, options);
  return attachCurrentSessionMetadata(result, deps, app);
}
