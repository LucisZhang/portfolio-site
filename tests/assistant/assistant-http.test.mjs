import assert from "node:assert/strict";
import test from "node:test";
import {
  AssistantBodyLimitError,
  AssistantBodyTimeoutError,
  MAX_ASSISTANT_REQUEST_BODY_BYTES,
  MAX_ASSISTANT_REQUEST_BODY_READ_MS,
  MAX_ASSISTANT_UPSTREAM_BODY_BYTES,
  gateAssistantHttpRequest,
  readAssistantRequestBody,
  readAssistantUpstreamJson,
} from "../../src/lib/assistant-http.ts";

test("HTTP gate requires JSON and rejects cross-site or cross-origin browser requests", () => {
  assert.deepEqual(gateAssistantHttpRequest(new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  })), { ok: false, status: 415, message: "Assistant requests require application/json." });

  assert.equal(gateAssistantHttpRequest(new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" },
    body: "{}",
  })).status, 403);
  assert.equal(gateAssistantHttpRequest(new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://attacker.example" },
    body: "{}",
  })).status, 403);
  assert.deepEqual(gateAssistantHttpRequest(new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Origin: "https://portfolio.example" },
    body: "{}",
  })), { ok: true });
  assert.deepEqual(gateAssistantHttpRequest(new Request("http://localhost:4173/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "127.0.0.1:4173",
      Origin: "http://127.0.0.1:4173",
      "Sec-Fetch-Site": "same-origin",
    },
    body: "{}",
  })), { ok: true });
  assert.equal(gateAssistantHttpRequest(new Request("http://localhost:4173/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "127.0.0.1:4173",
      Origin: "https://attacker.example",
      "Sec-Fetch-Site": "same-site",
    },
    body: "{}",
  })).status, 403);
});

test("request body reader rejects declared and streamed over-limit bodies before parsing", async () => {
  const declared = new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(MAX_ASSISTANT_REQUEST_BODY_BYTES + 1),
    },
    body: "{}",
  });
  await assert.rejects(() => readAssistantRequestBody(declared), AssistantBodyLimitError);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_ASSISTANT_REQUEST_BODY_BYTES));
      controller.enqueue(new Uint8Array([1]));
      controller.close();
    },
  });
  const streamed = new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  });
  await assert.rejects(() => readAssistantRequestBody(streamed), AssistantBodyLimitError);
});

test("request body reader accepts bounded UTF-8 JSON", async () => {
  const body = JSON.stringify({ locale: "zh", messages: [{ role: "user", content: "请介绍 p1。" }] });
  const request = new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  assert.equal(await readAssistantRequestBody(request), body);
});

test("request body reader applies an absolute read deadline", async () => {
  assert.equal(MAX_ASSISTANT_REQUEST_BODY_READ_MS, 3_000);
  const stream = new ReadableStream({ start() {} });
  const request = new Request("https://portfolio.example/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  });
  await assert.rejects(() => readAssistantRequestBody(request, 20), AssistantBodyTimeoutError);
});

test("upstream JSON reader is byte-bounded", async () => {
  const valid = new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  assert.deepEqual(await readAssistantUpstreamJson(valid), { ok: true });
  const oversized = new Response("x".repeat(MAX_ASSISTANT_UPSTREAM_BODY_BYTES + 1));
  await assert.rejects(() => readAssistantUpstreamJson(oversized), AssistantBodyLimitError);
});
