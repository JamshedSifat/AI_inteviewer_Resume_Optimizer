import { CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

export default function FeedbackCard({ question, answer, feedback, score, suggestion }) {
  return (
    <div className="card bg-base-100 border border-base-300 p-5 space-y-4 shadow-sm">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-base text-primary flex-1">{question}</h4>
        <span className="badge badge-neutral font-semibold ml-2">Score: {score}/100</span>
      </div>

      <div className="bg-base-200 p-3 rounded-lg text-sm">
        <span className="font-semibold text-base-content/70 block mb-1">Your Response:</span>
        <p className="italic text-base-content">{answer}</p>
      </div>

      <div className="text-sm space-y-2 border-t border-base-300 pt-3">
        <div className="flex items-start gap-2 text-info">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong>AI Evaluation:</strong> {feedback}</span>
        </div>
        <div className="flex items-start gap-2 text-warning">
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong>How to improve:</strong> {suggestion}</span>
        </div>
      </div>
    </div>
  );
}