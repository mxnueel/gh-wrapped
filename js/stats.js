/** Cuenta ocurrencias del lenguaje principal de cada repo, ordenado de mas a menos comun. */
export function aggregateLanguages(repos) {
  const counts = new Map();
  for (const r of repos) {
    if (!r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function findMostStarredRepo(repos) {
  if (repos.length === 0) return null;
  return repos.reduce((best, r) => (r.stars > (best?.stars ?? -1) ? r : best), null);
}

export function totalStars(repos) {
  return repos.reduce((sum, r) => sum + r.stars, 0);
}

export function reposCreatedInYear(repos, year) {
  return repos.filter((r) => !r.isFork && new Date(r.createdAt).getUTCFullYear() === year);
}

const PERSONALITIES = [
  { min: 300, title: "Máquina de Commits", emoji: "⚙️" },
  { min: 100, title: "Constructor Constante", emoji: "🔨" },
  { min: 30, title: "Builder en Ascenso", emoji: "🌱" },
  { min: 0, title: "Primeros Pasos", emoji: "🚀" },
];

/** Titulo tipo "Wrapped" basado en el total de commits del año. */
export function pickPersonality(totalCommits) {
  const match = PERSONALITIES.find((p) => totalCommits >= p.min);
  return match ?? PERSONALITIES[PERSONALITIES.length - 1];
}
