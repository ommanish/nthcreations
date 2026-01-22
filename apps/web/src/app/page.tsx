"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Step = { id: string; text: string };
type Principle = {
  id: string;
  name: string;
  category: string;
  description: string;
  why: string;
  examples: string[];
};

export default function Home() {
  const [mode, setMode] = useState<"manual" | "url" | "upload">("manual");
  const [useAI, setUseAI] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);

  // Manual mode
  const [goal, setGoal] = useState("");
  const [steps, setSteps] = useState<Step[]>([
    { id: "step-1", text: "" },
    { id: "step-2", text: "" },
  ]);

  // URL mode
  const [url, setUrl] = useState("");

  // Upload mode
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [overallRisk, setOverallRisk] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [expandedPrinciple, setExpandedPrinciple] = useState<string | null>(
    null,
  );

  // Check AI availability on mount
  useEffect(() => {
    fetch(`${API}/status`)
      .then((res) => res.json())
      .then((data) => {
        setAiAvailable(data.features?.aiEnhancedAnalysis || false);
      })
      .catch(() => setAiAvailable(false));
  }, []);

  const addStep = () =>
    setSteps((p) => [...p, { id: `step-${p.length + 1}`, text: "" }]);
  const updateStep = (id: string, text: string) =>
    setSteps((p) => p.map((s) => (s.id === id ? { ...s, text } : s)));

  const analyzeManual = async () => {
    setLoading(true);
    setOverallRisk(null);
    setHighlights([]);
    setFindings([]);
    setPrinciples([]);

    const cleaned = steps.filter((s) => s.text.trim().length > 0);

    const flowRes = await fetch(`${API}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, steps: cleaned }),
    });

    if (!flowRes.ok) {
      const err = await flowRes.json().catch(() => ({}));
      setLoading(false);
      alert(err.error ?? "Failed to create flow");
      return;
    }

    const flow = await flowRes.json();

    const analysisRes = await fetch(
      `${API}/flows/${flow.id}/analyze?ai=${useAI}`,
      {
        method: "POST",
      },
    );
    const analysis = await analysisRes.json();

    setOverallRisk(analysis.summary.overallRisk);
    setHighlights(analysis.summary.highlights);
    setFindings(analysis.findings);
    setPrinciples(analysis.principles || []);

    setLoading(false);
  };

  const analyzeUrl = async () => {
    setLoading(true);
    setOverallRisk(null);
    setHighlights([]);
    setFindings([]);
    setPrinciples([]);

    try {
      const response = await fetch(`${API}/analyze/url?ai=${useAI}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error ?? "Failed to analyze URL");
        setLoading(false);
        return;
      }

      const result = await response.json();

      setOverallRisk(result.analysis.summary.overallRisk);
      setHighlights(result.analysis.summary.highlights);
      setFindings(result.analysis.findings);
      setPrinciples(result.analysis.principles || []);

      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze URL");
      setLoading(false);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setLoading(true);
    setOverallRisk(null);
    setHighlights([]);
    setFindings([]);
    setPrinciples([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("useAI", String(useAI));

      const response = await fetch(`${API}/analyze/upload?ai=${useAI}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error ?? "Failed to analyze file");
        setLoading(false);
        return;
      }

      const result = await response.json();

      setOverallRisk(result.analysis.summary.overallRisk);
      setHighlights(result.analysis.summary.highlights);
      setFindings(result.analysis.findings);
      setPrinciples(result.analysis.principles || []);

      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze file");
      setLoading(false);
    }
  };

  const analyze = () => {
    if (mode === "manual") analyzeManual();
    else if (mode === "url") analyzeUrl();
    else if (mode === "upload") analyzeFile();
  };

  const getRiskColor = (risk: string) => {
    if (risk === "HIGH") return "#dc2626";
    if (risk === "MEDIUM") return "#ea580c";
    return "#16a34a";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "HIGH") return "#fecaca";
    if (severity === "MEDIUM") return "#fed7aa";
    return "#bbf7d0";
  };

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 42,
            marginBottom: 12,
            fontWeight: 800,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          Nthcreation
        </h1>
        <p
          style={{
            marginTop: 0,
            color: "#64748b",
            fontSize: 18,
            fontWeight: 400,
            maxWidth: 600,
          }}
        >
          UX Intelligence Platform — Identify experience risks in AI products
          before development begins.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 32,
          background: "#ffffff",
          padding: "8px",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={() => setMode("manual")}
          style={{
            padding: "12px 24px",
            border: "none",
            background:
              mode === "manual"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: mode === "manual" ? "#ffffff" : "#64748b",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 8,
            transition: "all 0.2s",
            boxShadow:
              mode === "manual" ? "0 2px 8px rgba(102, 126, 234, 0.3)" : "none",
          }}
        >
          ✏️ Manual Entry
        </button>
        <button
          onClick={() => setMode("url")}
          style={{
            padding: "12px 24px",
            border: "none",
            background:
              mode === "url"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: mode === "url" ? "#ffffff" : "#64748b",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 8,
            transition: "all 0.2s",
            boxShadow:
              mode === "url" ? "0 2px 8px rgba(102, 126, 234, 0.3)" : "none",
          }}
        >
          🔗 Analyze URL
        </button>
        <button
          onClick={() => setMode("upload")}
          style={{
            padding: "12px 24px",
            border: "none",
            background:
              mode === "upload"
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: mode === "upload" ? "#ffffff" : "#64748b",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 8,
            transition: "all 0.2s",
            boxShadow:
              mode === "upload" ? "0 2px 8px rgba(102, 126, 234, 0.3)" : "none",
          }}
        >
          📤 Upload File
        </button>
      </div>

      {/* AI Toggle */}
      {aiAvailable && (
        <div
          style={{
            marginBottom: 24,
            padding: "16px",
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            borderRadius: 12,
            border: "1px solid #667eea30",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 4,
              }}
            >
              🤖 AI-Enhanced Analysis
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Enable contextual AI analysis for deeper insights beyond
              rule-based checks (~15 sec)
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              style={{
                width: 20,
                height: 20,
                cursor: "pointer",
                accentColor: "#667eea",
              }}
            />
            <span style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>
              {useAI ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
      )}

      {mode === "manual" && (
        <>
          <section style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 14,
                color: "#334155",
                marginBottom: 8,
                display: "block",
                fontWeight: 600,
              }}
            >
              Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder='e.g., "Let users safely approve AI actions before execution"'
              style={{
                width: "100%",
                minHeight: 100,
                padding: 16,
                border: "2px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 15,
                fontFamily: "inherit",
                lineHeight: 1.6,
                resize: "vertical",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </section>

          <section style={{ marginBottom: 24 }}>
            <label
              style={{
                fontSize: 14,
                color: "#334155",
                marginBottom: 8,
                display: "block",
                fontWeight: 600,
              }}
            >
              Flow Steps
            </label>
            <div style={{ display: "grid", gap: 12 }}>
              {steps.map((s, i) => (
                <div key={s.id} style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 16,
                      top: 16,
                      color: "#94a3b8",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={s.text}
                    onChange={(e) => updateStep(s.id, e.target.value)}
                    placeholder={`Describe step ${i + 1}...`}
                    style={{
                      width: "100%",
                      padding: "14px 16px 14px 40px",
                      border: "2px solid #e2e8f0",
                      borderRadius: 12,
                      fontSize: 15,
                      fontFamily: "inherit",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addStep}
              style={{
                marginTop: 12,
                padding: "10px 18px",
                border: "2px dashed #cbd5e1",
                background: "transparent",
                borderRadius: 12,
                cursor: "pointer",
                color: "#64748b",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
                width: "100%",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.color = "#667eea";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              + Add step
            </button>
          </section>
        </>
      )}

      {mode === "url" && (
        <section style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 14,
              color: "#334155",
              marginBottom: 8,
              display: "block",
              fontWeight: 600,
            }}
          >
            Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/product-page"
            style={{
              width: "100%",
              padding: 16,
              border: "2px solid #e2e8f0",
              borderRadius: 12,
              fontSize: 15,
              fontFamily: "inherit",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            💡 Automatically extract and analyze UX flows from live product
            pages, demos, or documentation
          </p>
        </section>
      )}

      {mode === "upload" && (
        <section style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 14,
              color: "#334155",
              marginBottom: 8,
              display: "block",
              fontWeight: 600,
            }}
          >
            Upload File or Mockup
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".txt,.html,.md,.png,.jpg,.jpeg,.gif,.svg,.webp"
            style={{
              padding: 16,
              border: "2px solid #e2e8f0",
              borderRadius: 12,
              width: "100%",
              fontSize: 14,
              cursor: "pointer",
              background: "#f8fafc",
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: "#64748b",
              marginTop: 10,
              lineHeight: 1.6,
              background: "#f1f5f9",
              padding: 12,
              borderRadius: 8,
            }}
          >
            📄 <strong>Text files:</strong> .txt, .html, .md
            <br />
            🖼️ <strong>Mockup screens:</strong> .png, .jpg, .svg, .gif, .webp
          </div>
          {file && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                background:
                  "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                borderRadius: 12,
                fontSize: 14,
                border: "2px solid #667eea30",
              }}
            >
              ✅ Selected:{" "}
              <strong style={{ color: "#667eea" }}>{file.name}</strong>{" "}
              <span style={{ color: "#64748b" }}>
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </section>
      )}

      <button
        onClick={analyze}
        disabled={
          loading ||
          (mode === "manual" && goal.trim().length === 0) ||
          (mode === "url" && url.trim().length === 0) ||
          (mode === "upload" && !file)
        }
        style={{
          marginTop: 8,
          marginBottom: 40,
          padding: "16px 32px",
          borderRadius: 12,
          border: "none",
          background: loading
            ? "#94a3b8"
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.3s",
          boxShadow: loading ? "none" : "0 4px 14px rgba(102, 126, 234, 0.4)",
          opacity:
            loading ||
            (mode === "manual" && goal.trim().length === 0) ||
            (mode === "url" && url.trim().length === 0) ||
            (mode === "upload" && !file)
              ? 0.6
              : 1,
        }}
      >
        {loading ? "⏳ Analyzing…" : "🔍 Analyze Experience"}
      </button>

      {overallRisk && (
        <section>
          <div
            style={{
              padding: 32,
              borderRadius: 16,
              background: "#ffffff",
              marginBottom: 40,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: `3px solid ${getRiskColor(overallRisk)}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: getRiskColor(overallRisk) + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {overallRisk === "HIGH"
                  ? "⚠️"
                  : overallRisk === "MEDIUM"
                    ? "⚡"
                    : "✅"}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  UX Risk Assessment
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: getRiskColor(overallRisk),
                    letterSpacing: "-0.02em",
                  }}
                >
                  {overallRisk} RISK
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                padding: 20,
                borderRadius: 12,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                🎯 Key Issues Found:
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 24,
                  lineHeight: 2,
                  listStyle: "none",
                }}
              >
                {highlights.map((h, i) => (
                  <li
                    key={h}
                    style={{
                      fontSize: 15,
                      color: "#334155",
                      position: "relative",
                      paddingLeft: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: getRiskColor(overallRisk),
                        color: "#fff",
                        textAlign: "center",
                        lineHeight: "24px",
                        fontSize: 12,
                        fontWeight: 700,
                        marginRight: 12,
                      }}
                    >
                      {i + 1}
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {principles.length > 0 && (
            <>
              <h2
                style={{
                  marginBottom: 20,
                  fontSize: 28,
                  fontWeight: 800,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                📚 Related UX Principles
              </h2>
              <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
                {principles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 20,
                      border: "2px solid #e2e8f0",
                      borderRadius: 16,
                      background: "#ffffff",
                      transition: "all 0.3s",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "#667eea";
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(102, 126, 234, 0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      onClick={() =>
                        setExpandedPrinciple(
                          expandedPrinciple === p.id ? null : p.id,
                        )
                      }
                    >
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          color: "#1e293b",
                        }}
                      >
                        <span>{p.name}</span>
                        <span
                          style={{
                            fontSize: 24,
                            color: "#667eea",
                            fontWeight: 300,
                          }}
                        >
                          {expandedPrinciple === p.id ? "−" : "+"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: "#64748b",
                          marginTop: 8,
                          lineHeight: 1.6,
                        }}
                      >
                        {p.description}
                      </div>
                    </div>

                    {expandedPrinciple === p.id && (
                      <div
                        style={{
                          marginTop: 16,
                          paddingTop: 16,
                          borderTop: "2px solid #f1f5f9",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 8,
                            color: "#334155",
                          }}
                        >
                          💡 Why this matters:
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#475569",
                            lineHeight: 1.6,
                          }}
                        >
                          {p.why}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            marginTop: 16,
                            marginBottom: 8,
                            color: "#334155",
                          }}
                        >
                          ✅ Examples:
                        </div>
                        <ul
                          style={{
                            fontSize: 14,
                            color: "#475569",
                            paddingLeft: 24,
                            lineHeight: 1.7,
                          }}
                        >
                          {p.examples.map((ex, i) => (
                            <li key={i} style={{ marginTop: 6 }}>
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <h2
            style={{
              marginBottom: 16,
              fontSize: 28,
              fontWeight: 800,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.02em",
            }}
          >
            🔍 Analysis Results ({findings.length}{" "}
            {findings.length === 1 ? "Issue" : "Issues"})
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#64748b",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            We've analyzed your UX flow and identified potential trust and
            usability issues. Each finding includes why it matters and specific
            recommendations to improve the experience.
          </p>
          <div style={{ display: "grid", gap: 20 }}>
            {findings.map((f, index) => (
              <div
                key={f.id}
                style={{
                  padding: 28,
                  background: "#ffffff",
                  borderRadius: 16,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: "2px solid #e2e8f0",
                  borderLeft: `6px solid ${getRiskColor(f.severity)}`,
                  transition: "all 0.3s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(0,0,0,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${getRiskColor(f.severity)}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: getRiskColor(f.severity),
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: getRiskColor(f.severity),
                          color: "#fff",
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {f.severity} PRIORITY
                      </span>
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {f.category}
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        • {Math.round(f.confidence * 100)}% confidence
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#1e293b",
                        lineHeight: 1.4,
                        marginBottom: 12,
                      }}
                    >
                      {f.title}
                    </h3>
                  </div>
                </div>

                <div
                  style={{
                    background: "#fef9f3",
                    padding: 16,
                    borderRadius: 12,
                    borderLeft: "4px solid #f59e0b",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#92400e",
                      marginBottom: 6,
                    }}
                  >
                    ⚠️ Why This Matters:
                  </div>
                  <div
                    style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.7 }}
                  >
                    {f.description}
                  </div>
                </div>

                <div
                  style={{
                    background: "#f0fdf4",
                    padding: 16,
                    borderRadius: 12,
                    borderLeft: "4px solid #22c55e",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#166534",
                      marginBottom: 6,
                    }}
                  >
                    ✅ How to Fix It:
                  </div>
                  <div
                    style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.7 }}
                  >
                    {f.recommendation}
                  </div>
                </div>

                {f.patternId && (
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 13,
                      color: "#667eea",
                      background: "#f5f3ff",
                      padding: "12px 16px",
                      borderRadius: 10,
                      fontWeight: 600,
                      border: "1px solid #e9d5ff",
                    }}
                  >
                    🎯 Design Pattern:{" "}
                    <code
                      style={{
                        background: "#ede9fe",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      {f.patternId}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
