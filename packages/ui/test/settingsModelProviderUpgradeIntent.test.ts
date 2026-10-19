import { describe, expect, it } from "vitest";
import { BUILTIN_MODEL_PROVIDER_IDS } from "@zcode/shared";
import {
  normalizeCodingPlanProviderId,
  resolveCodingPlanOAuthProviderId,
} from "@/settings/model-provider-section/codingPlanPurchaseAuth.js";
import { CODING_PLAN_PROVIDER_SPECS } from "@/settings/model-provider-section/constants.js";

describe("settings model provider upgrade intent", () => {
  it("keeps both Team Provider identities in the Coding Plan upgrade boundary", () => {
    expect(normalizeCodingPlanProviderId(BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan)).toBe(
      BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan,
    );
    expect(normalizeCodingPlanProviderId(BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan)).toBe(
      BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan,
    );
    expect(resolveCodingPlanOAuthProviderId(BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan)).toBe(
      "zai",
    );
    expect(
      resolveCodingPlanOAuthProviderId(BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan),
    ).toBe("bigmodel");
    expect(CODING_PLAN_PROVIDER_SPECS.map((spec) => spec.id)).not.toContain(
      BUILTIN_MODEL_PROVIDER_IDS.zaiTeamCodingPlan,
    );
    expect(CODING_PLAN_PROVIDER_SPECS.map((spec) => spec.id)).not.toContain(
      BUILTIN_MODEL_PROVIDER_IDS.bigmodelTeamCodingPlan,
    );
  });

  it("routes both idle-time Upgrade entries through the shared purchase funnel context", () => {
    const offPeakNewTaskEntrySource = readSource("packages/ui/src/v4/OffPeakNewTaskEntry.tsx");
    const automationsSectionSource = readSource("packages/ui/src/settings/AutomationsSection.tsx");

    for (const source of [offPeakNewTaskEntrySource, automationsSectionSource]) {
      expect(source).toContain("createIdleTimeCodingPlanFunnelContext({");
      expect(source).toContain('initialAudience: "personal"');
      expect(source).toContain("funnelContext:");
    }
  });

  it("opens no-model Set action directly to model provider settings", () => {
    const composerToolbarSource = readSource("packages/ui/src/v4/composer/V4ComposerToolbar.tsx");

    expect(composerToolbarSource).toContain('setPendingSettingsSectionIntent("modelProvider")');
    expect(composerToolbarSource).toContain("handleOpenModelProviderSettings");
    expect(composerToolbarSource).toContain("onManageModels={handleOpenModelProviderSettings}");
    expect(composerToolbarSource).not.toContain("onManageModels={openSettingsTab}");
  });
});
