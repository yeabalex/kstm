import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

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
        placeholder="Type your message..."
        className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2 pr-10 text-sm text-black shadow-sm focus:border-black focus:ring-0 focus:outline-none"
        rows={1}
      />
      <Button
        className="absolute bottom-2 right-2 h-7 w-7 rounded-md bg-black hover:bg-neutral-800 p-1"
        onClick={handleSendMessage}
        disabled={!message.trim()}
      >
        <Send className="h-4 w-4 text-white" />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
};

export default ChatInput;
