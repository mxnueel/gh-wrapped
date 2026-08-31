import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startStaticServer } from "./static-server.js";

let server;
let baseUrl;
let browser;
let page;
const consoleErrors = [];

before(async () => {
  ({ server, url: baseUrl } = await startStaticServer());
  browser = await chromium.launch();
  page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForFunction(() => window.__wrappedReady === true, { timeout: 30_000 });
});

after(async () => {
  await browser?.close();
  server?.close();
});

test("la pagina carga con el titulo correcto", async () => {
  assert.equal(await page.title(), "GitHub Wrapped — tu resumen anual de código");
});

test("no hay errores en la consola del navegador al cargar", () => {
  assert.deepEqual(consoleErrors, []);
});

test("la tarjeta se genera con stats reales para el usuario de ejemplo", async () => {
  const stats = await page.evaluate(() => window.__wrappedStats);
  assert.ok(stats.totalCommits >= 2, `se esperaban al menos 2 commits reales, se obtuvo ${stats.totalCommits}`);
  assert.equal(typeof stats.newRepos, "number");
});

test("el canvas realmente dibujo algo (no esta en blanco)", async () => {
  const isBlank = await page.evaluate(() => {
    const canvas = document.getElementById("card");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Un canvas recien creado es todo ceros (transparente). Si dibujamos un
    // fondo con gradiente, deberia haber muchos pixeles no-cero.
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) return false;
    }
    return true;
  });
  assert.equal(isBlank, false, "el canvas deberia tener contenido dibujado, no estar transparente");
});

test("el boton de descarga genera un data URL de imagen valido", async () => {
  const dataUrl = await page.evaluate(() => document.getElementById("card").toDataURL("image/png"));
  assert.match(dataUrl, /^data:image\/png;base64,/);
  assert.ok(dataUrl.length > 1000, "la imagen generada deberia tener contenido real, no estar vacia");
});

test("buscar otro usuario real actualiza la tarjeta", async () => {
  await page.click('.example-btn[data-user="sindresorhus"]');
  await page.waitForFunction(
    () => document.getElementById("status-text").textContent.includes("Listo"),
    { timeout: 30_000 }
  );
  const stats = await page.evaluate(() => window.__wrappedStats);
  assert.ok(stats.totalStars >= 0);
});

test("un usuario que no existe muestra un mensaje de error claro", async () => {
  await page.fill("#username-input", "esto-no-existe-nunca-jamas-usuario-123456789");
  await page.click('#search-form button[type="submit"]');
  await page.waitForFunction(
    () => {
      const t = document.getElementById("status-text").textContent;
      return t.length > 0 && !t.includes("Buscando") && !t.includes("Contando");
    },
    { timeout: 20_000 }
  );
  const status = await page.textContent("#status-text");
  assert.match(status, /no encontrado/);
});
