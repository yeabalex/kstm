import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, ArrowUpRight, MessageSquare, Plus, Clock } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
  isLoading?: boolean;
}

export interface ChatSessionItem {
  id: string;
  title: string | null;
  updatedAt?: string;
  createdAt?: string;
}

interface BotInfo {
  name: string;
  model: string;
  user_id?: string;
  userId?: string;
  description: string;
  private: boolean;
}

interface Props {
  bot: BotInfo | undefined;
  messages: Message[];
  showIntro: boolean;
  handleSendMessage: (text: string) => void;
  handleNewSession: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  sessions?: ChatSessionItem[];
  activeSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  loadingSessionMessages?: boolean;
}

const starterPrompts = [
  "Summarize the key topics covered in this knowledge base",
  "What are the main guidelines or procedures documented here?",
  "List the most important facts or definitions from the sources",
];

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ChatLayout: React.FC<Props> = ({
  bot,
  messages,
  showIntro,
  handleSendMessage,
  handleNewSession,
  messagesEndRef,
  sessions = [],
  activeSessionId,
  onSelectSession,
  loadingSessionMessages = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isIntroView = showIntro && messages.length === 0 && !loadingSessionMessages;

  return (
    <div className="flex h-screen flex-col bg-zinc-50 text-zinc-900 w-full">
      <ChatHeader
        header={bot?.name}
        model={bot?.model}
        onNewSession={handleNewSession}
        hasMessages={messages.length > 0}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat History Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 shrink-0 border-r border-zinc-200/80 bg-white flex flex-col h-full">
            <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Chat History</span>
              </div>
              <button
                type="button"
                onClick={handleNewSession}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                title="Start a new conversation"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sessions.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <MessageSquare className="w-4 h-4 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">No past conversations yet</p>
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isActive = session.id === activeSessionId && !isIntroView;
                    const timeLabel = formatRelativeTime(
                      session.updatedAt || session.createdAt
                    );
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => onSelectSession?.(session.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-start gap-2.5 group ${
                          isActive
                            ? "bg-zinc-100 text-zinc-950 font-medium border border-zinc-200/80"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent"
                        }`}
                      >
                        <MessageSquare
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            isActive
                              ? "text-zinc-900"
                              : "text-zinc-400 group-hover:text-zinc-600"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs truncate leading-snug">
                            {session.title || "Untitled conversation"}
                          </div>
                          {timeLabel && (
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              {timeLabel}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            <ScrollArea className="w-full">
              <div
                className={`mx-auto flex max-w-3xl flex-col px-4 sm:px-6 py-8 ${
                  isIntroView
                    ? "min-h-[calc(100vh-3.5rem)] justify-center"
                    : "gap-6 pb-10"
                }`}
              >
                {loadingSessionMessages ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-300 border-t-zinc-900" />
                    <p className="text-xs font-mono text-zinc-500">
                      Loading conversation...
                    </p>
                  </div>
                ) : (
                  <>
                    {isIntroView && (
                      <div className="max-w-xl mx-auto w-full space-y-6">
                        <div className="text-left">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-[11px] font-mono text-zinc-500 mb-4">
                            <Bot className="w-3.5 h-3.5 text-zinc-700" />
                            <span>{bot?.model || "gemini-2.5-flash"}</span>
                          </div>
                          <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight">
                            {bot?.name || "Knowledge Assistant"}
                          </h2>
                          {bot?.description ? (
                            <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
                              {bot.description}
                            </p>
                          ) : (
                            <p className="text-sm text-zinc-500 mt-1.5">
                              Ask questions grounded in this assistant&apos;s indexed knowledge base.
                            </p>
                          )}
                        </div>

                        <ChatInput onSendMessage={handleSendMessage} />

                        <div className="space-y-2 pt-2">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                            Suggested Queries
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {starterPrompts.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => handleSendMessage(prompt)}
                                className="text-left px-3.5 py-2.5 rounded-lg bg-white border border-zinc-200/90 hover:border-zinc-400 text-xs text-zinc-700 hover:text-zinc-950 flex items-center justify-between group transition-colors"
                              >
                                <span>{prompt}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 shrink-0 ml-2" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg.text}
                        isAI={msg.isAI}
                        timestamp={msg.timestamp}
                        name={bot?.name}
                        isLoading={msg.isLoading}
                      />
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Bottom Composer when conversation is active */}
          {!isIntroView && (
            <div className="border-t border-zinc-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
              <div className="mx-auto max-w-3xl">
                <ChatInput onSendMessage={handleSendMessage} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
