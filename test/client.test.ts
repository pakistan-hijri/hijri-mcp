import { describe, expect, it, vi } from "vitest";
import { createCache } from "../src/api/cache.js";
import { createHijriApi } from "../src/api/client.js";
import type { HttpClient } from "../src/api/http.js";
import { fixture } from "./helpers/fixtures.js";

function clientWith(handler: (url: string) => unknown) {
  const getJson = vi.fn(async (url: string) => handler(url));
  const api = createHijriApi({
    baseUrl: "https://api.test/",
    http: { getJson } as HttpClient,
    cache: createCache(),
  });
  return { api, getJson };
}

describe("createHijriApi", () => {
  it("reads validated data from the expected routes", async () => {
    const { api, getJson } = clientWith((url) => {
      if (url.endsWith("/cities.json")) return fixture("cities.json");
      if (url.endsWith("/hijri/index.json")) return fixture("index.json");
      if (url.endsWith("/hijri/calendar/1448.json")) return fixture("calendar-1448.json");
      if (url.endsWith("/prayer/karachi/sunni_hanafi/2026.json")) {
        return fixture("prayer-karachi-2026.json");
      }
      throw new Error(`Unexpected URL ${url}`);
    });

    await expect(api.getCities()).resolves.toHaveLength(2);
    await expect(api.getIndex()).resolves.toMatchObject({ confirmed_days: 532 });
    await expect(api.getCalendar(1448)).resolves.toMatchObject({ hijri_year: 1448 });
    await expect(api.getPrayer("karachi", "sunni_hanafi", 2026)).resolves.toMatchObject({
      city: "karachi",
    });

    expect(getJson).toHaveBeenCalledWith("https://api.test/cities.json");
    expect(getJson).toHaveBeenCalledWith("https://api.test/hijri/index.json");
    expect(getJson).toHaveBeenCalledWith("https://api.test/hijri/calendar/1448.json");
    expect(getJson).toHaveBeenCalledWith(
      "https://api.test/prayer/karachi/sunni_hanafi/2026.json",
    );
  });

  it("rejects unknown cities and profiles", async () => {
    const { api } = clientWith(() => fixture("cities.json"));
    await expect(api.getPrayer("karachi", "bogus" as never, 2026)).rejects.toMatchObject({
      code: "UNKNOWN_PROFILE",
    });
    await expect(api.getPrayer("islamabad", "sunni_hanafi", 2026)).rejects.toMatchObject({
      code: "UNKNOWN_CITY",
    });
  });

  it("rejects malformed payloads as INVALID_DATA", async () => {
    const { api } = clientWith(() => fixture("bad-cities.json"));
    await expect(api.getCities()).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("does not cache invalid payloads", async () => {
    let call = 0;
    const getJson = vi.fn(async () =>
      call++ === 0 ? fixture("bad-cities.json") : fixture("cities.json"),
    );
    const api = createHijriApi({
      baseUrl: "https://api.test/",
      http: { getJson } as HttpClient,
      cache: createCache(),
    });

    await expect(api.getCities()).rejects.toMatchObject({ code: "INVALID_DATA" });
    await expect(api.getCities()).resolves.toHaveLength(2);
    expect(getJson).toHaveBeenCalledTimes(2);
  });

  it("caches validated payloads by absolute URL", async () => {
    const { api, getJson } = clientWith(() => fixture("cities.json"));
    await api.getCities();
    await api.getCities();
    expect(getJson).toHaveBeenCalledTimes(1);
  });
});
