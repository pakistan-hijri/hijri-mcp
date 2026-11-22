import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client, LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFixtureServer, type FixtureServer } from "./helpers/httpFixture.js";

const serverPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const expectedTools = [
  "list_cities",
  "get_hijri_date",
  "get_month_start",
  "get_prayer_times",
];

let fixtureServer: FixtureServer;
let client: Client;
let env: Record<string, string>;

function cleanEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

describe("MCP protocol", () => {
  beforeAll(async () => {
    fixtureServer = await createFixtureServer();
    env = {
      ...cleanEnv(),
      HIJRI_API_BASE_URL: fixtureServer.baseUrl,
      HIJRI_MCP_LOG_LEVEL: "error",
    };
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env,
    });
    client = new Client({ name: "hijri-mcp-test", version: "1.0.0" });
    await client.connect(transport);
  });

  afterAll(async () => {
    await client?.close();
    await fixtureServer?.close();
  });

  it("exposes server identity and instructions", () => {
    expect(client.getServerVersion()).toMatchObject({
      name: "hijri-mcp",
      version: "0.1.0",
    });
    expect(client.getInstructions()).toContain("Do not answer Hijri dates from memory");
  });

  it("lists four read-only tools with schemas", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(expectedTools);
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTypeOf("object");
      expect(JSON.stringify(tool.outputSchema)).toContain("oneOf");
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      });
    }
  });

  it("returns success envelopes from all four tools", async () => {
    const list = await client.callTool({ name: "list_cities", arguments: {} });
    expect(list.isError).toBeFalsy();
    expect(list.structuredContent).toMatchObject({ ok: true });

    const hijri = await client.callTool({
      name: "get_hijri_date",
      arguments: { date: "2026-06-17" },
    });
    expect(hijri.isError).toBeFalsy();
    expect(hijri.structuredContent).toMatchObject({
      ok: true,
      data: { hijri: { date: "1448-01-01" } },
    });

    const month = await client.callTool({
      name: "get_month_start",
      arguments: { hijri_year: 1448, hijri_month: 1 },
    });
    expect(month.isError).toBeFalsy();
    expect(month.structuredContent).toMatchObject({
      ok: true,
      data: { start_gregorian: "2026-06-17" },
    });

    const prayer = await client.callTool({
      name: "get_prayer_times",
      arguments: { city: "karachi", date: "2026-06-17" },
    });
    expect(prayer.isError).toBeFalsy();
    expect(prayer.structuredContent).toMatchObject({
      ok: true,
      data: { city: "karachi", ramadan: null },
    });
  });

  it("returns an error envelope for out-of-coverage dates", async () => {
    const result = await client.callTool({
      name: "get_hijri_date",
      arguments: { date: "2025-06-26" },
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: { code: "OUT_OF_COVERAGE", retryable: false, details: expect.any(Object) },
    });
    expect(
      (result.content[0] as { type: "text"; text: string } | undefined)?.text,
    ).toMatch(/^OUT_OF_COVERAGE: /);
  });

  it("returns INVALID_INPUT for malformed tool arguments", async () => {
    const result = await client.callTool({
      name: "get_month_start",
      arguments: { hijri_year: 1448, hijri_month: 13 },
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT", retryable: false },
    });
  });

  it("writes only JSON-RPC frames to stdout", async () => {
    const child = spawn(process.execPath, [serverPath], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    try {
      child.stdin.write(
        `${JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: LATEST_PROTOCOL_VERSION,
            capabilities: {},
            clientInfo: { name: "raw-stdout-test", version: "1.0.0" },
          },
        })}\n`,
      );
      await waitFor(() => stdout.includes('"id":1'), 5000);
      const lines = stdout.split("\n").filter((line) => line.trim() !== "");
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    } finally {
      child.kill();
    }
  });
});

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting for stdout.");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}
