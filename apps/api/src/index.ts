// ============================================================================
// Nthcreation API - UX Intelligence Platform
// Version: 2.0.0
// ============================================================================

import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";
import multer from "multer";
import OpenAI from "openai";
import dotenv from "dotenv";
import crypto from "crypto";
import {
  rateLimiter,
  aiRateLimiter,
  validateRequestSize,
  trackCost,
} from "./middleware/security";
import {
  logRequest,
  logResponse,
  getAnalytics,
  getTopEndpoints,
  getRecentErrors,
} from "./middleware/analytics";

// ============================================================================
// Environment & Configuration
// ============================================================================

dotenv.config();

const CONFIG = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4-turbo",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  JSON_LIMIT: "1mb",
} as const;

const AI_ENABLED = !!CONFIG.OPENAI_API_KEY;

// ============================================================================
// Type Definitions
// ============================================================================

type Severity = "HIGH" | "MEDIUM" | "LOW";
type Category = "TRUST" | "CONTROL" | "TRANSPARENCY" | "RECOVERY" | "MEMORY";
type FlowSource = "manual" | "url" | "upload";

interface Step {
  id: string;
  text: string;
}

interface Flow {
  id: string;
  goal: string;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  source?: FlowSource;
  sourceUrl?: string;
}

interface Finding {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  description: string;
  evidence: string[];
  recommendation: string;
  patternId?: string;
  confidence: number;
  principleId?: string;
}

interface UXPrinciple {
  id: string;
  name: string;
  category: string;
  description: string;
  why: string;
  examples: string[];
}

// ============================================================================
// Express & Middleware Setup
// ============================================================================

const app = express();

// Security: CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
);

app.use(express.json({ limit: CONFIG.JSON_LIMIT }));

// Security: Global rate limiting
app.use(rateLimiter());

// Analytics: Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const useAI = req.query.ai === "true";
  const log = logRequest(req, useAI);

  // Capture response
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logResponse(log, res.statusCode, duration);
  });

  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CONFIG.MAX_FILE_SIZE },
});

const openai = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY });

// ============================================================================
// Data Store
// ============================================================================

const flows = new Map<string, Flow>();

// ============================================================================
// UX Principles Database
// ============================================================================

