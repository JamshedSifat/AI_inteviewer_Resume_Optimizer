import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText } from "lucide-react";

export default function ResumeUploadZone({ onFileSelect, selectedFile }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/10" : "border-base-300 hover:border-primary/50 bg-base-100"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        {selectedFile ? (
          <>
            <FileText className="w-10 h-10 text-success" />
            <p className="font-semibold text-sm">{selectedFile.name}</p>
            <span className="text-xs text-base-content/60">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB - Click or drag to replace
            </span>
          </>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 text-base-content/40" />
            <p className="text-sm font-semibold">
              {isDragActive ? "Drop your resume here..." : "Drag & drop your resume, or Browse"}
            </p>
            <p className="text-xs text-base-content/60">Supports PDF & DOCX (Max 5MB)</p>
          </>
        )}
      </div>
    </div>
  );
}