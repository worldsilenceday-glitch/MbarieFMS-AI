import { useState, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  file?: {
    name: string;
    type: string;
    size: number;
  };
  draft?: EmailDraft;
}

export interface EmailDraft {
  subject: string;
  body: string;
  suggestedRecipients: string[];
  logId: number;
}

interface SendMessageOptions {
  text: string;
  file?: File;
  userId?: string;
  userName?: string;
}

interface ChatAgentHook {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (options: SendMessageOptions) => Promise<void>;
  playTTS: (text: string) => void;
  startVoiceCapture: () => void;
  stopVoiceCapture: () => void;
  isRecording: boolean;
  clearMessages: () => void;
}

export const useChatAgent = (): ChatAgentHook => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  // Send message to chat agent
  const sendMessage = useCallback(async ({ text, file, userId, userName }: SendMessageOptions) => {
    if (!text.trim() && !file) return;

    setIsLoading(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      file: file ? {
        name: file.name,
        type: file.type,
        size: file.size
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('message', text);
      if (file) {
        formData.append('file', file);
      }
      if (userId) {
        formData.append('userId', userId);
      }
      if (userName) {
        formData.append('userName', userName);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/chat-agent`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply,
        timestamp: new Date(),
        draft: data.draft ? {
          ...data.draft,
          logId: data.logId
        } : undefined
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Text-to-speech
  const playTTS = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      synthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported');
    }
  }, []);

  // Voice capture (Speech Recognition)
  const startVoiceCapture = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      
      // Add the transcribed text to the chat
      if (transcript.trim()) {
        sendMessage({ text: transcript });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendMessage]);

  const stopVoiceCapture = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    playTTS,
    startVoiceCapture,
    stopVoiceCapture,
    isRecording,
    clearMessages
  };
};
