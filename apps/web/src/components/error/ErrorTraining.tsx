import { useState } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, HelpCircle, MessageSquare, XCircle, Info } from 'lucide-react';

export default function BotTrainingFailed({ 
  botName = "AI Assistant", 
  errorMessage = "An unexpected error occurred during training.",
  errorDetails = null,
  onRetry = () => {},
  onBack = () => {},
  onContactSupport = () => {}
}) {
  const [showDetails, setShowDetails] = useState(false);
  
  const commonErrors = [
    { id: 1, title: "File format not supported", solution: "Please upload files in PDF, TXT, CSV, or JSON format." },
    { id: 2, title: "API key invalid", solution: "Check your API key or try using our managed API keys." },
    { id: 3, title: "File too large", solution: "Files should be under 50MB each. Try splitting larger files." }
  ];

  // Determine if the error matches any common errors
  const suggestedFix = commonErrors.find(err => 
    errorMessage.toLowerCase().includes(err.title.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-red-50 to-gray-50 p-6 rounded-xl shadow-lg">
      {/* Header Section with Animation */}
      <div className="flex items-start mb-8">
        <div className="p-3 bg-red-500 rounded-lg shadow-lg transform rotate-3 animate-pulse">
          <AlertTriangle size={32} className="text-white" />
        </div>
        <div className="ml-4">
          <h1 className="text-3xl font-bold text-red-600">
            Training Failed
          </h1>
          <p className="text-gray-600 mt-1">We encountered a problem while training {botName}</p>
        </div>
      </div>

      {/* Main Content in Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Error Info */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <XCircle size={20} className="mr-2 text-red-500" />
            What went wrong
          </h2>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
          
          {suggestedFix && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <h3 className="font-medium text-blue-800 mb-1 flex items-center">
                <Info size={16} className="mr-1" /> 
                Suggested Fix
              </h3>
              <p className="text-blue-700">{suggestedFix.solution}</p>
            </div>
          )}
          
          {errorDetails && (
            <div className="mt-4">
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
              >
                {showDetails ? "Hide" : "Show"} technical details
                <svg 
                  className={`ml-1 w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDetails && (
                <div className="mt-2 p-3 bg-gray-800 text-gray-200 rounded-lg overflow-auto text-xs font-mono h-32">
                  {errorDetails}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry Training
            </button>
            
            <button 
              onClick={onBack}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Setup
            </button>
          </div>
        </div>
        
        {/* Right Column - Help & Support */}
        <div className="bg-white p-6 rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-red-100 rounded-full opacity-30"></div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <HelpCircle size={20} className="mr-2 text-purple-500" />
            Need Help?
          </h2>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-1">Common Issues</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                {commonErrors.map(err => (
                  <li key={err.id} className="flex items-start">
                    <span className="inline-block w-1 h-1 rounded-full bg-gray-400 mt-2 mr-2"></span>
                    <span>{err.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Check Documentation</h3>
              <p className="text-sm text-gray-600">
                Our documentation has detailed guides on file requirements and training parameters.
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block">
                Read the docs →
              </a>
            </div>
            
            <button 
              onClick={onContactSupport}
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium py-3 px-4 rounded-lg flex items-center justify-center mt-2"
            >
              <MessageSquare size={16} className="mr-2" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-sm text-gray-500 italic">
        Training ID: {Math.random().toString(36).substring(2, 10).toUpperCase()} • {new Date().toLocaleString()}
      </div>
    </div>
  );
}