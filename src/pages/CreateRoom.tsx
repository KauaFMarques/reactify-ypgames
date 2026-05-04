import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, createScenario } from "@/lib/api";
import type { CreateChoiceInput, CreateScenarioInput } from "@/lib/api";

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

const emptyChoice = (): ChoiceDraft => ({
  text: "",
  is_best: false,
  feedback: "",
});
const emptyScenario = (): ScenarioDraft => ({
  title: "",
  description: "",
  choices: [emptyChoice(), emptyChoice(), emptyChoice(), emptyChoice()],
});

// ─── Componente principal ─────────────────────────────────────────────────────

const CreateRoom = () => {
  const navigate = useNavigate();

  // Dados da sala
  const [prof, setProf] = useState("");
  const [roomName, setRoomName] = useState("");
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>([
    emptyScenario(),
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");

  // ─── Sala e cenários ────────────────────────────────────────────────────────

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!prof || !roomName) {
      setError("Preencha todos os campos");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await createRoom(prof, roomName);
      setRoomId(data.id);
      setScenarios([emptyScenario()]);
    } catch (err: any) {
      setError(err.message || "Erro ao criar sala.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateScenario(idx: number, field: keyof ScenarioDraft, value: any) {
    setScenarios((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  function updateChoice(
    sIdx: number,
    cIdx: number,
    field: keyof ChoiceDraft,
    value: any,
  ) {
    setScenarios((prev) => {
      const updated = [...prev];
      const choices = [...updated[sIdx].choices];
      // Se marcando is_best, desmarca as outras
      if (field === "is_best" && value === true) {
        choices.forEach((c, i) => {
          choices[i] = { ...c, is_best: i === cIdx };
        });
      } else {
        choices[cIdx] = { ...choices[cIdx], [field]: value };
      }
      updated[sIdx] = { ...updated[sIdx], choices };
      return updated;
    });
  }

  function addScenario() {
    setScenarios((prev) => [...prev, emptyScenario()]);
  }

  function removeScenario(idx: number) {
    setScenarios((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      return updated.length > 0 ? updated : [emptyScenario()];
    });
  }

  async function handleSubmitAll(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const payloads: CreateScenarioInput[] = scenarios
        .map((sc, idx) => {
          // Validar: título é obrigatório
          if (!sc.title.trim()) {
            console.log(
              `[CreateRoom] Pergunta ${idx + 1} rejeitada: título vazio`,
            );
            return null;
          }

          // Filtrar choices com texto
          const choices: CreateChoiceInput[] = sc.choices
            .filter((c) => c.text.trim())
            .map((c) => ({
              text: c.text,
              is_best: c.is_best,
              feedback: c.feedback,
            }));

          // Validar: mínimo 2 choices com texto
          if (choices.length < 2) {
            console.log(
              `[CreateRoom] Pergunta ${idx + 1} rejeitada: apenas ${choices.length} opção(ões) com texto`,
            );
            return null;
          }

          // Validar: deve ter exatamente 1 resposta marcada como melhor
          const bestCount = choices.filter((c) => c.is_best).length;
          if (bestCount !== 1) {
            console.log(
              `[CreateRoom] Pergunta ${idx + 1} rejeitada: ${bestCount} resposta(s) marcada(s) como melhor (deve ser 1)`,
            );
            return null;
          }

          return {
            room: roomId,
            title: sc.title.trim(),
            description: sc.description.trim() || "Sem Descrição",
            order_index: idx,
            choices,
          };
        })
        .filter((payload): payload is CreateScenarioInput => payload !== null);

      if (payloads.length === 0) {
        setError("Adicione pelo menos uma pergunta completa antes de salvar.");
        return;
      }

      console.log(
        `[CreateRoom] Enviando ${payloads.length} pergunta(s) em lote:`,
        payloads,
      );
      await createScenario(payloads);
      navigate(`/${roomId}/score`);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar cenários.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Renderização ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen quiz-gradient-bg p-5">
      <div className="max-w-3xl mx-auto animate-fadeInUp">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-primary-foreground font-medium px-4 py-2 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-all duration-300 border-none cursor-pointer mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-primary-foreground">
            🏫 Criar Nova Sala
          </h1>
          <p className="text-primary-foreground/80 mt-2">
            {roomId
              ? `Sala: ${roomId} — cadastre as perguntas abaixo`
              : "Configure sua sala e cadastre as perguntas"}
          </p>
        </div>

        <div className="quiz-card mb-6">
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-5">
            <div className="text-left">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nome da sala
              </label>
              <input
                className="quiz-input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: Turma de ES — 2025.1"
                disabled={isLoading || !!roomId}
              />
            </div>
            <div className="text-left">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nome do professor
              </label>
              <input
                className="quiz-input"
                value={prof}
                onChange={(e) => setProf(e.target.value)}
                placeholder="Seu nome"
                disabled={isLoading || !!roomId}
              />
            </div>

            {error && <div className="quiz-error-box">⚠️ {error}</div>}

            {!roomId ? (
              <button
                type="submit"
                className="quiz-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Criando..." : "Criar sala"}
              </button>
            ) : (
              <div className="bg-muted rounded-2xl p-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                  Código da sala
                </p>
                <p className="text-4xl font-extrabold text-primary tracking-wider">
                  {roomId}
                </p>
              </div>
            )}
          </form>
        </div>

        {roomId && (
          <form onSubmit={handleSubmitAll}>
            <div className="flex flex-col gap-6">
              {scenarios.map((scenario, sIdx) => (
                <div key={sIdx} className="quiz-card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-foreground text-lg">
                      🧩 Pergunta {sIdx + 1}
                    </h3>
                    {scenarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScenario(sIdx)}
                        className="text-destructive text-sm font-medium bg-destructive/10 px-3 py-1 rounded-lg border-none cursor-pointer hover:bg-destructive/20"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Título da pergunta
                      </label>
                      <input
                        className="quiz-input"
                        value={scenario.title}
                        onChange={(e) =>
                          updateScenario(sIdx, "title", e.target.value)
                        }
                        placeholder="Ex: Mudança durante a sprint"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Descrição / contexto
                      </label>
                      <textarea
                        className="quiz-input resize-none"
                        rows={3}
                        value={scenario.description}
                        onChange={(e) =>
                          updateScenario(sIdx, "description", e.target.value)
                        }
                        placeholder="Ex: Durante a sprint, o cliente solicita uma nova funcionalidade urgente..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Opções de resposta{" "}
                        <span className="text-muted-foreground font-normal">
                          (marque a melhor)
                        </span>
                      </label>
                      <div className="flex flex-col gap-3">
                        {scenario.choices.map((choice, cIdx) => {
                          const letters = ["A", "B", "C", "D"];
                          return (
                            <div
                              key={cIdx}
                              className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                                choice.is_best
                                  ? "border-green-400 bg-green-50"
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                                  {letters[cIdx]}
                                </span>
                                <input
                                  className="quiz-input flex-1"
                                  value={choice.text}
                                  onChange={(e) =>
                                    updateChoice(
                                      sIdx,
                                      cIdx,
                                      "text",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={`Opção ${letters[cIdx]}`}
                                />
                                <label className="flex items-center gap-1 cursor-pointer text-sm font-semibold text-green-700 whitespace-nowrap">
                                  <input
                                    type="radio"
                                    name={`best-${sIdx}`}
                                    checked={choice.is_best}
                                    onChange={() =>
                                      updateChoice(sIdx, cIdx, "is_best", true)
                                    }
                                    className="accent-green-500"
                                  />
                                  Melhor
                                </label>
                              </div>
                              {choice.is_best && (
                                <input
                                  className="quiz-input text-sm"
                                  value={choice.feedback}
                                  onChange={(e) =>
                                    updateChoice(
                                      sIdx,
                                      cIdx,
                                      "feedback",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Explique por que esta é a melhor decisão..."
                                />
                              )}
                              {!choice.is_best && choice.text && (
                                <input
                                  className="quiz-input text-sm"
                                  value={choice.feedback}
                                  onChange={(e) =>
                                    updateChoice(
                                      sIdx,
                                      cIdx,
                                      "feedback",
                                      e.target.value,
                                    )
                                  }
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

              <button
                type="button"
                onClick={addScenario}
                className="w-full py-4 border-2 border-dashed border-primary/40 rounded-2xl text-primary font-semibold hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer bg-transparent"
              >
                + Adicionar pergunta
              </button>
            </div>

            {error && <div className="quiz-error-box mt-4">⚠️ {error}</div>}

            <button
              type="submit"
              className="quiz-btn-primary mt-6"
              disabled={isLoading || !roomId}
            >
              {isLoading ? "Salvando perguntas..." : "✅ Salvar perguntas"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
