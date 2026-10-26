import React from "react";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
  isLoading?: boolean;
}

interface Bot {
  name: string;
  model: string;
  user_id: string;
  description: string;
  private: boolean;
}

interface Props {
  bot: Bot | undefined;
  messages: Message[];
  showIntro: boolean;
  handleSendMessage: (text: string) => void;
  handleNewSession: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatLayout: React.FC<Props> = ({
  bot,
  messages,
  showIntro,
  handleSendMessage,
  handleNewSession,
  messagesEndRef,
}) => {
  return (
    <div className="flex h-screen flex-col bg-white text-black w-full">
      <ChatHeader header={bot?.name} />

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="w-full">
          <div
            className={`mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 ${
              showIntro && messages.length === 0 ? "h-[calc(100vh-4rem)] justify-center" : ""
            }`}
          >
            {showIntro && messages.length === 0 && (
              <div className="space-y-6 text-center animate-fade-in">
                <div>
                  <h2 className="text-2xl font-semibold text-black">
                    Welcome to <span className="font-bold underline">{bot?.name}</span>
                  </h2>
                  <p className="text-sm text-gray-700 mt-2">{bot?.description}</p>
                  <p className="text-xs text-gray-500 italic mt-1">
                    Powered by {bot?.model}
                  </p>
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
            <div ref={messagesEndRef} />
            {showIntro && messages.length === 0 && (
              <div className="max-w-md mx-auto w-full">
                <ChatInput onSendMessage={handleSendMessage} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer ChatInput only if not in intro mode */}
      {!showIntro || messages.length > 0 ? (
        <div className="border-t border-gray-300 bg-white px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex justify-between items-center mb-2">
              <Button variant="outline" onClick={handleNewSession}>
                New Session
              </Button>
            </div>
            <ChatInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ChatLayout;
