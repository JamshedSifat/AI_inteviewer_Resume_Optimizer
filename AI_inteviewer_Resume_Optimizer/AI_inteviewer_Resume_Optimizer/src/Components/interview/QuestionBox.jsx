import { Volume2 } from "lucide-react";

export default function QuestionBox({ questionNumber, totalQuestions, questionText }) {
  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center">
        <span className="badge badge-primary font-bold">
          Question {questionNumber} of {totalQuestions}
        </span>
        <button 
          onClick={handleSpeak}
          className="btn btn-circle btn-ghost btn-sm" 
          title="Play Audio"
        >
          <Volume2 className="w-5 h-5 text-primary" />
        </button>
      </div>
      <h2 className="text-xl font-semibold leading-relaxed">
        {questionText}
      </h2>
    </div>
  );
}