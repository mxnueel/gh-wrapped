import { getUser, getUserRepos, countCommitsInRepo, countPullRequests, countIssues, setAuthToken } from "./github.js";
import { aggregateLanguages, findMostStarredRepo, totalStars, reposCreatedInYear, pickPersonality } from "./stats.js";
import { drawCard } from "./card.js";

const MAX_REPOS_FOR_COMMIT_COUNT = 20; // limite para no agotar el rate limit sin autenticacion (60/hora)
const TOKEN_STORAGE_KEY = "gh-wrapped-token";

const form = document.getElementById("search-form");
const usernameInput = document.getElementById("username-input");
const yearSelect = document.getElementById("year-select");
const statusText = document.getElementById("status-text");
const cardWrap = document.getElementById("card-wrap");
const canvas = document.getElementById("card");
const downloadBtn = document.getElementById("download-btn");
const scopeNote = document.getElementById("scope-note");
const tokenInput = document.getElementById("token-input");

const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
if (savedToken) {
  tokenInput.value = savedToken;
  setAuthToken(savedToken);
}
tokenInput.addEventListener("change", () => {
  setAuthToken(tokenInput.value);
  if (tokenInput.value.trim()) {
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenInput.value.trim());
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
});

function populateYears() {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

async function generate(username, year) {
  statusText.textContent = "Buscando usuario...";
  cardWrap.hidden = true;
  scopeNote.hidden = true;

  try {
    const user = await getUser(username);
    const repos = await getUserRepos(username);

    const sinceISO = `${year}-01-01T00:00:00Z`;
    const untilISO = `${year}-12-31T23:59:59Z`;

    const reposForCommits = [...repos]
      .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt))
      .slice(0, MAX_REPOS_FOR_COMMIT_COUNT);

    statusText.textContent = `Contando commits en ${reposForCommits.length} repo(s)...`;
    const commitCounts = await Promise.all(
      reposForCommits.map((r) => countCommitsInRepo(r.fullName.split("/")[0], r.name, username, sinceISO, untilISO))
    );
    const totalCommits = commitCounts.reduce((a, b) => a + b, 0);

    statusText.textContent = "Contando pull requests e issues...";
    const [pullRequests] = await Promise.all([countPullRequests(username, sinceISO, untilISO)]);

    const newRepos = reposCreatedInYear(repos, year);
    const languages = aggregateLanguages(repos);
    const personality = pickPersonality(totalCommits);

    const stats = {
      totalCommits,
      pullRequests,
      newRepos: newRepos.length,
      totalStars: totalStars(repos),
      topLanguage: languages[0]?.[0] ?? null,
      mostStarredRepo: findMostStarredRepo(repos),
    };

    const ctx = canvas.getContext("2d");
    await drawCard(ctx, { user, year, personality, stats });

    cardWrap.hidden = false;
    scopeNote.hidden = false;
    statusText.textContent =
      reposForCommits.length < repos.length
        ? `Listo. (Los commits se contaron en tus ${MAX_REPOS_FOR_COMMIT_COUNT} repos con actividad mas reciente, de ${repos.length} totales.)`
        : "Listo.";
    window.__wrappedStats = stats; // gancho para pruebas end-to-end
    window.__wrappedReady = true;
  } catch (err) {
    statusText.textContent = err instanceof Error ? err.message : String(err);
    window.__wrappedReady = false;
  }
}

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `github-wrapped-${usernameInput.value}-${yearSelect.value}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  generate(usernameInput.value.trim(), Number(yearSelect.value));
});

document.querySelectorAll(".example-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    usernameInput.value = btn.dataset.user;
    generate(btn.dataset.user, Number(yearSelect.value));
  });
});

populateYears();
usernameInput.value = "mxnueel";
generate("mxnueel", Number(yearSelect.value));
