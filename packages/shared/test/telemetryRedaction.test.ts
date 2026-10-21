import { describe, expect, it } from "vitest";
import {
  redactTelemetryText,
  redactTelemetryUrl,
  resolveTelemetryProviderScope,
  resolveTelemetryModelId,
  sanitizeTelemetryModelValue,
} from "@zcode/shared";

describe("redactTelemetryText", () => {
  it("把 POSIX 绝对路径归一为占位符，不保留用户名", () => {
    const redacted = redactTelemetryText(
      "ENOENT: no such file or directory, open '/Users/alice/project/src/index.ts'",
    );
    expect(redacted).not.toContain("alice");
    expect(redacted).not.toContain("/Users/");
    expect(redacted).toContain("{path}");
  });

  it("覆盖 /home、/root 与 macOS 临时目录", () => {
    const redacted = redactTelemetryText(
      "read /home/bob/.hcode failed; tmp /var/folders/xy/zz/T/zcode-123 missing",
    );
    expect(redacted).not.toContain("bob");
    expect(redacted).not.toContain("/var/folders");
  });

  it("把 Windows 盘符路径归一为占位符", () => {
    const redacted = redactTelemetryText(String.raw`EPERM C:\Users\carol\AppData\zcode\db.sqlite`);
    expect(redacted).not.toContain("carol");
    expect(redacted).toContain("{path}");
  });

  it("把邮箱归一为占位符", () => {
    expect(redactTelemetryText("login failed for dave@example.com")).toContain("{email}");
    expect(redactTelemetryText("login failed for dave@example.com")).not.toContain("dave@");
  });

  it("移除 URL 的 query 与 fragment，只保留 host 与归一化路由", () => {
    const redacted = redactTelemetryText(
      "GET https://api.example.com/v1/sessions/0f8fad5b-d9cb-469f-a165-70867728950e?token=abc#frag failed",
    );
    expect(redacted).not.toContain("token=abc");
    expect(redacted).not.toContain("0f8fad5b");
    expect(redacted).toContain("https://api.example.com/v1/sessions/{segment}");
  });

  it("遮盖 Authorization、Bearer 与赋值形态的凭据", () => {
    const redacted = redactTelemetryText(
      `authorization: Bearer abc.def.ghi, api_key="topsecretvalue", password=hunter2`,
    );
    expect(redacted).not.toContain("abc.def.ghi");
    expect(redacted).not.toContain("topsecretvalue");
    expect(redacted).not.toContain("hunter2");
  });

  it("遮盖常见密钥字面量", () => {
    const redacted = redactTelemetryText(
      "keys: sk-abcdefghijklmnopqrstuvwx ghp_abcdefghijklmnopqrstu AKIAIOSFODNN7EXAMPLE",
    );
    expect(redacted).not.toContain("sk-abcdefghijklmnopqrstuvwx");
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstu");
    expect(redacted).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("按 maxLength 截断并保留头部", () => {
    const redacted = redactTelemetryText(`HEAD ${"x".repeat(5_000)}`, { maxLength: 100 });
    expect(redacted.length).toBe(100);
    expect(redacted.startsWith("HEAD ")).toBe(true);
  });

  it("空值与非字符串输入返回空串", () => {
    expect(redactTelemetryText("")).toBe("");
    expect(redactTelemetryText(undefined)).toBe("");
  });

  it("不改写普通诊断文本", () => {
    expect(redactTelemetryText("Cannot read properties of undefined (reading 'id')")).toBe(
      "Cannot read properties of undefined (reading 'id')",
    );
  });
});

describe("redactTelemetryUrl", () => {
  it("丢弃 query 与 fragment", () => {
    expect(redactTelemetryUrl("https://zcode.z.ai/api/v1/event/report?a=1&b=2#x")).toBe(
      "https://zcode.z.ai/api/v1/event/report",
    );
  });

  it("把 UUID、长 hash 与邮箱路由段归一", () => {
    expect(
      redactTelemetryUrl("https://h.test/u/eve@example.com/sessions/12345678901234567890"),
    ).toBe("https://h.test/u/{segment}/sessions/{segment}");
  });

  it("file:// 与本地路径归一为 local_file，不暴露目录", () => {
    expect(redactTelemetryUrl("file:///Users/frank/app/index.html")).toBe("local_file");
    expect(redactTelemetryUrl("/Users/frank/app/index.html")).toBe("local_file");
  });

  it("blob 与 data URL 只保留协议标记", () => {
    expect(redactTelemetryUrl("blob:file:///abc-def")).toBe("blob");
    expect(redactTelemetryUrl("data:image/png;base64,AAAA")).toBe("data");
  });

  it("无法解析时返回 unknown，不回退到原值", () => {
    expect(redactTelemetryUrl("!!!")).toBe("unknown");
    expect(redactTelemetryUrl("")).toBe("unknown");
  });
});

describe("resolveTelemetryProviderScope", () => {
  it("自定义 provider 归一为 custom，不泄露用户命名", () => {
    const resolved = resolveTelemetryProviderScope("\u6211\u7684\u5185\u7f51\u4ee3\u7406");
    expect(resolved).toEqual({ providerId: "custom", providerScope: "custom" });
  });

  it("缺失 provider 时 scope 为 unknown", () => {
    expect(resolveTelemetryProviderScope(undefined)).toEqual({
      providerId: "",
      providerScope: "unknown",
    });
  });

  it("内置 provider 已下线：account:* 与 builtin:* 旧身份同样只归一为 custom", () => {
    // 报表里仍可能看到历史会话写下的 account:* / builtin:*；内置供应商已删除，
    // 这些 ID 不再对应任何真实供应商，继续原样上报只会把它们当成稳定 ID 长期留存。
    for (const legacyId of [
      "account:zai-individual-coding-plan",
      "builtin:zai",
      "builtin:bigmodel",
      "builtin:zai-coding-plan",
      "builtin:bigmodel-coding-plan",
      "builtin:zai-start-plan",
      "builtin:bigmodel-start-plan",
      "builtin:my-proxy",
    ]) {
      expect(resolveTelemetryProviderScope(legacyId)).toEqual({
        providerId: "custom",
        providerScope: "custom",
      });
    }
  });

  it("未知的 builtin: 前缀不能借前缀混入内置", () => {
    expect(resolveTelemetryProviderScope("builtin:my-proxy")).toEqual({
      providerId: "custom",
      providerScope: "custom",
    });
  });
});

describe("resolveTelemetryModelId", () => {
  it("任何非空模型 ID 都归一为 custom，不泄露用户命名", () => {
    expect(resolveTelemetryModelId("custom", "GLM-4.6")).toBe("custom");
    expect(resolveTelemetryModelId("custom", "glm-\u672a\u6765\u578b\u53f7")).toBe("custom");
    expect(resolveTelemetryModelId("custom", "internal-llm-v3")).toBe("custom");
  });

  it("scope 未知或模型缺失时留空", () => {
    expect(resolveTelemetryModelId("unknown", "glm-4.6")).toBe("");
    expect(resolveTelemetryModelId("custom", undefined)).toBe("");
  });

  it("复合值与 custom: 编码值也不回显模型名", () => {
    expect(resolveTelemetryModelId("custom", "builtin:zai-start-plan/GLM-5.3")).toBe("custom");
    expect(resolveTelemetryModelId("custom", "custom:builtin%3Azai-start-plan:glm-5.3")).toBe(
      "custom",
    );
  });
});

describe("sanitizeTelemetryModelValue", () => {
  it("内置模型白名单已移除：裸模型 ID 也归一为 custom", () => {
    expect(sanitizeTelemetryModelValue("glm-4.6")).toBe("custom");
    expect(sanitizeTelemetryModelValue("GLM-4.6")).toBe("custom");
    expect(sanitizeTelemetryModelValue("some-internal-model")).toBe("custom");
  });

  it("custom: 编码值不泄露 provider 名与模型名", () => {
    const value = sanitizeTelemetryModelValue("custom:%E5%86%85%E7%BD%91:secret-model");
    expect(value).toBe("custom");
  });

  it("provider/model 复合值按 provider 判定，用户命名不回显", () => {
    expect(sanitizeTelemetryModelValue("account:zai-start-plan/glm-4.6")).toBe("custom");
    expect(sanitizeTelemetryModelValue("my-proxy/secret-model")).toBe("custom");
  });

  it("supervisor 投影出的旧身份复合值与 custom: 编码值都不回显模型名", () => {
    expect(sanitizeTelemetryModelValue("builtin:zai-start-plan/GLM-5.3")).toBe("custom");
    expect(sanitizeTelemetryModelValue("custom:builtin%3Azai-start-plan:glm-5.3")).toBe("custom");
  });

  it("空值保持空，便于与既有留空口径一致", () => {
    expect(sanitizeTelemetryModelValue("")).toBe("");
    expect(sanitizeTelemetryModelValue(undefined)).toBe("");
    expect(sanitizeTelemetryModelValue("   ")).toBe("");
  });
});
