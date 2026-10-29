import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative w-full">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about this knowledge base..."
        className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-2xs focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 focus:outline-none min-h-[48px]"
        rows={1}
      />
      <button
        type="button"
        className="absolute bottom-2.5 right-2.5 h-7 w-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center transition-colors"
        onClick={handleSendMessage}
        disabled={!message.trim()}
        aria-label="Send message"
      >
        <ArrowUp className="h-3.5 w-3.5 text-white" />
      </button>
    </div>
  );
};

export default ChatInput;