const UX_PRINCIPLES: UXPrinciple[] = [
  {
    id: "principle_human_in_loop",
    name: "Human-in-the-Loop Control",
    category: "CONTROL",
    description:
      "Users must have the ability to review and approve actions before the AI executes them.",
    why: "Automated actions without oversight can lead to loss of trust and user frustration.",
    examples: [
      "Show a preview before posting to social media",
      "Require confirmation before making purchases",
      "Display proposed changes before executing",
    ],
  },
  {
    id: "principle_explainability",
    name: "Transparent Reasoning",
    category: "TRANSPARENCY",
    description:
      "AI systems should explain why they made decisions using clear language.",
    why: "Users can't trust what they don't understand. Explanations build mental models.",
    examples: [
      "Show 'I chose this because...' explanations",
      "Display confidence levels",
      "Provide step-by-step reasoning",
    ],
  },
  {
    id: "principle_graceful_failure",
    name: "Graceful Failure & Recovery",
    category: "RECOVERY",
    description:
      "Systems must handle errors elegantly with clear recovery paths.",
    why: "How a system handles failures determines user confidence.",
    examples: [
      "Offer retry options",
      "Suggest alternative approaches",
      "Preserve user input when errors occur",
    ],
  },
  {
    id: "principle_progressive_disclosure",
    name: "Progressive Disclosure",
    category: "TRANSPARENCY",
    description: "Present information gradually, essential details first.",
    why: "Overwhelming users creates cognitive load.",
    examples: [
      "Show summaries with 'View details' options",
      "Collapse advanced settings by default",
      "Use expandable sections",
    ],
  },
  {
    id: "principle_undo_redo",
    name: "Reversible Actions",
    category: "CONTROL",
    description: "Users should be able to undo or modify AI actions.",
    why: "Undo capabilities encourage experimentation.",
    examples: [
      "Provide undo button",
      "Allow editing before sending",
      "Offer version history",
    ],
  },
  {
    id: "principle_context_awareness",
    name: "Contextual Memory",
    category: "MEMORY",
    description: "Remember relevant context from previous interactions.",
    why: "Asking users to repeat information signals the system isn't listening.",
    examples: [
      "Remember user preferences",
      "Reference previous conversations",
      "Auto-fill based on past inputs",
    ],
  },
  {
    id: "principle_feedback_visibility",
    name: "System Status Visibility",
    category: "TRANSPARENCY",
    description: "Keep users informed through appropriate feedback.",
    why: "Silence creates uncertainty.",
    examples: [
      "Show loading states",
      "Display progress bars",
      "Provide real-time status updates",
    ],
  },
  {
    id: "principle_error_prevention",
    name: "Error Prevention",
    category: "CONTROL",
    description: "Prevent errors through constraints and validation.",
    why: "Prevention is better than recovery.",
    examples: [
      "Validate inputs in real-time",
      "Disable invalid options",
      "Use smart defaults",
    ],
  },
  {
    id: "principle_trust_calibration",
    name: "Appropriate Trust Calibration",
    category: "TRUST",
    description:
      "Help users understand when to trust AI by showing confidence levels.",
    why: "Over-trust can be as harmful as distrust.",
    examples: [
      "Display confidence percentages",
      "Highlight areas of uncertainty",
      "Warn about edge cases",
    ],
  },
  {
    id: "principle_consent_clarity",
    name: "Clear Consent & Permissions",
    category: "TRUST",
    description: "Be explicit about data collection and usage.",
    why: "Hidden data collection erodes trust.",
    examples: [
      "Explain why each permission is needed",
      "Allow selective permission granting",
      "Show what data is being accessed",
    ],
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

const includesAny = (text: string, terms: string[]): boolean => {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
};

const calculateOverallRisk = (findings: Finding[]): Severity => {
  if (findings.some((f) => f.severity === "HIGH")) return "HIGH";
  if (findings.some((f) => f.severity === "MEDIUM")) return "MEDIUM";
  return "LOW";
};

const extractHighlights = (findings: Finding[]): string[] => {
  return findings.slice(0, 3).map((f) => f.title);
};

const sortBySeverity = (findings: Finding[]): Finding[] => {
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return [...findings].sort((a, b) => order[a.severity] - order[b.severity]);
};

const formatFlowForAI = (flow: Flow): string => {
  return `Goal: ${flow.goal}\n\nSteps:\n${flow.steps.map((s, i) => `${i + 1}. ${s.text}`).join("\n")}`;
};

const cleanJSONResponse = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n/, "");
    cleaned = cleaned.replace(/\n```\s*$/, "");
  }
  return cleaned;
};

const extractTextFromHTML = (html: string): string => {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
};

// ============================================================================
// Analysis Engine - Rule-Based
// ============================================================================

function runRules(flow: Flow): Finding[] {
  const findings: Finding[] = [];

  // Rule 1: Missing error handling
  const hasFailure = flow.steps.some((s) =>
    includesAny(s.text, [
      "error",
      "fail",
      "retry",
      "fallback",
      "recover",
      "undo",
    ]),
  );

  if (!hasFailure) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "HIGH",
      category: "RECOVERY",
      title: "No error handling or recovery path defined",
      description:
        "Your flow doesn't plan for failure. When AI makes mistakes or systems break, users get stuck with no way forward. This creates anxiety, support tickets, and abandoned flows. Every AI feature needs graceful degradation.",
      evidence: [
        "No error states mentioned",
        "No retry or fallback options",
        "No recovery path if AI fails",
      ],
      recommendation:
        "Add error handling at each AI step:\n\n1. Show clear error messages\n2. Offer retry with 'Try again' button\n3. Provide manual alternative\n4. Preserve user input during failures\n5. Explain what went wrong and why",
      principleId: "principle_graceful_failure",
      confidence: 0.9,
    });
  }

  // Rule 2: Missing approval/control
  const hasApproval = flow.steps.some((s) =>
    includesAny(s.text, [
      "approve",
      "confirm",
      "review",
      "check",
      "verify",
      "preview",
      "user approves",
    ]),
  );
  const hasAutoAct = flow.steps.some((s) =>
    includesAny(s.text, [
      "automatically",
      "auto",
      "ai executes",
      "ai performs",
      "ai does",
      "system sends",
      "publish",
    ]),
  );

  if (!hasApproval && hasAutoAct) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "HIGH",
      category: "CONTROL",
      title: "AI takes actions without user approval",
      description:
        "Your flow lets AI make decisions and take actions without asking permission. This feels like loss of control and breaks trust.",
      evidence: [
        "AI executes actions automatically",
        "No approval or confirmation step",
        "User cannot review before action",
      ],
      recommendation:
        "Add approval gates before AI actions:\n\n1. Preview what will happen\n2. Show 'Approve' and 'Cancel' buttons\n3. Allow editing before execution\n4. Make approval explicit, not assumed",
      principleId: "principle_human_in_loop",
      confidence: 0.95,
    });
  }

  // Rule 3: Missing explanations
  const hasExplain = flow.steps.some((s) =>
    includesAny(s.text, [
      "why",
      "because",
      "reason",
      "explains",
      "explanation",
      "shows rationale",
    ]),
  );

  if (!hasExplain) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "MEDIUM",
      category: "TRANSPARENCY",
      title: "AI decisions lack transparency",
      description:
        "Your flow doesn't explain WHY the AI makes decisions. Users can't trust what they don't understand.",
      evidence: [
        "No explanations of AI reasoning",
        "Missing 'what happens next' information",
        "Users left guessing why actions were taken",
      ],
      recommendation:
        "Add transparency:\n\n1. Explain WHY: 'I suggested this because...'\n2. Show confidence: '85% confident'\n3. Admit limitations: 'I'm not sure about X'\n4. Show reasoning factors",
      principleId: "principle_explainability",
      confidence: 0.85,
    });
  }

  // Rule 4: Missing progress feedback
  const hasProgress = flow.steps.some((s) =>
    includesAny(s.text, [
      "loading",
      "progress",
      "processing",
      "working",
      "status",
      "indicator",
    ]),
  );

  if (!hasProgress && flow.steps.length > 3) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "MEDIUM",
      category: "TRANSPARENCY",
      title: "Missing real-time feedback on system status",
      description:
        "Multi-step process without showing users what's happening. Silence creates anxiety.",
      evidence: [
        "No loading or progress indicators",
        "No intermediate feedback",
        "Users don't know if system is working",
      ],
      recommendation:
        "Add progressive feedback:\n\n1. Show spinners or progress bars\n2. Status messages: 'Analyzing data...'\n3. Time estimates: 'Usually takes 30 seconds'\n4. Step indicators: 'Step 2 of 5'",
      principleId: "principle_feedback_visibility",
      confidence: 0.8,
    });
  }

  // Rule 5: Missing memory/context
  const hasMemory = flow.steps.some((s) =>
    includesAny(s.text, [
      "remember",
      "recall",
      "previous",
      "history",
      "context",
      "saved",
    ]),
  );

  if (!hasMemory && flow.steps.length > 2) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "MEDIUM",
      category: "MEMORY",
      title: "System doesn't remember user context",
      description:
        "Making users repeat information they've already provided signals the system isn't listening.",
      evidence: [
        "No mention of remembering context",
        "No reference to previous interactions",
        "Likely repeats questions",
      ],
      recommendation:
        "Add contextual memory:\n\n1. Remember user preferences\n2. Reference previous inputs\n3. Auto-fill based on history\n4. Show 'We remember from last time'",
      principleId: "principle_context_awareness",
      confidence: 0.75,
    });
  }

  // Rule 6: Missing undo/edit
  const hasUndo = flow.steps.some((s) =>
    includesAny(s.text, [
      "undo",
      "edit",
      "modify",
      "change",
      "revert",
      "cancel",
    ]),
  );

  if (!hasUndo && hasAutoAct) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "MEDIUM",
      category: "CONTROL",
      title: "No way to undo or edit AI actions",
      description:
        "Irreversible AI actions create fear. Users need escape hatches.",
      evidence: [
        "No undo or edit capability",
        "AI actions appear permanent",
        "No way to fix AI mistakes",
      ],
      recommendation:
        "Add reversibility:\n\n1. Undo button after AI actions\n2. Edit capability before finalizing\n3. Version history\n4. 'Undo' window (e.g., 30 seconds)",
      principleId: "principle_undo_redo",
      confidence: 0.85,
    });
  }

  // Rule 7: Missing trust signals
  const hasTrust = flow.steps.some((s) =>
    includesAny(s.text, [
      "verified",
      "secure",
      "trust",
      "credential",
      "badge",
      "certification",
    ]),
  );

  if (!hasTrust && hasAutoAct) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "LOW",
      category: "TRUST",
      title: "Missing trust and credibility signals",
      description:
        "No signals to help users trust AI decisions. Trust must be earned.",
      evidence: [
        "No verification or credibility indicators",
        "No trust-building elements",
        "Missing security or authority signals",
      ],
      recommendation:
        "Add trust signals:\n\n1. Verification badges\n2. Data source transparency\n3. Security indicators\n4. Expert endorsements\n5. Success metrics",
      principleId: "principle_consent_clarity",
      confidence: 0.7,
    });
  }

  // Rule 8: Missing confidence communication
  const hasConfidence = flow.steps.some((s) =>
    includesAny(s.text, [
      "confidence",
      "certainty",
      "sure",
      "might",
      "may",
      "uncertain",
      "probability",
    ]),
  );

  if (!hasConfidence && hasAutoAct) {
    findings.push({
      id: crypto.randomUUID(),
      severity: "LOW",
      category: "TRUST",
      title: "AI doesn't communicate confidence levels",
      description:
        "All recommendations presented with same certainty, whether 95% sure or guessing.",
      evidence: [
        "No confidence scores shown",
        "Missing uncertainty indicators",
        "Doesn't flag low-confidence outputs",
      ],
      recommendation:
        "Add trust calibration:\n\n1. Confidence scores: '92% confident'\n2. Uncertainty flags: 'Not sure about this'\n3. Verification prompts\n4. Source transparency",
      principleId: "principle_trust_calibration",
      confidence: 0.8,
    });
  }

  return findings;
}

// ============================================================================
// Analysis Engine - AI-Powered
// ============================================================================

async function runAIAnalysis(flow: Flow): Promise<Finding[]> {
  if (!AI_ENABLED) {
    console.log("AI analysis skipped: No API key configured");
    return [];
  }

  try {
    const flowText = formatFlowForAI(flow);

    const completion = await openai.chat.completions.create({
      model: CONFIG.OPENAI_MODEL,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert UX researcher specializing in AI/agent interfaces. Analyze user flows for UX issues.

Focus on these 10 principles:
1. Graceful Error Recovery
2. Human-in-the-Loop Control
3. Transparent Reasoning
4. Real-time Feedback
5. Reversible Actions
6. Contextual Memory
7. Proactive Error Prevention
8. Trust Calibration
9. Progressive Disclosure
10. Context Awareness

Return JSON with detailed, specific findings. Include evidence from the flow in the description.
{
  "findings": [
    {
      "severity": "HIGH|MEDIUM|LOW",
      "category": "CONTROL|TRANSPARENCY|TRUST|RECOVERY|MEMORY",
      "title": "Clear, actionable title (max 80 chars)",
      "description": "Start with specific evidence from the flow, then explain WHY it matters. Example: 'In Step 3, AI automatically executes without asking - this breaks trust because users feel powerless.'",
      "recommendation": "Step-by-step fix with examples. Use numbered lists.",
      "confidence": 0.7-0.95,
      "principleId": "principle_graceful_failure|principle_human_in_loop|etc"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Analyze this AI product flow:\n\n${flowText}\n\nIdentify UX issues missed by basic checks. Focus on nuanced problems like unclear language, missing context, poor flow logic, or trust issues.`,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const jsonText = cleanJSONResponse(responseText);
    const parsed = JSON.parse(jsonText);

    return (parsed.findings || []).map((f: any) => ({
      id: crypto.randomUUID(),
      severity: f.severity || "MEDIUM",
      category: f.category || "TRANSPARENCY",
      title: f.title || "AI-detected issue",
      description: f.description || "No description provided",
      evidence: Array.isArray(f.evidence) ? f.evidence : [],
      recommendation: f.recommendation || "Review and improve this aspect",
      confidence: Math.min(Math.max(f.confidence || 0.7, 0), 1),
      principleId: f.principleId,
    }));
  } catch (error: any) {
    console.error("AI analysis error:", error.message);
    return [];
  }
}

