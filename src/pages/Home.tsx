import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinRoom } from "@/lib/api";

const Home = () => {
  const [room, setRoom] = useState("");
  const [team, setTeam] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!room || !team) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      localStorage.removeItem(room);
      const body = await joinRoom(room, team);
      const session = {
        team,
        teamId: body.id,
        score: 0,
        finished: false,
        results: [],
      };
      localStorage.clear();
      localStorage.setItem(room, JSON.stringify(session));
      navigate(`/${room}/play`);
    } catch (err: any) {
      setError(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full quiz-gradient-bg flex flex-col items-center justify-center p-5">
      {/* Hero */}
      <div className="text-center mb-10 text-primary-foreground">
        <div className="flex flex-col items-center mb-5">
          <div className="text-6xl mb-3 bg-primary-foreground/20 rounded-full w-28 h-28 flex items-center justify-center backdrop-blur-md shadow-lg">
            🧠
          </div>
          <h1 className="text-5xl font-extrabold drop-shadow-lg">AgileQuest</h1>
        </div>
        <p className="text-lg opacity-90 max-w-md mx-auto leading-relaxed">
          Simulador gamificado de decisões em metodologia ágil
        </p>
      </div>

      {/* Join Card */}
      <div className="w-full max-w-md mb-10">
        <div className="quiz-card text-center">
          <h2 className="text-foreground mb-2 text-2xl font-semibold">
            🎯 Entrar no Jogo
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Digite o código da sala e o nome da sua equipe para começar
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-left">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Código da Sala
              </label>
              <input
                className="quiz-input"
                value={room}
                onChange={(e) => setRoom(e.target.value.trim())}
                placeholder="Ex: xK3mP7a"
                disabled={isLoading}
              />
            </div>

            <div className="text-left">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nome da Equipe
              </label>
              <input
                className="quiz-input"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Ex: Os Ágeis"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="quiz-error-box animate-shake">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="quiz-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "🚀 Entrar na Sala"}
            </button>
          </form>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-md mb-10">
        <div className="flex items-center text-primary-foreground/80">
          <div className="flex-1 h-px bg-primary-foreground/30" />
          <span className="px-5 font-medium">ou</span>
          <div className="flex-1 h-px bg-primary-foreground/30" />
        </div>
      </div>

      {/* Create Room Link */}
      <div className="w-full max-w-md mb-10">
        <a
          href="/create"
          onClick={(e) => {
            e.preventDefault();
            navigate("/create");
          }}
          className="block no-underline"
        >
          <div className="bg-primary-foreground/10 backdrop-blur-md border-2 border-primary-foreground/20 rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 cursor-pointer text-primary-foreground hover:bg-primary-foreground/20 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="text-3xl bg-primary-foreground/20 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
              ➕
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold m-0">Criar Nova Sala</h3>
              <p className="m-0 opacity-80 text-sm">
                Seja o professor e crie uma sala com cenários
              </p>
            </div>
            <div className="text-xl opacity-70">→</div>
          </div>
        </a>
      </div>

      {/* Features */}
      <div className="w-full max-w-3xl mt-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🧩",
              title: "Cenários reais",
              desc: "Tome decisões em situações ágeis realistas",
            },
            {
              icon: "💬",
              title: "Feedback imediato",
              desc: "Aprenda com a explicação de cada decisão",
            },
            {
              icon: "📈",
              title: "Progresso em tempo real",
              desc: "Acompanhe seu desempenho ao longo das perguntas",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-primary-foreground/10 backdrop-blur-md rounded-2xl p-6 text-center text-primary-foreground transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h4 className="font-semibold text-lg mb-1">{f.title}</h4>
              <p className="opacity-80 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
