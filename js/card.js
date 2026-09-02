function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Decelera rapido y llega sin rebote — el equivalente en una curva de easing
// de un resorte critically-damped (ver skill apple-design: "damping 1.0" es
// el default para UI que no viene de un gesto con momentum propio).
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const INK = "#2a1f0f";
const INK_DIM = "#5f4e30";
const INK_FAINT = "rgba(42,31,15,0.3)";
const INK_HAIRLINE = "rgba(42,31,15,0.16)";

// A ceremony-ticker column, not a bordered dashboard box: a big ink-colored
// number with a small label under it, separated from its neighbors by a
// hairline rather than each stat living in its own card. Reads as an
// achievement list on a certificate, not app-UI metrics.
function drawStatColumn(ctx, centerX, y, finalValue, label, progress) {
  const shownValue = Math.round(finalValue * progress);

  ctx.fillStyle = INK;
  ctx.font = "700 40px 'Sora', -apple-system, sans-serif";
  ctx.textAlign = "center";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "-1px"; // texto grande: tracking negativo (ver skill apple-design, tipografia)
  ctx.fillText(String(shownValue), centerX, y);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0.4px"; // texto chico: tracking positivo

  ctx.fillStyle = INK_DIM;
  ctx.font = "500 13px Inter, -apple-system, sans-serif";
  ctx.fillText(label, centerX, y + 26);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
}

function renderFrame(ctx, data, avatar, progress) {
  const { user, year, personality, stats } = data;
  const W = 800;
  const H = 680;

  // Warm parchment, not a dark dashboard panel - a certificate you'd frame,
  // not a stat readout. Numbers/labels below are ink-colored against it
  // (verified >=4.5:1 real WCAG contrast against the lightest gradient
  // stop), not white-on-dark like the rest of the portfolio's cards.
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#f7ecd3");
  gradient.addColorStop(1, "#efe0bd");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Certificate frame: two hairline strokes near the edge instead of the
  // bordered-card-on-dark-bg look used elsewhere.
  ctx.strokeStyle = INK_FAINT;
  ctx.lineWidth = 1.5;
  roundedRect(ctx, 28, 28, W - 56, H - 56, 4);
  ctx.stroke();
  ctx.strokeStyle = INK_HAIRLINE;
  roundedRect(ctx, 36, 36, W - 72, H - 72, 2);
  ctx.stroke();

  if (avatar) {
    const avatarSize = 120;
    const ax = W / 2 - avatarSize / 2;
    const ay = 80;
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, ay + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = personality.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W / 2, ay + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, ax, ay, avatarSize, avatarSize);
    ctx.restore();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = "700 32px 'Sora', -apple-system, sans-serif";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "-0.5px";
  ctx.fillText(`@${user.login}`, W / 2, 250);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

  ctx.fillStyle = INK_DIM;
  ctx.font = "500 15px Inter, -apple-system, sans-serif";
  ctx.fillText(`GitHub Wrapped ${year}`, W / 2, 278);

  // Insignia de personalidad: pastilla con color de acento, sin emoji.
  ctx.font = "600 19px 'Sora', -apple-system, sans-serif";
  const badgeText = personality.title;
  const badgeTextWidth = ctx.measureText(badgeText).width;
  const badgePadX = 22;
  const badgeW = badgeTextWidth + badgePadX * 2;
  const badgeH = 40;
  const badgeX = W / 2 - badgeW / 2;
  const badgeY = 310;
  roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = personality.accent;
  ctx.fill();
  ctx.fillStyle = "#0a0c10";
  ctx.fillText(badgeText, W / 2, badgeY + badgeH / 2 + 7);

  const statList = [
    [stats.totalCommits, "commits"],
    [stats.pullRequests, "pull requests"],
    [stats.newRepos, "repos nuevos"],
    [stats.totalStars, "estrellas"],
  ];

  const railStartX = 90;
  const railEndX = W - 90;
  const colW = (railEndX - railStartX) / statList.length;
  const statsY = 470;
  const statsTop = statsY - 48;
  const statsBottom = statsY + 26;

  // Hairlines between columns instead of each stat living in its own
  // bordered card - reads as one continuous "ceremony ticker" row.
  for (let i = 1; i < statList.length; i++) {
    const x = railStartX + colW * i;
    ctx.strokeStyle = INK_HAIRLINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, statsTop);
    ctx.lineTo(x, statsBottom);
    ctx.stroke();
  }

  statList.forEach(([value, label], i) => {
    const centerX = railStartX + colW * i + colW / 2;
    drawStatColumn(ctx, centerX, statsY, value, label, progress);
  });

  if (stats.topLanguage) {
    ctx.fillStyle = INK_DIM;
    ctx.font = "500 15px Inter, -apple-system, sans-serif";
    ctx.fillText(`Lenguaje principal: ${stats.topLanguage}`, W / 2, statsY + 76);
  }

  ctx.fillStyle = "rgba(42,31,15,0.45)";
  ctx.font = "400 13px Inter, -apple-system, sans-serif";
  ctx.fillText("mxnueel.github.io/gh-wrapped", W / 2, H - 46);
}

let renderToken = 0;

function countUp(ctx, data, avatar, token) {
  const duration = 650;
  const start = performance.now();
  return new Promise((resolve) => {
    function tick(now) {
      if (token !== renderToken) return resolve(); // una generacion mas nueva la reemplazo a mitad de camino
      const t = Math.min(1, (now - start) / duration);
      renderFrame(ctx, data, avatar, easeOutExpo(t));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    }
    requestAnimationFrame(tick);
  });
}

/**
 * Dibuja la tarjeta "Wrapped" en un canvas 2D context ya obtenido. Resuelve
 * en cuanto el primer frame (avatar + fondo + numeros en 0) esta pintado, no
 * hay que esperar a que termine de contar para revelar el canvas — la cuenta
 * sigue de fondo. `canvas.__cardAnimationDone` resuelve cuando los numeros
 * llegan a su valor final (usalo antes de exportar con toDataURL).
 */
export async function drawCard(ctx, data) {
  const token = ++renderToken;
  const { user } = data;

  let avatar = null;
  try {
    avatar = await loadImage(user.avatarUrl);
  } catch {
    // Si el avatar no carga (red, CORS en un entorno raro), seguimos sin el.
  }
  if (token !== renderToken) return; // una llamada mas nueva ya empezo

  // document.fonts.ready puede tardar o, en algunos entornos, no resolver rapido
  // (verificado: bloqueaba toda la generacion de la tarjeta de forma intermitente).
  // Le damos 1.5s de margen y seguimos de todas formas - en el peor caso el texto
  // usa la fuente de respaldo del sistema en vez de Sora, no es motivo
  // para dejar al usuario esperando indefinidamente.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
  }
  if (token !== renderToken) return;

  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    renderFrame(ctx, data, avatar, 1);
    ctx.canvas.__cardAnimationDone = Promise.resolve();
    return;
  }

  renderFrame(ctx, data, avatar, 0);
  ctx.canvas.__cardAnimationDone = countUp(ctx, data, avatar, token);
}
