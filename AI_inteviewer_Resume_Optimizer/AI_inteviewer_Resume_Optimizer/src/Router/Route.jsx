import { createBrowserRouter } from "react-router";
import MainLayout from "../Components/common/MainLayout";
import Home from "../pages/Home";
import ResumeAudit from "../pages/ResumeAudit";
import MockSession from "../pages/MockSession";
import Report from "../pages/Report";
import HREmailGenerator from "../pages/HREmailGenerator";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "resume-audit", element: <ResumeAudit /> },
      { path: "mock-session", element: <MockSession /> },
      { path: "report", element: <Report /> },
      { path: "email-generator", element: <HREmailGenerator /> },
    ],
  },
]);