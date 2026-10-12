import type { Theme } from "@/useTheme.js";
import { useState } from "react";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button.js";
import { useDesktopZoomControls } from "@/hooks/useDesktopZoomControls.js";
import { Card, CardContent } from "@/components/ui/card.js";
import { Input } from "@/components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { SettingsRow } from "@/settings/SettingsPageParts.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { THEME_MODES } from "@/settings/settingsPageConfig.js";
import { MAX_UI_FONT_SIZE_PX, MIN_UI_FONT_SIZE_PX } from "@/lib/uiFontSize.js";

function FontSizeInput({
  value,
  min,
  max,
  ariaLabel,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = draft.trim() === "" ? Number.NaN : Number(draft);
    const nextValue = Number.isFinite(parsed)
      ? Math.min(max, Math.max(min, Math.round(parsed)))
      : value;
    setDraft(String(nextValue));
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <div className="relative w-28">
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft}
        aria-label={ariaLabel}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            event.preventDefault();
            setDraft(String(value));
          }
        }}
        className="pr-8 text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-ui-lg text-foreground-subtle">
        px
      </span>
    </div>
  );
}

export function AppearanceSectionContent({
  theme,
  setTheme,
  uiFontSizePx,
  setUiFontSizePx,
  isDesktop = false,
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  uiFontSizePx: number;
  setUiFontSizePx: (fontSizePx: number) => void;
  isDesktop?: boolean;
}) {
  const { intl } = useZCodeIntl();
  // 界面缩放原在账户菜单中，菜单移除后迁入这里；仅桌面端有意义。
  const zoom = useDesktopZoomControls(isDesktop);

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h3 className="text-ui-lg font-semibold text-foreground">
          {intl.formatMessage({ id: "settings.appearance.interfaceTitle" })}
        </h3>
        <p className="mt-1 text-ui-base leading-6 text-foreground-subtle">
          {intl.formatMessage({
            id: "settings.appearance.interfaceDescription",
          })}
        </p>
      </div>
      <Card className="border border-border bg-card py-0 shadow-none">
        <CardContent className="space-y-0 px-0">
          <SettingsRow
            label={intl.formatMessage({ id: "settings.themeMode" })}
            description={intl.formatMessage({
              id: "settings.themeModeDescription",
            })}
            control={
              <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                <SelectTrigger size="lg" className="w-[260px] min-w-0 justify-between">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEME_MODES.map(({ mode, icon: Icon }) => (
                    <SelectItem key={mode} value={mode}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-4" />
                        {intl.formatMessage({
                          id: `settings.themeMode.${mode}`,
                        })}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <SettingsRow
            label={intl.formatMessage({ id: "settings.uiFontSize" })}
            description={intl.formatMessage({
              id: "settings.uiFontSizeDescription",
            })}
            control={
              <FontSizeInput
                key={uiFontSizePx}
                min={MIN_UI_FONT_SIZE_PX}
                max={MAX_UI_FONT_SIZE_PX}
                value={uiFontSizePx}
                onChange={setUiFontSizePx}
                ariaLabel={intl.formatMessage({ id: "settings.uiFontSize" })}
              />
            }
          />
          {isDesktop ? (
            <SettingsRow
              label={intl.formatMessage({ id: "sidebar.settings.interfaceZoom" })}
              description={intl.formatMessage({ id: "settings.appearance.zoomDescription" })}
              control={
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    title={intl.formatMessage({ id: "titleBar.menu.view.zoomOut" })}
                    aria-label={intl.formatMessage({ id: "titleBar.menu.view.zoomOut" })}
                    disabled={!zoom.canZoomOut}
                    onClick={zoom.zoomOut}
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    title={intl.formatMessage({ id: "titleBar.menu.view.actualSize" })}
                    aria-label={intl.formatMessage({ id: "titleBar.menu.view.actualSize" })}
                    disabled={!zoom.canResetZoom}
                    onClick={zoom.resetZoom}
                  >
                    <Maximize className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    title={intl.formatMessage({ id: "titleBar.menu.view.zoomIn" })}
                    aria-label={intl.formatMessage({ id: "titleBar.menu.view.zoomIn" })}
                    disabled={!zoom.canZoomIn}
                    onClick={zoom.zoomIn}
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                </div>
              }
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
