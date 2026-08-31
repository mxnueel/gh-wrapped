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

function drawStatBlock(ctx, x, y, w, h, value, label) {
  roundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 40px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(value), x + w / 2, y + h / 2 - 4);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 15px -apple-system, sans-serif";
  ctx.fillText(label, x + w / 2, y + h / 2 + 26);
}

/**
 * Dibuja la tarjeta "Wrapped" completa en un canvas 2D context ya obtenido
 * (ctx = canvas.getContext("2d")). `data` trae user, year, y las stats calculadas.
 */
export async function drawCard(ctx, data) {
  const { user, year, personality, stats } = data;
  const W = 800;
  const H = 1000;

  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, "#1a1035");
  gradient.addColorStop(1, "#0a2a4a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Avatar
  try {
    const avatar = await loadImage(user.avatarUrl);
    const avatarSize = 120;
    const ax = W / 2 - avatarSize / 2;
    const ay = 70;
    ctx.save();
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
  ctx.font = "700 30px -apple-system, sans-serif";
  ctx.fillText(`@${user.login}`, W / 2, 235);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 18px -apple-system, sans-serif";
  ctx.fillText(`GitHub Wrapped ${year}`, W / 2, 265);

  ctx.font = "700 26px -apple-system, sans-serif";
  ctx.fillStyle = "#ffd54f";
  ctx.fillText(`${personality.emoji} ${personality.title}`, W / 2, 320);

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
  const startY = 370;

  statList.forEach(([value, label], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    drawStatBlock(ctx, startX + col * (blockW + gap), startY + row * (blockH + gap), blockW, blockH, value, label);
  });

  if (stats.topLanguage) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "500 18px -apple-system, sans-serif";
    ctx.fillText(`Lenguaje principal: ${stats.topLanguage}`, W / 2, startY + 2 * (blockH + gap) + 30);
  }

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 13px -apple-system, sans-serif";
  ctx.fillText("mxnueel.github.io/gh-wrapped", W / 2, H - 30);
}
