import { createContext, useContext, useState } from "react";

const InterviewContext = createContext();

export function InterviewProvider({ children }) {
  const [role, setRole] = useState("Software Engineer");
  const [sessionData, setSessionData] = useState({
    questions: [],
    answers: [],
    currentQuestionIndex: 0,
    transcript: "",
  });
  const [finalReport, setFinalReport] = useState(null);

  return (
    <InterviewContext.Provider
      value={{
        role,
        setRole,
        sessionData,
        setSessionData,
        finalReport,
        setFinalReport,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export const useInterview = () => useContext(InterviewContext);