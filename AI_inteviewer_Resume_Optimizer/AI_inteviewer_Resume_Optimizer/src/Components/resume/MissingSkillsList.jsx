import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function MissingSkillsList({ matchedSkills = [], missingSkills = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card bg-base-100 border border-base-300 p-4">
        <h4 className="font-semibold text-success flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4" /> Matched Keywords ({matchedSkills.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.map((skill, index) => (
            <span key={index} className="badge badge-success badge-soft text-xs">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 p-4">
        <h4 className="font-semibold text-error flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4" /> Missing Keywords ({missingSkills.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {missingSkills.map((skill, index) => (
            <span key={index} className="badge badge-error badge-soft text-xs">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}