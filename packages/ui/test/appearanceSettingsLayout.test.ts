import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import enUS from "../src/i18n/locales/en-US.js";
import zhCN from "./fixtures/zhCNLegacy.js";
import viVN from "../src/i18n/locales/vi-VN.js";

describe("appearance settings layout", () => {

  it("把实时预览统一命名为代码预览", () => {
    expect(zhCN["settings.uiFontSize"]).toBe("界面字号");
    expect(zhCN["settings.appearance.interfaceTitle"]).toBe("界面设置");
    expect(zhCN["settings.appearance.codeTitle"]).toBe("代码设置");
    expect(zhCN["settings.previewSectionTitle"]).toBe("代码预览");
    expect(enUS["settings.appearance.interfaceTitle"]).toBe("Interface Setting");
    expect(enUS["settings.appearance.codeTitle"]).toBe("Code settings");
    expect(enUS["settings.previewSectionTitle"]).toBe("Code preview");
  });

  it("语言选项除系统默认外使用对应语言自名", () => {
    // Bugfix: 固定语言项表示目标语言本身，不能随当前 UI locale 翻译成另一种写法。
    expect(enUS["settings.locale.system"]).toBe("System default");
    expect(viVN["settings.locale.system"]).toBe("Theo hệ thống");
    expect(enUS["settings.locale.en-US"]).toBe("English");
    expect(viVN["settings.locale.vi-VN"]).toBe("Tiếng Việt");
    expect(viVN["settings.locale.en-US"]).toBe("English");
  });

  it("文案描述可见效果，不再声称修改 rem 布局或显示右侧单一预览", () => {
    expect(zhCN["settings.appearance.interfaceDescription"]).toBe(
      "设置应用主题和界面文字大小。",
    );
    expect(zhCN["settings.uiFontSizeDescription"]).toContain("图标和布局尺寸不受影响");
    expect(zhCN["settings.previewDescription"]).toContain("同时预览浅色与深色代码主题");
    expect(enUS["settings.uiFontSizeDescription"]).toContain(
      "without changing icons or layout dimensions",
    );
    expect(enUS["settings.previewDescription"]).toContain(
      "Preview the light and dark code themes together",
    );

    for (const copy of [
      zhCN["settings.appearance.interfaceDescription"],
      zhCN["settings.uiFontSizeDescription"],
      zhCN["settings.previewDescription"],
      enUS["settings.appearance.interfaceDescription"],
      enUS["settings.uiFontSizeDescription"],
      enUS["settings.previewDescription"],
    ]) {
      expect(copy.toLowerCase()).not.toContain("rem");
      expect(copy).not.toContain("右侧");
      expect(copy.toLowerCase()).not.toContain("on the right");
    }
  });
});
