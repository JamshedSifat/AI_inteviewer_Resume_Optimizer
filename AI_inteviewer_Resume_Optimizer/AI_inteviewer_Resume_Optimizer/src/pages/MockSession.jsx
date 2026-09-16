import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { Mic, Square, ArrowRight, Volume2, Timer, Keyboard, AlertTriangle, Briefcase } from "lucide-react";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useTimer } from "../hooks/useTimer";
import { getQuestionsAPI, evaluateInterviewAPI } from "../services/api";
import { useInterview } from "../context/InterviewContext";
import Loader from "../Components/common/Loader";
import AIAvatarCanvas from "../Components/avatar/AIAvatarCanvas";
import CanvasErrorBoundary from "../Components/avatar/CanvasErrorBoundary";

const QUESTION_TIME_LIMIT_SECONDS = 120;

const FALLBACK_QUESTIONS = [
  "Can you introduce yourself and describe a recent complex technical project you built?",
  "What criteria do you use to choose between relational and NoSQL databases?",
  "Describe how you identify and fix performance bottlenecks in a web application.",
  "How do you handle technical trade-offs and code review conflicts within a team?",
  "Explain how you design a fault-tolerant REST or GraphQL API.",
];

export default function MockSession() {
  const navigate = useNavigate();
  const { role } = useInterview();

  // Role setup states
  const [sessionStarted, setSessionStarted] = useState(false);
  const [targetRole, setTargetRole] = useState(role || "");

  // Interview execution states
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [useTextFallback, setUseTextFallback] = useState(false);

  // Avatar states
  const [avatarState, setAvatarState] = useState("idle");
  const [ttsLevel, setTtsLevel] = useState(0);
  const ttsIntervalRef = useRef(null);

  const {
    transcript,
    interimTranscript,
    isListening,
    audioLevel,
    isSupported,
    permissionState,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  const { timeLeft, startTimer, pauseTimer, resetTimer, formatTime } = useTimer(
    QUESTION_TIME_LIMIT_SECONDS,
    () => handleNext()
  );

  // 1. Fetch questions dynamically based on selected role
  useEffect(() => {
    if (!sessionStarted) return;

    let isMounted = true;

    async function fetchQuestions() {
      try {
        setLoadingQuestions(true);
        const selectedRole = targetRole.trim() || "Software Engineer";
        
        // getQuestionsAPI সরাসরি response.data রিটার্ন করে
        const res = await getQuestionsAPI(selectedRole);

        // API থেকে আসা ডেটা সঠিকভাবে এক্সট্রাক্ট করা
        const fetchedList = res?.questions || res?.data?.questions || [];

        if (isMounted) {
          if (Array.isArray(fetchedList) && fetchedList.length > 0) {
            setQuestions(fetchedList);
            setCurrentIndex(0);
            setAnswers([]);
          } else {
            throw new Error("Invalid structure from question API");
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic questions, fallback engaged:", err);
        if (isMounted) {
          setQuestions(FALLBACK_QUESTIONS);
        }
      } finally {
        if (isMounted) {
          setLoadingQuestions(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [sessionStarted]);

  // 2. Timer reset on question change
  useEffect(() => {
    if (questions.length > 0 && sessionStarted) {
      resetTimer(QUESTION_TIME_LIMIT_SECONDS);
      startTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions, sessionStarted]);

  // 3. Mirror live speech into text box
  useEffect(() => {
    if (transcript || interimTranscript) {
      setCurrentAnswer(`${transcript} ${interimTranscript}`.trim());
    }
  }, [transcript, interimTranscript]);

  // 4. Fallback if voice input is unsupported or denied
  useEffect(() => {
    if (!isSupported || permissionState === "denied") {
      setUseTextFallback(true);
    }
  }, [isSupported, permissionState]);

  // 5. Avatar sync with mic listening
  useEffect(() => {
    if (isListening) {
      setAvatarState("listening");
    }
  }, [isListening]);

  const clearTtsPulse = useCallback(() => {
    if (ttsIntervalRef.current) {
      clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = null;
    }
    setTtsLevel(0);
  }, []);

  const speakQuestion = useCallback(
    (text) => {
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;

      setAvatarState("speaking");
      clearTtsPulse();
      ttsIntervalRef.current = setInterval(() => {
        setTtsLevel(0.4 + Math.random() * 0.6);
      }, 90);

      utterance.onend = () => {
        clearTtsPulse();
        setAvatarState("idle");
      };
      utterance.onerror = () => {
        clearTtsPulse();
        setAvatarState("idle");
      };

      window.speechSynthesis.speak(utterance);
    },
    [clearTtsPulse]
  );

  // Auto-speak new question
  useEffect(() => {
    if (questions.length > 0 && questions[currentIndex] && sessionStarted) {
      speakQuestion(questions[currentIndex]);
    }
    return () => {
      window.speechSynthesis?.cancel();
      clearTtsPulse();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions, sessionStarted]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      setAvatarState("idle");
    } else {
      startListening();
    }
  };

  const handleNext = async () => {
    stopListening();
    pauseTimer();
    window.speechSynthesis?.cancel();
    clearTtsPulse();
    setAvatarState("idle");

    const finalAnswer = currentAnswer.trim() || "No answer recorded.";
    const updatedAnswers = [
      ...answers,
      {
        question: questions[currentIndex],
        answer: finalAnswer,
      },
    ];

    setAnswers(updatedAnswers);
    resetTranscript();
    setCurrentAnswer("");

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      try {
        setEvaluating(true);
        const evalRes = await evaluateInterviewAPI(updatedAnswers);
        
        // API থেকে আসা evaluations সরাসরি এক্সট্রাক্ট করা
        const evaluatedData = evalRes?.evaluations || evalRes?.data?.evaluations || evalRes?.results || updatedAnswers;
        
        navigate("/report", { state: { results: evaluatedData } });
      } catch (err) {
        console.error("Evaluation error:", err);
        navigate("/report", { state: { results: updatedAnswers } });
      } finally {
        setEvaluating(false);
      }
    }
  };

  // ----------------------------------------------------
  // RENDER: Role Selection Setup Screen
  // ----------------------------------------------------
  if (!sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto mt-12 md:mt-24 p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Briefcase className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                Mock Interview Setup
              </h1>
              <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                Specify the exact job title or tech specialization. AI will instantly generate scenario-based questions tailored specifically to this position.
              </p>
            </div>

            <div className="pt-4 pb-2">
              <input
                type="text"
                className="input input-lg w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl text-center font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400"
                placeholder="e.g. Flutter Developer, React Engineer, DevOps Specialist..."
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && targetRole.trim()) setSessionStarted(true);
                }}
                autoFocus
              />
            </div>

            <button
              onClick={() => setSessionStarted(true)}
              disabled={!targetRole.trim()}
              className="btn btn-primary btn-lg w-full rounded-full font-bold text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Start AI Mock Interview <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Loading & Evaluating Screens
  // ----------------------------------------------------
  if (loadingQuestions) {
    return <Loader text={`Generating tailored scenario questions for "${targetRole}"...`} />;
  }

  if (evaluating) {
    return <Loader text="Evaluating your answers and compiling performance metrics..." />;
  }

  // ----------------------------------------------------
  // RENDER: Active Interview Screen
  // ----------------------------------------------------
  const avatarAudioLevel = avatarState === "speaking" ? ttsLevel : audioLevel;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 font-sans text-slate-800">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="badge badge-primary font-bold px-3 py-3">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
            {targetRole} Role
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Timer className="w-4 h-4 text-amber-500" />
          <span className={timeLeft < 30 ? "text-rose-500 font-bold animate-pulse" : "text-slate-700"}>
            {formatTime()}
          </span>
        </div>
      </div>

      {/* Grid: Avatar & Question Panel */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-stretch">
        <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden h-[240px] md:h-auto relative shadow-inner">
          <CanvasErrorBoundary>
            <AIAvatarCanvas state={avatarState} audioLevel={avatarAudioLevel} />
          </CanvasErrorBoundary>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                {questions[currentIndex]}
              </h2>
              <button
                onClick={() => speakQuestion(questions[currentIndex])}
                className="btn btn-ghost btn-circle shrink-0 hover:bg-slate-100"
                title="Replay question"
              >
                <Volume2 className="w-6 h-6 text-primary" />
              </button>
            </div>
          </div>

          {speechError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{speechError}</span>
            </div>
          )}

          {!useTextFallback ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center gap-4 shadow-sm">
              <div
                className={`p-6 rounded-full transition-all duration-300 ${
                  isListening ? "bg-rose-100 scale-105 shadow-[0_0_40px_rgba(244,63,94,0.3)]" : "bg-slate-50 hover:bg-slate-100 cursor-pointer"
                }`}
                onClick={handleToggleListening}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${
                    isListening ? "bg-rose-500 animate-pulse" : "bg-primary"
                  }`}
                >
                  {isListening ? <Square className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium text-center">
                {isListening ? "Listening... Speak your answer clearly" : "Click the microphone to start speaking"}
              </p>
              <button
                onClick={() => setUseTextFallback(true)}
                className="btn btn-ghost btn-sm rounded-full gap-2 text-slate-400 hover:text-slate-600 mt-2"
              >
                <Keyboard className="w-4 h-4" /> Switch to typing
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Using text input mode{!isSupported ? " (Voice input unsupported)" : ""}
              {isSupported && permissionState !== "denied" && (
                <button
                  onClick={() => setUseTextFallback(false)}
                  className="btn btn-ghost btn-xs rounded-full ml-auto text-primary"
                >
                  Switch to voice
                </button>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-sm">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Live Transcript / Your Answer
            </label>
            <textarea
              className="textarea w-full min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm md:text-base leading-relaxed rounded-2xl p-4 resize-none transition-all text-slate-700"
              placeholder="Your answer will appear here. You can also type directly..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleNext} 
              className="btn btn-primary btn-lg rounded-full px-8 text-white font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/40 transition-all"
            >
              {currentIndex + 1 === questions.length ? "Finish & Evaluate" : "Submit & Next"}
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}