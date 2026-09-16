export default function Loader({ text = "Analyzing with AI..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <span className="loading loading-bars loading-lg text-primary"></span>
      <p className="text-sm font-medium text-base-content/70 animate-pulse">{text}</p>
    </div>
  );
}