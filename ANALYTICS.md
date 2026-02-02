# 📊 Usage Tracking & Analytics Guide

## How API Hits Are Tracked

Your Nthcreation API now has **comprehensive analytics** to track all usage!

---

## 🎯 What's Tracked

### Every Request Logs:

- **Timestamp** - When the request happened
- **IP Address** - Who made the request
- **Endpoint** - Which API endpoint
- **Method** - GET/POST/etc
- **AI Usage** - Whether AI was used
- **User Agent** - Browser/client info
- **Response Time** - How long it took
- **Status Code** - Success (200) or error (4xx/5xx)

### Daily Statistics:

- Total requests
- AI-enhanced requests
- Unique IP addresses
- Most used endpoints
- Error count & rate
- Average response time

---

## 📈 View Your Analytics

### **Option 1: Analytics Dashboard** (Recommended)

Visit your API analytics endpoint:

```
https://nthcreations.onrender.com/analytics
```

**Response Example:**

```json
{
  "current": {
    "date": "2026-02-02",
    "totalRequests": 142,
    "aiRequests": 38,
    "uniqueIPs": 12,
    "endpoints": {
      "/analyze/url": 45,
      "/analyze/upload": 22,
      "/flows": 15
    },
    "errors": 3,
    "avgResponseTime": 1250,
    "errorRate": "2.11%"
  },
  "recent": [
    {
      "timestamp": "2026-02-02T15:30:45.123Z",
      "ip": "203.0.113.45",
      "endpoint": "/analyze/url",
      "method": "POST",
      "useAI": true,
      "duration": 3400,
      "status": 200
    }
  ],
  "historical": [
    {
      "date": "2026-02-01",
      "totalRequests": 198,
      "aiRequests": 52,
      "uniqueIPs": 18
    }
  ],
  "summary": {
    "totalRequestsAllTime": 340,
    "totalAIRequestsAllTime": 90
  }
}
```

### **Option 2: Top Endpoints**

See which endpoints are most popular:

```
https://nthcreations.onrender.com/analytics/top-endpoints
```

### **Option 3: Recent Errors**

Track errors to debug issues:

```
https://nthcreations.onrender.com/analytics/errors
```

### **Option 4: Render Logs** (Real-time)

1. Go to https://dashboard.render.com
2. Click your `nthcreations` service
3. Click **"Logs"** tab

You'll see:

```
[REQUEST] POST /analyze/url - IP: 203.0.113.45
[REQUEST][AI] POST /analyze/upload - IP: 198.51.100.23
[COST] Daily AI usage: 38/100
```

---

## 📊 Data Retention

| Data Type       | Storage   | Retention           |
| --------------- | --------- | ------------------- |
| Recent requests | In-memory | Last 1,000 requests |
| Daily stats     | In-memory | Last 30 days        |
| Logs (Render)   | Cloud     | 7 days (free tier)  |

**Note:** Data resets when server restarts (in-memory storage)

---

## 🔍 Monitoring Checklist

### Daily

- [ ] Check analytics dashboard
- [ ] Review error rate
- [ ] Monitor AI usage (stay under 100/day)

### Weekly

- [ ] Review top endpoints
- [ ] Check unique users growth
- [ ] Analyze response times

### Monthly

- [ ] Review OpenAI billing: https://platform.openai.com/usage
- [ ] Check Render metrics
- [ ] Adjust rate limits if needed

---

## 💰 Cost Tracking

### Current AI Usage

```
https://nthcreations.onrender.com/analytics
```

Look for:

- `aiRequests` - How many AI calls today
- Compare to limit (100/day)
- Estimated cost: `aiRequests × $0.03` = Daily cost

### Set Up Alerts

**1. OpenAI Dashboard**

- Go to: https://platform.openai.com/account/billing/limits
- Set monthly limit: $50 (or your budget)
- Enable email alerts at 50%, 75%, 90%

**2. Render Monitoring** (Paid plan)

- Upgrade to enable custom metrics
- Set alerts for high traffic

---

## 🛠️ Advanced: Export Data

Want to save analytics permanently? Add this to your code:

### Save to File (Local testing)

```typescript
import fs from "fs";

app.get("/analytics/export", async (req, res) => {
  const analytics = getAnalytics();
  fs.writeFileSync(
    `analytics-${new Date().toISOString()}.json`,
    JSON.stringify(analytics, null, 2),
  );
  res.json({ exported: true });
});
```

### Send to Google Sheets/Airtable

Use services like:

- **Zapier** - Connect API → Google Sheets
- **Make.com** - Automation workflows
- **PostHog** - Free analytics platform

---

## 📱 Quick Analytics Summary

Run in terminal:

```bash
curl https://nthcreations.onrender.com/analytics | jq '.current'
```

Output:

```json
{
  "date": "2026-02-02",
  "totalRequests": 142,
  "aiRequests": 38,
  "uniqueIPs": 12,
  "avgResponseTime": 1250,
  "errorRate": "2.11%"
}
```

---

## 🎯 Key Metrics to Watch

| Metric            | Good    | Warning | Action Needed |
| ----------------- | ------- | ------- | ------------- |
| Error Rate        | < 5%    | 5-10%   | > 10%         |
| Avg Response Time | < 2s    | 2-5s    | > 5s          |
| AI Requests/Day   | < 80    | 80-95   | > 95          |
| Unique IPs        | Growing | Stable  | Dropping      |

---

## 🚀 Your Analytics Endpoints

| Endpoint                   | Description               |
| -------------------------- | ------------------------- |
| `/analytics`               | Full dashboard with stats |
| `/analytics/top-endpoints` | Most popular endpoints    |
| `/analytics/errors`        | Recent errors             |
| `/status`                  | API health & features     |
| `/health`                  | Simple health check       |

---

**You're now tracking everything!** 📊

Check your dashboard: https://nthcreations.onrender.com/analytics
