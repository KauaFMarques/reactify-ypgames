import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchScore } from "@/lib/api";

interface TeamScore {
  name: string;
  score: number;
  finished: boolean;
  details?: Array<{ question_id: number; correct: boolean }>;
}

const Score = () => {
  const { room } = useParams<{ room: string }>();
  const [teams, setTeams] = useState<TeamScore[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!room) return;

    const load = async () => {
      try {
        const data = await fetchScore(room);
        setTeams(data);
      } catch {
        setTeams([]);
      }
      setLoading(false);
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [room]);

  const sortedTeams = teams ? [...teams].sort((a, b) => b.score - a.score) : [];

  return (
    <div className="max-w-5xl mx-auto p-5 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">🏆 Placar da Sala</h1>
        <p className="text-muted-foreground">
          Sala: <span className="text-primary font-bold text-xl">{room}</span>
        </p>
      </header>

      <div className="mt-5">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-lg">Carregando placar...</div>
        ) : !teams || teams.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-lg">Aguardando as equipes entrarem...</div>
        ) : (
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["#", "Equipe", "Pontos", "Mapa de Respostas", "Status"].map((h) => (
                    <th key={h} className="bg-muted p-4 text-left text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, i) => (
                  <tr key={team.name} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-bold text-muted-foreground text-lg">{i + 1}º</td>
                    <td className="p-4 font-semibold text-foreground">{team.name}</td>
                    <td className="p-4 font-bold text-primary text-xl">{team.score}</td>
                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {(team.details || []).map((detail, j) => (
                          <div
                            key={j}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs text-primary-foreground font-bold cursor-help transition-transform hover:scale-125 ${
                              detail.correct ? "bg-green-500" : "bg-red-500"
                            }`}
                            title={`Questão ${detail.question_id}`}
                          >
                            {detail.correct ? "✓" : "✕"}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {team.finished ? (
                        <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "hsl(var(--quiz-success-bg))", color: "hsl(152 69% 20%)" }}>
                          ✓ Finalizado
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "hsl(var(--quiz-warning-bg))", color: "hsl(var(--quiz-warning-text))" }}>
                          Em andamento...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Score;
