/** HTTP transport with timeout, response-size limit, and typed failures. */
import { AppError } from "../errors.js";

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface HttpClient {
  getJson(url: string): Promise<unknown>;
}

export interface HttpClientOptions {
  timeoutMs: number;
  maxResponseBytes?: number;
  fetchImpl?: FetchLike;
}

const DEFAULT_MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;

  return {
    async getJson(url: string): Promise<unknown> {
      const route = routeOf(url);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        const response = await fetchImpl(url, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });

        if (!response.ok) {
          throw new AppError(
            "NETWORK",
            `Could not fetch ${route} (HTTP ${response.status}).`,
            { retryable: true },
          );
        }

        const declaredLength = Number(response.headers.get("content-length") ?? "0");
        if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
          await response.body?.cancel();
          throw new AppError("INVALID_DATA", `Response for ${route} is too large.`);
        }

        const text = await response.text();
        if (Buffer.byteLength(text, "utf8") > maxResponseBytes) {
          throw new AppError("INVALID_DATA", `Response for ${route} is too large.`);
        }

        try {
          return JSON.parse(text) as unknown;
        } catch (error) {
          throw new AppError("INVALID_DATA", `Response for ${route} is not valid JSON.`, {
            cause: error,
          });
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        const message = controller.signal.aborted
          ? `Timed out fetching ${route}.`
          : `Network error fetching ${route}.`;
        throw new AppError("NETWORK", message, { retryable: true, cause: error });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function routeOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
