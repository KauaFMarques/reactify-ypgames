const BASE_URL = "https://yp-game-backend2-1.onrender.com";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Choice {
  id: number;
  text: string;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  order_index: number;
  choices: Choice[];
}

export interface RespondResult {
  is_best: boolean;
  feedback: string;
  score: number;
}

export interface ResponseDetail {
  scenario_id: number;
  scenario_title: string;
  choice_id: number;
  choice_text: string;
  is_best: boolean;
  response_time_ms: number;
  responded_at: string;
}

export interface TeamScore {
  team_id: number;
  team_name: string;
  score: number;
  total: number;
  avg_time_ms: number;
  details: ResponseDetail[];
}

export interface CreateChoiceInput {
  text: string;
  is_best: boolean;
  feedback: string;
}

export interface CreateScenarioInput {
  room: string;
  title: string;
  description: string;
  order_index: number;
  choices: CreateChoiceInput[];
}

// ─── Sala ─────────────────────────────────────────────────────────────────────

export async function createRoom(
  prof: string,
  room: string,
): Promise<{ id: string }> {
  const response = await fetch(
    `${BASE_URL}/room?prof=${encodeURIComponent(prof)}&room=${encodeURIComponent(room)}`,
    {
      method: "POST",
    },
  );
  if (response.ok) return response.json();
  throw new Error("Falha ao criar a sala. Tente novamente.");
}

export async function joinRoom(
  room: string,
  team: string,
): Promise<{ id: number }> {
  const response = await fetch(
    `${BASE_URL}/join?room=${encodeURIComponent(room)}&team=${encodeURIComponent(team)}`,
    {
      method: "POST",
    },
  );
  if (response.ok) return response.json();
  const errorData = await response.json().catch(() => ({}));
  throw new Error(
    errorData.error || "Falha ao entrar na sala. Verifique o código.",
  );
}

// ─── Cenários ─────────────────────────────────────────────────────────────────

export async function createScenario(
  input: CreateScenarioInput[],
): Promise<unknown> {
  console.log("[createScenario] payload", input);
  const response = await fetch(`${BASE_URL}/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.ok) return response.json();
  throw new Error("Falha ao criar cenário.");
}

// Busca os cenários da sala — NÃO revela is_best nem feedback
export async function fetchScenarios(room: string): Promise<Scenario[]> {
  const response = await fetch(
    `${BASE_URL}/scenarios?room=${encodeURIComponent(room)}`,
  );
  if (response.ok) return response.json();
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.error || "Falha ao buscar cenários.");
}

// ─── Jogo ─────────────────────────────────────────────────────────────────────

export async function submitResponse(
  teamId: number,
  scenarioId: number,
  choiceId: number,
  responseTimeMs: number,
): Promise<RespondResult> {
  const response = await fetch(`${BASE_URL}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: teamId,
      scenario_id: scenarioId,
      choice_id: choiceId,
      response_time_ms: responseTimeMs,
    }),
  });
  if (response.ok) return response.json();
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.error || "Falha ao enviar resposta.");
}

// ─── Placar ───────────────────────────────────────────────────────────────────

export async function fetchScore(room: string): Promise<TeamScore[]> {
  const params = new URLSearchParams({ room });
  const response = await fetch(`${BASE_URL}/score?${params}`);
  if (response.ok) return response.json();
  throw new Error("Falha ao buscar placar.");
}
