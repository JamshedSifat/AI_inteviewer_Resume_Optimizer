import { useLocation, Link } from "react-router";
import FeedbackCard from "../Components/interview/FeedbackCard";
import { 
  Award, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Target,
  MessageSquare,
  FileQuestion,
  TrendingUp
} from "lucide-react";

export default function Report() {
  const location = useLocation();
  const results = location.state?.results || [];

  // Calculate overall score securely
  const overallScore = results.length > 0
    ? Math.round(results.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / results.length)
    : 0;

  // Dynamic Performance Tier Logic
  const getPerformanceTier = (score) => {
    if (score >= 75) {
      return {
        textColor: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        iconColor: "text-emerald-500",
        title: "Interview Ready",
        desc: "Strong technical accuracy and excellent communication.",
        Icon: CheckCircle2
      };
    }
    if (score >= 45) {
      return {
        textColor: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        iconColor: "text-amber-500",
        title: "Needs Polish",
        desc: "Good attempt, but review your weak points below.",
        Icon: AlertTriangle
      };
    }
    return {
      textColor: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      iconColor: "text-rose-500",
      title: "Needs Improvement",
      desc: "Answers lacked depth or core technical substance.",
      Icon: Target
    };
  };

  const tier = getPerformanceTier(overallScore);
  const TierIcon = tier.Icon;

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-4 md:p-8 font-sans text-slate-800 pb-16">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">
            Interview Performance Report
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Detailed AI evaluation of your verbal responses and technical accuracy.
          </p>
        </div>
        <Link 
          to="/mock-session" 
          className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 rounded-full px-6 shadow-sm font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Retake Interview
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-2">
            <FileQuestion className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">No Interview Data Found</h3>
          <p className="text-slate-500">Please complete a mock interview session to view your performance analytics.</p>
          <Link to="/mock-session" className="btn btn-primary rounded-full px-8 mt-4 shadow-lg shadow-primary/30">
            Start Mock Interview
          </Link>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
          
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Overall Score Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-center shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Score</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-black text-slate-800">{overallScore}</span>
                <span className="text-xl font-bold text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Questions Evaluated Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-center shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Questions Answered</h3>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-black text-slate-800">{results.length}</span>
                <span className="text-base font-semibold text-slate-500">total</span>
              </div>
            </div>

            {/* Readiness Status Card (Dynamic) */}
            <div className={`rounded-3xl border ${tier.borderColor} ${tier.bgColor} p-6 flex flex-col justify-center shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-4 mb-2">
                <div className={`p-3 bg-white rounded-2xl shadow-sm ${tier.iconColor}`}>
                  <TierIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Readiness</h3>
              </div>
              <div className="mt-2 space-y-1">
                <h4 className={`text-xl font-bold ${tier.textColor}`}>{tier.title}</h4>
                <p className={`text-xs font-medium ${tier.textColor} opacity-80 leading-snug`}>{tier.desc}</p>
              </div>
            </div>
          </div>

          {/* Detailed Feedback Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold text-slate-800">Detailed Answer Analysis</h3>
            </div>
            
            <div className="space-y-6">
              {results.map((item, index) => (
                <FeedbackCard
                  key={index}
                  question={`Q${index + 1}: ${item.question}`}
                  answer={item.answer || item.user_answer || "No answer recorded."}
                  score={item.score ?? 0}
                  feedback={item.feedback || item.evaluation || "No evaluation provided."}
                  suggestion={item.suggestion || item.how_to_improve || "Provide concrete examples using real-world projects."}
                />
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}