import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { fixture } from "./fixtures.js";

export interface FixtureServer {
  baseUrl: string;
  close(): Promise<void>;
}

export async function createFixtureServer(): Promise<FixtureServer> {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const payload = payloadFor(path);
    if (payload === undefined) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end('{"error":"not found"}');
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(payload));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

function payloadFor(path: string): unknown {
  if (path === "/cities.json") return fixture("cities.json");
  if (path === "/hijri/index.json") return fixture("index.json");
  if (path === "/hijri/calendar/1447.json") return fixture("calendar-1447.json");
  if (path === "/hijri/calendar/1448.json") return fixture("calendar-1448.json");
  if (path === "/prayer/karachi/sunni_hanafi/2026.json") {
    return fixture("prayer-karachi-2026.json");
  }
  if (path === "/prayer/karachi/sunni_hanafi/2027.json") {
    return fixture("prayer-karachi-2027.json");
  }
  const calendar = /^\/hijri\/calendar\/(\d+)\.json$/.exec(path);
  if (calendar?.[1]) {
    return {
      hijri_year: Number(calendar[1]),
      coverage_start: "2025-06-27",
      generated_at: "2026-11-21T09:22:41.389Z",
      baseline: "islamic-umalqura (Intl)",
      days: {},
    };
  }
  return undefined;
}
