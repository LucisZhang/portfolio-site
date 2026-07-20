import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitDecision {
  allowed: boolean;
  limit: "minute" | "day" | null;
  retryAfterSeconds: number;
  remainingMinute: number;
  remainingDay: number;
}

export type AssistantRateLimitMode =
  | "upstash-redis"
  | "best-effort-in-memory-per-instance"
  | "upstash-configuration-error";

export interface AssistantRateLimiter {
  readonly mode: AssistantRateLimitMode;
  check(key: string, now?: number): RateLimitDecision | Promise<RateLimitDecision>;
}

interface UpstashLimitResponseLike {
  success: boolean;
  remaining: number;
  reset: number;
  reason?: string;
}

interface UpstashLimitClient {
  limit(identifier: string): Promise<UpstashLimitResponseLike>;
}

export interface AssistantRateLimitEnvironment {
  [key: string]: string | undefined;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  ASSISTANT_RATE_LIMIT_HMAC_SECRET?: string;
  OPENROUTER_API_KEY?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
}

export class AssistantRateLimitUnavailableError extends Error {
  constructor(message = "The assistant rate limiter is unavailable.") {
    super(message);
    this.name = "AssistantRateLimitUnavailableError";
  }
}

interface Bucket {
  minute: number[];
  day: number[];
  lastSeen: number;
}

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;
export const DEFAULT_MAX_RATE_LIMIT_BUCKETS = 5_000;
const UPSTASH_REQUEST_TIMEOUT_MS = 4_000;

export class InMemoryAssistantRateLimiter implements AssistantRateLimiter {
  readonly mode = "best-effort-in-memory-per-instance" as const;
  private readonly buckets = new Map<string, Bucket>();
  private readonly minuteLimit: number;
  private readonly dayLimit: number;
  private readonly maxBuckets: number;
  private operations = 0;

  constructor(minuteLimit = 10, dayLimit = 50, maxBuckets = DEFAULT_MAX_RATE_LIMIT_BUCKETS) {
    if (
      !Number.isInteger(minuteLimit)
      || !Number.isInteger(dayLimit)
      || !Number.isInteger(maxBuckets)
      || minuteLimit < 1
      || dayLimit < 1
      || maxBuckets < 1
    ) {
      throw new RangeError("Assistant rate-limit values must be positive integers.");
    }
    this.minuteLimit = minuteLimit;
    this.dayLimit = dayLimit;
    this.maxBuckets = maxBuckets;
  }

  check(key: string, now = Date.now()): RateLimitDecision {
    this.operations += 1;
    if (this.operations % 100 === 0 || (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets)) {
      this.pruneExpired(now);
    }
    if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) this.evictOldest();

    const bucket = this.buckets.get(key) ?? { minute: [], day: [], lastSeen: now };
    bucket.minute = bucket.minute.filter((timestamp) => timestamp > now - MINUTE_MS);
    bucket.day = bucket.day.filter((timestamp) => timestamp > now - DAY_MS);
    bucket.lastSeen = now;

    if (bucket.minute.length >= this.minuteLimit) {
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        limit: "minute",
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.minute[0] + MINUTE_MS - now) / 1_000)),
        remainingMinute: 0,
        remainingDay: Math.max(0, this.dayLimit - bucket.day.length),
      };
    }
    if (bucket.day.length >= this.dayLimit) {
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        limit: "day",
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.day[0] + DAY_MS - now) / 1_000)),
        remainingMinute: Math.max(0, this.minuteLimit - bucket.minute.length),
        remainingDay: 0,
      };
    }

    bucket.minute.push(now);
    bucket.day.push(now);
    this.buckets.set(key, bucket);
    return {
      allowed: true,
      limit: null,
      retryAfterSeconds: 0,
      remainingMinute: this.minuteLimit - bucket.minute.length,
      remainingDay: this.dayLimit - bucket.day.length,
    };
  }

  get bucketCount() {
    return this.buckets.size;
  }

  private pruneExpired(now: number) {
    for (const [key, bucket] of this.buckets) {
      bucket.minute = bucket.minute.filter((timestamp) => timestamp > now - MINUTE_MS);
      bucket.day = bucket.day.filter((timestamp) => timestamp > now - DAY_MS);
      if (bucket.day.length === 0) this.buckets.delete(key);
    }
  }

  private evictOldest() {
    let oldestKey: string | undefined;
    let oldestSeen = Number.POSITIVE_INFINITY;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastSeen < oldestSeen) {
        oldestKey = key;
        oldestSeen = bucket.lastSeen;
      }
    }
    if (oldestKey !== undefined) this.buckets.delete(oldestKey);
  }
}

