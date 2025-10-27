import { useState, useRef } from "react";

export const VoiceButton = ({ onResult }: { onResult: (text: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      setError(null);
      setIsListening(true);
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setError("Microphone permission denied. Please allow microphone access in your browser settings.");
            break;
          case 'no-speech':
            setError("No speech detected. Please try speaking again.");
            break;
          case 'audio-capture':
            setError("No microphone found. Please check your audio devices.");
            break;
          case 'network':
            setError("Network error occurred during speech recognition.");
            break;
          default:
            setError("Speech recognition failed. Please try again.");
        }
        
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      
      // Auto-stop after 10 seconds if no speech detected
      setTimeout(() => {
        if (isListening) {
          recognition.stop();
          setError("Speech recognition timed out. Please try again.");
          setIsListening(false);
        }
      }, 10000);
      
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to initialize speech recognition. Please try again.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={`p-3 rounded-full transition-all duration-300 ${
          isListening 
            ? "bg-red-500 text-white animate-pulse" 
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <div className="w-4 h-4 bg-white rounded-sm"></div>
        ) : (
          <span className="text-sm">🎤</span>
        )}
      </button>
      
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded-lg text-xs max-w-xs z-10">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}
      
      {isListening && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-300 text-blue-800 px-3 py-1 rounded-lg text-xs whitespace-nowrap">
          Listening...
        </div>
      )}
    </div>
  );
};
