import { Briefcase, Code2 } from "lucide-react";
import { cn } from "@/components/lib/utils.js";
import { Button } from "@/components/ui/button.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { type InterfaceMode } from "@/lib/interfaceMode.js";
import { useZCodeStore } from "@/store/StoreProvider.js";

// 界面模式（编程 / 办公）放在侧栏最上方，直接可见，不再藏在账户菜单的子菜单里。
// 状态仍由 store 的 interfaceMode 持有，与设置页保持同一来源。
const MODE_OPTIONS: ReadonlyArray<{
  value: InterfaceMode;
  labelId: string;
  icon: typeof Code2;
}> = [
  { value: "coding", labelId: "settings.interfaceMode.coding", icon: Code2 },
  { value: "office", labelId: "settings.interfaceMode.office", icon: Briefcase },
];

export function WorkspaceInterfaceModeSwitch() {
  const { intl } = useZCodeIntl();
  const interfaceMode = useZCodeStore((state) => state.interfaceMode);
  const setInterfaceMode = useZCodeStore((state) => state.setInterfaceMode);

  return (
    <div
      role="group"
      aria-label={intl.formatMessage({ id: "settings.interfaceMode" })}
      className="grid grid-cols-2 gap-1"
    >
      {MODE_OPTIONS.map(({ value, labelId, icon: Icon }) => {
        const active = interfaceMode === value;
        return (
          <Button
            key={value}
            variant="ghost"
            size="lg"
            aria-pressed={active}
            data-testid={`interface-mode-${value}`}
            onClick={() => setInterfaceMode(value)}
            className={cn(
              "w-full justify-center gap-2 text-foreground hover:bg-surface-hover hover:text-foreground",
              active && "bg-selected text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="min-w-0 truncate">{intl.formatMessage({ id: labelId })}</span>
          </Button>
        );
      })}
    </div>
  );
}
