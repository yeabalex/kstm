import React from "react";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: string;
  isAI: boolean;
  timestamp: string;
  name: string | undefined;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isAI,
  timestamp,
  name,
  isLoading,
}) => {
  const formattedTime = (() => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  })();

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isAI ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg shrink-0 border mt-0.5",
          isAI
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white text-zinc-700 border-zinc-200"
        )}
      >
        {isAI ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-2xl min-w-0",
          isAI ? "text-left flex-1" : "text-right"
        )}
      >
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5 text-[11px] text-zinc-400",
            isAI ? "justify-start" : "justify-end"
          )}
        >
          <span className="font-medium text-zinc-600">
            {isAI ? name || "Assistant" : "You"}
          </span>
          {formattedTime && (
            <>
              <span>·</span>
              <span className="font-mono">{formattedTime}</span>
            </>
          )}
        </div>

        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm leading-relaxed inline-block text-left",
            isAI
              ? "bg-white text-zinc-900 border border-zinc-200/90 shadow-2xs w-full"
              : "bg-zinc-900 text-white"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-0.5 text-xs font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
              <span>Retrieving context & generating response...</span>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => (
                  <p className="mb-3 last:mb-0 text-sm leading-relaxed" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                a: ({ node, href, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc ml-5 mb-3 space-y-1.5 text-sm" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal ml-5 mb-3 space-y-1.5 text-sm" {...props} />
                ),
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                h1: ({ node, ...props }) => (
                  <h1 className="text-base font-semibold mt-4 mb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-sm font-semibold mt-4 mb-1.5" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-sm font-medium mt-3 mb-1" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-2 border-zinc-300 pl-3 py-0.5 my-2.5 text-zinc-600"
                    {...props}
                  />
                ),
                pre: ({ node, ...props }) => (
                  <pre
                    className="bg-zinc-950 text-zinc-100 rounded-lg p-3.5 my-3 overflow-x-auto text-xs font-mono"
                    {...props}
                  />
                ),
                code: ({ node, className, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code
                      className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-mono text-xs"
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props} />
                  );
                },
                hr: ({ node, ...props }) => (
                  <hr className="my-4 border-t border-zinc-200" {...props} />
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
