import React, { useState, useEffect, useRef } from 'react';
import { inventoryAI } from '../lib/ai/inventoryAI';
import { AIInventoryResponse } from '../types/inventory';

interface VoiceInventoryControlsProps {
  onCommandResult: (result: AIInventoryResponse) => void;
  disabled?: boolean;
}

export const VoiceInventoryControls: React.FC<VoiceInventoryControlsProps> = ({
  onCommandResult,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          processVoiceCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onCommandResult({
          success: false,
          message: `Speech recognition error: ${event.error}`
        });
      };
    }
  }, [transcript]);

  const startListening = () => {
    if (!speechSupported || disabled) return;
    
    setTranscript('');
    setIsListening(true);
    try {
      recognitionRef.current?.start();
      onCommandResult({
        success: true,
        message: "Listening... Speak your inventory command."
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  const processVoiceCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    try {
      const result = await inventoryAI.processVoiceCommand(command);
      onCommandResult(result);
      
      // Speak the response if speech synthesis is available
      if (result.success && 'speechSynthesis' in window) {
        speakResponse(result.message);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      onCommandResult({
        success: false,
        message: 'Failed to process voice command.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleManualCommand = () => {
    if (transcript.trim()) {
      processVoiceCommand(transcript);
    }
  };

  if (!speechSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          Voice commands are not supported in your browser. Try Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Voice Inventory Control</h3>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isListening 
              ? 'bg-red-100 text-red-800 animate-pulse' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isListening ? 'Listening...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || isProcessing}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg
            className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
            />
          </svg>
          <span>{isListening ? 'Stop Listening' : 'Start Voice Command'}</span>
        </button>

        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm">Processing...</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Command:</span>
            <button
              onClick={handleManualCommand}
              disabled={isProcessing}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Process
            </button>
          </div>
          <p className="text-gray-800">{transcript}</p>
        </div>
      )}

      {/* Command Examples */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Try saying:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• "Add 50 liters of diesel"</li>
          <li>• "Check lubricant stock"</li>
          <li>• "How many LED bulbs are left?"</li>
          <li>• "List all inventory"</li>
          <li>• "Show stock alerts"</li>
        </ul>
      </div>

      {/* Status Information */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 Speak clearly and include quantities and units when adding items.</p>
        <p>🎯 Works offline - voice commands are processed locally.</p>
        <p>🔄 Changes sync automatically when back online.</p>
      </div>
    </div>
  );
};
