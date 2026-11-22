import { describe, expect, it, vi } from "vitest";
import { createHttpClient } from "../src/api/http.js";
import type { AppError } from "../src/errors.js";

const url = "https://api.test/cities.json";

describe("createHttpClient", () => {
  it("returns parsed JSON", async () => {
    const http = createHttpClient({
      timeoutMs: 1000,
      fetchImpl: vi.fn().mockResolvedValue(new Response('[{"id":"karachi"}]')),
    });
    await expect(http.getJson(url)).resolves.toEqual([{ id: "karachi" }]);
  });

  it("maps non-2xx responses to NETWORK", async () => {
    const http = createHttpClient({
      timeoutMs: 1000,
      fetchImpl: vi.fn().mockResolvedValue(new Response("nope", { status: 503 })),
    });
    await expect(http.getJson(url)).rejects.toMatchObject({
      code: "NETWORK",
      retryable: true,
    });
  });

  it("maps invalid JSON to INVALID_DATA", async () => {
    const http = createHttpClient({
      timeoutMs: 1000,
      fetchImpl: vi.fn().mockResolvedValue(new Response("not json")),
    });
    await expect(http.getJson(url)).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("rejects oversized declared responses", async () => {
    const response = new Response("[]", {
      headers: { "content-length": "999999" },
    });
    const http = createHttpClient({
      timeoutMs: 1000,
      maxResponseBytes: 10,
      fetchImpl: vi.fn().mockResolvedValue(response),
    });
    await expect(http.getJson(url)).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("maps timeouts to NETWORK", async () => {
    const fetchImpl = (_input: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const http = createHttpClient({ timeoutMs: 5, fetchImpl });
    let failure: AppError | undefined;
    try {
      await http.getJson(url);
    } catch (error) {
      failure = error as AppError;
    }
    expect(failure?.code).toBe("NETWORK");
    expect(failure?.retryable).toBe(true);
    expect(failure?.message).toContain("Timed out");
  });
});