// ============================================================================
// Analysis Engine - Hybrid
// ============================================================================

async function runHybridAnalysis(
  flow: Flow,
  useAI: boolean = false,
): Promise<Finding[]> {
  const ruleFindings = runRules(flow);

  if (!useAI || !AI_ENABLED) {
    return sortBySeverity(ruleFindings);
  }

  const aiFindings = await runAIAnalysis(flow);

  // Deduplicate: AI findings override rule findings in same category
  const aiCategories = new Set(aiFindings.map((f) => f.category));
  const filteredRuleFindings = ruleFindings.filter(
    (rf) => !aiCategories.has(rf.category),
  );

  const combined = [...aiFindings, ...filteredRuleFindings];
  return sortBySeverity(combined);
}

// ============================================================================
// Routes - Health & Status
// ============================================================================

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/status", (_req, res) => {
  res.json({
    product: "Nthcreation",
    tagline: "UX Intelligence Platform for AI Products",
    description: "Identify experience risks before development begins",
    status: "operational",
    version: "2.0.0",
    features: {
      ruleBasedAnalysis: true,
      aiEnhancedAnalysis: AI_ENABLED,
      urlScraping: true,
      fileUpload: true,
      imageAnalysis: true,
    },
    aiModel: AI_ENABLED ? CONFIG.OPENAI_MODEL : null,
    analysisEngine: {
      rules: 8,
      principles: 10,
      confidence: "70-95%",
      responseTime: "instant (rules) | ~15sec (AI)",
    },
    capabilities: {
      analysisTypes: ["trust", "control", "transparency", "recovery", "memory"],
      inputFormats: ["text", "url", "html", "markdown", "images"],
      outputFormats: ["json", "markdown"],
      supportedRisks: [
        "missing_approval",
        "unexplained_decision",
        "no_recovery_path",
        "information_overload",
        "no_memory",
        "missing_trust_signals",
        "irreversible_action",
        "excessive_automation",
      ],
    },
  });
});

