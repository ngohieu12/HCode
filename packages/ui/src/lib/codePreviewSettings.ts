/**
 * 代码预览设置的类型与默认值。
 *
 * 独立的中立模块：若定义在 zustand store（@/store/index.ts）里，
 * 纯展示组件（ai-elements / ToolCallBlocks）为了拿类型和默认值就要依赖 store。
 * store 只做 re-export，展示组件改为 props 传入 + 本模块默认值兜底。
 *
 * 代码配色已移除用户选择（设置页不再提供主题选择），统一使用这里的默认高亮主题。
 */
import type { BundledTheme } from "shiki";

export const CODE_PREVIEW_LIGHT_THEME: BundledTheme = "github-light";
export const CODE_PREVIEW_DARK_THEME: BundledTheme = "github-dark";
/** 代码高亮统一的 [浅色, 深色] 主题对，供需要成对传参的渲染器直接复用。 */
export const CODE_PREVIEW_SHIKI_THEMES: [BundledTheme, BundledTheme] = [
  CODE_PREVIEW_LIGHT_THEME,
  CODE_PREVIEW_DARK_THEME,
];

export interface CodePreviewSettings {
  showLineNumbers: boolean;
  wrapLongLines: boolean;
  fontSizePx: number;
}

export const DEFAULT_CODE_PREVIEW_SETTINGS: CodePreviewSettings = {
  showLineNumbers: true,
  wrapLongLines: false,
  fontSizePx: 12,
};
