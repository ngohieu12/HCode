import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

it("内嵌网页导航保留顶部和左右间距，移除底部内边距", async () => {
  const source = await readFile("packages/ui/src/components/EmbeddedWebsiteHeader.tsx", "utf8");
  expect(source).toContain('className="bg-background px-6 py-4 pb-0 max-sm:px-4"');
});

it("菜单保留邀请好友及奖励徽标，页面标题独立为奖励中心", async () => {
  expect(await readFile("packages/ui/src/i18n/locales/en-US.ts", "utf8")).toContain(
    '"rewards.menuTitle": "Refer a friend"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/en-US.ts", "utf8")).toContain(
    '"rewards.menuBadge": "Rewards"',
  );
  expect(await readFile("packages/ui/src/i18n/locales/en-US.ts", "utf8")).toContain(
    '"rewards.title": "Rewards"',
  );
it("真实入口 JSX 在匿名时不渲染，登录后展示邀请好友和奖励徽标", async () => {
  const source = await readFile("packages/ui/src/WorkspaceSidebarFooter.tsx", "utf8");
  const end = source.indexOf("{onLogin && !user");
  const start = source.lastIndexOf("{user ? (", end);
  const expression = source.slice(start, end).trim().slice(1, -1);
  const script = ts.transpileModule(`const result = (${expression}); result;`, {
    compilerOptions: { jsx: ts.JsxEmit.React },
    fileName: "entry.tsx",
  }).outputText;
  const render = (user: object | null) =>
    renderToStaticMarkup(
      runInNewContext(script, {
        React,
        user,
        DropdownMenuItem: "div",
        Gift: "svg",
        Badge: "span",
        intl: { formatMessage: ({ id }: { id: string }) => id },
        openRewards: () => {},
      }),
    );
  expect(render(null)).toBe("");
  expect(render({ id: "test-user" })).toContain('data-testid="rewards-menu-item"');
  expect(render({ id: "test-user" })).toContain('data-testid="rewards-reward-badge"');
});
