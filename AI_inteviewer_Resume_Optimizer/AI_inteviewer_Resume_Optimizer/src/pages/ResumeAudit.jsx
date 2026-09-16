import { useState } from "react";
import ResumeUploadZone from "../Components/resume/ResumeUploadZone";
import ScoreCard from "../Components/resume/ScoreCard";
import MissingSkillsList from "../Components/resume/MissingSkillsList";
import Loader from "../Components/common/Loader";
import Button from "../Components/common/Button";
import { 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Lightbulb,
  FileText
} from "lucide-react";
import { Link } from "react-router";
import { auditResumeAPI } from "../services/api";

export default function ResumeAudit() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAnalyze = async () => {
    if (!file || !jobDescription.trim()) return;
    setLoading(true);
    setErrorMessage("");
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", jobDescription);

      const response = await auditResumeAPI(formData);
      const resultData = response?.data || response;
      setReport(resultData);
    } catch (error) {
      console.error("Resume audit error:", error);
      setErrorMessage(error.response?.data?.error || "Analysis failed. Please check your connection or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 md:p-8 font-sans text-slate-800">
      
      {/* Premium Header */}
      <div className="text-center space-y-3 mt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">
          Resume ATS Audit
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Evaluate your resume format, technical skill density, and engineering metrics against enterprise-grade ATS algorithms and target job descriptions.
        </p>
      </div>

      {/* Input Section - Styled as a premium container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-500 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Upload Resume (PDF)
            </label>
            <div className="h-full">
              <ResumeUploadZone onFileSelect={setFile} selectedFile={file} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="bg-slate-100 text-slate-500 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Target Job Description
            </label>
            <textarea
              className="textarea w-full h-[220px] bg-slate-50 border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-none rounded-2xl p-4"
              placeholder="Paste the complete job description, requirements, and responsibilities here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleAnalyze}
            isLoading={loading}
            disabled={!file || !jobDescription.trim()}
            size="lg"
            className="rounded-full px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
          >
            <FileText className="w-5 h-5 mr-2" />
            Run Comprehensive Audit
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {loading && (
        <div className="py-12">
          <Loader text="Analyzing resume structure, formatting compliance, and technical keyword density..." />
        </div>
      )}

      {report && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <ScoreCard
            score={report.score}
            summary={report.summary}
            subScores={report.subScores}
          />

          {/* ATS Compliance Box - SaaS Style */}
          {report.atsCompliance && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50/50 border-b border-slate-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${report.atsCompliance.isAtsFriendly ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {report.atsCompliance.isAtsFriendly ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">File & Structural Compliance</h3>
                    <p className="text-xs text-slate-500">How well ATS bots can parse your document</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${report.atsCompliance.isAtsFriendly ? "text-emerald-500" : "text-amber-500"}`}>
                    {report.atsCompliance.atsComplianceScore}%
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">Page Budget</span>
                    <span className={`font-bold text-base flex items-center gap-1 ${report.atsCompliance.pageCount === 1 ? "text-emerald-600" : "text-amber-600"}`}>
                      {report.atsCompliance.pageCount} Page(s) {report.atsCompliance.pageCount === 1 && <CheckCircle2 className="w-4 h-4"/>}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">Contact Links</span>
                    <span className={`font-bold text-base ${report.atsCompliance.contactAudit?.github && report.atsCompliance.contactAudit?.linkedin ? "text-emerald-600" : "text-rose-500"}`}>
                      {report.atsCompliance.contactAudit?.github && report.atsCompliance.contactAudit?.linkedin ? "Detected ✓" : "Missing ⚠"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">Tone Analysis</span>
                    <span className={`font-bold text-base ${!report.atsCompliance.hasFirstPersonPronouns ? "text-emerald-600" : "text-rose-500"}`}>
                      {!report.atsCompliance.hasFirstPersonPronouns ? "Clean (3rd) ✓" : "Contains (1st) ✖"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">Word Count</span>
                    <span className="font-bold text-base text-slate-700">{report.atsCompliance.wordCount} words</span>
                  </div>
                </div>

                {report.atsCompliance.issues && report.atsCompliance.issues.length > 0 && (
                  <div className="mt-6 bg-rose-50 border border-rose-100 rounded-xl p-5">
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4"/> Parsing Risks Detected
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-rose-700/80">
                      {report.atsCompliance.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></div>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Missing Skills Section - Assuming MissingSkillsList handles its own style, but putting it in a grid flow */}
          <div className="w-full">
             <MissingSkillsList
              matchedSkills={report.matchedSkills}
              missingSkills={report.missingSkills}
            />
          </div>

          {/* Actionable Suggestions */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg p-6 md:p-8 text-white">
            <h3 className="font-bold text-xl flex items-center gap-3 mb-6 text-indigo-100">
              <Lightbulb className="w-6 h-6 text-amber-400" />
              Strategic Improvement Plan
            </h3>
            <ul className="space-y-4">
              {report.suggestions?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="bg-indigo-500/30 text-indigo-200 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-sm md:text-base text-slate-200 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Final CTA */}
          <div className="pt-6 flex justify-center md:justify-end">
            <Link 
              to="/mock-session" 
              className="btn btn-primary rounded-full px-8 py-4 h-auto text-base font-bold text-white shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
            >
              Start Tailored Mock Interview <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}