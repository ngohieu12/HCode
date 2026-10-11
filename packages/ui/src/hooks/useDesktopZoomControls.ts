import { useCallback, useEffect, useState } from "react";
import { DesktopCommandIds } from "@zcode/shared";
import { usePlatform } from "@/hooks/usePlatform.js";

export const DESKTOP_ZOOM_MIN_LEVEL = -3;
export const DESKTOP_ZOOM_MAX_LEVEL = 5;

/**
 * 桌面端界面缩放的状态与命令。
 * 账户菜单移入设置页后，缩放按钮只在“外观”分区使用；快捷键仍由菜单与全局分发处理。
 */
export function useDesktopZoomControls(isDesktop: boolean) {
  const platform = usePlatform();
  const [zoomLevel, setZoomLevel] = useState(0);

  useEffect(() => {
    if (!isDesktop) {
      setZoomLevel(0);
      return;
    }

    let isCancelled = false;
    void platform.getDesktopZoomLevel?.().then((state) => {
      if (!isCancelled && Number.isFinite(state.zoomLevel)) {
        setZoomLevel(state.zoomLevel);
      }
    });

    const dispose = platform.onDesktopZoomLevelChanged?.((state) => {
      if (Number.isFinite(state.zoomLevel)) {
        setZoomLevel(state.zoomLevel);
      }
    });

    return () => {
      isCancelled = true;
      dispose?.();
    };
  }, [isDesktop, platform]);

  const runCommand = useCallback(
    (command: (typeof DesktopCommandIds)["ZoomIn" | "ZoomOut" | "ResetZoom"]) => {
      void platform.executeDesktopCommand(command);
    },
    [platform],
  );

  return {
    zoomLevel,
    canZoomIn: zoomLevel < DESKTOP_ZOOM_MAX_LEVEL,
    canZoomOut: zoomLevel > DESKTOP_ZOOM_MIN_LEVEL,
    canResetZoom: zoomLevel !== 0,
    zoomIn: () => runCommand(DesktopCommandIds.ZoomIn),
    zoomOut: () => runCommand(DesktopCommandIds.ZoomOut),
    resetZoom: () => runCommand(DesktopCommandIds.ResetZoom),
  };
}
