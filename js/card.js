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

function drawStatBlock(ctx, x, y, w, h, value, label, accent) {
  roundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  roundedRect(ctx, x, y, 4, h, 2);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 42px 'Space Grotesk', -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(value), x + w / 2, y + h / 2 - 4);

  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "500 14px Inter, -apple-system, sans-serif";
  ctx.fillText(label, x + w / 2, y + h / 2 + 27);
}

/**
 * Dibuja la tarjeta "Wrapped" completa en un canvas 2D context ya obtenido
 * (ctx = canvas.getContext("2d")). `data` trae user, year, y las stats calculadas.
 */
export async function drawCard(ctx, data) {
  const { user, year, personality, stats } = data;
  const W = 800;
  const H = 1000;

  // document.fonts.ready puede tardar o, en algunos entornos, no resolver rapido
  // (verificado: bloqueaba toda la generacion de la tarjeta de forma intermitente).
  // Le damos 1.5s de margen y seguimos de todas formas - en el peor caso el texto
  // usa la fuente de respaldo del sistema en vez de Space Grotesk, no es motivo
  // para dejar al usuario esperando indefinidamente.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
  }

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#120c24");
  gradient.addColorStop(1, "#07152a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Avatar
  try {
    const avatar = await loadImage(user.avatarUrl);
    const avatarSize = 120;
    const ax = W / 2 - avatarSize / 2;
    const ay = 66;
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
  } catch {
    // Si el avatar no carga (red, CORS en un entorno raro), seguimos sin el.
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px 'Space Grotesk', -apple-system, sans-serif";
  ctx.fillText(`@${user.login}`, W / 2, 234);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "500 16px Inter, -apple-system, sans-serif";
  ctx.fillText(`GitHub Wrapped ${year}`, W / 2, 262);

  // Insignia de personalidad: pastilla con color de acento, sin emoji.
  ctx.font = "600 20px 'Space Grotesk', -apple-system, sans-serif";
  const badgeText = personality.title;
  const badgeTextWidth = ctx.measureText(badgeText).width;
  const badgePadX = 22;
  const badgeW = badgeTextWidth + badgePadX * 2;
  const badgeH = 42;
  const badgeX = W / 2 - badgeW / 2;
  const badgeY = 296;
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

  const cols = 2;
  const blockW = 320;
  const blockH = 130;
  const gap = 20;
  const startX = W / 2 - (blockW * cols + gap) / 2;
  const startY = 380;

  statList.forEach(([value, label], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    drawStatBlock(ctx, startX + col * (blockW + gap), startY + row * (blockH + gap), blockW, blockH, value, label, personality.accent);
  });

  if (stats.topLanguage) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "500 16px Inter, -apple-system, sans-serif";
    ctx.fillText(`Lenguaje principal: ${stats.topLanguage}`, W / 2, startY + 2 * (blockH + gap) + 30);
  }

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "400 13px Inter, -apple-system, sans-serif";
  ctx.fillText("mxnueel.github.io/gh-wrapped", W / 2, H - 30);
}
