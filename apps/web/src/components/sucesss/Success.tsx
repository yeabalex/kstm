import { useState } from 'react';
import { NEXT_JS_PROXY_URL } from '@/const';
import { Check, Copy, Share2, Code, ExternalLink, ChevronRight, Rocket, MessageSquare, Settings } from 'lucide-react';

export default function BotTrainingSuccess({ 
  botName, 
  botId, 
  kbId,
  onGoToChat = () => {},
  domain = NEXT_JS_PROXY_URL
}:
{
    botName: string | null;
    botId: string | null;
    kbId: string | null;
    onGoToChat?: () => void;
    domain?: string;
}) {
  const [copyStatus, setCopyStatus] = useState({
    shareLink: false,
    embedCode: false
  });
  
  const shareUrl = `${domain}/chat/${botId}/${kbId}`;
  const embedCode = `<iframe src="${shareUrl}/embed" width="100%" height="600px" frameborder="0"></iframe>`;
  
  const copyToClipboard = (text:string, type:string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopyStatus(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  return (
    <div className="p-6 rounded-xl">
      {/* Header Section with Animation */}
      <div className="flex items-start mb-8">
        <div className="p-3 bg-green-500 rounded-lg shadow-lg transform -rotate-3">
          <Rocket size={32} className="text-white" />
        </div>
        <div className="ml-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-600">
            {botName} is live!
          </h1>
          <p className="text-gray-600 mt-1">Your new AI assistant is ready to help your users</p>
        </div>
      </div>

      {/* Main Content in Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Bot Info */}
        <div className="bg-white p-6 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare size={20} className="mr-2 text-blue-500" />
            Bot Details
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Bot Name</p>
              <p className="font-medium">{botName}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Bot ID</p>
              <p className="font-mono text-sm bg-gray-50 p-1 rounded">{botId}</p>
            </div>
            
            <div className="pt-4">
              <button 
                onClick={onGoToChat}
                className="w-full bg-black text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center group"
              >
                Go to Chat
                <ChevronRight size={18} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Middle Column - Share Link */}
        <div className="bg-white p-6 rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>
          <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-green-100 rounded-full opacity-50"></div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Share2 size={20} className="mr-2 text-purple-500" />
            Share Your Bot
          </h2>
          
          <div className="relative">
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Anyone with this link can access your bot:</p>
              <div className="flex">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  className="bg-gray-50 p-3 rounded-l-lg border border-gray-200 flex-grow text-sm font-mono"
                />
                <button 
                  onClick={() => copyToClipboard(shareUrl, 'shareLink')}
                  className="bg-gray-100 hover:bg-gray-200 px-3 rounded-r-lg border border-l-0 border-gray-200"
                >
                  {copyStatus.shareLink ? (
                    <Check size={18} className="text-green-600" />
                  ) : (
                    <Copy size={18} className="text-gray-600" />
                  )}
                </button>
              </div>
              {copyStatus.shareLink && (
                <p className="text-green-600 text-xs mt-1 animate-pulse">Copied to clipboard!</p>
              )}
            </div>
            
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
              <Settings size={14} className="mr-1" />
              Customize sharing settings
            </button>
          </div>
        </div>
        
        {/* Right Column - Embed Code */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-purple-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Code size={20} className="mr-2 text-gray-800" />
            Embed on Website
          </h2>
          
          <div>
            <p className="text-sm text-gray-600 mb-3">Add this code to your website:</p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono h-32 overflow-auto">
              {embedCode}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-gray-500">Responsive iframe embed code</span>
              <button 
                onClick={() => copyToClipboard(embedCode, 'embedCode')}
                className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-gray-700"
              >
                {copyStatus.embedCode ? (
                  <>
                    <Check size={14} className="mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="mt-8 flex justify-between items-center">
        <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
          <ExternalLink size={18} className="mr-1" />
          View all bots
        </button>
        
        <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg">
          Create Another Bot
        </button>
      </div>
    </div>
  );
}