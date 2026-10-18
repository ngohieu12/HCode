import type { PlaywrightChromiumModule } from "@zcode/adapters/browser";

export async function loadCliPlaywrightChromium(): Promise<PlaywrightChromiumModule> {
  return (await import("playwright-core")) as PlaywrightChromiumModule;
}
