import { describe, expect, it, vi } from "vitest";
import { createCache } from "../src/api/cache.js";

describe("createCache", () => {
  it("serves fresh entries without reloading", async () => {
    const load = vi.fn().mockResolvedValue("value");
    const cache = createCache();

    await expect(cache.getOrLoad("key", 1000, load)).resolves.toBe("value");
    await expect(cache.getOrLoad("key", 1000, load)).resolves.toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.get("key")).toBe("value");
  });

  it("refetches expired entries", async () => {
    let now = 0;
    const cache = createCache({ now: () => now });
    const load = vi.fn().mockResolvedValueOnce("first").mockResolvedValueOnce("second");

    await expect(cache.getOrLoad("key", 10, load)).resolves.toBe("first");
    now = 11;
    await expect(cache.getOrLoad("key", 10, load)).resolves.toBe("second");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("deduplicates concurrent loads", async () => {
    const cache = createCache();
    let resolveLoad: (value: string) => void = () => undefined;
    const load = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const first = cache.getOrLoad("key", 1000, load);
    const second = cache.getOrLoad("key", 1000, load);
    resolveLoad("shared");

    await expect(Promise.all([first, second])).resolves.toEqual(["shared", "shared"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("evicts failed loads", async () => {
    const cache = createCache();
    const load = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("ok");

    await expect(cache.getOrLoad("key", 1000, load)).rejects.toThrow("down");
    await expect(cache.getOrLoad("key", 1000, load)).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
