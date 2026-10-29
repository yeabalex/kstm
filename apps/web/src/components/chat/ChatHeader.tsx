import React from "react";
import { Plus, ArrowLeft, PanelLeft } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  header: string | undefined;
  model?: string;
  onNewSession?: () => void;
  hasMessages?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  header,
  model,
  onNewSession,
  hasMessages,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-10 h-14 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors shrink-0 ${
              sidebarOpen
                ? "border-zinc-300 bg-zinc-100 text-zinc-950"
                : "border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
            }`}
            title={sidebarOpen ? "Hide Chat History" : "Show Chat History"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors shrink-0"
          title="Back to Workspace"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5 min-w-0 ml-0.5">
          <h1 className="text-sm font-semibold text-zinc-950 truncate">
            {header || "Assistant"}
          </h1>
          {model && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
              {model}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasMessages && onNewSession && (
          <button
            type="button"
            onClick={onNewSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-500" />
            <span>New Chat</span>
          </button>
        )}
        <Link
          href="/"
          className="h-7 px-2 rounded-md bg-zinc-900 text-white flex items-center justify-center font-mono text-[11px] font-semibold"
        >
          KSTM
        </Link>
      </div>
    </header>
  );
};

export default ChatHeader;
