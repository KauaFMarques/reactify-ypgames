import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { fetchScenarios, submitResponse } from "@/lib/api";
import type { Scenario, RespondResult } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const Play = () => {
  const { room } = useParams<{ room: string }>();
  const navigate = useNavigate();
  const { value: store, update } = useLocalStorage(room || "");

  // Etapa atual — salva no localStorage junto com o store
  const stage = store?.stage ?? 1;

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["scenarios", room, stage],
    queryFn: () => fetchScenarios(room!, stage),
    enabled: !!room,
    retry: false,
  });

  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [result, setResult] = useState<RespondResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Timer de resposta
  const startTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [store?.results?.length]);

  const currentScenario: Scenario | null = useMemo(() => {
    if (store && scenarios) {
      return scenarios[store.results.length] ?? null;
    }
    return null;
  }, [store, scenarios]);

  const progress = useMemo(() => {
    if (store && scenarios && scenarios.length > 0) {
      return Math.round((store.results.length / scenarios.length) * 100);
    }
    return 0;
  }, [store, scenarios]);

  async function handleChoose(choiceId: number) {
    if (isAnswering || showFeedback || !store || !currentScenario) return;

    setIsAnswering(true);
    setSelectedChoice(choiceId);

    const elapsed = Date.now() - startTimeRef.current;

    try {
      const res = await submitResponse(store.teamId, currentScenario.id, choiceId, elapsed);
      setResult(res);
      setShowFeedback(true);

      update((prev) => ({
        ...prev,
        results: [
          ...prev.results,
          {
            scenarioId: currentScenario.id,
            choiceId,
            isBest: res.is_best,
            responseTimeMs: elapsed,
          },
        ],
        score: res.score,
      }));
    } catch (err) {
      console.error("Erro ao responder:", err);
    } finally {
      setIsAnswering(false);
    }
  }

  function goToNext() {
    setShowFeedback(false);
    setSelectedChoice(null);
    setResult(null);

    if (store && scenarios && store.results.length >= scenarios.length) {
      update((prev) => ({ ...prev, finished: true }));
    }
  }

  if (isLoading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-lg">Carregando cenários...</p>
        </div>
      </div>
    );
  }

  if (store.finished) {
    return (
      <div className="min-h-screen flex items-center justify-center quiz-gradient-bg p-5">
        <div className="quiz-card text-center max-w-md w-full animate-scaleIn">
          <div className="text-7xl mb-5">🏆</div>
          <h2 className="text-2xl font-bold text-foreground">
            Parabéns, {store.team}!
          </h2>
          <p className="text-muted-foreground mt-2">Você completou todos os cenários da etapa {stage}.</p>
          <div className="my-6 p-5 bg-muted rounded-2xl flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-sm">Melhores decisões</span>
            <strong className="text-5xl text-primary">{store.score}</strong>
            <span className="text-muted-foreground text-sm">de {scenarios?.length ?? 0} cenários</span>
          </div>
          <button
            onClick={() => navigate(`/${room}/score`)}
            className="quiz-btn-primary"
          >
            Ver Ranking Geral →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-5 min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card p-5 rounded-2xl shadow-md mb-6">
        <div className="flex justify-between mb-4">
          <span
            className="px-4 py-2 rounded-full font-bold text-sm"
            style={{ background: "hsl(var(--quiz-team-bg))", color: "hsl(var(--quiz-team-text))" }}
          >
            👥 {store.team}
          </span>
          <div className="flex gap-2">
            <span
              className="px-4 py-2 rounded-full font-bold text-sm"
              style={{ background: "hsl(var(--quiz-badge-bg))", color: "hsl(var(--quiz-badge-text))" }}
            >
              📅 Etapa {stage}
            </span>
            <span
              className="px-4 py-2 rounded-full font-bold text-sm"
              style={{ background: "hsl(var(--quiz-team-bg))", color: "hsl(var(--quiz-team-text))" }}
            >
              🎯 {store.score} pts
            </span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Cenário {store.results.length + 1} de {scenarios?.length ?? "?"}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${progress}%`, background: "hsl(var(--quiz-success))" }}
            />
          </div>
        </div>
      </header>

      {/* Cenário */}
      {currentScenario && (
        <div className={`quiz-card transition-all duration-300 ${showFeedback ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Título do cenário */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              🧩 {currentScenario.title}
            </span>
          </div>

          {/* Descrição / contexto */}
          <div className="bg-muted rounded-xl p-4 mb-6 border-l-4 border-primary">
            <p className="text-foreground leading-relaxed">{currentScenario.description}</p>
          </div>

          <p className="text-sm font-semibold text-muted-foreground mb-3">❓ O que você faz?</p>

          {/* Opções */}
          <div className="flex flex-col gap-3">
            {currentScenario.choices.map((choice, idx) => {
              const letters = ["A", "B", "C", "D"];
              const isSelected = selectedChoice === choice.id;
              const isBestChoice = isSelected && result?.is_best;
              const isWrongChoice = isSelected && result !== null && !result.is_best;

              return (
                <button
                  key={choice.id}
                  className={`answer-btn ${isBestChoice ? "correct" : ""} ${isWrongChoice ? "incorrect" : ""}`}
                  onClick={() => handleChoose(choice.id)}
                  disabled={showFeedback || isAnswering}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                      {letters[idx]}
                    </span>
                    {choice.text}
                  </span>
                  {showFeedback && isSelected && (
                    <span className="text-lg">{isBestChoice ? "✅" : "❌"}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Feedback */}
      {showFeedback && result && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-5 z-50">
          <div className="bg-card p-8 rounded-3xl text-center max-w-md w-full animate-scaleIn shadow-2xl">
            <div className="text-6xl mb-4">{result.is_best ? "🎯" : "💡"}</div>
            <h3 className="text-xl font-bold text-foreground mb-1">
              {result.is_best ? "Melhor decisão!" : "Não foi a melhor opção"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {result.is_best ? "Você tomou a decisão mais adequada." : "Veja o que seria mais indicado:"}
            </p>

            {/* Feedback explicativo — coração do novo sistema */}
            <div
              className="rounded-xl p-4 mb-6 text-left text-sm leading-relaxed"
              style={{
                background: result.is_best ? "hsl(var(--quiz-success-bg))" : "hsl(var(--quiz-warning-bg))",
                color: result.is_best ? "hsl(152 69% 20%)" : "hsl(var(--quiz-warning-text))",
                borderLeft: `4px solid ${result.is_best ? "hsl(var(--quiz-success))" : "hsl(38 92% 60%)"}`,
              }}
            >
              <strong className="block mb-1">💬 Explicação:</strong>
              {result.feedback}
            </div>

            <div className="text-sm text-muted-foreground mb-5">
              Pontuação atual: <strong className="text-primary">{result.score} pts</strong>
            </div>

            <button
              onClick={goToNext}
              className="quiz-btn-primary"
            >
              {store && scenarios && store.results.length >= scenarios.length
                ? "Ver resultado final 🏆"
                : "Próximo cenário →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Play;