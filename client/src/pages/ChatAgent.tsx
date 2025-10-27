import React, { useState, useRef, useEffect } from 'react';
import { useChatAgent, ChatMessage, EmailDraft } from '../hooks/useChatAgent';
import DraftModal from '../components/DraftModal';

const ChatAgent: React.FC = () => {
  const {
    messages,
    isLoading,
    sendMessage,
    playTTS,
    startVoiceCapture,
    stopVoiceCapture,
    isRecording,
    clearMessages
  } = useChatAgent();

  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<EmailDraft | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile) return;

    await sendMessage({
      text: inputText,
      file: selectedFile || undefined,
      userId: 'demo-user', // In real app, get from auth context
      userName: 'Demo User'
    });

    setInputText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleDraftClick = (draft: EmailDraft) => {
    setCurrentDraft(draft);
    setShowDraftModal(true);
  };

  const handleSendEmail = async (draft: EmailDraft, overrideRecipients?: string[], finalBody?: string) => {
    try {
      const response = await fetch('/api/email-approval/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logId: draft.logId,
          approved: true,
          overrideRecipients,
          finalBody
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      
      if (result.success) {
        showToast('Email sent successfully!', 'success');
      } else {
        showToast(`Failed to send email: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Error sending email. Please try again.', 'error');
    }
  };

  const formatMessage = (message: ChatMessage) => {
    return message.content.split('\n').map((line, index) => (
      <div key={index}>{line}</div>
    ));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('csv') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Chat Assistant</h1>
              <p className="text-sm text-gray-600">Get help with facility management and business operations</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearMessages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-lg">Start a conversation with the AI assistant</p>
                <p className="text-sm mt-1">Ask questions, upload files, or request email drafts</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'ai'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {/* File attachment */}
                    {message.file && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-white bg-opacity-20 rounded">
                        <span className="text-lg">{getFileIcon(message.file.type)}</span>
                        <div className="text-sm">
                          <div className="font-medium">{message.file.name}</div>
                          <div className="text-xs opacity-80">
                            {(message.file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message content */}
                    <div className="whitespace-pre-wrap">{formatMessage(message)}</div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>

                    {/* Email draft button */}
                    {message.draft && (
                      <div className="mt-3 pt-3 border-t border-gray-300 border-opacity-30">
                        <button
                          onClick={() => handleDraftClick(message.draft!)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
                        >
                          📧 Review Email Draft
                        </button>
                      </div>
                    )}

                    {/* TTS button for AI messages */}
                    {message.role === 'ai' && (
                      <button
                        onClick={() => playTTS(message.content)}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        🔊 Play
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {/* File selection preview */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                <div>
                  <div className="font-medium text-sm">{selectedFile.name}</div>
                  <div className="text-xs text-gray-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex gap-3">
            {/* File upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
              title="Upload file (PDF, DOCX, TXT, CSV, PNG, JPG)"
            >
              📎 Attach
            </button>

            {/* Voice input button */}
            <button
              onClick={isRecording ? stopVoiceCapture : startVoiceCapture}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? '🔴 Stop' : '🎤 Voice'}
            </button>

            {/* Text input */}
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or use voice input..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !selectedFile) || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>

          {/* File type hints */}
          <div className="mt-2 text-xs text-gray-500">
            Supported files: PDF, DOCX, TXT, CSV, PNG, JPG (max 10MB)
          </div>
        </div>
      </div>

      {/* Draft Modal */}
      {currentDraft && (
        <DraftModal
          draft={currentDraft}
          isOpen={showDraftModal}
          onClose={() => setShowDraftModal(false)}
          onSend={handleSendEmail}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ChatAgent;