// ============================================================================
// Routes - Analytics & Monitoring
// ============================================================================

app.get("/analytics", (_req, res) => {
  res.json(getAnalytics());
});

app.get("/analytics/top-endpoints", (_req, res) => {
  res.json(getTopEndpoints());
});

app.get("/analytics/errors", (_req, res) => {
  res.json(getRecentErrors());
});

// ============================================================================
// Routes - UX Principles
// ============================================================================

app.get("/principles", (_req, res) => {
  res.json(UX_PRINCIPLES);
});

app.get("/principles/:id", (req, res) => {
  const principle = UX_PRINCIPLES.find((p) => p.id === req.params.id);
  if (!principle) {
    return res.status(404).json({ error: "Principle not found" });
  }
  res.json(principle);
});

// ============================================================================
// Routes - Flow Management
// ============================================================================

app.post("/flows", (req, res) => {
  const { goal, steps } = req.body ?? {};

  if (!goal || typeof goal !== "string") {
    return res.status(400).json({ error: "goal is required" });
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: "steps required" });
  }

  const cleanedSteps: Step[] = steps
    .filter((s: any) => s?.text && String(s.text).trim().length > 0)
    .map((s: any) => ({
      id: String(s.id ?? crypto.randomUUID()),
      text: String(s.text),
    }));

  if (cleanedSteps.length === 0) {
    return res.status(400).json({ error: "at least one step required" });
  }

  const now = new Date().toISOString();
  const flow: Flow = {
    id: crypto.randomUUID(),
    goal: goal.trim(),
    steps: cleanedSteps,
    createdAt: now,
    updatedAt: now,
    source: "manual",
  };

  flows.set(flow.id, flow);
  res.json(flow);
});

