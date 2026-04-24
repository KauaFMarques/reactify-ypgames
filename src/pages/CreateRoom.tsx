import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, createStage, createScenario } from "@/lib/api";
import type { CreateChoiceInput } from "@/lib/api";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface ChoiceDraft {
  text: string;
  is_best: boolean;
  feedback: string;
}

interface ScenarioDraft {
  title: string;
  description: string;
  choices: ChoiceDraft[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyChoice = (): ChoiceDraft => ({ text: "", is_best: false, feedback: "" });
const emptyScenario = (): ScenarioDraft => ({
  title: "",
  description: "",
  choices: [emptyChoice(), emptyChoice(), emptyChoice(), emptyChoice()],
});

// ─── Componente principal ─────────────────────────────────────────────────────

type Step = "room" | "scenarios" | "done";

const CreateRoom = () => {
  const navigate = useNavigate();

  // Passo atual do wizard
  const [step, setStep] = useState<Step>("room");

  // Dados da sala
  const [prof, setProf] = useState("");
  const [roomName, setRoomName] = useState("");
  const [totalStages, setTotalStages] = useState(3);

  // Cenários por etapa: { 1: [...], 2: [...], 3: [...] }
  const [scenariosByStage, setScenariosByStage] = useState<Record<number, ScenarioDraft[]>>({
    1: [emptyScenario()],
  });
  const [currentStage, setCurrentStage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");

  // ─── Passo 1: Criar sala ────────────────────────────────────────────────────

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!prof || !roomName) { setError("Preencha todos os campos"); return; }

    setIsLoading(true);
    setError("");
    try {
      const data = await createRoom(prof, roomName);
      setRoomId(data.id);

      // Inicializa arrays de cenários para todas as etapas
      const initial: Record<number, ScenarioDraft[]> = {};
      for (let i = 1; i <= totalStages; i++) initial[i] = [emptyScenario()];
      setScenariosByStage(initial);

      setStep("scenarios");
    } catch (err: any) {
      setError(err.message || "Erro ao criar sala.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Passo 2: Cenários ──────────────────────────────────────────────────────

  function updateScenario(stageNum: number, idx: number, field: keyof ScenarioDraft, value: any) {
    setScenariosByStage((prev) => {
      const updated = [...prev[stageNum]];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, [stageNum]: updated };
    });
  }

  function updateChoice(stageNum: number, sIdx: number, cIdx: number, field: keyof ChoiceDraft, value: any) {
    setScenariosByStage((prev) => {
      const updated = [...prev[stageNum]];
      const choices = [...updated[sIdx].choices];
      // Se marcando is_best, desmarca as outras
      if (field === "is_best" && value === true) {
        choices.forEach((c, i) => { choices[i] = { ...c, is_best: i === cIdx }; });
      } else {
        choices[cIdx] = { ...choices[cIdx], [field]: value };
      }
      updated[sIdx] = { ...updated[sIdx], choices };
      return { ...prev, [stageNum]: updated };
    });
  }

  function addScenario(stageNum: number) {
    setScenariosByStage((prev) => ({
      ...prev,
      [stageNum]: [...prev[stageNum], emptyScenario()],
    }));
  }

  function removeScenario(stageNum: number, idx: number) {
    setScenariosByStage((prev) => {
      const updated = prev[stageNum].filter((_, i) => i !== idx);
      return { ...prev, [stageNum]: updated.length > 0 ? updated : [emptyScenario()] };
    });
  }

  async function handleSubmitAll(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Cria uma stage para cada etapa e depois os cenários
      for (let s = 1; s <= totalStages; s++) {
        const stageLabels: Record<number, string> = {
          1: "Semana 1 — Primeiro contato",
          2: "Semana 2 — Nova rodada",
          3: "Semana 3 — Rodada final",
          4: "Semana 4 — Questionário de percepção",
        };
        await createStage(roomId, s, stageLabels[s] ?? `Etapa ${s}`);

        const scenarios = scenariosByStage[s] ?? [];
        for (let idx = 0; idx < scenarios.length; idx++) {
          const sc = scenarios[idx];
          if (!sc.title || !sc.description) continue; // pula incompletos

          const choices: CreateChoiceInput[] = sc.choices
            .filter((c) => c.text)
            .map((c) => ({ text: c.text, is_best: c.is_best, feedback: c.feedback }));

          if (choices.length < 2) continue;

          await createScenario({
            room: roomId,
            stage: s,
            title: sc.title,
            description: sc.description,
            order_index: idx,
            choices,
          });
        }
      }

      setStep("done");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar cenários.");
    } finally {
      setIsLoading(false);
    }
  }

  const stageScenarios = scenariosByStage[currentStage] ?? [];

  // ─── Renderização ────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="min-h-screen quiz-gradient-bg flex items-center justify-center p-5">
        <div className="quiz-card text-center max-w-md w-full animate-scaleIn">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Sala criada com sucesso!</h2>
          <p className="text-muted-foreground mb-6">
            Compartilhe o código abaixo com os alunos:
          </p>
          <div className="bg-muted rounded-2xl p-6 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Código da sala</p>
            <p className="text-4xl font-extrabold text-primary tracking-wider">{roomId}</p>
          </div>
          <button
            onClick={() => navigate(`/${roomId}/score`)}
            className="quiz-btn-primary"
          >
            Abrir placar →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen quiz-gradient-bg p-5">
      <div className="max-w-3xl mx-auto animate-fadeInUp">

        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => step === "scenarios" ? setStep("room") : navigate("/")}
            className="inline-flex items-center gap-2 text-primary-foreground font-medium px-4 py-2 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-all duration-300 border-none cursor-pointer mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-primary-foreground">
            {step === "room" ? "🏫 Criar Nova Sala" : "🧩 Cadastrar Cenários"}
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            {step === "room"
              ? "Configure sua sala e defina o número de etapas"
              : `Sala: ${roomId} — crie os cenários para cada etapa`}
          </p>
        </div>

        {/* ── PASSO 1: Dados da sala ── */}
        {step === "room" && (
          <div className="quiz-card">
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-5">
              <div className="text-left">
                <label className="block text-sm font-semibold text-foreground mb-2">Nome da sala</label>
                <input
                  className="quiz-input"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Turma de ES — 2025.1"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-foreground mb-2">Nome do professor</label>
                <input
                  className="quiz-input"
                  value={prof}
                  onChange={(e) => setProf(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-foreground mb-2">Número de etapas (semanas)</label>
                <select
                  className="quiz-input"
                  value={totalStages}
                  onChange={(e) => setTotalStages(Number(e.target.value))}
                >
                  {[2, 3, 4].map((n) => (
                    <option key={n} value={n}>{n} etapas</option>
                  ))}
                </select>
              </div>

              {error && <div className="quiz-error-box">⚠️ {error}</div>}

              <button type="submit" className="quiz-btn-primary" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar sala e continuar →"}
              </button>
            </form>
          </div>
        )}

        {/* ── PASSO 2: Cenários ── */}
        {step === "scenarios" && (
          <form onSubmit={handleSubmitAll}>
            {/* Seletor de etapa */}
            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              {Array.from({ length: totalStages }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCurrentStage(s)}
                  className={`px-5 py-2 rounded-full font-semibold text-sm border-2 transition-all duration-200 cursor-pointer ${
                    currentStage === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30"
                  }`}
                >
                  Etapa {s}
                </button>
              ))}
            </div>

            {/* Cenários da etapa atual */}
            <div className="flex flex-col gap-6">
              {stageScenarios.map((scenario, sIdx) => (
                <div key={sIdx} className="quiz-card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-foreground text-lg">
                      🧩 Cenário {sIdx + 1} — Etapa {currentStage}
                    </h3>
                    {stageScenarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScenario(currentStage, sIdx)}
                        className="text-destructive text-sm font-medium bg-destructive/10 px-3 py-1 rounded-lg border-none cursor-pointer hover:bg-destructive/20"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Título do cenário</label>
                      <input
                        className="quiz-input"
                        value={scenario.title}
                        onChange={(e) => updateScenario(currentStage, sIdx, "title", e.target.value)}
                        placeholder="Ex: Mudança durante a Sprint"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Descrição / contexto</label>
                      <textarea
                        className="quiz-input resize-none"
                        rows={3}
                        value={scenario.description}
                        onChange={(e) => updateScenario(currentStage, sIdx, "description", e.target.value)}
                        placeholder="Ex: Durante a sprint, o cliente solicita uma nova funcionalidade urgente..."
                      />
                    </div>

                    {/* Choices */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Opções de escolha <span className="text-muted-foreground font-normal">(marque a melhor)</span>
                      </label>
                      <div className="flex flex-col gap-3">
                        {scenario.choices.map((choice, cIdx) => {
                          const letters = ["A", "B", "C", "D"];
                          return (
                            <div
                              key={cIdx}
                              className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                                choice.is_best ? "border-green-400 bg-green-50" : "border-border bg-card"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                                  {letters[cIdx]}
                                </span>
                                <input
                                  className="quiz-input flex-1"
                                  value={choice.text}
                                  onChange={(e) => updateChoice(currentStage, sIdx, cIdx, "text", e.target.value)}
                                  placeholder={`Opção ${letters[cIdx]}`}
                                />
                                <label className="flex items-center gap-1 cursor-pointer text-sm font-semibold text-green-700 whitespace-nowrap">
                                  <input
                                    type="radio"
                                    name={`best-${currentStage}-${sIdx}`}
                                    checked={choice.is_best}
                                    onChange={() => updateChoice(currentStage, sIdx, cIdx, "is_best", true)}
                                    className="accent-green-500"
                                  />
                                  Melhor
                                </label>
                              </div>
                              {choice.is_best && (
                                <input
                                  className="quiz-input text-sm"
                                  value={choice.feedback}
                                  onChange={(e) => updateChoice(currentStage, sIdx, cIdx, "feedback", e.target.value)}
                                  placeholder="Explique por que esta é a melhor decisão..."
                                />
                              )}
                              {!choice.is_best && choice.text && (
                                <input
                                  className="quiz-input text-sm"
                                  value={choice.feedback}
                                  onChange={(e) => updateChoice(currentStage, sIdx, cIdx, "feedback", e.target.value)}
                                  placeholder="Feedback para quem escolher esta opção..."
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Adicionar cenário */}
              <button
                type="button"
                onClick={() => addScenario(currentStage)}
                className="w-full py-4 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-semibold hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer bg-transparent"
              >
                + Adicionar cenário na Etapa {currentStage}
              </button>
            </div>

            {error && <div className="quiz-error-box mt-4">⚠️ {error}</div>}

            <button
              type="submit"
              className="quiz-btn-primary mt-6"
              disabled={isLoading}
            >
              {isLoading ? "Salvando cenários..." : "✅ Salvar tudo e finalizar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;