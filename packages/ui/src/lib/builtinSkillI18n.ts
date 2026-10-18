import type { Locale, SkillScope } from "@zcode/shared";

interface SkillDisplayCandidate {
  name: string;
  description: string;
  path: string;
  scope: SkillScope;
  pluginName?: string;
}

const OFFICIAL_BUILTIN_PLUGIN_NAMES = new Set([
  "android-emulator",
  "browser",
  "browser-use",
  "document-skills",
  "documents",
  "pdf",
  "presentations",
  "spreadsheets",
  "ios-simulator",
  "restore-legacy-sessions",
  "skill-creator",
  "plugin-creator",
  "superpowers",
  "zcode-guide",
]);

const OFFICIAL_PLUGIN_PATH_MARKERS = [
  "/zcode-plugins-official/",
  "\\zcode-plugins-official\\",
  "/android-emulator-plugin/",
  "/browser-use-plugin/",
  "/document-skills-plugin/",
  "/documents-plugin/",
  "/pdf-plugin/",
  "/presentations-plugin/",
  "/spreadsheets-plugin/",
  "/ios-simulator-plugin/",
  "/restore-legacy-sessions-plugin/",
  "/skill-creator-plugin/",
  "/plugin-creator-plugin/",
  "/superpowers-plugin/",
  "/zcode-guide-plugin/",
];

// 未提供某语言描述时回落到英文（越南语描述暂未单独翻译）。
const BUILTIN_SKILL_DESCRIPTIONS: Record<string, Partial<Record<Locale, string>>> = {
  "android-dev": {
    "en-US": "Build, run, inspect, and lightly automate Android apps through the android-emulator MCP tools.",
  },
  "brainstorming": {
    "en-US": "Use before any creative work, including creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements, and design before implementation.",
  },
  "control-browser": {
    "en-US":
      "Control HCode's built-in browser to open, inspect, click, type, screenshot, or verify webpages and local development targets.",
  },
  "dispatching-parallel-agents": {
    "en-US": "Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies.",
  },
  "docx": {
    "en-US": "Create, edit, and analyze DOCX documents with revisions, comments, formatting preservation, and text extraction. Use for new documents, edits, revision handling, comments, and professional Word document work.",
  },
  "executing-plans": {
    "en-US": "Use when you have a written implementation plan to execute in a separate session with review checkpoints.",
  },
  "finishing-a-development-branch": {
    "en-US": "Use when implementation is complete, tests pass, and you need to decide how to integrate the work through merge, PR, or cleanup.",
  },
  "ios-dev": {
    "en-US": "Build, run, inspect, and lightly automate iOS Simulator apps through the ios-simulator MCP tools.",
  },
  "pdf": {
    "en-US": "Professional PDF toolkit for reports, creative visuals, academic LaTeX, and existing-PDF workflows. Supports reports, posters, papers, resumes, extraction, merge, split, forms, and conversion.",
  },
  "pptx": {
    "en-US": "Inspect and narrowly update elements selected in PPTX Preview Pane. Verifies the whole-file fingerprint and OOXML locator for shape or table-cell text, and stops on conflicts instead of guessing.",
  },
  "receiving-code-review": {
    "en-US": "Use when receiving code review feedback before implementing suggestions, especially when feedback is unclear or technically questionable.",
  },
  "requesting-code-review": {
    "en-US": "Use when completing tasks, implementing major features, or before merging to verify work meets requirements.",
  },
  "restore-legacy-sessions": {
    "en-US": "Inspect, plan, or restore old ACP-era ZCode sessions into the new ZCode task and session stores.",
  },
  "plugin-creator": {
    "en-US": "Create and validate HCode plugins, and guide local installation and updates.",
  },
  "skill-creator": {
    "en-US": "Create new skills, edit existing skills, and iterate wording. Use for writing SKILL.md from scratch, improving skills, capturing repeated workflows, or tuning descriptions for reliable triggering.",
  },
  "subagent-driven-development": {
    "en-US": "Use when executing implementation plans with independent tasks in the current session.",
  },
  "systematic-debugging": {
    "en-US": "Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes.",
  },
  "test-driven-development": {
    "en-US": "Use when implementing any feature or bugfix, before writing implementation code.",
  },
  "using-git-worktrees": {
    "en-US": "Use when starting feature work that needs isolation or before executing implementation plans. Ensures an isolated workspace exists via native tools or git worktree fallback.",
  },
  "using-superpowers": {
    "en-US": "Use when starting any conversation. Establishes how to find and use skills, requiring Skill tool invocation before any response including clarifying questions.",
  },
  "verification-before-completion": {
    "en-US": "Use before claiming work is complete, fixed, or passing. Requires running verification commands and confirming output before success claims.",
  },
  "web-gui-tester": {
    "en-US":
      "Run pure GUI black-box tests against websites and local web frontends with HCode Browser Use, combining real user interactions, semantic DOM evidence, and inspected screenshots.",
  },
  "writing-plans": {
    "en-US": "Use when you have a spec or requirements for a multi-step task, before touching code.",
  },
  "writing-skills": {
    "en-US": "Use when creating new skills, editing existing skills, or verifying skills work before deployment.",
  },
};

export function resolveSkillSourceLabel(scope: SkillScope): string {
  if (scope === "workspace") return "Workspace";
  if (scope === "plugin") return "Plugin";
  return "User";
}

export function resolveSkillDisplayDescription(
  skill: SkillDisplayCandidate,
  locale?: Locale,
): string {
  const descriptions = isOfficialBuiltinSkill(skill)
    ? BUILTIN_SKILL_DESCRIPTIONS[skill.name]
    : undefined;
  const localized = descriptions?.[locale ?? "en-US"] ?? descriptions?.["en-US"];
  return localized ?? skill.description;
}

function isOfficialBuiltinSkill(skill: SkillDisplayCandidate): boolean {
  if (skill.scope !== "plugin") {
    return false;
  }
  const pluginName = skill.pluginName?.trim();
  if (pluginName && OFFICIAL_BUILTIN_PLUGIN_NAMES.has(pluginName)) {
    return true;
  }
  const normalizedPath = skill.path.replaceAll("\\", "/");
  return OFFICIAL_PLUGIN_PATH_MARKERS.some((marker) => normalizedPath.includes(marker));
}
