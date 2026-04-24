import { useState, useCallback } from "react";

// Shape do store de sessão do aluno
export interface ResultEntry {
  scenarioId: number;
  choiceId: number;
  isBest: boolean;
  responseTimeMs: number;
}

export interface SessionStore {
  team: string;
  teamId: number;
  stage: number;
  score: number;
  finished: boolean;
  results: ResultEntry[];
}

export function useLocalStorage(key: string) {
  const [value, setValue] = useState<SessionStore | null>(() => {
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const update = useCallback(
    (updater: (prev: SessionStore) => SessionStore) => {
      setValue((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return { value, update };
}