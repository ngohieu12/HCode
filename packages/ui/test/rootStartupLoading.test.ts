import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as startupLoadingModule from "@/root/RootStartupLoading.js";
import { RootStartupLoading } from "@/root/RootStartupLoading.js";

describe("RootStartupLoading", () => {
  it("启动阻塞态用中性加载指示替代旧品牌图标，且不渲染可见 loading 文案", () => {
    const html = renderToStaticMarkup(createElement(RootStartupLoading, { label: "加载中..." }));

    expect(html).toContain('data-testid="root-startup-loading"');
    expect(html).toContain('aria-label="加载中..."');
    expect(html).toContain("animate-spin");
    expect(html).toContain("bg-background");
    expect(html).not.toContain("<animate");
    expect(html).not.toContain("viewBox=\"0 0 256 218\"");
    expect(html).not.toContain(">加载中...<");
  });

  it("不再导出旧品牌标志组件", () => {
    expect("ZCodeStartupLogoBadge" in startupLoadingModule).toBe(false);
    expect("ZCodeStartupLogo" in startupLoadingModule).toBe(false);
  });
});