app.get("/flows/:id", (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(404).json({ error: "Flow not found" });
  }
  res.json(flow);
});

// ============================================================================
// Routes - Analysis (URL)
// ============================================================================

app.post("/analyze/url", validateRequestSize(), async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }

    const useAI = req.query.ai === "true";

    // AI requests have stricter limits
    if (useAI) {
      const aiLimit = aiRateLimiter();
      const costTrack = trackCost;

      // Apply AI rate limiting
      return new Promise((resolve) => {
        aiLimit(req, res, () => {
          costTrack(req, res, () => {
            resolve(processUrlAnalysis(req, res, url, useAI));
          });
        });
      });
    }

    return processUrlAnalysis(req, res, url, useAI);
  } catch (error: any) {
    console.error("URL analysis error:", error);
    res.status(500).json({ error: "Failed to analyze URL" });
  }
});

async function processUrlAnalysis(
  req: any,
  res: any,
  url: string,
  useAI: boolean,
) {
  try {
    // Fetch webpage
    const response = await axios.get(url, { timeout: 10000 });
    const text = extractTextFromHTML(response.data);

    // Extract metadata
    const $ = cheerio.load(response.data);
    const title = $("title").text() || url;
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "No description available";

    // Extract flow elements
    const headings = $("h1, h2, h3")
      .map((_, el) => $(el).text().trim())
      .get();
    const lists = $("ul, ol").length;
    const buttons = $("button, [role='button']").length;
    const forms = $("form").length;

    // Create flow from extracted content
    const goalHint = headings[0] || title || "Analyze website UX flow";
    const stepsHint = headings.slice(0, 10).map((h, i) => ({
      id: `step-${i + 1}`,
      text: h,
    }));

    const now = new Date().toISOString();
    const flow: Flow = {
      id: crypto.randomUUID(),
      goal: goalHint,
      steps:
        stepsHint.length > 0
          ? stepsHint
          : [
              { id: "step-1", text: "Visit website" },
              { id: "step-2", text: "Browse content" },
            ],
      createdAt: now,
      updatedAt: now,
      source: "url",
      sourceUrl: url,
    };

    flows.set(flow.id, flow);

    // Analyze
    const findings = await runHybridAnalysis(flow, useAI);
    const overallRisk = calculateOverallRisk(findings);
    const highlights = extractHighlights(findings);

    const principleIds = [
      ...new Set(findings.map((f) => f.principleId).filter(Boolean)),
    ];
    const principles = UX_PRINCIPLES.filter((p) => principleIds.includes(p.id));

    return res.json({
      product: "Nthcreation",
      version: "2.0.0",
      flow,
      analysis: {
        analysisId: crypto.randomUUID(),
        flowId: flow.id,
        findings,
        summary: { overallRisk, highlights },
        principles,
      },
      metadata: {
        title,
        description,
        extractedElements: { headings: headings.length, lists, buttons, forms },
      },
    });
  } catch (error: any) {
    console.error("URL processing error:", error);
    return res.status(500).json({ error: "Failed to process URL analysis" });
  }
}

