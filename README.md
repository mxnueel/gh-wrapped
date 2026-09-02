# GitHub Wrapped

[![CI](https://github.com/mxnueel/gh-wrapped/actions/workflows/ci.yml/badge.svg)](https://github.com/mxnueel/gh-wrapped/actions/workflows/ci.yml)
[![Deploy](https://github.com/mxnueel/gh-wrapped/actions/workflows/deploy.yml/badge.svg)](https://github.com/mxnueel/gh-wrapped/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live: [mxnueel.github.io/gh-wrapped](https://mxnueel.github.io/gh-wrapped/)**

![Typing a GitHub username and watching the real Wrapped card materialize with live stats](docs/demo.gif)

*(Real recording of the live app — typing a username, hitting Generar, watching the actual card materialize and its numbers count up. No mockup: same code, same GitHub API calls.)*

Spotify Wrapped, but for your GitHub activity. Enter a username, get a shareable stats card for the year — commits, pull requests, new repos, top language — rendered as a downloadable PNG. No account, no server. It's the same reason `github-readme-stats` embeds in thousands of profile READMEs: people want machine-generated proof of their own work, just in the "wrapped" format instead of a static badge.

## Why commit counts don't use GitHub's commit search API

`/search/commits` looks like the obvious way to count a user's commits for a year — it isn't reliable. Testing it live, a well-known account showed **184,836 commits** for one year, because the endpoint counts duplicate commits across every fork/mirror of a repo, not just the original. `countCommitsInRepo()` in [`js/github.js`](js/github.js) avoids that endpoint entirely: it paginates the standard commits-list endpoint (`Link` header, `per_page=1`, read the last page number) scoped per-repo and per-date-range — verified against real repos with known commit counts before shipping.

**Honest scope limitation as a result:** these stats reflect activity on the user's **own repositories** only (commits, languages, stars, new repos). They don't include contributions to other people's or organizations' repos — GitHub's public API has no reliable, unauthenticated way to compute that across a whole account. Pull request and issue counts (via GitHub's Search API for issues, which — unlike the commit search endpoint — checked out accurate in testing) aren't subject to this limitation.

## Optional: bring your own token

Unauthenticated requests to GitHub's API are capped at 60/hour, which a full report (one call per repo to count commits, up to 20 repos) can approach quickly. There's an optional field to paste a free GitHub personal access token (no scopes needed, just for reading public data) that raises the limit to 5,000/hour. It's stored only in your own browser's `localStorage` and sent directly to `api.github.com` — never to any server this project controls.

## Run locally

No build step needed:

```bash
python3 -m http.server 8000
# or: npx serve
```

## Testing

```bash
npm install
npx playwright install chromium
npm test
```

19 tests across three levels:
- **`github.test.js`** — real calls against the live GitHub API (no mocks), including a direct verification that the `Link`-header commit-counting approach gives accurate numbers against a repo with a known commit count
- **`stats.test.js`** — pure aggregation logic (language counting, star totals, personality-tier selection)
- **`e2e.test.js`** — a real headless Chromium browser (Playwright) loading the actual page: confirms the card canvas actually renders (checks real pixel data, not just "no crash"), the downloaded image is a valid non-empty PNG, real stats populate for a real user, an invalid username shows a clear error, and there are zero console errors

CI runs the full suite on every push. A separate workflow deploys straight to GitHub Pages.

## License

MIT — see [LICENSE](LICENSE).
