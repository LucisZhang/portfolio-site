export const MAX_ASSISTANT_REQUEST_BODY_BYTES = 24_000;
export const MAX_ASSISTANT_UPSTREAM_BODY_BYTES = 64_000;
export const MAX_ASSISTANT_REQUEST_BODY_READ_MS = 3_000;

export type AssistantHttpGateResult =
  | { ok: true }
  | { ok: false; status: 403 | 415; message: string };

export class AssistantBodyLimitError extends Error {
  readonly status = 413;

  constructor(message = "Assistant request body exceeds the byte limit.") {
    super(message);
    this.name = "AssistantBodyLimitError";
  }
}

export class AssistantBodyReadError extends Error {
  readonly status: number = 400;

  constructor(message = "Assistant request body could not be read.") {
    super(message);
    this.name = "AssistantBodyReadError";
  }
}

export class AssistantBodyTimeoutError extends AssistantBodyReadError {
  readonly status = 408;

  constructor(message = "Assistant request body timed out.") {
    super(message);
    this.name = "AssistantBodyTimeoutError";
  }
}

function mediaType(value: string | null) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function requestOrigins(request: Request) {
  const requestUrl = new URL(request.url);
  const origins = new Set([requestUrl.origin]);
  const host = request.headers.get("host");
  // Next.js may normalize Request.url to localhost while preserving the actual
  // browser target in Host. Browser code cannot forge Host, so it is the right
  // same-origin comparison fallback for local and reverse-proxied requests.
  if (host && !/[\s,/@\\]/u.test(host)) {
    try {
      origins.add(new URL(`${requestUrl.protocol}//${host}`).origin);
    } catch {
      // Ignore malformed Host values; the canonical Request.url origin remains.
    }
  }
  return origins;
}

export function gateAssistantHttpRequest(request: Request): AssistantHttpGateResult {
  if (mediaType(request.headers.get("content-type")) !== "application/json") {
    return { ok: false, status: 415, message: "Assistant requests require application/json." };
  }
  if (request.headers.get("sec-fetch-site")?.toLowerCase() === "cross-site") {
    return { ok: false, status: 403, message: "Cross-site assistant requests are not allowed." };
  }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (!requestOrigins(request).has(new URL(origin).origin)) {
        return { ok: false, status: 403, message: "Cross-origin assistant requests are not allowed." };
      }
    } catch {
      return { ok: false, status: 403, message: "Assistant request origin is invalid." };
    }
  }
  return { ok: true };
}

function checkedContentLength(headers: Headers, maxBytes: number) {
  const raw = headers.get("content-length");
  if (raw === null) return;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new AssistantBodyReadError("Invalid Content-Length.");
  if (parsed > maxBytes) throw new AssistantBodyLimitError();
}

async function readBoundedBytes(
  body: ReadableStream<Uint8Array> | null,
  headers: Headers,
  maxBytes: number,
  timeoutMs?: number,
) {
  checkedContentLength(headers, maxBytes);
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const deadline = timeoutMs === undefined ? undefined : Date.now() + timeoutMs;
  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const read = reader.read();
      const next = deadline === undefined
        ? read
        : Promise.race([
          read,
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(
              () => reject(new AssistantBodyTimeoutError()),
              Math.max(0, deadline - Date.now()),
            );
          }),
        ]);
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await next;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
      const { done, value } = chunk;
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        void reader.cancel("assistant body byte cap exceeded").catch(() => undefined);
        throw new AssistantBodyLimitError();
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof AssistantBodyLimitError || error instanceof AssistantBodyTimeoutError) {
      void reader.cancel("assistant body read stopped").catch(() => undefined);
      throw error;
    }
    throw new AssistantBodyReadError();
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

function decodeUtf8(bytes: Uint8Array) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new AssistantBodyReadError("Assistant body is not valid UTF-8.");
  }
}

export async function readAssistantRequestBody(
  request: Request,
  timeoutMs = MAX_ASSISTANT_REQUEST_BODY_READ_MS,
) {
  return decodeUtf8(await readBoundedBytes(
    request.body,
    request.headers,
    MAX_ASSISTANT_REQUEST_BODY_BYTES,
    timeoutMs,
  ));
}

export async function readAssistantUpstreamJson(response: Response): Promise<unknown> {
  const text = decodeUtf8(await readBoundedBytes(
    response.body,
    response.headers,
    MAX_ASSISTANT_UPSTREAM_BODY_BYTES,
  ));
  try {
    return JSON.parse(text);
  } catch {
    throw new AssistantBodyReadError("Assistant upstream response is not valid JSON.");
  }
}
