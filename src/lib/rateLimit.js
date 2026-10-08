import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

// Different limits for different types of actions.
//
// We intentionally keep authentication limits stricter
// because login/register endpoints are common brute-force targets.

export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "gym:ratelimit:login",
  analytics: true,
});

export const registerRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  prefix: "gym:ratelimit:register",
  analytics: true,
});

export const forgotPasswordRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  prefix: "gym:ratelimit:forgot-password",
  analytics: true,
});

export const paymentRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "gym:ratelimit:payment",
  analytics: true,
});

export const adminRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "gym:ratelimit:admin",
  analytics: true,
});

/**
 * Get the client's IP address from a Next.js request.
 *
 * Vercel/proxies normally provide x-forwarded-for.
 * We use the first IP in that list.
 */
export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Create a consistent identifier for IP-based rate limiting.
 *
 * Example:
 * login:192.168.1.10
 */
export function createRateLimitIdentifier(prefix, value) {
  const cleanValue = String(value || "unknown").trim();

  return `${prefix}:${cleanValue}`;
}

/**
 * Return a standard 429 response when the rate limit is exceeded.
 */
export function rateLimitResponse(result) {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

  return new Response(
    JSON.stringify({
      success: false,
      message: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(
          Math.max(0, result.remaining)
        ),
      },
    }
  );
}