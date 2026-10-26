import React from "react";
import { Sparkles } from "lucide-react";

interface ChatHeaderProps {
  header: string | undefined;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ header }) => {
  return (
    <div className="sticky top-0 z-10 h-14 border-b border-neutral-200 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-black" />
        <h1 className="text-base font-medium text-black">{header}</h1>
      </div>
      <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
        K
      </div>
    </div>
  );
};

export default ChatHeader;