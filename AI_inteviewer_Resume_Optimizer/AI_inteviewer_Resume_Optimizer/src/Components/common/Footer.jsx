export default function Footer() {
  return (
    <footer className="footer footer-center p-4 bg-base-100 border-t border-base-300 text-base-content text-sm">
      <aside>
        <p>© {new Date().getFullYear()} PrepAI - AI Interviewer & Resume Optimizer</p>
      </aside>
    </footer>
  );
}