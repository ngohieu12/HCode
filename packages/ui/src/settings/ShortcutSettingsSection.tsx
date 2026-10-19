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
import { ShortcutBindingRow, type RecordingState } from "@/settings/ShortcutBindingRow.js";
import { ShortcutSearchBar } from "@/settings/ShortcutSearchBar.js";
import { useShortcutKeySearch } from "@/settings/useShortcutKeySearch.js";
import { useShortcutRecording } from "@/settings/useShortcutRecording.js";

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
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

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

  const persistBindings = useCallback(
    async (next: Record<string, string[]>) => {
      if (savingRef.current) {
        return;
      }
      // 原因：仅用 ref 拦截会静默丢弃后续点击；保存态同步禁用入口，直到权威快照刷新完成。
      savingRef.current = true;
      setSaving(true);
      setSaveFailed(false);
      setRecording(null);
      try {
        await update({ shortcutBindings: next });
      } catch (error) {
        logger.error("[shortcuts] 保存快捷键绑定失败", { error: String(error) });
        setSaveFailed(true);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [update],
  );

  /** 追加一条（占位行录第一条也走这里：生效列表为空时等价于写入第一条）。 */
  const appendBinding = useCallback(
    (commandId: ShortcutCommandId, binding: string) => {
      void persistBindings(buildShortcutOverridesAfterAppend(overrides, commandId, binding));
    },
    [overrides, persistBindings],
  );

  /** 替换生效列表第 bindingIndex 条（覆盖整组替换语义，须写完整生效列表）。 */
  const replaceBindingAt = useCallback(
    (commandId: ShortcutCommandId, bindingIndex: number, binding: string) => {
      void persistBindings(
        buildShortcutOverridesWithBindingAt(overrides, commandId, bindingIndex, binding),
      );
    },
    [overrides, persistBindings],
  );

  /**
   * 二次确认后的抢绑：目标命令按录制时的行级语义写入新键（replace 指定条 / 未分配录
   * 第一条 → append），并从占用命令移除冲突键。抢绑只改变冲突处理方式，不改变用户
   * 原本选择的行级操作（多绑定命令抢绑不得静默删除其余绑定）。
   */
  const stealBinding = useCallback(
    (commandId: ShortcutCommandId, binding: string) => {
      const next = buildShortcutOverridesAfterSteal(overrides, commandId, binding, {
        mode: recording?.mode,
        bindingIndex: recording?.bindingIndex,
      });
      void persistBindings(next);
    },
    [overrides, persistBindings, recording],
  );

  /** 操作列垃圾桶「清除」= 清空该命令全部绑定 = 未分配：覆盖写显式空数组，不回退默认
   * （含 menu 通道 accelerator 摘除）。与录制态 Backspace 的「恢复默认」是两个语义。 */
  const clearAllBindings = useCallback(
    (commandId: ShortcutCommandId) => {
      void persistBindings({ ...overrides, [commandId]: [] });
    },
    [overrides, persistBindings],
  );

  /**
   * 录制态 Backspace「恢复默认」= 删除覆盖条目。默认键被同作用域其他命令占用
   * （含物理等价，如 win 的 Ctrl+m ≡ CmdOrCtrl+m）时提示冲突且不落盘——恢复默认与录制
   * 是同一不变量（一键一命令）的两个入口；按用户口径只提示不自动清占用方。
   */
  const clearBinding = useCallback(
    (commandId: ShortcutCommandId) => {
      if (overrides?.[commandId] === undefined) {
        return;
      }
      const defaultBinding = getDefaultShortcutBindings(commandId)[0];
      if (defaultBinding) {
        const conflict = checkShortcutBindingConflict(commandId, defaultBinding, overrides, {
          menuChannelReserved: !isDesktop,
        });
        if (conflict?.kind === "occupied" && conflict.ownerCommandId) {
          toast(
            intl.formatMessage(
              { id: "settings.shortcuts.clearConflict" },
              { command: commandLabel(conflict.ownerCommandId) },
            ),
          );
          return;
        }
      }
      const next = { ...overrides };
      delete next[commandId];
      void persistBindings(next);
    },
    [overrides, persistBindings, isDesktop, intl, commandLabel],
  );

  // 「全部恢复默认」是破坏性操作（清空全部自定义键位覆盖），复用全局确认弹窗（Promise 式）防一键误触
  const requestConfirmation = useConfirmDialogStore((state) => state.requestConfirmation);
  const resetAll = useCallback(async () => {
    if (!overrides || Object.keys(overrides).length === 0) {
      return;
    }
    const confirmed = await requestConfirmation({
      confirmVariant: "destructive",
      title: intl.formatMessage({ id: "settings.shortcuts.resetAllConfirmTitle" }),
      description: intl.formatMessage({ id: "settings.shortcuts.resetAllConfirmDescription" }),
    });
    if (confirmed) {
      void persistBindings({});
    }
  }, [overrides, persistBindings, requestConfirmation, intl]);

  // 录制态抑制：录制监听注册晚于 useAppKeyboard 的 capture 监听（同阶段先注册先执行），
  // 不抑制的话录制按下的组合会先触发原命令，改键永远不成功。
  // renderer 通道靠内核标记短路 useAppKeyboard；menu 通道靠 main 摘除菜单 accelerator
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
    <div className="min-w-0 space-y-6" aria-busy={saving} data-testid="settings-shortcuts-section">
      <ShortcutSearchBar
        query={query}
        onQueryChange={setQuery}
        keySearch={keySearch}
        // 与行内录制互斥：武装前取消进行中的录制，两套 window capture 监听不并存
        onArmKeySearch={() => setRecording(null)}
        actions={
          <Button
            variant="outline"
            onClick={resetAll}
            disabled={saving || !settings || !overrides || Object.keys(overrides).length === 0}
            data-testid="settings-shortcut-reset-all"
          >
            <RotateCcw className="size-3.5" />
            {intl.formatMessage({ id: saving ? "common.saving" : "settings.shortcuts.resetAll" })}
          </Button>
        }
      />

      {saveFailed ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-ui-base text-destructive"
          data-testid="settings-shortcut-save-error"
        >
          {intl.formatMessage({ id: "settings.shortcuts.saveFailed" })}
        </div>
      ) : null}
      <div className="min-w-0 rounded-xl border border-card-border">
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_80px_40px] rounded-t-xl bg-surface sm:grid px-4 py-3 text-ui-sm text-foreground-subtle">
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
            saving={saving || !settings}
            isOverridden={overrides?.[entry.id] !== undefined}
            isRecording={recordingCommandId === entry.id}
            recording={recording}
            menuChannelUnavailable={entry.channel === "menu" && !isDesktop}
            onRecord={(bindingIndex) => {
              // 行内录制与按键搜索武装态互斥：两套 window capture 监听并存会互相吞键
              keySearch.disarm();
              setRecording({
                commandId: entry.id,
                mode: "replace",
                bindingIndex,
                preview: null,
                error: null,
                conflictBinding: null,
              });
            }}
            onSteal={(binding) => {
              stealBinding(entry.id, binding);
              setRecording(null);
            }}
            onClearAll={() => clearAllBindings(entry.id)}
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
