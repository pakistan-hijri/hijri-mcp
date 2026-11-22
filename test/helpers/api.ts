import { createCache } from "../../src/api/cache.js";
import { createHijriApi, type HijriApi } from "../../src/api/client.js";
import type { HttpClient } from "../../src/api/http.js";
import { emptyCalendar, fixture } from "./fixtures.js";

export function createFixtureApi(): { api: HijriApi; requests: string[] } {
  const requests: string[] = [];
  const http: HttpClient = {
    async getJson(url) {
      requests.push(url);
      if (url.endsWith("/cities.json")) return fixture("cities.json");
      if (url.endsWith("/hijri/index.json")) return fixture("index.json");
      if (url.endsWith("/hijri/calendar/1447.json")) return fixture("calendar-1447.json");
      if (url.endsWith("/hijri/calendar/1448.json")) return fixture("calendar-1448.json");
      const calendarMatch = /\/hijri\/calendar\/(\d+)\.json$/.exec(url);
      if (calendarMatch?.[1]) return emptyCalendar(Number(calendarMatch[1]));
      if (url.endsWith("/prayer/karachi/sunni_hanafi/2026.json")) {
        return fixture("prayer-karachi-2026.json");
      }
      if (url.endsWith("/prayer/karachi/sunni_hanafi/2027.json")) {
        return fixture("prayer-karachi-2027.json");
      }
      throw new Error(`Unexpected fixture request: ${url}`);
    },
  };

  return {
    api: createHijriApi({
      baseUrl: "https://api.test",
      http,
      cache: createCache(),
    }),
    requests,
  };
}
