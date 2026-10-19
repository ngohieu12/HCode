import { afterEach, describe, expect, it, vi } from "vitest";
import { createStaticProviderEndpointRoutingPort } from "../src/model/official-coding-plan-gateway.js";
import { createProviderEndpointRoutingFetch } from "../src/model/provider-endpoint-routing-fetch.js";

const ORIGIN = "https://gateway.example.test";
afterEach(() => vi.unstubAllGlobals());

describe("HCode BYOK endpoint routing", () => {
  it.each([
    "https://open.bigmodel.cn/api/anthropic/v1/messages",
    "https://OPEN.BIGMODEL.CN:443/api/anthropic/v1/messages/",
    "https://api.z.ai/api/anthropic/v1/messages",
    "https://provider.example.test/v1/messages",
    "http://127.0.0.1:8080/v1/messages",
    "not a URL",
  ])("never routes %s through a product gateway", async (url) => {
    const network = vi.fn();
    vi.stubGlobal("fetch", network);
    const source = `${url}?id=a%2Bb&empty=`;
    await expect(createStaticProviderEndpointRoutingPort(ORIGIN).resolve(source)).resolves.toEqual({
      routed: false,
      url: source,
    });
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["string", "URL", "Request"])(
    "passes %s input directly to transport without changing credentials",
    async (kind) => {
      const source = "https://api.z.ai/api/anthropic/v1/messages?stream=true";
      const controller = new AbortController();
      const body = JSON.stringify({ stream: true, model: "example" });
      const init = {
        method: "POST",
        body,
        signal: controller.signal,
        headers: { Authorization: "Bearer example", "x-api-key": "example-key" },
      };
      const response = new Response("data: first\n\ndata: second\n\n");
      const network = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response);
      const transport = createProviderEndpointRoutingFetch({
        routingPort: createStaticProviderEndpointRoutingPort(ORIGIN),
        fetch: network,
      });
      const input =
        kind === "Request" ? new Request(source, init) : kind === "URL" ? new URL(source) : source;
      const options = kind === "Request" ? undefined : init;
      expect(await transport(input, options)).toBe(response);
      expect(network).toHaveBeenCalledExactlyOnceWith(input, options);
      const sent = new Request(input, options);
      expect(sent.url).toBe(source);
      expect(sent.headers.get("authorization")).toBe("Bearer example");
      expect(sent.headers.get("x-api-key")).toBe("example-key");
      await expect(sent.text()).resolves.toBe(body);
      controller.abort();
      expect(sent.signal.aborted).toBe(true);
      await expect(response.text()).resolves.toBe("data: first\n\ndata: second\n\n");
    },
  );
});
