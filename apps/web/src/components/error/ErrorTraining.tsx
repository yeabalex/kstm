import { useState } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

export default function BotTrainingFailed({
  botName = "AI Assistant",
  errorMessage = "An unexpected error occurred during provisioning.",
  errorDetails = null,
  onRetry = () => {},
  onBack = () => {},
}: {
  botName?: string;
  errorMessage?: string;
  errorDetails?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  onContactSupport?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const commonErrors = [
    {
      id: 1,
      title: "File format not supported",
      solution: "Upload files in PDF, TXT, CSV, or JSON format.",
    },
    {
      id: 2,
      title: "API key invalid",
      solution: "Verify your custom API key or switch to the workspace key.",
    },
    {
      id: 3,
      title: "File too large",
      solution: "Keep individual source files under 50 MB.",
    },
  ];

  const suggestedFix = commonErrors.find((err) =>
    errorMessage.toLowerCase().includes(err.title.toLowerCase())
  );

  return (
    <div className="min-h-full bg-zinc-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-zinc-200/90 rounded-xl p-6 md:p-8">
          <div className="flex items-start gap-3.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
                Provisioning failed for {botName}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                The ingestion service returned an error while setting up this assistant.
              </p>
            </div>
          </div>

          <div className="bg-red-50/70 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-xs font-mono text-red-800">{errorMessage}</p>
          </div>

          {suggestedFix && (
            <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mb-6 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-medium text-zinc-900 block mb-0.5">
                  Recommended resolution
                </span>
                <span className="text-zinc-600">{suggestedFix.solution}</span>
              </div>
            </div>
          )}

          {errorDetails && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-900"
              >
                {showDetails ? "Hide trace" : "Show trace"}
              </button>
              {showDetails && (
                <pre className="mt-2 p-3 bg-zinc-950 text-zinc-200 rounded-lg overflow-auto text-xs font-mono max-h-40">
                  {errorDetails}
                </pre>
              )}
            </div>
          )}

          <div className="border-t border-zinc-100 pt-5 mb-6">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
              Troubleshooting Checklist
            </h2>
            <ul className="space-y-2 text-xs text-zinc-600">
              {commonErrors.map((err) => (
                <li key={err.id} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                  <span>
                    <strong className="font-medium text-zinc-800">
                      {err.title}:
                    </strong>{" "}
                    {err.solution}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Configuration</span>
              </button>
            </div>

            <Link
              href="/dashboard"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Return to Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
