import { useCallback, useEffect, useMemo, useState } from "react";
import { SHORTCUT_COMMANDS, type ShortcutCommandId } from "@zcode/shared";
import { usePlatform } from "@/hooks/usePlatform.js";
import { useSettings } from "@/hooks/useSettingService.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { isSamePhysicalBinding } from "@/shortcuts/conflicts.js";
import { formatShortcutBindingLabel } from "@/shortcuts/label.js";
import { useComposerEnterBehavior } from "@/shortcuts/useShortcutBindings.js";
import {
  resolveEffectiveShortcutBindings,
  setShortcutRecordingActive,
} from "@/shortcuts/bindings.js";
import { ShortcutBindingRow } from "./ShortcutBindingRow.js";
import { ShortcutSearchBar } from "./ShortcutSearchBar.js";
import { useShortcutKeySearch } from "./useShortcutKeySearch.js";

/**
 * 快捷键设置分区（只读）：展示命令表与当前生效键位，支持文本搜索与按组合键搜索。
 *
 * 本页不提供任何修改入口（录制 / 删除单条 / 清空 / 恢复默认都已移除），
 * 键位只读展示；用户已有的 shortcutBindings 覆盖仍由内核按原语义解析并生效，
 * 只是不能再从 UI 写入。按键搜索武装态仍需要键盘独占（显式捕获组合键、不触发命令）。
 */
export function ShortcutSettingsSection() {
  const { intl } = useZCodeIntl();
  const { settings } = useSettings();
  const platform = usePlatform();
  const [query, setQuery] = useState("");
  const keySearch = useShortcutKeySearch();

  const overrides = settings?.shortcutBindings;
  // composer 两条命令的默认键随 Enter 模式变化，展示要按同一模式解析
  const composerEnterBehavior = useComposerEnterBehavior();
  const effective = useMemo(
    () => resolveEffectiveShortcutBindings(overrides, composerEnterBehavior),
    [overrides, composerEnterBehavior],
  );
  const commandLabel = useCallback(
    (commandId: ShortcutCommandId) =>
      intl.formatMessage({ id: `settings.shortcuts.command.${commandId}` }),
    [intl],
  );

  const visibleCommands = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    // 取局部变量：some 回调闭包里 TS 无法保持 keySearch.binding 的非空收窄
    const keyBinding = keySearch.binding;
    return SHORTCUT_COMMANDS.filter((entry) => {
      // 这些快捷键保留注册，但不在用户可见列表中展示。
      if (entry.id === "openOnboarding") return false;
      const matchesText =
        !keyword ||
        entry.id.toLowerCase().includes(keyword) ||
        commandLabel(entry.id).toLowerCase().includes(keyword);
      // 按键过滤沿用物理等价口径（win 的 Ctrl+m ≡ CmdOrCtrl+m）
      const matchesKey =
        keyBinding === null ||
        (effective[entry.id] ?? []).some((binding) => isSamePhysicalBinding(binding, keyBinding));
      return matchesText && matchesKey;
    });
  }, [commandLabel, effective, keySearch.binding, query]);

  // 按键搜索武装态仍要抑制全局快捷键分发：监听注册晚于 useAppKeyboard 的 capture 监听，
  // 不抑制的话按下的组合会先触发原命令，搜索永远捕获不到。menu 通道靠 main 摘除 accelerator
  // （macOS 系统菜单先于 renderer 吃键，preventDefault 拦不住）。
  useEffect(() => {
    if (!keySearch.armed) {
      return;
    }
    setShortcutRecordingActive(true);
    platform.setShortcutRecordingActive?.(true);
    return () => {
      setShortcutRecordingActive(false);
      platform.setShortcutRecordingActive?.(false);
    };
  }, [keySearch.armed, platform]);

  return (
    <div className="space-y-4" data-testid="settings-shortcuts-section">
      <ShortcutSearchBar query={query} onQueryChange={setQuery} keySearch={keySearch} />

      <p className="text-ui-sm text-foreground-subtle">
        {intl.formatMessage({ id: "settings.shortcuts.readOnlyHint" })}
      </p>

      <div className="overflow-hidden rounded-xl border border-border hcode-dark:bg-surface">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_80px] bg-surface px-4 py-3 text-ui-sm text-foreground-subtle">
          <span>{intl.formatMessage({ id: "settings.shortcuts.columnHeaderCommand" })}</span>
          <span>{intl.formatMessage({ id: "settings.shortcuts.columnHeaderBinding" })}</span>
          <span>{intl.formatMessage({ id: "settings.shortcuts.columnHeaderScope" })}</span>
        </div>
        {visibleCommands.map((entry) => (
          <ShortcutBindingRow
            key={entry.id}
            entry={entry}
            commandLabel={commandLabel(entry.id)}
            bindings={effective[entry.id] ?? []}
          />
        ))}
        {visibleCommands.length === 0 ? (
          <div
            className="border-t border-border px-4 py-8 text-center text-ui-sm text-foreground-subtle"
            data-testid="settings-shortcut-search-empty"
          >
            {keySearch.binding !== null
              ? intl.formatMessage(
                  { id: "settings.shortcuts.keySearchEmpty" },
                  { keys: formatShortcutBindingLabel(keySearch.binding) },
                )
              : intl.formatMessage({ id: "settings.shortcuts.searchEmpty" })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
