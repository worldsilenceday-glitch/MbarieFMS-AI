import { useState, useEffect } from "react";
import { useAI } from "../hooks/useAI";
import { useTheme } from "../contexts/ThemeContext";
import { VoiceButton } from "./VoiceButton";
import { FileUploadButton } from "./FileUploadButton";
import { MessageBubble } from "./MessageBubble";
import { generateRecommendations, filterRecommendationsByContext, InsightOverview } from "../utils/recommendationEngine";
import { useInsights } from "../hooks/useInsights";

export const CopilotPanel = () => {
  const { request, uploadFile, loading, error, backendStatus, checkHealth } = useAI();
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<{ role: string; content: string; type?: string }[]>([]);
  const [input, setInput] = useState("");
  const [connectionChecked, setConnectionChecked] = useState(false);

  // Check backend health on component mount
  useEffect(() => {
    const checkConnection = async () => {
      await checkHealth();
      setConnectionChecked(true);
    };
    checkConnection();
  }, [checkHealth]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Check for contextual recommendation queries
    const query = input.toLowerCase();
    
    if (query.includes("efficiency") || query.includes("performance") || 
        query.includes("risk") || query.includes("safety") ||
        query.includes("maintenance") || query.includes("compliance") ||
        query.includes("recommend") || query.includes("suggest") ||
        query.includes("what should") || query.includes("how to")) {
      
      // Generate contextual recommendations
      try {
        const { insights } = useInsights();
        const insightOverview: InsightOverview = {
          insights: insights,
          trend: 'up', // This would come from predictive data in a real implementation
          confidence: 0.85
        };
        
        const recommendations = await generateRecommendations(insightOverview);
        const filteredRecommendations = filterRecommendationsByContext(recommendations, query);
        
        if (filteredRecommendations.length > 0) {
          const recommendationText = formatRecommendationsAsChat(filteredRecommendations);
          setMessages((prev) => [...prev, { 
            role: "assistant", 
            content: recommendationText,
            type: "recommendations"
          }]);
          return;
        }
      } catch (error) {
        console.warn('Failed to generate recommendations:', error);
        // Fall through to regular AI response
      }
    }

    // Try different AI endpoints based on input content
    let aiResponse;
    let endpoint = "document/analyze";
    
    if (query.includes("risk") || query.includes("safety")) {
      endpoint = "risk/assess";
    } else if (query.includes("permit") || query.includes("approval")) {
      endpoint = "permit/recommend";
    } else if (query.includes("delegate") || query.includes("assign")) {
      endpoint = "delegation/recommend";
    }

    aiResponse = await request(endpoint, { text: input });

    const reply = aiResponse?.summary || aiResponse?.recommendation || aiResponse?.message || "No response received from AI service.";
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  };

  const handleFileUpload = async (file: File) => {
    const fileMsg = { 
      role: "user", 
      content: `Uploaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      type: "file"
    };
    setMessages((prev) => [...prev, fileMsg]);

    const aiResponse = await uploadFile(file);
    
    if (aiResponse) {
      const reply = aiResponse.summary || aiResponse.analysis || "File analysis completed successfully.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } else {
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "Failed to analyze the uploaded file. Please try again or check if the backend service is running." 
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'healthy': return 'bg-green-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (backendStatus) {
      case 'healthy': return 'Connected';
      case 'unhealthy': return 'Disconnected';
      default: return 'Checking...';
    }
  };

  // Helper function to format recommendations as chat response
  const formatRecommendationsAsChat = (recommendations: any[]) => {
    if (!recommendations || recommendations.length === 0) {
      return "I don't have any specific recommendations based on your current data. Please check back later or provide more context.";
    }

    let response = "Based on your operational data, here are my recommendations:\n\n";
    
    recommendations.forEach((rec) => {
      response += `**${rec.category}** (${rec.confidence}% confidence)\n`;
      response += `${rec.text}\n`;
      if (rec.reasoning) {
        response += `*Reasoning: ${rec.reasoning}*\n`;
      }
      response += "\n";
    });

    response += "You can execute these actions directly from the dashboard or ask me for more details about any specific recommendation.";
    
    return response;
  };

  return (
    <div className={`flex flex-col h-full p-6 rounded-3xl mx-auto max-w-4xl w-full transition-all duration-500 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white shadow-2xl shadow-blue-900/20' 
        : 'bg-white/80 backdrop-blur-md text-gray-900 shadow-2xl shadow-blue-500/10 border border-white/20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="text-xl font-bold">Mbarie FMS AI Copilot</h2>
            <div className="flex items-center space-x-2 text-sm opacity-75">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span>{getStatusText()}</span>
              {!connectionChecked && <span className="animate-pulse">• Checking connection...</span>}
            </div>
          </div>
        </div>
        
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mb-4 p-4 rounded-xl border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-red-900/20 border-red-700 text-red-200'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">Connection Issue</span>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
          <p className="text-sm mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto rounded-2xl p-6 mb-4 transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gray-800/40 backdrop-blur-sm border border-gray-700/50'
          : 'bg-gray-50/80 backdrop-blur-sm border border-gray-200/50'
      }`}>
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-50">💬</div>
            <h3 className="text-lg font-semibold mb-2">Welcome to Mbarie AI Copilot</h3>
            <p className={`text-sm max-w-md mx-auto leading-relaxed ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Ask me about permits, risk assessments, delegation recommendations, 
              or upload documents for AI analysis. I'm here to help with your facility management needs.
            </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        
        {loading && (
          <div className="flex items-center space-x-2 text-sm opacity-75 mt-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about permits, risks, delegations, or upload documents..."
            className={`w-full p-4 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              theme === 'dark'
                ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white/90 border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            disabled={loading}
          />
        </div>
        
        <div className="flex space-x-2">
          <FileUploadButton onFileUpload={handleFileUpload} />
          <VoiceButton onResult={setInput} />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:hover:bg-blue-600'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:hover:bg-blue-600'
            }`}
          >
            Send
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className={`mt-4 text-xs text-center transition-colors duration-300 ${
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      }`}>
        Powered by Mbarie FMS AI • Phase 7.2 Enhanced Experience
      </div>
    </div>
  );
};
