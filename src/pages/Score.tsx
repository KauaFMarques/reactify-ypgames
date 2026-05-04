import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchScore } from "@/lib/api";
import type { TeamScore } from "@/lib/api";

const Score = () => {
  const { room } = useParams<{ room: string }>();
  const navigate = useNavigate();
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

  const sortedTeams = teams
    ? [...teams].sort(
        (a, b) => b.score - a.score || a.avg_time_ms - b.avg_time_ms,
      )
    : [];

  const formatTime = (ms: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="max-w-5xl mx-auto p-5 min-h-screen">
      <header className="text-center mb-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-primary font-medium px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all duration-300 border-none cursor-pointer mb-4"
        >
          ← Início
        </button>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          🏆 Placar da Sala
        </h1>
        <p className="text-muted-foreground">
          Sala: <span className="text-primary font-bold text-xl">{room}</span>
        </p>
      </header>

      <div className="mt-5">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-lg">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando placar...
          </div>
        ) : !teams || teams.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-lg">
            Aguardando as equipes entrarem...
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {[
                    "#",
                    "Equipe",
                    "Melhores Decisões",
                    "Tempo Médio",
                    "Detalhes",
                  ].map((h) => (
                    <th
                      key={h}
                      className="bg-muted p-4 text-left text-muted-foreground font-semibold uppercase text-xs tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, i) => (
                  <tr
                    key={team.team_id}
                    className="border-t border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-muted-foreground text-lg">
                      {i === 0
                        ? "🥇"
                        : i === 1
                          ? "🥈"
                          : i === 2
                            ? "🥉"
                            : `${i + 1}º`}
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {team.team_name}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-primary text-xl">
                        {team.score}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {" "}
                        / {team.total}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">
                      ⏱ {formatTime(team.avg_time_ms)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {(team.details || []).map((detail, j) => (
                          <div
                            key={j}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white font-bold cursor-help transition-transform hover:scale-125 ${
                              detail.is_best ? "bg-green-500" : "bg-red-400"
                            }`}
                            title={`${detail.scenario_title} — ${detail.choice_text} (${formatTime(detail.response_time_ms)})`}
                          >
                            {detail.is_best ? "✓" : "✕"}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-center text-muted-foreground text-xs mt-6">
        Atualiza automaticamente a cada 5 segundos
      </p>
    </div>
  );
};

export default Score;
