import React from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
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
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        isAI ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
          isAI ? "bg-gray-800 text-white" : "bg-gray-500 text-white"
        )}
      >
        {isAI ? <span className="text-xs font-bold">AI</span> : <User className="h-4 w-4" />}
      </div>

      {/* Message Bubble */}
      <div className={cn("max-w-sm", isAI ? "text-left" : "text-right")}>
        <div
          className={cn(
            "mb-1 flex items-center text-xs text-gray-500",
            isAI ? "justify-start" : "justify-end"
          )}
        >
          <span>{isAI ? name : "You"}</span>
          <span className="mx-1">•</span>
          <span>{new Date(timestamp).toLocaleTimeString()}</span>
        </div>

        <div
          className={cn(
            "rounded-xl px-4 py-2 text-sm shadow-sm",
            isAI
              ? message.startsWith("❌")
                ? "bg-gray-100 text-black border border-gray-300"
                : "bg-gray-100 text-black"
              : "bg-white text-black border border-gray-300"
          )}
        >
          {isLoading ? (
            <span className="animate-pulse text-gray-400">Thinking...</span>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => (
                  <p className="mb-4 last:mb-0 text-sm leading-relaxed" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                a: ({ node, href, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc ml-6 mb-4 space-y-2 text-sm" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal ml-6 mb-4 space-y-2 text-sm" {...props} />
                ),
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                h1: ({ node, ...props }) => (
                  <h1 className="text-xl font-bold mt-6 mb-3" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-lg font-semibold mt-5 mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-md font-semibold mt-4 mb-2" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-gray-400 pl-4 py-1 my-3 italic text-gray-700" {...props} />
                ),
                pre: ({ node, ...props }) => (
                  <pre className="bg-gray-200 rounded-md p-3 mb-4 overflow-x-auto text-sm font-mono text-black" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-4 border-t border-gray-400" {...props} />
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
