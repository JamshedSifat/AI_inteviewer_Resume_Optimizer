import { Mic, Square } from "lucide-react";

export default function AudioRecorder({ isListening, onStart, onStop }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`p-4 rounded-full transition-all duration-300 ${
        isListening ? "bg-error/20 scale-110 animate-pulse" : "bg-base-200"
      }`}>
        <button
          onClick={isListening ? onStop : onStart}
          className={`btn btn-circle btn-lg ${isListening ? "btn-error" : "btn-primary"} text-white`}
        >
          {isListening ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
      </div>
      <span className="text-xs text-base-content/70 font-medium">
        {isListening ? "Recording in progress... Click to stop" : "Click mic to speak your answer"}
      </span>
    </div>
  );
}