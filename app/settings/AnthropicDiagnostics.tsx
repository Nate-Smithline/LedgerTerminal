"use client";

import { useState } from "react";

type Check = { label: string; pass: boolean; detail: string };

type KeyCheckResult = {
  status: string;
  checks: Check[];
  hint: string;
};

type LiveTestResult = {
  success: boolean;
  latencyMs?: number;
  model?: string;
  stopReason?: string;
  usage?: { inputTokens: number; outputTokens: number };
  response?: string;
  error?: string;
  errorType?: string;
  diagnosis?: string;
  steps?: string[];
  keyPreview?: string;
};

export function AnthropicDiagnostics() {
  const [keyCheck, setKeyCheck] = useState<KeyCheckResult | null>(null);
  const [liveResult, setLiveResult] = useState<LiveTestResult | null>(null);
  const [loading, setLoading] = useState<"idle" | "checking" | "testing">("idle");
  const [customPrompt, setCustomPrompt] = useState("");

  async function runKeyCheck() {
    setLoading("checking");
    setKeyCheck(null);
    try {
      const res = await fetch("/api/test-anthropic");
      const data = await res.json();
      setKeyCheck(data);
    } catch (e: unknown) {
      setKeyCheck({
        status: "error",
        checks: [],
        hint: e instanceof Error ? e.message : "Failed to reach test endpoint",
      });
    }
    setLoading("idle");
  }

  async function runLiveTest() {
    setLoading("testing");
    setLiveResult(null);
    try {
      const res = await fetch("/api/test-anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customPrompt ? { prompt: customPrompt } : {}),
      });
      const data = await res.json();
      setLiveResult(data);
    } catch (e: unknown) {
      setLiveResult({
        success: false,
        error: e instanceof Error ? e.message : "Network error",
        diagnosis: "Could not reach the test endpoint.",
        steps: ["Check if your dev server is running."],
      });
    }
    setLoading("idle");
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-mono-dark mb-1">
        Anthropic API Diagnostics
      </h2>
      <p className="text-sm text-mono-medium mb-4">
        Test your Anthropic connection without uploading transactions.
      </p>

      {/* Step 1: Key check */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-mono-dark">
            Step 1: Check API Key
          </h3>
          <button
            onClick={runKeyCheck}
            disabled={loading !== "idle"}
            className="btn-secondary text-xs px-3 py-1"
          >
            {loading === "checking" ? "Checking..." : "Run Check"}
          </button>
        </div>

        {keyCheck && (
          <div className="bg-bg-secondary rounded-md p-4 space-y-2">
            {keyCheck.checks.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={c.pass ? "text-green-600" : "text-red-500"}>
                  {c.pass ? "PASS" : "FAIL"}
                </span>
                <div>
                  <span className="font-medium text-mono-dark">{c.label}</span>
                  <span className="text-mono-medium ml-2">{c.detail}</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-mono-medium mt-2 pt-2 border-t border-bg-tertiary">
              {keyCheck.hint}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Live test */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-sm font-semibold text-mono-dark">
            Step 2: Live API Call
          </h3>
          <button
            onClick={runLiveTest}
            disabled={loading !== "idle"}
            className="btn-primary text-xs px-3 py-1"
          >
            {loading === "testing" ? "Calling Anthropic..." : "Send Test Message"}
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-mono-medium mb-1">
            Custom prompt (optional — leave blank for default expense test)
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder='e.g. "Categorize: AWS $49.99 on 2025-03-01"'
            className="w-full border border-bg-tertiary rounded-md px-3 py-2 text-sm"
          />
        </div>

        {liveResult && (
          <div
            className={`rounded-md p-4 space-y-3 ${
              liveResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {/* Status */}
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold ${
                  liveResult.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {liveResult.success ? "SUCCESS" : "FAILED"}
              </span>
              {liveResult.latencyMs != null && (
                <span className="text-xs text-mono-medium">
                  {liveResult.latencyMs}ms
                </span>
              )}
            </div>

            {/* Success details */}
            {liveResult.success && (
              <>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-mono-light">Model</span>
                    <p className="font-medium text-mono-dark">{liveResult.model}</p>
                  </div>
                  <div>
                    <span className="text-mono-light">Stop reason</span>
                    <p className="font-medium text-mono-dark">
                      {liveResult.stopReason}
                    </p>
                  </div>
                  <div>
                    <span className="text-mono-light">Tokens</span>
                    <p className="font-medium text-mono-dark">
                      {liveResult.usage?.inputTokens} in /{" "}
                      {liveResult.usage?.outputTokens} out
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-mono-light">Response</span>
                  <pre className="mt-1 text-xs text-mono-dark bg-white rounded p-3 overflow-auto max-h-48 whitespace-pre-wrap border border-bg-tertiary">
                    {liveResult.response}
                  </pre>
                </div>
              </>
            )}

            {/* Error details */}
            {!liveResult.success && (
              <>
                <div>
                  <span className="text-xs font-medium text-red-800">
                    Diagnosis
                  </span>
                  <p className="text-sm text-red-700 mt-1">
                    {liveResult.diagnosis}
                  </p>
                </div>

                {liveResult.steps && liveResult.steps.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-red-800">
                      How to fix
                    </span>
                    <ol className="text-sm text-red-700 mt-1 space-y-0.5 list-decimal list-inside">
                      {liveResult.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {liveResult.keyPreview && (
                  <p className="text-xs text-mono-light">
                    Key used: {liveResult.keyPreview}
                  </p>
                )}

                <div>
                  <span className="text-xs text-mono-light">Raw error</span>
                  <pre className="mt-1 text-xs text-red-700 bg-white rounded p-2 overflow-auto border border-red-100">
                    [{liveResult.errorType}] {liveResult.error}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
