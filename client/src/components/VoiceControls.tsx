import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceControlsProps {
  onVoiceCommand: (command: string) => void;
  onVoiceResponse?: (text: string) => void;
  disabled?: boolean;
}

// Check if speech recognition is available
const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Speech recognition setup
const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

export default function VoiceControls({ 
  onVoiceCommand, 
  onVoiceResponse, 
  disabled = false 
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError(null);
        console.log('Voice recognition started');
      };

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        // Only process final results
        if (event.results[current].isFinal) {
          console.log('Voice command received:', transcriptText);
          onVoiceCommand(transcriptText);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setTranscript('');
        console.log('Voice recognition ended');
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognition && !isListening && !disabled) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setError('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && !disabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setError('Text-to-speech failed');
      };

      speechSynthesis.speak(utterance);
      if (onVoiceResponse) {
        onVoiceResponse(text);
      }
    } else {
      setError('Text-to-speech not supported');
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Common voice commands for quick access
  const quickCommands = [
    { text: 'Show maintenance report', emoji: '🔧' },
    { text: 'Check inventory levels', emoji: '📦' },
    { text: 'What are the risks?', emoji: '⚠️' },
    { text: 'Generate recommendations', emoji: '💡' },
    { text: 'Show today\'s maintenance schedule', emoji: '📅' },
    { text: 'Predict failure on generator 2', emoji: '🔍' },
    { text: 'Assign technician Musa to fix AC unit', emoji: '👨‍🔧' },
    { text: 'Check equipment health status', emoji: '❤️' },
    { text: 'What\'s the maintenance status of the generator?', emoji: '⚡' },
    { text: 'Schedule an inspection for pump A3', emoji: '🔧' },
    { text: 'Who\'s assigned to today\'s maintenance tasks?', emoji: '👥' },
    { text: 'Generate maintenance report', emoji: '📊' },
    { text: 'Show critical equipment alerts', emoji: '🚨' },
    { text: 'Check sensor data for anomalies', emoji: '📡' },
    { text: 'Update maintenance task status', emoji: '✅' },
    { text: 'Show predictive maintenance insights', emoji: '🤖' }
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Voice Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleListening}
            disabled={disabled || !isSpeechRecognitionSupported()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            {isListening ? 'Stop Listening' : 'Start Voice'}
          </button>

          <button
            onClick={() => speakText('Hello, I am Mbarie AI Assistant. How can I help you today?')}
            disabled={disabled || isSpeaking}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isSpeaking 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Volume2 className="w-4 h-4" />
            {isSpeaking ? 'Speaking...' : 'Test Voice'}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {isListening && (
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isListening ? 'Listening...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>You said:</strong> {transcript}
          </p>
        </div>
      )}

      {/* Quick Commands */}
      <div className="grid grid-cols-2 gap-2">
        {quickCommands.map((command, index) => (
          <button
            key={index}
            onClick={() => onVoiceCommand(command.text)}
            disabled={disabled}
            className="flex items-center gap-2 p-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 text-gray-700 dark:text-gray-300"
          >
            <span>{command.emoji}</span>
            <span className="truncate">{command.text}</span>
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      {/* Browser Support Info */}
      {!isSpeechRecognitionSupported() && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Voice commands require Chrome, Edge, or Safari. For other browsers, use text input.
          </p>
        </div>
      )}

      {/* Voice Tips */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p><strong>Voice Command Tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>"Show maintenance schedule"</li>
          <li>"Check inventory for safety equipment"</li>
          <li>"What are today's risks?"</li>
          <li>"Generate AI recommendations"</li>
          <li>"Predict failure on generator 2"</li>
          <li>"Assign technician to fix AC unit"</li>
          <li>"Check equipment health status"</li>
          <li>"Show sensor data analysis"</li>
        </ul>
      </div>
    </div>
  );
}
