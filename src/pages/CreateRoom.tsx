import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom as createRoomApi } from "@/lib/api";

const CreateRoom = () => {
  const [room, setRoom] = useState("");
  const [prof, setProf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prof || !room) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await createRoomApi(prof, room);
      navigate(`/${data.id}/score`);
    } catch (err: any) {
      setError(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen quiz-gradient-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md animate-fadeInUp">
        <div className="quiz-card">
          <div className="relative text-center mb-6">
            <button
              onClick={() => navigate("/")}
              className="absolute left-0 top-0 inline-flex items-center gap-2 text-primary font-medium px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-300 border-none cursor-pointer"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold text-foreground mt-12">🏫 Criar Nova Sala</h1>
            <p className="text-muted-foreground mt-2">Configure sua sala de quiz personalizada</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-left">
              <label className="block text-sm font-semibold text-foreground mb-2">Nome da sala</label>
              <input
                className="quiz-input"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ex: Quiz de História - Turma A"
              />
            </div>

            <div className="text-left">
              <label className="block text-sm font-semibold text-foreground mb-2">Nome do professor</label>
              <input
                className="quiz-input"
                value={prof}
                onChange={(e) => setProf(e.target.value)}
                placeholder="Digite seu nome"
                required
              />
            </div>

            {error && (
              <div className="quiz-error-box animate-shake">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="quiz-btn-primary" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Sala"}
            </button>
          </form>

          <div className="mt-8 bg-muted rounded-2xl p-6 border border-border">
            <h3 className="text-foreground text-lg font-semibold mb-3 flex items-center gap-2">
              📋 Como funciona?
            </h3>
            <ul className="list-none p-0 m-0 space-y-2">
              {["Crie sua sala com um nome descritivo", "Compartilhe o código gerado com os alunos", "Acompanhe as pontuações em tempo real"].map((item) => (
                <li key={item} className="text-muted-foreground font-medium pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
