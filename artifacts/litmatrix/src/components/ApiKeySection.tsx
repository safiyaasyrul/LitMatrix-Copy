import React, { useState } from "react";
import {
  UserAIKeysConfig,
  AIProviderConfig,
  getActiveAIConfig,
  testAIConnection,
  SupportedAIProvider,
  DEFAULT_AI_KEYS_CONFIG,
} from "../utils/aiClient";
import {
  Key,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Trash2,
  Check,
  Copy,
  Zap,
  Globe,
  Lock,
  Cpu,
  Terminal,
  Server,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ApiKeySectionProps {
  keysConfig: UserAIKeysConfig;
  onUpdateKeysConfig: (newConfig: UserAIKeysConfig) => void;
  onContinueToNext?: () => void;
}

export default function ApiKeySection({
  keysConfig,
  onUpdateKeysConfig,
  onContinueToNext,
}: ApiKeySectionProps) {
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; message: string; latencyMs: number } | null;
  }>({});
  const [copiedDisclosure, setCopiedDisclosure] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSetActive = (provider: SupportedAIProvider) => {
    const updated: UserAIKeysConfig = {
      ...DEFAULT_AI_KEYS_CONFIG,
      ...keysConfig,
      activeProvider: provider,
    };
    onUpdateKeysConfig(updated);
    triggerSaveToast();
  };

  const triggerSaveToast = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleUpdateField = (
    provider: "openai" | "claude" | "gemini" | "emergent" | "replit" | "other",
    field: string,
    value: string
  ) => {
    const defaultProviderObj = DEFAULT_AI_KEYS_CONFIG[provider] || {};
    const updated = {
      ...DEFAULT_AI_KEYS_CONFIG,
      ...keysConfig,
      [provider]: {
        ...defaultProviderObj,
        ...(keysConfig?.[provider] || {}),
        [field]: value,
      },
    };
    onUpdateKeysConfig(updated);
  };

  const handleTestKey = async (provider: SupportedAIProvider) => {
    setTestingProvider(provider);
    setTestResults((prev) => ({ ...prev, [provider]: null }));

    let testConfig: AIProviderConfig;
    if (provider === "server-gemini") {
      testConfig = { provider: "server-gemini", model: "gemini-3.7-flash" };
    } else if (provider === "openai") {
      testConfig = {
        provider: "openai",
        apiKey: keysConfig?.openai?.apiKey || "",
        model: keysConfig?.openai?.model || "gpt-4o-mini",
        customBase: keysConfig?.openai?.customBase || "https://api.openai.com/v1",
      };
    } else if (provider === "claude") {
      testConfig = {
        provider: "claude",
        apiKey: keysConfig?.claude?.apiKey || "",
        model: keysConfig?.claude?.model || "claude-3-7-sonnet-20250219",
      };
    } else if (provider === "gemini") {
      testConfig = {
        provider: "gemini",
        apiKey: keysConfig?.gemini?.apiKey || "",
        model: keysConfig?.gemini?.model || "gemini-3.7-flash",
      };
    } else if (provider === "emergent") {
      testConfig = {
        provider: "emergent",
        apiKey: keysConfig?.emergent?.apiKey || "",
        model: keysConfig?.emergent?.model || "gpt-4o-mini",
        customBase: keysConfig?.emergent?.customBase || "https://api.emergent.sh/v1",
      };
    } else if (provider === "replit") {
      testConfig = {
        provider: "replit",
        apiKey: keysConfig?.replit?.apiKey || "",
        model: keysConfig?.replit?.model || "replit-code-v1_5-3b",
        customBase: keysConfig?.replit?.customBase || "https://api.replit.com/ai/v1",
      };
    } else {
      testConfig = {
        provider: "other",
        apiKey: keysConfig?.other?.apiKey || "",
        model: keysConfig?.other?.model || "gpt-4o-mini",
        customBase: keysConfig?.other?.customBase || "https://openrouter.ai/api/v1",
      };
    }

    const res = await testAIConnection(testConfig);
    setTestResults((prev) => ({ ...prev, [provider]: res }));
    setTestingProvider(null);
  };

  const handleClearAllKeys = () => {
    if (
      window.confirm(
        "Are you sure you want to remove all saved API keys? This will reset all key inputs."
      )
    ) {
      onUpdateKeysConfig({
        activeProvider: "server-gemini",
        openai: { apiKey: "", model: "gpt-4o-mini", customBase: "https://api.openai.com/v1" },
        claude: { apiKey: "", model: "claude-3-7-sonnet-20250219" },
        gemini: { apiKey: "", model: "gemini-3.7-flash" },
        emergent: { apiKey: "", model: "gpt-4o-mini", customBase: "https://api.emergent.sh/v1" },
        replit: { apiKey: "", model: "replit-code-v1_5-3b", customBase: "https://api.replit.com/ai/v1" },
        other: { apiKey: "", model: "gpt-4o-mini", customBase: "https://openrouter.ai/api/v1" },
      });
      setTestResults({});
      triggerSaveToast();
    }
  };

  const activeAI = getActiveAIConfig(keysConfig);

  // PRISMA Item 8 automation disclosure prose
  const getPrismaItem8Disclosure = () => {
    const providerNameMap: Record<SupportedAIProvider, string> = {
      "server-gemini": "Google Gemini (Built-in Server Gemini 3.7 Flash)",
      openai: `OpenAI (${keysConfig?.openai?.model || "gpt-4o-mini"})`,
      claude: `Anthropic Claude (${keysConfig?.claude?.model || "claude-3-7-sonnet"})`,
      gemini: `Google Gemini (${keysConfig?.gemini?.model || "gemini-3.7-flash"})`,
      emergent: `Emergent AI (${keysConfig?.emergent?.model || "gpt-4o-mini"})`,
      replit: `Replit AI (${keysConfig?.replit?.model || "replit-code"})`,
      other: `Custom LLM (${keysConfig?.other?.model || "custom model"}) via ${keysConfig?.other?.customBase || ""}`,
    };

    return `PRISMA 2020 Item 8 Automation & LLM Disclosure:
"Title/abstract screening, study characteristics extraction, risk-of-bias evaluation, and preliminary synthesis were assisted using large language model automation (${providerNameMap[keysConfig?.activeProvider || "server-gemini"]}). Automated screening recommendations were reviewed and independently verified by human investigators with a pre-specified consensus threshold."`;
  };

  const copyDisclosure = () => {
    navigator.clipboard.writeText(getPrismaItem8Disclosure());
    setCopiedDisclosure(true);
    setTimeout(() => setCopiedDisclosure(false), 2000);
  };

  return (
    <div id="api-keys-management-container" className="space-y-6">
      {/* Toast Save indicator */}
      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between shadow-xs font-mono text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>AI configuration saved to your browser session.</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                Step 1 · AI Configuration
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                PRISMA 2020 Item 8 Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Providers & API Keys
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              Key in your API key for <strong>OpenAI</strong>, <strong>Anthropic Claude</strong>, <strong>Google Gemini</strong>, <strong>Emergent</strong>, <strong>Replit</strong>, or <strong>Custom Endpoints</strong> to power screening, study characteristics extraction, risk of bias, meta-analysis, and PRISMA reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onContinueToNext && (
              <button
                onClick={onContinueToNext}
                className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Continue to Protocol & Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Provider Quick Card */}
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400">Currently Active Provider:</div>
              <div className="font-mono text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>
                  {keysConfig.activeProvider === "server-gemini"
                    ? "Built-in Gemini (Server-side 2.5 Flash)"
                    : keysConfig.activeProvider === "openai"
                    ? `OpenAI (${keysConfig.openai.model || "gpt-4o-mini"})`
                    : keysConfig.activeProvider === "claude"
                    ? `Anthropic Claude (${keysConfig.claude.model || "claude-3-7-sonnet"})`
                    : keysConfig.activeProvider === "gemini"
                    ? `Google Gemini Studio (${keysConfig.gemini.model || "gemini-2.5-flash"})`
                    : keysConfig.activeProvider === "emergent"
                    ? `Emergent AI (${keysConfig.emergent.model || "gpt-4o-mini"})`
                    : keysConfig.activeProvider === "replit"
                    ? `Replit AI (${keysConfig.replit.model || "replit-code"})`
                    : `Custom Endpoint (${keysConfig.other.model})`}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestKey(keysConfig.activeProvider)}
              disabled={testingProvider !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              {testingProvider === keysConfig.activeProvider ? "Testing..." : "Test Active Provider"}
            </button>
          </div>
        </div>
      </div>

      {/* Provider Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            id: "openai" as SupportedAIProvider,
            label: "OpenAI",
            desc: "GPT-4o, GPT-4o-mini, o3-mini",
            hasKey: Boolean(keysConfig.openai.apiKey),
            icon: Sparkles,
          },
          {
            id: "claude" as SupportedAIProvider,
            label: "Anthropic Claude",
            desc: "Claude 3.7 / 3.5 Sonnet",
            hasKey: Boolean(keysConfig.claude.apiKey),
            icon: Shield,
          },
          {
            id: "gemini" as SupportedAIProvider,
            label: "Google Gemini",
            desc: "Gemini 2.5 Flash, 2.5 Pro",
            hasKey: Boolean(keysConfig.gemini.apiKey),
            icon: Zap,
          },
          {
            id: "emergent" as SupportedAIProvider,
            label: "Emergent AI",
            desc: "api.emergent.sh Gateway",
            hasKey: Boolean(keysConfig.emergent.apiKey),
            icon: Globe,
          },
          {
            id: "replit" as SupportedAIProvider,
            label: "Replit AI",
            desc: "api.replit.com/ai Endpoint",
            hasKey: Boolean(keysConfig.replit.apiKey),
            icon: Terminal,
          },
          {
            id: "other" as SupportedAIProvider,
            label: "Custom / Local",
            desc: "OpenRouter, Groq, Ollama",
            hasKey: Boolean(keysConfig.other.apiKey),
            icon: Cpu,
          },
        ].map((p) => {
          const isActive = keysConfig.activeProvider === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => handleSetActive(p.id)}
              className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                {isActive && (
                  <span className="text-[9px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
                {!isActive && p.hasKey && (
                  <span className="text-[9px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                    KEY SET
                  </span>
                )}
              </div>
              <div className="font-bold text-xs text-slate-900">{p.label}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Provider Details Cards */}
      <div className="space-y-4">
        {/* 1. OpenAI Configuration */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
            keysConfig.activeProvider === "openai"
              ? "border-indigo-500 ring-1 ring-indigo-500/30"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs">
                OA
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">OpenAI API Configuration</h3>
                <p className="text-xs text-slate-500">
                  Connect official OpenAI keys (<code className="font-mono text-[11px]">sk-...</code>) or custom Azure/proxy URLs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetActive("openai")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  keysConfig.activeProvider === "openai"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {keysConfig.activeProvider === "openai" ? "✓ Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleTestKey("openai")}
                disabled={testingProvider === "openai" || !keysConfig.openai.apiKey}
                className="px-3 py-1 text-xs font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                {testingProvider === "openai" ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                OpenAI API Key (sk-...)
              </label>
              <div className="relative">
                <input
                  type={showKeys["openai"] ? "text" : "password"}
                  value={keysConfig.openai.apiKey}
                  onChange={(e) => handleUpdateField("openai", "apiKey", e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full font-mono text-xs px-3 py-2 pr-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("openai")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["openai"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Model
              </label>
              <select
                value={keysConfig.openai.model || "gpt-4o-mini"}
                onChange={(e) => handleUpdateField("openai", "model", e.target.value)}
                className="w-full font-mono text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                <option value="gpt-4o">gpt-4o (High Accuracy)</option>
                <option value="o3-mini">o3-mini (Reasoning)</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
              </select>
            </div>
          </div>

          {testResults["openai"] && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                testResults["openai"].success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResults["openai"].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResults["openai"].message}</span>
              </div>
              <span className="text-[10px] text-slate-500">{testResults["openai"].latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* 2. Claude Configuration */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
            keysConfig.activeProvider === "claude"
              ? "border-indigo-500 ring-1 ring-indigo-500/30"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
                CL
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Anthropic Claude API Configuration</h3>
                <p className="text-xs text-slate-500">
                  Direct browser API connection with Claude (<code className="font-mono text-[11px]">sk-ant-...</code>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetActive("claude")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  keysConfig.activeProvider === "claude"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {keysConfig.activeProvider === "claude" ? "✓ Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleTestKey("claude")}
                disabled={testingProvider === "claude" || !keysConfig.claude.apiKey}
                className="px-3 py-1 text-xs font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                {testingProvider === "claude" ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Anthropic API Key (sk-ant-...)
              </label>
              <div className="relative">
                <input
                  type={showKeys["claude"] ? "text" : "password"}
                  value={keysConfig.claude.apiKey}
                  onChange={(e) => handleUpdateField("claude", "apiKey", e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full font-mono text-xs px-3 py-2 pr-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("claude")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["claude"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Model
              </label>
              <select
                value={keysConfig.claude.model || "claude-3-7-sonnet-20250219"}
                onChange={(e) => handleUpdateField("claude", "model", e.target.value)}
                className="w-full font-mono text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Latest)</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
              </select>
            </div>
          </div>

          {testResults["claude"] && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                testResults["claude"].success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResults["claude"].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResults["claude"].message}</span>
              </div>
              <span className="text-[10px] text-slate-500">{testResults["claude"].latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* 3. Google Gemini (AI Studio Key) */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
            keysConfig.activeProvider === "gemini"
              ? "border-indigo-500 ring-1 ring-indigo-500/30"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                GM
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Google Gemini (Google AI Studio Key)</h3>
                <p className="text-xs text-slate-500">
                  Key in your Google AI Studio key (<code className="font-mono text-[11px]">AIzaSy...</code>) for direct unlimited API access.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetActive("gemini")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  keysConfig.activeProvider === "gemini"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {keysConfig.activeProvider === "gemini" ? "✓ Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleTestKey("gemini")}
                disabled={testingProvider === "gemini" || !keysConfig.gemini.apiKey}
                className="px-3 py-1 text-xs font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                {testingProvider === "gemini" ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Google AI Studio API Key (AIzaSy...)
              </label>
              <div className="relative">
                <input
                  type={showKeys["gemini"] ? "text" : "password"}
                  value={keysConfig.gemini.apiKey}
                  onChange={(e) => handleUpdateField("gemini", "apiKey", e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full font-mono text-xs px-3 py-2 pr-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("gemini")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["gemini"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Model
              </label>
              <select
                value={keysConfig?.gemini?.model || "gemini-3.7-flash"}
                onChange={(e) => handleUpdateField("gemini", "model", e.target.value)}
                className="w-full font-mono text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Recommended, High Quality)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Fast)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Complex Reasoning)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest</option>
              </select>
            </div>
          </div>

          {testResults["gemini"] && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                testResults["gemini"].success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResults["gemini"].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResults["gemini"].message}</span>
              </div>
              <span className="text-[10px] text-slate-500">{testResults["gemini"].latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* 4. Emergent AI */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
            keysConfig.activeProvider === "emergent"
              ? "border-indigo-500 ring-1 ring-indigo-500/30"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs">
                EM
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Emergent AI Endpoint</h3>
                <p className="text-xs text-slate-500">
                  Connect via Emergent AI API gateway (<code className="font-mono text-[11px]">https://api.emergent.sh/v1</code>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetActive("emergent")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  keysConfig.activeProvider === "emergent"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {keysConfig.activeProvider === "emergent" ? "✓ Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleTestKey("emergent")}
                disabled={testingProvider === "emergent" || !keysConfig.emergent.apiKey}
                className="px-3 py-1 text-xs font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                {testingProvider === "emergent" ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Emergent API Key
              </label>
              <div className="relative">
                <input
                  type={showKeys["emergent"] ? "text" : "password"}
                  value={keysConfig.emergent.apiKey}
                  onChange={(e) => handleUpdateField("emergent", "apiKey", e.target.value)}
                  placeholder="em-..."
                  className="w-full font-mono text-xs px-3 py-2 pr-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("emergent")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["emergent"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Model Name
              </label>
              <input
                type="text"
                value={keysConfig.emergent.model}
                onChange={(e) => handleUpdateField("emergent", "model", e.target.value)}
                placeholder="gpt-4o-mini / emergent-1"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Base URL
              </label>
              <input
                type="text"
                value={keysConfig.emergent.customBase}
                onChange={(e) => handleUpdateField("emergent", "customBase", e.target.value)}
                placeholder="https://api.emergent.sh/v1"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {testResults["emergent"] && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                testResults["emergent"].success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResults["emergent"].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResults["emergent"].message}</span>
              </div>
              <span className="text-[10px] text-slate-500">{testResults["emergent"].latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* 5. Replit AI */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
            keysConfig.activeProvider === "replit"
              ? "border-indigo-500 ring-1 ring-indigo-500/30"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center font-bold text-xs">
                RP
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Replit AI Gateway</h3>
                <p className="text-xs text-slate-500">
                  Connect using Replit AI API token (<code className="font-mono text-[11px]">https://api.replit.com/ai/v1</code>).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetActive("replit")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  keysConfig.activeProvider === "replit"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {keysConfig.activeProvider === "replit" ? "✓ Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleTestKey("replit")}
                disabled={testingProvider === "replit" || !keysConfig.replit.apiKey}
                className="px-3 py-1 text-xs font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                {testingProvider === "replit" ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Replit AI Token
              </label>
              <div className="relative">
                <input
                  type={showKeys["replit"] ? "text" : "password"}
                  value={keysConfig.replit.apiKey}
                  onChange={(e) => handleUpdateField("replit", "apiKey", e.target.value)}
                  placeholder="replit_ai_..."
                  className="w-full font-mono text-xs px-3 py-2 pr-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("replit")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["replit"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Model Name
              </label>
              <input
                type="text"
                value={keysConfig.replit.model}
                onChange={(e) => handleUpdateField("replit", "model", e.target.value)}
                placeholder="replit-code-v1_5-3b"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Base URL
              </label>
              <input
                type="text"
                value={keysConfig.replit.customBase}
                onChange={(e) => handleUpdateField("replit", "customBase", e.target.value)}
                placeholder="https://api.replit.com/ai/v1"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {testResults["replit"] && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                testResults["replit"].success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResults["replit"].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResults["replit"].message}</span>
              </div>
              <span className="text-[10px] text-slate-500">{testResults["replit"].latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* 6. Custom OpenAI-compatible / OpenRouter / Groq / Ollama */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
            keysConfig.activeProvider === "other"
              ? "border-indigo-500 ring-1 ring-indigo-500/30"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Custom Gateway / OpenRouter / Groq / Ollama</h3>
                <p className="text-xs text-slate-500">
                  Any OpenAI-compatible completions endpoint with custom base URL.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetActive("other")}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                  keysConfig.activeProvider === "other"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {keysConfig.activeProvider === "other" ? "✓ Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleTestKey("other")}
                disabled={testingProvider === "other" || !keysConfig.other.apiKey}
                className="px-3 py-1 text-xs font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
              >
                {testingProvider === "other" ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                API Key / Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showKeys["other"] ? "text" : "password"}
                  value={keysConfig.other.apiKey}
                  onChange={(e) => handleUpdateField("other", "apiKey", e.target.value)}
                  placeholder="Bearer token or API key"
                  className="w-full font-mono text-xs px-3 py-2 pr-9 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("other")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys["other"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Model Name
              </label>
              <input
                type="text"
                value={keysConfig.other.model}
                onChange={(e) => handleUpdateField("other", "model", e.target.value)}
                placeholder="meta-llama/llama-3.3-70b"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-600 font-semibold block">
                Base URL
              </label>
              <input
                type="text"
                value={keysConfig.other.customBase}
                onChange={(e) => handleUpdateField("other", "customBase", e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {testResults["other"] && (
            <div
              className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                testResults["other"].success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResults["other"].success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResults["other"].message}</span>
              </div>
              <span className="text-[10px] text-slate-500">{testResults["other"].latencyMs}ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Security & PRISMA Disclosure Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-800">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>PRISMA 2020 Item 8 Automation Transparency Disclosure</span>
          </div>
          <button
            onClick={copyDisclosure}
            className="flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            {copiedDisclosure ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedDisclosure ? "Copied" : "Copy Disclosure Text"}
          </button>
        </div>
        <p className="text-xs font-mono bg-white p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
          {getPrismaItem8Disclosure()}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans pt-1">
          <span>
            🔒 All API keys are securely held in your browser's private storage and sent directly to the selected provider endpoint.
          </span>
          <button
            onClick={handleClearAllKeys}
            className="text-rose-600 hover:text-rose-800 font-mono text-xs cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Stored Keys
          </button>
        </div>
      </div>
    </div>
  );
}
