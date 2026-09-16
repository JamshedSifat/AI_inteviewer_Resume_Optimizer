import { useState } from "react";
import { 
  Mail, Copy, Check, Sparkles, Building2, Briefcase, User, 
  RefreshCw, Globe, Plus, X 
} from "lucide-react";
import { generateHREmailAPI } from "../services/api";

const EMAIL_CATEGORIES = [
  {
    category: "Application & Outreach",
    options: [
      "Cold Outreach / Role Inquiry",
      "Application Follow-up",
      "Employee Referral Request",
    ]
  },
  {
    category: "Interview Process",
    options: [
      "Technical Interview Thank You",
      "Take-Home Assignment Submission",
      "Post-Interview Status Follow-up",
      "Interview Rescheduling Request",
    ]
  },
  {
    category: "Offers & Negotiation",
    options: [
      "Job Offer Acceptance",
      "Salary & Compensation Negotiation",
      "Offer Evaluation / Time Extension Request",
      "Polite Offer Decline",
    ]
  },
  {
    category: "Professional Etiquette",
    options: [
      "Rejection Reply (Keeping in Touch)",
      "Reference & Document Submission",
      "Application Withdrawal",
    ]
  }
];

export default function HREmailGenerator() {
  const [candidateName, setCandidateName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [emailType, setEmailType] = useState("Technical Interview Thank You");
  
  const [skills, setSkills] = useState(["React", "REST APIs"]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleAddSkill = (skillToAdd) => {
    if (!skillToAdd) return;
    const trimmed = skillToAdd.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setCustomSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!company.trim() || !jobTitle.trim() || !candidateName.trim()) return;

    setError("");
    setLoading(true);
    try {
      const res = await generateHREmailAPI({
        candidate_name: candidateName.trim(),
        company: company.trim(),
        job_title: jobTitle.trim(),
        email_type: emailType,
        skills: skills,
        portfolio_url: portfolioUrl.trim(),
        linkedin_url: linkedinUrl.trim(),
        github_url: githubUrl.trim()
      });
      setEmailResult(res);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to generate email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!emailResult) return;
    const fullText = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-sans text-slate-800 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Mail className="w-8 h-8"/>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">
          Software Engineer Email Assistant
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto">
          Tailors dynamic emails matching your exact skills and professional links with zero editing required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Pane */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Your Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400"/>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sifat Ahmed"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="input input-bordered input-sm md:input-md w-full pl-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Company *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3.5 text-slate-400"/>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brain Station 23"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="input input-bordered input-sm md:input-md w-full pl-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Job Role *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-3.5 text-slate-400"/>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="input input-bordered input-sm md:input-md w-full pl-9 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Email Purpose *
              </label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="select select-bordered select-sm md:select-md w-full rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm font-medium"
              >
                {EMAIL_CATEGORIES.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.options.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Skills */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Technical Stack / Skills
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a skill and hit Add..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill(customSkillInput);
                    }
                  }}
                  className="input input-bordered input-sm w-full rounded-xl bg-slate-50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(customSkillInput)}
                  className="btn btn-sm btn-outline rounded-xl"
                >
                  <Plus className="w-4 h-4"/>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="badge badge-primary gap-1 font-medium px-2.5 py-3 rounded-lg text-xs text-white"
                  >
                    {skill}
                    <X 
                      className="w-3.5 h-3.5 cursor-pointer hover:opacity-75" 
                      onClick={() => handleRemoveSkill(skill)}
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Optional Links */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Professional Links (Optional)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400"/>
                  <input
                    type="text"
                    placeholder="Portfolio URL"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="input input-bordered input-xs md:input-sm w-full pl-8 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
                
                <div className="relative">
                  <svg className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="LinkedIn URL"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="input input-bordered input-xs md:input-sm w-full pl-8 rounded-lg bg-slate-50 text-xs"
                  />
                </div>

                <div className="relative">
                  <svg className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="GitHub URL"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="input input-bordered input-xs md:input-sm w-full pl-8 rounded-lg bg-slate-50 text-xs"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading || !company.trim() || !jobTitle.trim() || !candidateName.trim()}
              className="btn btn-primary w-full rounded-xl text-white font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all mt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2"/> Generating Email...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2"/> Generate Tailored Email
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Pane */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 min-h-[460px] flex flex-col justify-between">
          {emailResult ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="badge badge-primary badge-outline text-xs font-semibold">
                  {emailType}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="btn btn-ghost btn-xs rounded-lg gap-1 text-slate-500 hover:text-slate-800"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                  {copied ? "Copied!" : "Copy Full Email"}
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</span>
                <p className="font-semibold text-slate-800 text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {emailResult.subject}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Body</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto font-sans">
                  {emailResult.body}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center my-auto text-slate-400 p-8">
              <Mail className="w-12 h-12 stroke-[1.5] mb-2 opacity-50"/>
              <p className="text-sm">Select your purpose and enter details to generate a finished engineering email.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}