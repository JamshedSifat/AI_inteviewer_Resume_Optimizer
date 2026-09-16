import { Link, NavLink } from "react-router";
import { Bot, FileText, Home, Mail } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar bg-base-100 shadow-sm border-b border-base-300 px-4 md:px-8">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl font-bold text-primary flex items-center gap-2">
          <Bot className="w-6 h-6" />
          <span>PrepAI</span>
        </Link>
      </div>
      <nav className="flex-none">
        <ul className="menu menu-horizontal px-1 gap-2 font-medium items-center">
          <li>
            <NavLink to="/">
              <Home className="w-4 h-4" /> Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/resume-audit">
              <FileText className="w-4 h-4" /> Resume Audit
            </NavLink>
          </li>
          <li>
            <NavLink to="/email-generator">
              <Mail className="w-4 h-4" /> HR Email
            </NavLink>
          </li>
          <li>
            <NavLink to="/mock-session" className="btn btn-primary btn-sm text-white">
              Start Interview
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}