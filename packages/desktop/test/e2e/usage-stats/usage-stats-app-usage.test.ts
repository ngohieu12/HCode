import {
  TID_SETTINGS_SECTION_NAV,
  TID_SETTINGS_USAGE_TAB,
  TID_TASK_SETTINGS_BUTTON,
  testId,
} from "@zcode/shared/test-ids";
import {
  clearAppData,
  clickTestIdByDom,
  getE2EAppDataPaths,
  waitForDefaultWorkspaceReady,
} from "../helpers/desktop-app.js";
import { clearAppUsageE2EFixture } from "../helpers/usage-stats-app-usage-fixture.js";

describe("Usage Stats App Usage E2E", () => {
  after(async () => {
    await clearAppData();
  });

  it("US-AU-02/03/04/05: 聚合、range 与模型用量表格", async function () {
    this.timeout(120_000);
    await openAppUsage();

    await assertBodyIncludes(["e2e-model-alpha", "e2e-model-beta"]);
    // 图表现已整体移除：不再有热力图与每日趋势图，模型用量改为表格。
    await assertBodyExcludes(["Token Activity", "Token 活动"]);
    await assertBodyExcludes(["Daily Token Trend", "每日 Token 趋势图"]);
    await assertBodyIncludesAny(["Model Usage", "模型用量", "Mức sử dụng model"]);
    // 表格两列数值都可排序：表头是按钮。
    await assertBodyIncludesAny(["Tokens", "Token 用量"]);
    await assertBodyIncludesAny(["Requests", "请求数"]);
    // tokenNumberFormat 按 locale compact：英文为 9.5K，中文在 1 万以下保留 9510。
    await assertBodyIncludesAny(["9.5K", "9,510", "9510"]);

    await clickButtonByText(["Last 7 days", "近 7 日"]);
    await assertPressedButton(["Last 7 days", "近 7 日"]);
    await assertBodyIncludes(["e2e-model-alpha", "e2e-model-beta"]);
    // 7d 使用精确时间戳边界，恰好第 7 天的 fixture 会落在窗口外。
    await assertBodyIncludesAny(["2.4K", "2,406", "2406"]);

    await clickButtonByText(["Last 30 days", "近 30 日"]);
    await assertPressedButton(["Last 30 days", "近 30 日"]);
    await assertBodyIncludes(["e2e-model-gamma"]);
    await assertBodyIncludesAny(["4.5K", "4,510", "4510"]);
  });

  it("US-AU-01: usage facts 清空后显示确定空态", async function () {
    this.timeout(60_000);
    clearAppUsageE2EFixture(getE2EAppDataPaths().homeDir);
    await clickButtonByText(["Refresh", "刷新"]);
    await browser.waitUntil(
      async () => {
        const body = await $("body").getText();
        return /No usage data yet|还没有可展示的数据/.test(body);
      },
      { timeout: 20_000, timeoutMsg: "清空 usage facts 后没有显示 App Usage 空态" },
    );
    await assertBodyExcludes(["e2e-model-alpha", "e2e-model-gamma"]);
  });
});

async function openAppUsage(): Promise<void> {
  await waitForDefaultWorkspaceReady(60_000);
  await clickTestIdByDom(TID_TASK_SETTINGS_BUTTON, {
    timeout: 20_000,
    timeoutMsg: "App Usage E2E 无法打开设置页",
  });
  await clickTestIdByDom(testId(TID_SETTINGS_SECTION_NAV, "usage"), {
    timeout: 20_000,
    timeoutMsg: "设置页 Usage 分区没有出现",
  });
  await clickTestIdByDom(testId(TID_SETTINGS_USAGE_TAB, "app"), {
    timeout: 20_000,
    timeoutMsg: "App Usage tab 没有出现",
  });
  await browser.waitUntil(
    async () => /Model Usage|模型用量|Mức sử dụng model/i.test(await $("body").getText()),
    { timeout: 30_000, timeoutMsg: "App Usage 数据没有完成加载" },
  );
}

async function clickButtonByText(labels: string[]): Promise<void> {
  for (const button of await $$("button")) {
    if (labels.includes((await button.getText()).trim())) {
      await button.click();
      return;
    }
  }
  throw new Error(`找不到按钮: ${labels.join("/")}`);
}

async function assertPressedButton(labels: string[]): Promise<void> {
  await browser.waitUntil(
    async () =>
      browser.execute((candidateLabels) => {
        const target = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (button) => candidateLabels.includes(button.textContent?.trim() ?? ""),
        );
        return target?.getAttribute("data-state") === "active";
      }, labels),
    { timeout: 10_000, timeoutMsg: `${labels.join("/")} 没有进入 active 状态` },
  );
}

async function assertBodyIncludes(values: string[]): Promise<void> {
  await browser.waitUntil(
    async () => {
      const body = await $("body").getText();
      const normalizedBody = body.toLocaleLowerCase();
      return values.every((value) => normalizedBody.includes(value.toLocaleLowerCase()));
    },
    { timeout: 20_000, timeoutMsg: `页面缺少文本: ${values.join(", ")}` },
  );
}

async function assertBodyIncludesAny(values: string[]): Promise<void> {
  await browser.waitUntil(
    async () => {
      const body = await $("body").getText();
      const normalizedBody = body.toLocaleLowerCase();
      return values.some((value) => normalizedBody.includes(value.toLocaleLowerCase()));
    },
    { timeout: 20_000, timeoutMsg: `页面未出现任一文本: ${values.join(", ")}` },
  );
}

async function assertBodyExcludes(values: string[]): Promise<void> {
  await browser.waitUntil(
    async () => {
      const body = await $("body").getText();
      return values.every((value) => !body.includes(value));
    },
    { timeout: 20_000, timeoutMsg: `页面仍包含文本: ${values.join(", ")}` },
  );
}
