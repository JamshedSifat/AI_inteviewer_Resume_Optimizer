import { useState, useEffect, useRef } from "react";

export function useTimer(initialSeconds = 120, onTimeUp) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      clearInterval(timerRef.current);
      if (onTimeUp) onTimeUp();
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, onTimeUp]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = (newSeconds = initialSeconds) => {
    setIsActive(false);
    setTimeLeft(newSeconds);
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { timeLeft, isActive, startTimer, pauseTimer, resetTimer, formatTime };
}