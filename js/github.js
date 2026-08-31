const API_BASE = "https://api.github.com";

/**
 * Token personal opcional del propio visitante (nunca se envia a ningun servidor
 * nuestro, solo directo a api.github.com desde su navegador). Sin token: 60
 * peticiones/hora y 10 busquedas/minuto. Con un token gratuito de solo-lectura:
 * 5000/hora y 30 busquedas/minuto - suficiente margen para generar varios wrapped.
 */
let authToken = null;

export function setAuthToken(token) {
  authToken = token?.trim() || null;
}

async function githubFetch(path, init) {
  const headers = { Accept: "application/vnd.github+json", ...init?.headers };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 404) {
    throw new Error("Usuario no encontrado. Revisa que el nombre este bien escrito.");
  }
  if (res.status === 401) {
    throw new Error("El token que pusiste no es valido. Quitalo o revisa que lo copiaste bien.");
  }
  if (res.status === 403) {
    throw new Error(
      authToken
        ? "Limite de peticiones alcanzado incluso con tu token. Intenta de nuevo en unos minutos."
        : "Limite de peticiones de GitHub alcanzado (60/hora sin token). Pega un token gratuito abajo para subir a 5000/hora, o intenta de nuevo en unos minutos."
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub respondio ${res.status}`);
  }
  return res;
}

export async function getUser(username) {
  const res = await githubFetch(`/users/${username}`);
  const data = await res.json();
  return {
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    createdAt: data.created_at,
    followers: data.followers,
    publicRepos: data.public_repos,
  };
}

/** Trae TODOS los repos propios del usuario (paginado). */
export async function getUserRepos(username) {
  const repos = [];
  let page = 1;
  for (;;) {
    const res = await githubFetch(`/users/${username}/repos?per_page=100&page=${page}&type=owner`);
    const batch = await res.json();
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return repos.map((r) => ({
    name: r.name,
    fullName: r.full_name,
    language: r.language,
    stars: r.stargazers_count,
    isFork: r.fork,
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
    htmlUrl: r.html_url,
  }));
}

/**
 * Cuenta commits reales de `author` en un repo dentro de un rango de fechas, usando
 * el header Link de paginacion (per_page=1, se lee el numero de la ultima pagina) en
 * vez de la Search API de commits, que cuenta commits duplicados a traves de forks/mirrors
 * y da numeros no confiables (verificado: un usuario conocido mostraba 184,836 commits).
 */
export async function countCommitsInRepo(owner, repo, author, sinceISO, untilISO) {
  const params = new URLSearchParams({ author, since: sinceISO, until: untilISO, per_page: "1" });
  const res = await githubFetch(`/repos/${owner}/${repo}/commits?${params}`);
  const link = res.headers.get("link");
  if (!link) {
    const body = await res.json();
    return body.length; // 0 o 1, sin paginacion no hay header Link
  }
  const lastMatch = link.match(/[?&]page=(\d+)>; rel="last"/);
  return lastMatch ? Number(lastMatch[1]) : 1;
}

function toSearchDate(iso) {
  return iso.slice(0, 10);
}

export async function countPullRequests(username, sinceISO, untilISO) {
  const q = `author:${username} type:pr created:${toSearchDate(sinceISO)}..${toSearchDate(untilISO)}`;
  const res = await githubFetch(`/search/issues?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.total_count;
}

export async function countIssues(username, sinceISO, untilISO) {
  const q = `author:${username} type:issue created:${toSearchDate(sinceISO)}..${toSearchDate(untilISO)}`;
  const res = await githubFetch(`/search/issues?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.total_count;
}
