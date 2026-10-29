import { useState } from "react";
import { NEXT_JS_PROXY_URL } from "@/const";
import {
  Check,
  Copy,
  Share2,
  Code,
  ArrowUpRight,
  Plus,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function BotTrainingSuccess({
  botName,
  botId,
  kbId,
  onGoToChat = () => {},
  onReset,
  domain = NEXT_JS_PROXY_URL,
}: {
  botName: string | null;
  botId: string | null;
  kbId: string | null;
  onGoToChat?: () => void;
  onReset?: () => void;
  domain?: string;
}) {
  const [copyStatus, setCopyStatus] = useState({
    shareLink: false,
    embedCode: false,
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : domain;
  const shareUrl = `${origin}/chat/${botId}/${kbId}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" style="border:1px solid #e4e4e7;border-radius:12px;" allow="clipboard-write"></iframe>`;

  const copyToClipboard = (text: string, type: "shareLink" | "embedCode") => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [type]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-full bg-zinc-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Banner */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-zinc-950 tracking-tight">
                  {botName || "Assistant"} is deployed
                </h1>
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  READY
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Knowledge base ingestion has been queued and your assistant endpoint is live.
              </p>
            </div>
          </div>

          <button
            onClick={onGoToChat}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors shrink-0 self-start sm:self-auto"
          >
            <span>Open Assistant Chat</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Endpoint Metadata & Direct Share URL */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-semibold text-zinc-950">
                  Direct Chat Endpoint
                </h2>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 text-xs">
                  <span className="text-zinc-500">Assistant ID</span>
                  <code className="font-mono text-zinc-800 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/70">
                    {botId}
                  </code>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 text-xs">
                  <span className="text-zinc-500">Knowledge Base ID</span>
                  <code className="font-mono text-zinc-800 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/70">
                    {kbId}
                  </code>
                </div>
              </div>

              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Shareable URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200 flex-1 text-xs font-mono text-zinc-700 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl, "shareLink")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shrink-0"
                >
                  {copyStatus.shareLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mt-4">
              You can toggle public or private access at any time from the workspace card menu.
            </p>
          </div>

          {/* Website Embed Snippet */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-zinc-500" />
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Embed via Iframe
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">HTML</span>
              </div>

              <p className="text-xs text-zinc-500 mb-3">
                Paste this snippet into any documentation page or internal portal:
              </p>

              <pre className="bg-zinc-950 text-zinc-200 p-3.5 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
                {embedCode}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Responsive container
              </span>
              <button
                onClick={() => copyToClipboard(embedCode, "embedCode")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors"
              >
                {copyStatus.embedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied snippet</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy snippet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assistants</span>
          </Link>

          <button
            onClick={() => (onReset ? onReset() : window.location.reload())}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Another Assistant</span>
          </button>
        </div>
      </div>
    </div>
  );
}