// ============================================================================
// Routes - Analysis (File Upload)
// ============================================================================

app.post(
  "/analyze/upload",
  upload.single("file"),
  validateRequestSize(),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "file is required" });
      }

      const useAI = req.query.ai === "true";

      // AI requests have stricter limits
      if (useAI) {
        const aiLimit = aiRateLimiter();
        const costTrack = trackCost;

        return new Promise((resolve) => {
          aiLimit(req, res, () => {
            costTrack(req, res, () => {
              resolve(processFileAnalysis(req, res, file, useAI));
            });
          });
        });
      }

      return processFileAnalysis(req, res, file, useAI);
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to process file upload" });
    }
  },
);

async function processFileAnalysis(
  req: any,
  res: any,
  file: any,
  useAI: boolean,
) {
  try {
    let content = "";

    // Extract content based on file type
    if (file.mimetype.startsWith("image/")) {
      content = "Image mockup uploaded - analyzing visual flow heuristically";
    } else {
      content = file.buffer.toString("utf-8");
    }

    // Parse content into flow
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const goalLine = lines.find(
      (l) =>
        l.toLowerCase().includes("goal") ||
        l.toLowerCase().includes("objective"),
    );
    const goal = goalLine || lines[0] || "Analyze uploaded flow";

    const stepLines = lines
      .filter((l) => /^\d+\./.test(l) || /^[-*]/.test(l))
      .map((l, i) => ({
        id: `step-${i + 1}`,
        text: l.replace(/^[\d+\.\-\*\s]+/, "").trim(),
      }));

    const now = new Date().toISOString();
    const flow: Flow = {
      id: crypto.randomUUID(),
      goal: goal.replace(/^(goal|objective)[:\s]*/i, "").trim(),
      steps:
        stepLines.length > 0
          ? stepLines
          : [{ id: "step-1", text: "Review uploaded content" }],
      createdAt: now,
      updatedAt: now,
      source: "upload",
    };

    flows.set(flow.id, flow);

    // Analyze
    const findings = await runHybridAnalysis(flow, useAI);
    const overallRisk = calculateOverallRisk(findings);
    const highlights = extractHighlights(findings);

    const principleIds = [
      ...new Set(findings.map((f) => f.principleId).filter(Boolean)),
    ];
    const principles = UX_PRINCIPLES.filter((p) => principleIds.includes(p.id));

    return res.json({
      product: "Nthcreation",
      version: "2.0.0",
      flow,
      analysis: {
        analysisId: crypto.randomUUID(),
        flowId: flow.id,
        findings,
        summary: { overallRisk, highlights },
        principles,
        aiEnhanced: useAI && AI_ENABLED,
      },
      metadata: {
        filename: file.originalname,
        size: file.size,
        type: file.mimetype,
        isImage: file.mimetype.startsWith("image/"),
      },
    });
  } catch (error: any) {
    console.error("File processing error:", error);
    return res.status(500).json({
      error: "Failed to analyze file",
      details: error.message,
    });
  }
}

