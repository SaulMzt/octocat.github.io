const PALETTE = ["#FF7A59", "#F3C64E", "#4BC7B5", "#5B8CFF", "#B484F2", "#EE7196", "#77B84F", "#ED9857"];

function wheelLabelLines(ctx, value, maxWidth, maxLines) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  while (words.length && lines.length < maxLines) {
    const word = words.shift();
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = word;
    } else {
      let clipped = word;
      while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) clipped = clipped.slice(0, -1);
      lines.push(`${clipped}…`);
      line = "";
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length) {
    let last = lines.at(-1);
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function drawWheelLabel(ctx, entry, mid, radius, count) {
  const fontSize = Math.max(10, Math.min(count <= 12 ? 17 : 14, 300 / count));
  const maxLines = count <= 18 ? 2 : 1;
  const lineHeight = fontSize * 1.08;
  const maxWidth = radius * (count <= 10 ? .58 : .48);

  ctx.save();
  ctx.rotate(mid);
  ctx.translate(radius * .63, 0);
  if (Math.cos(mid) < 0) ctx.rotate(Math.PI);
  ctx.fillStyle = "#10172b";
  ctx.font = `700 ${fontSize}px Manrope`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wheelLabelLines(ctx, entry.name, maxWidth, maxLines);
  const firstY = -((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => ctx.fillText(line, 0, firstY + index * lineHeight, maxWidth));
  ctx.restore();
}

export function drawWheel(canvas, entries) {
  const ctx = canvas.getContext("2d");
  const size = Math.min(canvas.width, canvas.height);
  const center = size / 2;
  const radius = center - 18;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(center, center);

  if (!entries.length) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#202b4e";
    ctx.fill();
    ctx.fillStyle = "#aeb9d6";
    ctx.font = "600 28px Manrope";
    ctx.textAlign = "center";
    ctx.fillText("Añade opciones", 0, 8);
    ctx.restore();
    return;
  }

  const angle = (Math.PI * 2) / entries.length;
  const showNames = entries.length <= 36;
  entries.forEach((entry, index) => {
    const start = -Math.PI / 2 + index * angle;
    const end = start + angle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = entry.enabled ? PALETTE[index % PALETTE.length] : "#566079";
    ctx.fill();
    ctx.strokeStyle = "rgba(15,20,40,.38)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (showNames) drawWheelLabel(ctx, entry, start + angle / 2, radius, entries.length);
  });

  ctx.beginPath();
  ctx.arc(0, 0, radius * .19, 0, Math.PI * 2);
  ctx.fillStyle = "#f6f8ff";
  ctx.fill();
  ctx.restore();
}

export function spinWheel(canvas, spin, onFinish) {
  const angle = 360 / spin.total;
  const target = (360 - ((spin.targetIndex + .5) * angle) % 360) % 360;
  const current = Number(canvas.dataset.rotation || 0);
  const finalRotation = Math.ceil(current / 360) * 360 + (7 + (spin.spinNumber % 3)) * 360 + target;
  const elapsed = Math.max(0, Date.now() - (spin.startedAt?.toMillis?.() || Date.now()));
  const animation = canvas.animate(
    [{ transform: `rotate(${current}deg)` }, { transform: `rotate(${finalRotation}deg)` }],
    { duration: Math.max(300, spin.durationMs - elapsed), easing: "cubic-bezier(.08,.72,.08,1)", fill: "forwards" }
  );
  animation.onfinish = () => {
    canvas.dataset.rotation = String(finalRotation);
    canvas.style.transform = `rotate(${finalRotation}deg)`;
    onFinish?.();
  };
  return animation;
}
