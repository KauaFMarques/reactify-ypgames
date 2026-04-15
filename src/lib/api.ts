const BASE_URL = "https://yp-game-backend.onrender.com";

export async function fetchQuestions() {
  const response = await fetch(`${BASE_URL}/questions`);
  if (response.ok) {
    return response.json();
  }
  throw new Error("Failed to fetch questions");
}

export async function joinRoom(room: string, team: string) {
  const response = await fetch(`${BASE_URL}/join?room=${room}&team=${team}`, {
    method: "POST",
  });
  if (response.ok) {
    return response.json();
  }
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || "Falha ao entrar na sala. Verifique o código.");
}

export async function createRoom(prof: string, room: string) {
  const response = await fetch(`${BASE_URL}/room?prof=${prof}&room=${room}`, {
    method: "POST",
  });
  if (response.ok) {
    return response.json();
  }
  throw new Error("Falha ao criar a sala. Tente novamente.");
}

export async function submitAnswer(teamId: string, questionId: number, answerId: number) {
  const params = new URLSearchParams({
    team: String(teamId),
    question: String(questionId),
    answer: String(answerId),
  });
  const response = await fetch(`${BASE_URL}/answer?${params.toString()}`, {
    method: "POST",
  });
  if (response.ok) {
    return response.json();
  }
  throw new Error("Failed to submit answer");
}

export async function fetchScore(room: string) {
  const response = await fetch(`${BASE_URL}/score?room=${room}`);
  return response.json();
}