// ============================================================================
// Routes - Analysis (Existing Flow)
// ============================================================================

app.post("/flows/:id/analyze", validateRequestSize(), async (req, res) => {
  const flow = flows.get(req.params.id);

  if (!flow) {
    return res.status(404).json({ error: "Flow not found" });
  }

  const useAI = req.query.ai === "true";

  // AI requests have stricter limits
  if (useAI) {
    const aiLimit = aiRateLimiter();
    const costTrack = trackCost;

    return new Promise((resolve) => {
      aiLimit(req, res, () => {
        costTrack(req, res, async () => {
          resolve(await performFlowAnalysis(flow, useAI, res));
        });
      });
    });
  }

  return performFlowAnalysis(flow, useAI, res);
});

async function performFlowAnalysis(flow: Flow, useAI: boolean, res: any) {
  try {
    const findings = await runHybridAnalysis(flow, useAI);
    const overallRisk = calculateOverallRisk(findings);
    const highlights = extractHighlights(findings);

    const principleIds = [
      ...new Set(findings.map((f) => f.principleId).filter(Boolean)),
    ];
    const principles = UX_PRINCIPLES.filter((p) => principleIds.includes(p.id));

    return res.json({
      product: "Nthcreation",
      version: "2.0.0",
      analysisId: crypto.randomUUID(),
      flowId: flow.id,
      findings,
      summary: { overallRisk, highlights },
      principles,
      aiEnhanced: useAI && AI_ENABLED,
    });
  } catch (error: any) {
    console.error("Flow analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze flow",
      details: error.message,
    });
  }
}

// ============================================================================
// Server Start
// ============================================================================

app.listen(CONFIG.PORT, () => {
  console.log(`API running on http://localhost:${CONFIG.PORT}`);
  console.log(`Security: Rate limiting enabled`);
  console.log(`- General: 10 requests/minute per IP`);
  console.log(`- AI Analysis: 20 requests/hour per IP`);
  console.log(`- Daily AI Limit: 100 total requests`);
});

export default app;
