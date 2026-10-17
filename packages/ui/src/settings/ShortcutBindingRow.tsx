import type { ShortcutCommandEntry } from "@zcode/shared";
import { Kbd, KbdGroup } from "@/components/ui/kbd.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { formatShortcutBindingLabelParts } from "@/shortcuts/label.js";

interface ShortcutBindingRowProps {
  entry: ShortcutCommandEntry;
  /** i18n 后的命令名（主组件统一格式化后传入）。 */
  commandLabel: string;
  bindings: readonly string[];
}

/**
 * 快捷键设置页的命令行（只读）：左列命令名，中列是该命令当前生效的键位
 * （多绑定时纵向排列），右列作用域。
 * 设置页已不再提供录制/改键入口，因此这里没有任何按钮或可交互元素；
 * 键位只做展示，避免出现「看起来能点、点了没反应」的假交互。
 */
export function ShortcutBindingRow({ entry, commandLabel, bindings }: ShortcutBindingRowProps) {
  const { intl } = useZCodeIntl();

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_80px] items-center border-t border-border px-4 py-3 text-ui-base"
      data-testid={`settings-shortcut-row-${entry.id}`}
    >
      <span className="flex min-w-0 items-center">
        <span className="truncate">{commandLabel}</span>
      </span>
      <span className="flex min-w-0 flex-col items-start gap-1.5">
        {bindings.map((binding, index) => (
          <span
            key={`${binding}-${index}`}
            className="flex flex-wrap items-center gap-1.5"
            data-testid={`settings-shortcut-bind-${entry.id}-${index}`}
          >
            <KbdGroup>
              {formatShortcutBindingLabelParts(binding).map((part, partIndex) => (
                <Kbd key={`${part}-${partIndex}`}>{part}</Kbd>
              ))}
            </KbdGroup>
          </span>
        ))}
        {bindings.length === 0 ? (
          <Kbd data-testid={`settings-shortcut-bind-${entry.id}-unassigned`}>
            {intl.formatMessage({ id: "settings.shortcuts.notSet" })}
          </Kbd>
        ) : null}
      </span>
      {/* 作用域独立成列：global = 全局生效；composer = 仅聊天输入框内生效 */}
      <span
        className="text-ui-sm text-foreground-subtle"
        data-testid={`settings-shortcut-scope-${entry.id}`}
      >
        {entry.scope === "composer"
          ? intl.formatMessage({ id: "settings.shortcuts.scopeComposer" })
          : intl.formatMessage({ id: "settings.shortcuts.scopeGlobal" })}
      </span>
    </div>
  );
}
