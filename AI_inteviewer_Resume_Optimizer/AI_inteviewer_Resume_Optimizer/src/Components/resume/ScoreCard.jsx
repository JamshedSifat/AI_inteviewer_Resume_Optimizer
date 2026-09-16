import React from 'react';
import { Target, Briefcase, TrendingUp, LayoutTemplate } from 'lucide-react';

export default function ScoreCard({ score = 0, summary = "", subScores = {} }) {
  const metrics = [
    { label: "Skills Match", value: subScores.skills ?? score, weight: "40%", icon: Target, color: "from-blue-500 to-indigo-500" },
    { label: "Experience Match", value: subScores.experience ?? score, weight: "25%", icon: Briefcase, color: "from-emerald-400 to-teal-500" },
    { label: "Impact & Metrics", value: subScores.impact ?? score, weight: "20%", icon: TrendingUp, color: "from-violet-500 to-purple-500" },
    { label: "Format & Structure", value: subScores.formatting ?? score, weight: "15%", icon: LayoutTemplate, color: "from-amber-400 to-orange-500" },
  ];

  // স্কোর অনুযায়ী কালার নির্ধারণ
  const getScoreColor = (s) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
      {/* Top Section: Radial Score & Summary */}
      <div className="p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-slate-50/80 to-white">
        <div className="relative flex shrink-0 items-center justify-center">
          <div
            className={`radial-progress ${getScoreColor(score)} bg-slate-100 font-extrabold text-3xl`}
            style={{ "--value": score, "--size": "8rem", "--thickness": "0.6rem" }}
            role="progressbar"
          >
            <span className="text-slate-800">{score}<span className="text-lg text-slate-400">%</span></span>
          </div>
          {/* Subtle glow effect behind radial */}
          <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full ${getScoreColor(score).replace('text', 'bg')}`}></div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Executive ATS Verdict</h3>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed bg-white/60 p-4 rounded-xl border border-slate-100">
            {summary || "Your resume has been analyzed against industry-standard ATS parameters."}
          </p>
        </div>
      </div>

      {/* Bottom Section: Sub-scores Grid */}
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 border-t border-slate-100 bg-white">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="space-y-2 group">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100 group-hover:shadow-sm transition-all">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{item.label} <span className="text-xs font-normal text-slate-400">({item.weight})</span></span>
                </div>
                <span className="text-sm font-bold text-slate-800">{item.value}%</span>
              </div>
              
              {/* Custom Premium Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}