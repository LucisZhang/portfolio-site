import { NextResponse } from "next/server";
import {
  assistantClientIp,
  assistantPseudonymousRateLimitKey,
} from "@/lib/assistant-client-ip";
import {
  AssistantBodyLimitError,
  AssistantBodyTimeoutError,
  gateAssistantHttpRequest,
  readAssistantRequestBody,
} from "@/lib/assistant-http";
import {
  ASSISTANT_EVIDENCE_MODE,
  ASSISTANT_POLICY_REVISION,
  executeAssistantRequest,
  type AssistantOutputRejection,
} from "@/lib/assistant-policy";
import type { AssistantPublicCitation } from "@/lib/assistant-public-sources";
import {
  createAssistantRateLimiter,
  type AssistantRateLimiter,
  type RateLimitDecision,
} from "@/lib/assistant-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const assistantGlobal = globalThis as typeof globalThis & {
  __portfolioAssistantRateLimiter?: AssistantRateLimiter;
};
const limiter = assistantGlobal.__portfolioAssistantRateLimiter ?? createAssistantRateLimiter();
assistantGlobal.__portfolioAssistantRateLimiter = limiter;

function responseHeaders(
  rate?: RateLimitDecision,
  responseReturnedModel?: string,
  outputRejection?: AssistantOutputRejection,
  sourcePackSha256?: string,
  factCatalogSha256?: string,
  outboundPayloadSha256?: string,
) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store, max-age=0",
    "X-Assistant-Evidence-Mode": ASSISTANT_EVIDENCE_MODE,
    "X-Assistant-RateLimit-Mode": limiter.mode,
    "X-Assistant-Policy-Revision": ASSISTANT_POLICY_REVISION,
  };
  if (responseReturnedModel) headers["X-Assistant-Response-Model"] = responseReturnedModel;
  if (outputRejection) headers["X-Assistant-Output-Rejection"] = outputRejection;
  if (sourcePackSha256) headers["X-Assistant-Source-Pack"] = sourcePackSha256;
  if (factCatalogSha256) headers["X-Assistant-Fact-Catalog"] = factCatalogSha256;
  if (outboundPayloadSha256) headers["X-Assistant-Payload-SHA256"] = outboundPayloadSha256;
  if (rate) {
    headers["X-RateLimit-Remaining-Minute"] = String(rate.remainingMinute);
    headers["X-RateLimit-Remaining-Day"] = String(rate.remainingDay);
    if (!rate.allowed) headers["Retry-After"] = String(rate.retryAfterSeconds);
  }
  return headers;
}

function assistantResponse(
  reply: string,
  status: number,
  rate?: RateLimitDecision,
  responseReturnedModel?: string,
  outputRejection?: AssistantOutputRejection,
  sources?: readonly AssistantPublicCitation[],
  sourcePackSha256?: string,
  factCatalogSha256?: string,
  outboundPayloadSha256?: string,
) {
  return NextResponse.json({ reply, ...(sources ? { sources } : {}) }, {
    status,
    headers: responseHeaders(
      rate,
      responseReturnedModel,
      outputRejection,
      sourcePackSha256,
      factCatalogSha256,
      outboundPayloadSha256,
    ),
  });
}

export async function POST(request: Request) {
  const gate = gateAssistantHttpRequest(request);
  if (!gate.ok) return assistantResponse(gate.message, gate.status);

  let body: string;
  try {
    body = await readAssistantRequestBody(request);
  } catch (error) {
    return assistantResponse(
      error instanceof AssistantBodyLimitError
        ? "The assistant request is too large."
        : error instanceof AssistantBodyTimeoutError
          ? "The assistant request body timed out."
        : "The assistant request body could not be read.",
      error instanceof AssistantBodyLimitError ? 413 : error instanceof AssistantBodyTimeoutError ? 408 : 400,
    );
  }

  const clientIp = assistantClientIp(request.headers);
  const result = await executeAssistantRequest(body, {
    clientIp,
    checkRate: async (key) => limiter.check(
      limiter.mode === "upstash-redis"
        ? assistantPseudonymousRateLimitKey(
          key,
          process.env.ASSISTANT_RATE_LIMIT_HMAC_SECRET ?? "",
        )
        : key,
    ),
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.ASSISTANT_MODEL,
  });
  return assistantResponse(
    result.reply,
    result.status,
    result.rate,
    result.responseReturnedModel,
    result.outputRejection,
    result.sources,
    result.sourcePackSha256,
    result.factCatalogSha256,
    result.outboundPayloadSha256,
  );
}
