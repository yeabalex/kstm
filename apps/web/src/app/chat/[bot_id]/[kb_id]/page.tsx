import ChatContainer from "@/components/chat/ChatContainer";

export default function Chat(){
    return (
        <div className="flex min-h-screen bg-white text-slate-800 w-full mx-auto">
          <div className="flex-1 flex flex-col">
            <ChatContainer />
          </div>
        </div>
      );
}