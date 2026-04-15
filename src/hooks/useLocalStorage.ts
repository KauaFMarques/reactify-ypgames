import { useState, useCallback, useEffect } from "react";

interface GameSession {
  team: string;
  teamId: string;
  score: number;
  finished: boolean;
  results: Array<{
    questionId: number;
    answerId: number;
    correct: boolean;
  }>;
}

export function useLocalStorage(key: string) {
  const [value, setValue] = useState<GameSession | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [key]);

  const save = useCallback(
    (newValue: GameSession | null) => {
      if (newValue) {
        localStorage.setItem(key, JSON.stringify(newValue));
      } else {
        localStorage.removeItem(key);
      }
    },
    [key]
  );

  const update = useCallback(
    (updater: (prev: GameSession) => GameSession) => {
      setValue((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        save(next);
        return next;
      });
    },
    [save]
  );

  return { value, setValue: (v: GameSession) => { setValue(v); save(v); }, update };
}
