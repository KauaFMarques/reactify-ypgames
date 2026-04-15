import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { submitAnswer } from "@/lib/api";
import { useQuestions } from "@/hooks/useQuestions";

const Play = () => {
  const { room } = useParams<{ room: string }>();
  const navigate = useNavigate();
  const { value: store, update } = useLocalStorage(room || "");
  const { data: questions, isLoading: questionsLoading } = useQuestions();

  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const currentQuestion = useMemo(() => {
    if (store && questions) {
      return questions[store.results.length] || null;
    }
    return null;
  }, [store, questions]);

  const progress = useMemo(() => {
    if (store && questions && questions.length > 0) {
      return ((store.results.length / questions.length) * 100).toFixed(0);
    }
    return "0";
  }, [store, questions]);

  async function handleAnswer(answerId: number) {
    if (isAnswering || showResult || !store || !currentQuestion) return;

    setIsAnswering(true);
    setSelectedAnswer(answerId);

    try {
      const result = await submitAnswer(store.teamId, currentQuestion.id, answerId);
      setCorrect(result.correct);
      setShowResult(true);

      update((prev) => ({
        ...prev,
        results: [...prev.results, { questionId: currentQuestion.id, answerId, correct: result.correct }],
        score: result.correct ? prev.score + 1 : prev.score,
      }));
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setIsAnswering(false);
    }
  }

  function goToNext() {
    setShowResult(false);
    setSelectedAnswer(null);
    setCorrect(null);

    if (store && questions && store.results.length === questions.length) {
      update((prev) => ({ ...prev, finished: true }));
    }
  }

  if (questionsLoading || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-lg">Carregando...</p>
      </div>
    );
  }

  if (store.finished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-5">
        <div className="quiz-card text-center max-w-md w-full">
          <div className="text-7xl mb-5">🏆</div>
          <h2 className="text-2xl font-bold text-foreground">Parabéns, {store.team}!</h2>
          <div className="my-6 p-5 bg-muted rounded-2xl flex flex-col">
            <span className="text-muted-foreground">Pontuação Final</span>
            <strong className="text-5xl text-primary">{store.score}</strong>
          </div>
          <button
            onClick={() => navigate(`/${room}/score`)}
            className="text-primary font-semibold text-lg underline bg-transparent border-none cursor-pointer"
          >
            Ver Ranking Geral
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-5 min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card p-5 rounded-2xl shadow-md mb-6">
        <div className="flex justify-between mb-5">
          <span className="px-4 py-2 rounded-full font-bold text-sm" style={{ background: "hsl(var(--quiz-team-bg))", color: "hsl(var(--quiz-team-text))" }}>
            👥 {store.team}
          </span>
          <span className="px-4 py-2 rounded-full font-bold text-sm" style={{ background: "hsl(var(--quiz-badge-bg))", color: "hsl(var(--quiz-badge-text))" }}>
            🎯 {store.score} <small>pts</small>
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Pergunta {store.results.length + 1} de {questions?.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-400"
              style={{ width: `${progress}%`, background: "hsl(var(--quiz-success))" }}
            />
          </div>
        </div>
      </header>

      {/* Question */}
      {currentQuestion && (
        <div className={`quiz-card transition-all duration-300 ${showResult ? "blur-sm pointer-events-none" : ""}`}>
          <h2 className="text-xl text-foreground mb-6 leading-relaxed">{currentQuestion.text}</h2>
          <div className="flex flex-col gap-3">
            {currentQuestion.answers.map((answer: any) => (
              <button
                key={answer.id}
                className={`answer-btn ${selectedAnswer === answer.id && correct === true ? "correct" : ""} ${selectedAnswer === answer.id && correct === false ? "incorrect" : ""}`}
                onClick={() => handleAnswer(answer.id)}
                disabled={showResult}
              >
                <span>{answer.text}</span>
                {showResult && selectedAnswer === answer.id && (
                  <span>{correct ? "✅" : "❌"}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center p-5 z-50">
          <div className="bg-card p-10 rounded-3xl text-center max-w-sm w-full animate-scaleIn">
            <div className="text-6xl mb-4">{correct ? "🎉" : "😓"}</div>
            <h3 className="text-xl font-bold text-foreground">{correct ? "Excelente!" : "Não foi dessa vez"}</h3>
            <p className="text-muted-foreground mt-2">
              {correct ? "Você acertou e ganhou 1 ponto." : "Estude mais este ponto para a próxima!"}
            </p>
            <button
              onClick={goToNext}
              className="mt-6 w-full py-4 border-none rounded-xl bg-foreground text-card font-bold text-base cursor-pointer"
            >
              {store.results.length === questions?.length ? "Finalizar Quiz" : "Próxima Pergunta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Play;
