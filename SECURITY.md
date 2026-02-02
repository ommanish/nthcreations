# 🔒 Security Configuration - Nthcreation API

## ⚠️ CRITICAL: OpenAI API Cost Protection

Your API is now protected against unauthorized usage and cost overruns.

---

## 🛡️ Security Layers Implemented

### 1. **Rate Limiting** (Per IP Address)

- **General API**: 10 requests/minute
- **AI Analysis**: 20 requests/hour
- **Daily AI Limit**: 100 total AI requests/day

### 2. **Request Validation**

- Maximum 50 steps per flow analysis
- Maximum 500 characters for goal description
- File size limit: 10MB
- JSON payload limit: 1MB

### 3. **Cost Tracking**

- Monitors total daily AI usage
- Alerts at 80% of daily limit
- Hard stop at 100 requests/day
- Logs all AI requests to console

---

## 📊 Current Limits & Costs

### API Rate Limits

| Endpoint              | Rate Limit   | Per      |
| --------------------- | ------------ | -------- |
| All endpoints         | 10 requests  | 1 minute |
| AI analysis endpoints | 20 requests  | 1 hour   |
| AI total (all IPs)    | 100 requests | 24 hours |

### OpenAI Cost Estimates

| Model       | Cost per 1K tokens         | Typical Analysis Cost |
| ----------- | -------------------------- | --------------------- |
| GPT-4 Turbo | $0.01 input / $0.03 output | $0.01 - $0.05         |

**With 100 AI requests/day limit:**

- Maximum daily cost: ~$5
- Maximum monthly cost: ~$150

---

## 🔧 How to Adjust Limits

Edit `/apps/api/src/middleware/security.ts`:

```typescript
// Change these values:
const MAX_REQUESTS_PER_MINUTE = 10; // General rate limit
const MAX_AI_REQUESTS_PER_HOUR = 20; // AI per user
const DAILY_AI_LIMIT = 100; // Total AI per day
```

---

## 📈 Monitoring Your Usage

### 1. **Check Render Logs**

Go to: https://dashboard.render.com → Your service → Logs

Look for:

```
[COST] Daily AI usage: 45/100
[COST WARNING] 80% of daily AI limit used: 82/100
[COST ALERT] Daily AI limit reached: 100/100
```

### 2. **OpenAI Dashboard**

Go to: https://platform.openai.com/usage

Monitor:

- Daily token usage
- Cost trends
- Set up billing alerts

---

## 🚨 What Users See When Limits Hit

### Rate Limit Exceeded

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

### AI Rate Limit Exceeded

```json
{
  "error": "AI rate limit exceeded",
  "message": "Too many AI requests. You can make 20 AI-enhanced analyses per hour. Try again in 35 minutes, or use rule-based analysis (disable AI toggle).",
  "retryAfter": 2100
}
```

### Daily Limit Reached

```json
{
  "error": "Daily AI limit reached",
  "message": "The daily AI analysis limit has been reached. Please try rule-based analysis (disable AI toggle) or try again tomorrow."
}
```

---

## 🔐 Optional: Add API Key Authentication

For extra security, require an API key from your frontend:

### 1. Set Environment Variable

In Render, add:

```
API_KEY=your-secret-key-here-generate-random-string
```

### 2. Update Frontend

Add to all API calls:

```typescript
headers: {
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
}
```

### 3. Enable Authentication

The middleware already checks for `X-API-Key` header if `API_KEY` env var is set.

---

## 🌐 CORS Configuration

Currently set to allow all origins (`*`).

To restrict to your frontend only:

### In Render Environment Variables:

```
ALLOWED_ORIGINS=https://nthcreations-app.vercel.app,http://localhost:3000
```

---

## ✅ Security Checklist

- [x] Rate limiting enabled (10 req/min general, 20 req/hour AI)
- [x] Daily AI limit (100 requests/day)
- [x] Request size validation
- [x] Cost tracking and alerts
- [x] CORS protection (configurable)
- [ ] API key authentication (optional, currently disabled)
- [ ] HTTPS only in production (Render provides this automatically)

---

## 🆘 If You See Unexpected Charges

1. **Check Render Logs** for suspicious patterns
2. **Reduce limits** in `security.ts`
3. **Enable API_KEY** authentication
4. **Restrict CORS** to your domain only
5. **Set OpenAI billing limit** at https://platform.openai.com/account/billing/limits

---

## 💡 Best Practices

1. **Monitor daily** for first week
2. **Set OpenAI billing alerts** at $10, $50, $100
3. **Enable API key auth** before public launch
4. **Adjust limits** based on actual usage
5. **Consider Redis** for rate limiting in production (more robust)

---

**Your API is now protected! 🛡️**

Maximum possible cost with current limits: ~$150/month