function validUpstashResponse(value: UpstashLimitResponseLike) {
  return typeof value.success === "boolean"
    && Number.isFinite(value.remaining)
    && Number.isFinite(value.reset);
}

export class UpstashAssistantRateLimiter implements AssistantRateLimiter {
  readonly mode = "upstash-redis" as const;

  constructor(
    private readonly minuteLimiter: UpstashLimitClient,
    private readonly dayLimiter: UpstashLimitClient,
  ) {}

  async check(key: string, now = Date.now()): Promise<RateLimitDecision> {
    let minute: UpstashLimitResponseLike;
    let day: UpstashLimitResponseLike;
    try {
      [minute, day] = await Promise.all([
        this.minuteLimiter.limit(key),
        this.dayLimiter.limit(key),
      ]);
    } catch {
      throw new AssistantRateLimitUnavailableError("The Upstash rate-limit check failed.");
    }

    if (
      !validUpstashResponse(minute)
      || !validUpstashResponse(day)
      || minute.reason === "timeout"
      || day.reason === "timeout"
    ) {
      throw new AssistantRateLimitUnavailableError("The Upstash rate-limit response was unavailable.");
    }

    const blockedLimit = !minute.success ? "minute" : !day.success ? "day" : null;
    const blockedReset = blockedLimit === "minute" ? minute.reset : blockedLimit === "day" ? day.reset : now;
    return {
      allowed: blockedLimit === null,
      limit: blockedLimit,
      retryAfterSeconds: blockedLimit === null ? 0 : Math.max(1, Math.ceil((blockedReset - now) / 1_000)),
      remainingMinute: Math.max(0, Math.floor(minute.remaining)),
      remainingDay: Math.max(0, Math.floor(day.remaining)),
    };
  }
}

class MisconfiguredUpstashAssistantRateLimiter implements AssistantRateLimiter {
  readonly mode = "upstash-configuration-error" as const;

  async check(): Promise<RateLimitDecision> {
    throw new AssistantRateLimitUnavailableError(
      "Upstash REST configuration and a dedicated assistant HMAC secret are required.",
    );
  }
}

export function createAssistantRateLimiter(
  environment: AssistantRateLimitEnvironment = process.env,
): AssistantRateLimiter {
  const url = environment.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = environment.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  const hmacSecret = environment.ASSISTANT_RATE_LIMIT_HMAC_SECRET?.trim() ?? "";
  if (!url && !token && !hmacSecret) {
    const hasModelKey = Boolean(environment.OPENROUTER_API_KEY?.trim());
    const isDeployedOrProduction = environment.NODE_ENV?.trim() === "production"
      || ["preview", "production"].includes(environment.VERCEL_ENV?.trim() ?? "");
    if (hasModelKey || isDeployedOrProduction) {
      return new MisconfiguredUpstashAssistantRateLimiter();
    }
    return new InMemoryAssistantRateLimiter(10, 50, DEFAULT_MAX_RATE_LIMIT_BUCKETS);
  }
  if (!url || !token || Buffer.byteLength(hmacSecret, "utf8") < 32) {
    return new MisconfiguredUpstashAssistantRateLimiter();
  }

  const redis = new Redis({
    url,
    token,
    retry: false,
    signal: () => AbortSignal.timeout(UPSTASH_REQUEST_TIMEOUT_MS),
  });
  const shared = {
    redis,
    analytics: false,
    ephemeralCache: false as const,
    // The SDK defaults to fail-open after five seconds. Zero disables that timeout;
    // network errors therefore reject and are converted to a local HTTP 503.
    timeout: 0,
  };
  return new UpstashAssistantRateLimiter(
    new Ratelimit({
      ...shared,
      prefix: "portfolio-assistant:minute:v1",
      limiter: Ratelimit.slidingWindow(10, "1 m"),
    }),
    new Ratelimit({
      ...shared,
      prefix: "portfolio-assistant:day:v1",
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    }),
  );
}
