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
  type AssistantCitation,
  type AssistantOutputRejection,
} from "@/lib/assistant-policy";
import {
  createAssistantRateLimiter,
  type AssistantRateLimiter,
  type RateLimitDecision,
} from "@/lib/assistant-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const assistantGlobal = globalThis as typeof globalThis & {
  __portfolioAssistantRateLimiter?: AssistantRateLimiter;
};
const limiter = assistantGlobal.__portfolioAssistantRateLimiter ?? createAssistantRateLimiter();
assistantGlobal.__portfolioAssistantRateLimiter = limiter;

function responseHeaders(
  rate?: RateLimitDecision,
  responseReturnedModel?: string,
  outputRejection?: AssistantOutputRejection,
  publicSnapshotSha256?: string,
  privateSnapshotSha256?: string,
  combinedSnapshotSha256?: string,
  retrievalCount?: number,
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
  if (publicSnapshotSha256) headers["X-Assistant-Public-Knowledge"] = publicSnapshotSha256;
  if (privateSnapshotSha256) headers["X-Assistant-Private-Knowledge"] = privateSnapshotSha256;
  if (combinedSnapshotSha256) headers["X-Assistant-Knowledge-Snapshot"] = combinedSnapshotSha256;
  if (retrievalCount !== undefined) headers["X-Assistant-Retrieval-Count"] = String(retrievalCount);
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
  sources?: readonly AssistantCitation[],
  publicSnapshotSha256?: string,
  privateSnapshotSha256?: string,
  combinedSnapshotSha256?: string,
  retrievalCount?: number,
  outboundPayloadSha256?: string,
) {
  return NextResponse.json({ reply, ...(sources ? { sources } : {}) }, {
    status,
    headers: responseHeaders(
      rate,
      responseReturnedModel,
      outputRejection,
      publicSnapshotSha256,
      privateSnapshotSha256,
      combinedSnapshotSha256,
      retrievalCount,
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
    modelEn: process.env.ASSISTANT_MODEL_EN,
    modelZh: process.env.ASSISTANT_MODEL_ZH,
    privateKnowledgeEncoded: process.env.ASSISTANT_PRIVATE_KNOWLEDGE_B64_GZIP,
  });
  return assistantResponse(
    result.reply,
    result.status,
    result.rate,
    result.responseReturnedModel,
    result.outputRejection,
    result.sources,
    result.publicSnapshotSha256,
    result.privateSnapshotSha256,
    result.combinedSnapshotSha256,
    result.retrievalCount,
    result.outboundPayloadSha256,
  );
}
