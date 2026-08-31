import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateLanguages, findMostStarredRepo, totalStars, reposCreatedInYear, pickPersonality } from "../js/stats.js";

const sampleRepos = [
  { name: "a", language: "TypeScript", stars: 5, isFork: false, createdAt: "2026-03-01T00:00:00Z" },
  { name: "b", language: "TypeScript", stars: 10, isFork: false, createdAt: "2026-05-01T00:00:00Z" },
  { name: "c", language: "JavaScript", stars: 2, isFork: false, createdAt: "2025-01-01T00:00:00Z" },
  { name: "d", language: null, stars: 0, isFork: true, createdAt: "2026-01-01T00:00:00Z" },
];

test("aggregateLanguages cuenta e ignora repos sin lenguaje", () => {
  assert.deepEqual(aggregateLanguages(sampleRepos), [
    ["TypeScript", 2],
    ["JavaScript", 1],
  ]);
});

test("findMostStarredRepo regresa el repo con mas estrellas", () => {
  assert.equal(findMostStarredRepo(sampleRepos).name, "b");
});

test("findMostStarredRepo regresa null para una lista vacia", () => {
  assert.equal(findMostStarredRepo([]), null);
});

test("totalStars suma todas las estrellas", () => {
  assert.equal(totalStars(sampleRepos), 17);
});

test("reposCreatedInYear filtra por año y excluye forks", () => {
  const repos2026 = reposCreatedInYear(sampleRepos, 2026);
  assert.deepEqual(
    repos2026.map((r) => r.name),
    ["a", "b"]
  );
});

test("pickPersonality regresa el titulo correcto segun el umbral de commits", () => {
  assert.equal(pickPersonality(500).title, "Máquina de Commits");
  assert.equal(pickPersonality(150).title, "Constructor Constante");
  assert.equal(pickPersonality(50).title, "Builder en Ascenso");
  assert.equal(pickPersonality(5).title, "Primeros Pasos");
  assert.equal(pickPersonality(0).title, "Primeros Pasos");
});
