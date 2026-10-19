import type { HttpClientRequest } from "@zcode/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCliOAuthClient } from "../src/auth/cli-oauth.js";

afterEach(() => vi.unstubAllEnvs());

describe("HCode legacy OAuth service boundary", () => {
  it.each([
    [undefined, "https://services.hcode.invalid/api/v1/oauth/cli/init"],
    ["https://accounts.example.test/api/v1", "https://accounts.example.test/api/v1/oauth/cli/init"],
  ])("never defaults to an upstream account service (%s)", async (baseUrl, expected) => {
    for (const key of ["ZCODE_BASE_URL", "ZCODE_ENDPOINT_ORIGIN", "ZCODE_PRODUCTION_BASE_URL"]) {
      vi.stubEnv(key, undefined);
    }
    vi.stubEnv("ZCODE_ENV", "production");
    const request = vi.fn(async (_request: HttpClientRequest) => {
      throw new Error("captured without network");
    });
    const client = createCliOAuthClient({ baseUrl, providerId: "zai", httpClient: { request } });
    await expect(client.init({ pollToken: "synthetic-poll-token" })).rejects.toThrow();
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0]?.[0]).toMatchObject({ url: expected, method: "POST" });
  });
});
