# Nthcreation — UX Intelligence Platform

**Identify experience risks in AI products before development begins.**

Nthcreation is a professional UX Intelligence platform designed for product teams, designers, and engineers building AI-powered products. Unlike UI generators or design tools, Nthcreation analyzes proposed user flows to surface critical experience risks around **trust**, **control**, **transparency**, and **recovery** — before a single line of code is written.

---

## 🎯 What It Does

Nthcreation analyzes AI/agent product flows and identifies:

- **Trust Risks** — Will users trust your AI's decisions?
- **Control Issues** — Do users have agency over automated actions?
- **Transparency Gaps** — Can users understand what's happening and why?
- **Recovery Problems** — What happens when things go wrong?
- **Memory Concerns** — Does your product remember context appropriately?

---

## 💡 Why It Exists

Most AI products fail not because of poor algorithms, but because of poor **user experience design**. Common issues include:

- AI making irreversible decisions without user approval
- No explanation of why the AI chose a particular action
- Users getting stuck when AI fails with no recovery path
- Loss of trust from opaque or unpredictable behavior

Nthcreation helps teams **catch these issues early** — during the design phase — when changes are cheap and easy.

---

## 🚀 How It Works

### **Hybrid Analysis Approach**

Nthcreation uses a dual-layer analysis system:

1. **Rule-Based Analysis** (Fast, Free, Deterministic)
   - 8 expert-crafted UX rules
   - Instant feedback with high confidence (90%+)
   - Evidence-based findings with specific recommendations
   - Perfect for rapid iteration and validation

2. **AI-Enhanced Analysis** (Deep, Contextual, Optional)
   - GPT-4 Turbo integration
   - Understands nuanced, domain-specific scenarios
   - Surfaces edge cases and contextual risks
   - Cost: ~$0.01-0.05 per analysis

### **Multiple Input Methods**

- **Manual Entry** — Describe your flow step-by-step
- **URL Analysis** — Paste a link to product pages, demos, or documentation
- **File Upload** — Upload flow descriptions (`.txt`, `.md`, `.html`) or UI mockups (`.png`, `.jpg`)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Express.js, TypeScript
- **AI**: OpenAI GPT-4 Turbo (optional)
- **Package Manager**: pnpm workspaces (monorepo)
- **Analysis**: 8 rule-based checks + AI enhancement

---

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd nthcreation

# Install dependencies
pnpm install

# Configure API (optional for AI features)
cd apps/api
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Start development servers
pnpm dev
```

**Access:**

- Frontend: http://localhost:3000
- API: http://localhost:4000

---

## 📖 Usage

### Quick Start

1. **Choose Input Method**
   - Manual: Describe your flow step-by-step
   - URL: Paste a link to analyze
   - Upload: Drop in flow docs or mockups

2. **Toggle AI Enhancement** (optional)
   - Enable for deeper, contextual insights
   - ~15 seconds analysis time
   - Requires OpenAI API key

3. **Get Actionable Feedback**
   - Severity ratings (Low, Medium, High)
   - Evidence from your flow
   - Specific recommendations
   - Related UX principles

### Example

**Input:**

```
Goal: Let users approve AI-generated social media posts

Steps:
1. User describes desired post
2. AI generates content
3. Post is automatically published
```

**Output:**

```
🚨 HIGH RISK: Missing Approval Step
Evidence: "Post is automatically published" (Step 3)
Recommendation: Add preview + approval gate before publishing
Principle: Human-in-the-Loop Control
Confidence: 95%
```

---

## 🏗️ Architecture

```
nthcreation/
├── apps/
│   ├── api/          # Express backend with analysis engine
│   │   └── src/
│   │       └── index.ts  # Core analysis logic (1059 lines)
│   └── web/          # Next.js frontend
│       └── src/
│           └── app/
│               └── page.tsx  # Main UI (1100 lines)
├── packages/         # Shared utilities (future)
└── docs/            # Documentation
```

---

## 🔬 Analysis Rules

1. **Human-in-the-Loop** — Check for approval gates before automated actions
2. **Explainability** — Verify AI reasoning is transparent
3. **Graceful Failure** — Ensure clear error handling and recovery
4. **Progressive Disclosure** — Validate information is revealed appropriately
5. **Memory & Context** — Check if system remembers relevant context
6. **Trust Signals** — Look for credibility and verification indicators
7. **Undo/Reversibility** — Ensure users can reverse AI actions
8. **Autonomy Calibration** — Balance automation vs. user control

---

## 📊 Output Format

```json
{
  "findings": [
    {
      "type": "missing_approval",
      "severity": "HIGH",
      "evidence": "Step 3: 'automatically publish'",
      "recommendation": "Add preview + approval before publish",
      "principle": "Human-in-the-Loop Control",
      "confidence": 0.95
    }
  ],
  "principles": [
    {
      "id": "principle_human_in_loop",
      "name": "Human-in-the-Loop Control",
      "category": "CONTROL",
      "description": "..."
    }
  ],
  "overallRisk": "HIGH"
}
```

---

## 💼 Who It's For

- **Product Teams** — Validate AI flows before engineering begins
- **UX Designers** — Get expert-level UX feedback on AI interactions
- **Engineering Leads** — Reduce costly late-stage design changes
- **Founders** — Build trustworthy AI products from day one

---

## 🔒 Privacy & Security

- **No Data Storage** — Flows are analyzed in real-time, not stored
- **Optional AI** — Works fully with rule-based analysis (no external API calls)
- **Local First** — Can run entirely on your infrastructure
- **API Key Control** — Bring your own OpenAI key (if using AI features)

---

## 📈 Roadmap

- [ ] Team collaboration features
- [ ] Export to Figma/Miro
- [ ] Custom rule builder
- [ ] Industry-specific templates (healthcare, fintech, etc.)
- [ ] Integration with design tools
- [ ] Multi-language support

---

## 🤝 Contributing

Nthcreation is a professional product. For enterprise licensing, custom deployments, or partnerships, please contact the team.

---

## 📄 License

Copyright © 2025 Nthcreation. All rights reserved.

---

## 🔗 Resources

- **Documentation**: `/docs` folder
- **API Reference**: `http://localhost:4000/status`
- **Examples**: See `EXAMPLE_RESULTS.md`

---

**Built for teams who ship AI products users actually trust.**
