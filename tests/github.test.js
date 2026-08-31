import { test } from "node:test";
import assert from "node:assert/strict";
import { getUser, getUserRepos, countCommitsInRepo, countPullRequests, countIssues } from "../js/github.js";

test("getUser trae datos reales de un usuario real", async () => {
  const user = await getUser("mxnueel");
  assert.equal(user.login, "mxnueel");
  assert.equal(typeof user.publicRepos, "number");
  assert.ok(user.avatarUrl.startsWith("https://"));
});

test("getUser lanza un error claro para un usuario que no existe", async () => {
  await assert.rejects(() => getUser("esto-no-existe-nunca-jamas-usuario-123456789"), /no encontrado/);
});

test("getUserRepos trae la lista real de repos de un usuario real", async () => {
  const repos = await getUserRepos("mxnueel");
  assert.ok(repos.length >= 6, `se esperaban al menos 6 repos reales, se obtuvieron ${repos.length}`);
  assert.ok(repos.some((r) => r.name === "sismos-mx"));
});

test("countCommitsInRepo cuenta commits reales de forma precisa (via header Link, no la Search API con bug)", async () => {
  // sismos-mx tenia exactamente 2 commits en su rama principal al momento de escribir esta prueba,
  // verificado a mano con `git log --oneline | wc -l`. Usamos un rango amplio para no depender de fechas exactas.
  const count = await countCommitsInRepo("mxnueel", "sismos-mx", "mxnueel", "2020-01-01T00:00:00Z", "2030-01-01T00:00:00Z");
  assert.ok(count >= 2, `se esperaban al menos 2 commits reales, se obtuvieron ${count}`);
});

test("countCommitsInRepo regresa 0 para un rango de fechas sin commits", async () => {
  const count = await countCommitsInRepo("mxnueel", "sismos-mx", "mxnueel", "2000-01-01T00:00:00Z", "2000-01-02T00:00:00Z");
  assert.equal(count, 0);
});

test("countPullRequests y countIssues regresan numeros reales (Search API, sin el bug de la de commits)", async () => {
  const prs = await countPullRequests("mxnueel", "2020-01-01T00:00:00Z", "2030-01-01T00:00:00Z");
  const issues = await countIssues("mxnueel", "2020-01-01T00:00:00Z", "2030-01-01T00:00:00Z");
  assert.equal(typeof prs, "number");
  assert.equal(typeof issues, "number");
  assert.ok(prs < 1000, "el conteo de PRs deberia ser un numero razonable, no inflado como el bug de commits");
});
