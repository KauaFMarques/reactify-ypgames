import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Tela intermediária onde o aluno seleciona em qual etapa vai jogar.
// Acessada via /:room/stage
const StageSelect = () => {
  const { room } = useParams<{ room: string }>();
  const navigate = useNavigate();
  const { value: store, update } = useLocalStorage(room || "");
  const [selected, setSelected] = useState<number | null>(null);

  const stages = [
    { number: 1, label: "Semana 1", description: "Primeiro contato com os cenários" },
    { number: 2, label: "Semana 2", description: "Nova rodada — mesmos conceitos, novos cenários" },
    { number: 3, label: "Semana 3", description: "Rodada final" },
    { number: 4, label: "Semana 4", description: "Questionário de percepção" },
  ];

  function handleStart() {
    if (!selected || !store) return;
    update((prev) => ({
      ...prev,
      stage: selected,
      results: [],   // zera resultados ao trocar de etapa
      score: 0,
      finished: false,
    }));
    navigate(`/${room}/play`);
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Você precisa entrar numa sala primeiro.</p>
          <button
            onClick={() => navigate("/")}
            className="text-primary underline border-none bg-transparent cursor-pointer"
          >
            Ir para o início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen quiz-gradient-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md animate-fadeInUp">
        <div className="quiz-card">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">📅</div>
            <h1 className="text-2xl font-bold text-foreground">Selecionar Etapa</h1>
            <p className="text-muted-foreground mt-1">
              Olá, <strong>{store.team}</strong>! Escolha a etapa da semana de hoje:
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            {stages.map((s) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setSelected(s.number)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-card ${
                  selected === s.number
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-200 ${
                    selected === s.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {s.number}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{s.label}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                  {selected === s.number && (
                    <span className="ml-auto text-primary text-lg">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={!selected}
            className="quiz-btn-primary"
          >
            {selected ? `Começar Etapa ${selected} →` : "Selecione uma etapa"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageSelect;