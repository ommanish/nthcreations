// ============================================================================
// Analytics & Usage Tracking
// ============================================================================

import { Request } from "express";

interface RequestLog {
  timestamp: string;
  ip: string;
  endpoint: string;
  method: string;
  useAI: boolean;
  userAgent?: string;
  duration?: number;
  status?: number;
}

interface DailyStats {
  date: string;
  totalRequests: number;
  aiRequests: number;
  uniqueIPs: Set<string>;
  endpoints: Map<string, number>;
  errors: number;
  avgResponseTime: number;
}

// In-memory storage (persists until server restart)
const requestLogs: RequestLog[] = [];
const MAX_LOGS = 1000; // Keep last 1000 requests

// Daily statistics
let currentDayStats: DailyStats = {
  date: new Date().toISOString().split("T")[0],
  totalRequests: 0,
  aiRequests: 0,
  uniqueIPs: new Set(),
  endpoints: new Map(),
  errors: 0,
  avgResponseTime: 0,
};

const historicalStats: DailyStats[] = [];
let totalResponseTime = 0;

// Reset daily stats at midnight
function checkAndResetDaily() {
  const today = new Date().toISOString().split("T")[0];

  if (currentDayStats.date !== today) {
    // Save yesterday's stats
    historicalStats.push({
      ...currentDayStats,
      uniqueIPs: new Set(currentDayStats.uniqueIPs), // Clone the Set
    });

    // Keep only last 30 days
    if (historicalStats.length > 30) {
      historicalStats.shift();
    }

    // Reset for new day
    currentDayStats = {
      date: today,
      totalRequests: 0,
      aiRequests: 0,
      uniqueIPs: new Set(),
      endpoints: new Map(),
      errors: 0,
      avgResponseTime: 0,
    };
    totalResponseTime = 0;

    console.log(`[ANALYTICS] New day started: ${today}`);
  }
}

// Check every hour
setInterval(checkAndResetDaily, 60 * 60 * 1000);

export function logRequest(req: Request, useAI: boolean = false) {
  checkAndResetDaily();

  const ip = getClientIp(req);
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    ip,
    endpoint: req.path,
    method: req.method,
    useAI,
    userAgent: req.headers["user-agent"],
  };

  // Add to logs
  requestLogs.push(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.shift(); // Remove oldest
  }

  // Update daily stats
  currentDayStats.totalRequests++;
  if (useAI) currentDayStats.aiRequests++;
  currentDayStats.uniqueIPs.add(ip);

  const endpointCount = currentDayStats.endpoints.get(req.path) || 0;
  currentDayStats.endpoints.set(req.path, endpointCount + 1);

  // Log to console
  const aiFlag = useAI ? "[AI]" : "";
  console.log(`[REQUEST]${aiFlag} ${req.method} ${req.path} - IP: ${ip}`);

  return log;
}

export function logResponse(log: RequestLog, status: number, duration: number) {
  log.status = status;
  log.duration = duration;

  // Update stats
  if (status >= 400) {
    currentDayStats.errors++;
  }

  totalResponseTime += duration;
  currentDayStats.avgResponseTime =
    totalResponseTime / currentDayStats.totalRequests;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  return typeof forwarded === "string"
    ? forwarded.split(",")[0].trim()
    : req.socket.remoteAddress || "unknown";
}

export function getAnalytics() {
  checkAndResetDaily();

  return {
    current: {
      date: currentDayStats.date,
      totalRequests: currentDayStats.totalRequests,
      aiRequests: currentDayStats.aiRequests,
      uniqueIPs: currentDayStats.uniqueIPs.size,
      endpoints: Object.fromEntries(currentDayStats.endpoints),
      errors: currentDayStats.errors,
      avgResponseTime: Math.round(currentDayStats.avgResponseTime),
      errorRate:
        currentDayStats.totalRequests > 0
          ? (
              (currentDayStats.errors / currentDayStats.totalRequests) *
              100
            ).toFixed(2) + "%"
          : "0%",
    },
    recent: requestLogs.slice(-50).reverse(), // Last 50 requests
    historical: historicalStats.map((stats) => ({
      date: stats.date,
      totalRequests: stats.totalRequests,
      aiRequests: stats.aiRequests,
      uniqueIPs: stats.uniqueIPs.size,
      errors: stats.errors,
      avgResponseTime: Math.round(stats.avgResponseTime),
    })),
    summary: {
      totalRequestsAllTime:
        currentDayStats.totalRequests +
        historicalStats.reduce((sum, s) => sum + s.totalRequests, 0),
      totalAIRequestsAllTime:
        currentDayStats.aiRequests +
        historicalStats.reduce((sum, s) => sum + s.aiRequests, 0),
    },
  };
}

export function getTopEndpoints(limit: number = 10) {
  const sorted = Array.from(currentDayStats.endpoints.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted.map(([endpoint, count]) => ({ endpoint, count }));
}

export function getRecentErrors(limit: number = 20) {
  return requestLogs
    .filter((log) => log.status && log.status >= 400)
    .slice(-limit)
    .reverse();
}
