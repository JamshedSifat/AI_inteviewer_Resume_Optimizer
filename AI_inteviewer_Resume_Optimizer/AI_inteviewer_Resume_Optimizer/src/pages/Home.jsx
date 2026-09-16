import { Link } from "react-router";
import { ArrowRight, Bot, Sparkles, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <div className="badge badge-primary badge-outline mb-4 p-3 gap-2">
        <Sparkles className="w-4 h-4" /> AI Powered Career Suite
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
        Ace Your Next Interview & <br />
        <span className="text-primary">Optimize Your Resume</span>
      </h1>
      <p className="max-w-2xl text-base-content/80 text-lg mb-8">
        Get instant ATS feedback on your resume and practice voice-based mock interviews with AI tailored to your target job role.
      </p>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Link to="/resume-audit" className="btn btn-outline btn-primary gap-2">
          Audit Resume
        </Link>
        <Link to="/mock-session" className="btn btn-primary gap-2 text-white">
          Start Mock Interview <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
        <div className="card bg-base-100 shadow-md border border-base-300 p-6">
          <Bot className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-bold text-lg mb-1">Real-time Mock Interview</h3>
          <p className="text-sm text-base-content/70">Interactive voice & text Q&A simulating real technical and HR rounds.</p>
        </div>
        <div className="card bg-base-100 shadow-md border border-base-300 p-6">
          <Sparkles className="w-8 h-8 text-secondary mb-3" />
          <h3 className="font-bold text-lg mb-1">ATS Optimization</h3>
          <p className="text-sm text-base-content/70">Scan keywords against target job descriptions and get actionable advice.</p>
        </div>
        <div className="card bg-base-100 shadow-md border border-base-300 p-6">
          <Award className="w-8 h-8 text-accent mb-3" />
          <h3 className="font-bold text-lg mb-1">Detailed Analytics</h3>
          <p className="text-sm text-base-content/70">Comprehensive scorecards, missing skills analysis, and improvement tips.</p>
        </div>
      </div>
    </div>
  );
}