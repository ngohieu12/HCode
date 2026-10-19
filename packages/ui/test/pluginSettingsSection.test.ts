import { describe, expect, it } from "vitest";
import { isPluginScopeWorkspaceConnected } from "@/settings/PluginScopeMenu.js";
import type { WorkspaceTabState } from "@/store/tabStore.js";

describe("Plugin settings section", () => {
  it("只把可用本地项目和已连接远端项目放进 Scope", () => {
    const workspace = (overrides: Partial<WorkspaceTabState>) =>
      ({
        id: "workspace-1",
        kind: "workspace",
        label: "Workspace",
        workspacePath: "/workspace",
        ...overrides,
      }) as WorkspaceTabState;

    expect(isPluginScopeWorkspaceConnected(workspace({}))).toBe(true);
    expect(
      isPluginScopeWorkspaceConnected(workspace({ availability: "unavailable-local-directory" })),
    ).toBe(false);
    expect(
      isPluginScopeWorkspaceConnected(
        workspace({ workspaceIdentity: "remote:ssh:host:/workspace" }),
      ),
    ).toBe(false);
    expect(
      isPluginScopeWorkspaceConnected(
        workspace({
          workspaceIdentity: "remote:ssh:host:/workspace",
          remoteSessionId: "remote-session-1",
        }),
      ),
    ).toBe(true);
  });

  it("uses a transparent dashed container for install empty states", () => {
    const source = readSource("src/settings/PluginInstallEmptyState.tsx");
    const pluginSource = readSource("src/settings/PluginsSection.tsx");
    expect(source).toContain("border border-dashed border-border bg-transparent");
    expect(source).not.toContain("rounded-xl bg-surface");
    expect(pluginSource).toContain(
      'className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-ui-base text-foreground-subtle"',
    );
    expect(pluginSource).not.toContain("border-dashed border-border bg-surface px-4 py-8");
    expect(source).toContain("PluginLoadingState");
    expect(readSource("src/settings/PluginsSection.tsx")).toContain("<PluginLoadingState");
    expect(readSource("src/settings/SkillsSection.tsx")).toContain("<PluginLoadingState");
    expect(readSource("src/settings/PluginsSection.tsx")).toMatch(
      /<PluginInstallEmptyState[\s\S]*?size="lg"/,
    );
    expect(readSource("src/settings/McpSettingsSection.tsx")).toMatch(
      /<PluginInstallEmptyState[\s\S]*?size="lg"/,
    );
    expect(readSource("src/settings/SkillsSection.tsx")).toMatch(
      /<PluginInstallEmptyState[\s\S]*?size="lg"/,
    );
  });

  it("uses independent Plugin, MCP, Skill, and Command settings navigation entries", () => {
    const source = readSource("src/settings/settingsPageConfig.ts");
    const navigationSource = readSource("src/lib/settingsNavigation.ts");
    expect(source.indexOf('id: "plugin"')).toBeGreaterThan(-1);
    expect(source.indexOf('id: "mcp"')).toBeGreaterThan(-1);
    expect(source.indexOf('id: "skill"')).toBeGreaterThan(-1);
    expect(source.indexOf('id: "commands"')).toBeGreaterThan(-1);
    expect(source).toContain('id: "plugin"');
    expect(source).not.toContain('id: "plugins"');
    expect(source).toContain('titleId: "settings.plugins.title"');
    expect(navigationSource).not.toContain('| "customize"');
    expect(navigationSource).not.toContain('value === "customize"');
  });

  it("reuses the complete Plugin scope menu in the Command editor", () => {
    const formSource = readSource("src/settings/CommandForm.tsx");
    const commandSource = readSource("src/settings/CommandsSection.tsx");
    expect(formSource).toContain("<PluginScopeMenu");
    expect(formSource).toContain('align="end"');
    expect(formSource).toContain("selectedScopeKey={scopeKey}");
    expect(commandSource).toContain("parentScopeKey");
    expect(commandSource).toContain("onFormScopeKeyChange");
  });

  it("routes marketplace plugin management to Settings Plugins", () => {
    const marketplaceSource = readSource("src/settings/PluginStorePage.tsx");
    expect(marketplaceSource).toContain("onManageInstalled");
    expect(marketplaceSource).toContain("onOpenManage={onManageInstalled}");
    expect(marketplaceSource).not.toContain('"manage"');
    expect(marketplaceSource).not.toContain("PluginStoreManageView");
  });

  it("exposes the remote Plugin sync entry on the Plugins settings page", () => {
    const source = readSource("src/settings/PluginsSection.tsx");

    expect(source).toContain('id: "settings.plugins.remoteSync.open"');
    expect(source).toContain("canSyncPlugins");
    expect(source).toContain("remotePluginSyncOpen");
    expect(source).toContain("localPluginSyncService={baseServices.pluginSyncService}");
    expect(source).toContain(
      "remotePluginSyncService={targetServiceResolution.services.pluginSyncService}",
    );
    expect(source).toContain("<RemoteSyncDialogs");
  });

  it("shows the connected remote workspace context on the Plugin tab", () => {
    const source = readSource("src/settings/PluginsSection.tsx");

    expect(source).toContain(
      'import { formatRemoteSkillSyncTarget } from "@/settings/RemoteSkillSyncDialog.js";',
    );
    expect(source).toContain("const remotePluginSyncTargetLabel = connectedRemoteSyncTarget");
    expect(source).toContain('id: "settings.plugins.remoteContext"');
    expect(source).toMatch(
      /connectedRemoteSyncTarget \? \([\s\S]*?settings\.plugins\.remoteContext[\s\S]*?remotePluginSyncTargetLabel/,
    );
  });

  it("reuses the complete Plugin scope menu in the MCP editor", () => {
    const scopeMenuSource = readSource("src/settings/PluginScopeMenu.tsx");
    const sectionSource = readSource("src/settings/PluginsSection.tsx");
    const formSource = readSource("src/settings/McpServerForm.tsx");
    const mcpSource = readSource("src/settings/McpSettingsSection.tsx");

    expect(scopeMenuSource).toContain("export function PluginScopeMenu");
    expect(scopeMenuSource).toContain("export function isPluginScopeWorkspaceConnected");
    expect(scopeMenuSource).toContain('tab.availability === "unavailable-local-directory"');
    expect(scopeMenuSource).toContain("return Boolean(tab.remoteSessionId)");
    expect(scopeMenuSource).toContain('align = "start"');
    expect(scopeMenuSource).toContain("workspaceTabs");
    expect(scopeMenuSource).toContain(".map((tab) => ({");
    expect(scopeMenuSource).toContain("Cloud");
    expect(scopeMenuSource).toContain("remote: Boolean(tab.remoteTarget || tab.remoteSessionId)");
    expect(scopeMenuSource).toContain("workspace.remote ? Cloud : Folder");
    expect(sectionSource).toContain(".filter(isPluginScopeWorkspaceConnected)");
    expect(sectionSource).toContain("mcpEditorWorkspaceMissing");
    expect(sectionSource).toContain("commandEditorWorkspaceMissing");
    expect(sectionSource).toContain("setMcpEditorOpen(false)");
    expect(sectionSource).toContain("setCommandEditorOpen(false)");
    expect(sectionSource).toContain("const mcpTarget = mcpEditorWorkspaceMissing");
    expect(sectionSource).toContain("const commandTarget = commandEditorWorkspaceMissing");
    expect(formSource).toMatch(/<PluginScopeMenu\s+align="end"/);
    expect(formSource).not.toContain("function McpScopeSelect");
    expect(mcpSource).toContain("await ensureLoadedForWorkspace(");
    expect(mcpSource).toContain("const services = useWorkspaceServices(");
    expect(mcpSource).toContain("remoteSessionId,");
    expect(mcpSource).toContain("workspaceIdentity,");
    expect(mcpSource).toContain("formScopeKey");
    expect(mcpSource).toContain("onFormScopeKeyChange");
  });

  it("reuses the automation detail segmented tabs for Form and JSON", () => {
    const segmentedTabsSource = readSource("src/settings/SettingsSegmentedTabs.tsx");
    const automationSource = readSource("src/settings/AutomationDesignPrimitives.tsx");
    const mcpSource = readSource("src/settings/McpSettingsSection.tsx");

    expect(segmentedTabsSource).toContain("export function SettingsSegmentedTabs");
    expect(segmentedTabsSource).toContain("rounded-full bg-surface");
    expect(segmentedTabsSource).toContain("data-active:bg-background");
    expect(automationSource).toContain("<SettingsSegmentedTabs");
    expect(mcpSource).toContain("<SettingsSegmentedTabs");
    expect(mcpSource).not.toContain("function McpEditorModeTabs");
  });

  it("binds plugin-contributed MCPs and Skills to scoped plugin installations", () => {
    const mcpSource = readSource("src/settings/McpSettingsSection.tsx");
    const mcpListSource = readSource("src/settings/McpServerList.tsx");
    const skillsSource = readSource("src/settings/SkillsSection.tsx");
    const sharedGroupSource = readSource("src/settings/SettingsResourceGroup.tsx");
    expect(mcpSource).toMatch(
      /selectPluginsForScope\(\s*plugins,\s*installedPlugins,\s*scopeFilter,?\s*\)/,
    );
    expect(mcpSource).toContain("const query = searchQuery");
    expect(mcpSource).not.toContain("hideSearchInput");
    expect(mcpSource).toContain("onEditorOpenChange?.(isFormView)");
    expect(mcpSource).toContain('data-mcp-list-layout="grouped"');
    expect(mcpSource).toContain("groupPluginMcpServersByPlugin");
    expect(mcpSource).toContain("<SettingsResourceGroupHeader");
    expect(sharedGroupSource).toContain(
      'className="flex h-7 items-center gap-1.5 text-ui-base font-medium text-foreground"',
    );
    expect(mcpSource).toContain('id: "settings.plugin.mcp.installed"');
    expect(mcpSource).toContain('className={hideInstalledGroup ? "hidden" : "space-y-4"}');
    expect(mcpSource).not.toContain("flatSourceList");
    expect(mcpSource).toContain("<SettingsResourceHeaderActions");
    expect(mcpSource).toContain('data-mcp-plugin-installed-actions="true"');
    expect(mcpSource).toContain("<PluginInstallEmptyState");
    expect(mcpSource).toContain("<PluginSearchEmptyState");
    expect(mcpSource).toContain("const hasEmptySearchResult =");
    expect(mcpSource).toContain("const hideInstalledGroup =");
    expect(mcpSource).toContain("hasEmptySearchResult ? (");
    expect(mcpSource).toContain('id: "settings.plugin.mcp.searchEmpty"');
    expect(mcpSource).toContain('id: "settings.plugin.mcp.emptyInstalledTitle"');
    expect(mcpSource).toContain('importActionId="settings.mcp.import.open"');
    expect(mcpSource).toContain("data-mcp-plugin-group={group.pluginId}");
    expect(mcpSource).not.toContain("sourceLabelOnly");
    expect(mcpSource).not.toContain("formatCanonicalMarketplaceName");
    expect(mcpSource).not.toContain("<Badge");
    expect(mcpSource).not.toContain("typeof item.toolCount");
    expect(mcpSource).toContain("<PluginStoreAvatar");
    expect(mcpSource).toContain("listing: pluginListingById.get(item.pluginId)");
    expect(mcpSource).toContain('className="size-9 bg-background"');
    expect(mcpSource).not.toContain('className="divide-y divide-border"');
    expect(sharedGroupSource).toContain('className="overflow-hidden rounded-xl bg-surface"');
    expect(sharedGroupSource).toContain('className="h-px bg-border/50"');
    expect(mcpSource).not.toContain('className="divide-y divide-border"');
    expect(mcpListSource).toContain("<SettingsResourceList");
    expect(mcpListSource).toContain(
      "size-9 shrink-0 items-center justify-center rounded-xl bg-background",
    );
    expect(mcpListSource).not.toContain('className="divide-y divide-border"');
    expect(mcpListSource).toContain("hideMetadata");
    expect(mcpListSource).toContain('variant="link"');
    expect(mcpSource).toContain('variant="link"');
    expect(mcpListSource).toContain('<ExternalLink className="size-4"');
    expect(mcpSource).toContain('<ExternalLink className="size-4"');
    expect(mcpListSource).toContain(
      'className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"',
    );
    expect(mcpSource).toContain(
      'className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"',
    );
    expect(skillsSource).toContain("selectSkillsForScope(");
    expect(skillsSource).toContain("groupScopedSkillsBySource(");
    expect(skillsSource).toContain("const query = searchQuery");
    expect(skillsSource).not.toContain("hideSearchInput");
    expect(skillsSource).toContain("SettingsResourceGroupHeader");
    expect(skillsSource).toContain('id: "settings.plugin.skills.installed"');
    expect(skillsSource).toContain('data-skills-plugin-direct-actions="true"');
    expect(skillsSource).toContain("<PluginInstallEmptyState");
    expect(skillsSource).toContain("<PluginSearchEmptyState");
    expect(skillsSource).toContain("const hasEmptySearchResult =");
    expect(skillsSource).toContain("const hideInstalledGroup =");
    expect(skillsSource).toContain("hasEmptySearchResult ? (");
    expect(skillsSource).toContain('id: "settings.plugin.skills.searchEmpty"');
    expect(skillsSource).toContain('id: "settings.plugin.skills.emptyInstalledTitle"');
    expect(skillsSource).toContain("<SettingsResourceList");
    expect(skillsSource).toContain(
      "size-9 shrink-0 items-center justify-center rounded-xl bg-background",
    );
    expect(skillsSource).toContain("<PluginStoreAvatar");
    expect(skillsSource).toContain("pluginIconItemById.get");
    expect(skillsSource).toContain('className="size-9 bg-background"');
    expect(skillsSource).toContain("<WandSparkles");
    expect(skillsSource).toContain("title={resolvePluginDisplayName(");
    expect(skillsSource).not.toContain("EnabledStatusFilterSelect");
    expect(skillsSource).not.toContain("enabledFilter");
    expect(skillsSource).not.toContain("!scopeFilter ? (");
    expect(skillsSource).not.toContain("data-skill-scope");
  });
});
