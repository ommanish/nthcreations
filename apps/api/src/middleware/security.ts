// ============================================================================
// Security Middleware - Rate Limiting & Authentication
// ============================================================================

import { Request, Response, NextFunction } from "express";

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10; // Max 10 requests per minute per IP
const MAX_AI_REQUESTS_PER_HOUR = 20; // Max 20 AI requests per hour per IP

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getClientId(req: Request): string {
  // Use IP address as identifier
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" 
    ? forwarded.split(",")[0].trim() 
    : req.socket.remoteAddress || "unknown";
  return ip;
}

export function rateLimiter(maxRequests: number = MAX_REQUESTS_PER_MINUTE) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}:general`;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // New window
      entry = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      };
      rateLimitStore.set(key, entry);
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    entry.count++;
    next();
  };
}

export function aiRateLimiter() {
  const AI_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${clientId}:ai`;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // New window
      entry = {
        count: 1,
        resetTime: now + AI_LIMIT_WINDOW,
      };
      rateLimitStore.set(key, entry);
      return next();
    }

    if (entry.count >= MAX_AI_REQUESTS_PER_HOUR) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "AI rate limit exceeded",
        message: `Too many AI requests. You can make ${MAX_AI_REQUESTS_PER_HOUR} AI-enhanced analyses per hour. Try again in ${Math.ceil(retryAfter / 60)} minutes, or use rule-based analysis (disable AI toggle).`,
        retryAfter,
      });
    }

    entry.count++;
    next();
  };
}

// ============================================================================
// API Key Authentication (Optional - for production)
// ============================================================================

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.API_KEY;

  // If no API_KEY is set in environment, skip this check
  if (!validApiKey) {
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Valid API key required",
    });
  }

  next();
}

// ============================================================================
// Request Size Validation
// ============================================================================

export function validateRequestSize(maxSteps: number = 50) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { steps, goal } = req.body;

    if (steps && Array.isArray(steps) && steps.length > maxSteps) {
      return res.status(400).json({
        error: "Request too large",
        message: `Maximum ${maxSteps} steps allowed per analysis`,
      });
    }

    if (goal && goal.length > 500) {
      return res.status(400).json({
        error: "Request too large",
        message: "Goal description must be less than 500 characters",
      });
    }

    next();
  };
}

// ============================================================================
// Cost Tracking & Alerts
// ============================================================================

interface CostEntry {
  count: number;
  resetTime: number;
}

const costTracker = new Map<string, CostEntry>();
const DAILY_AI_LIMIT = 100; // Maximum 100 AI requests per day (total)
const DAILY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

export function trackCost(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = "global:ai:daily";

  let entry = costTracker.get(key);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + DAILY_WINDOW,
    };
    costTracker.set(key, entry);
    console.log(`[COST] Daily AI usage: 1/${DAILY_AI_LIMIT}`);
    return next();
  }

  entry.count++;

  if (entry.count >= DAILY_AI_LIMIT) {
    console.error(`[COST ALERT] Daily AI limit reached: ${entry.count}/${DAILY_AI_LIMIT}`);
    return res.status(429).json({
      error: "Daily AI limit reached",
      message: "The daily AI analysis limit has been reached. Please try rule-based analysis (disable AI toggle) or try again tomorrow.",
    });
  }

  // Warning at 80%
  if (entry.count >= DAILY_AI_LIMIT * 0.8) {
    console.warn(`[COST WARNING] 80% of daily AI limit used: ${entry.count}/${DAILY_AI_LIMIT}`);
  }

  console.log(`[COST] Daily AI usage: ${entry.count}/${DAILY_AI_LIMIT}`);
  next();
}
