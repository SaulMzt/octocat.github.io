import { COLORS, drawScene, drawRunner, drawMonster, drawName, drawPoof } from "./game-art.js?v=20260925-2";

const states = new WeakMap();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { const v = clamp(x); return v * v * (3 - 2 * v); };

export function seededRandom(seed) {
  let value = Math.imul((Number(seed) >>> 0) || 1, 0x9e3779b1) >>> 0;
  return () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
}
export function shuffle(items, seed) {
  const random = seededRandom(seed), result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function racePlan(entries, spin = {}, limit = 6) {
  const active = entries.filter(entry => (entry.enabled && !entry.retired) || entry.id === spin.winnerId);
  const seed = spin.visualSeed || spin.spinNumber || 17;
  const winner = active.find(entry => entry.id === spin.winnerId);
  const others = shuffle(active.filter(entry => entry.id !== spin.winnerId), seed);
  const pack = shuffle([...others.slice(0, limit - (winner ? 1 : 0)), ...(winner ? [winner] : [])], seed ^ 0x9e3779b9);
  const caught = shuffle(pack.filter(entry => entry.id !== spin.winnerId), seed ^ 0x85ebca6b);
  return { pack, catches: caught.map((entry, i) => ({ id: entry.id, at: .28 + i / Math.max(1, caught.length - 1) * .56 })), total: spin.total || active.length };
}
function textElement(className, tag = "div") {
  const element = document.createElement(tag); element.className = className; return element;
}
function timeOf(value) { return value?.toMillis?.() ?? (value?.seconds ? value.seconds * 1000 : Date.now()); }

export function stopRace(container) {
  const state = states.get(container);
  if (!state) return;
  cancelAnimationFrame(state.frame); clearTimeout(state.finishTimer);
  state.resize.disconnect(); state.visibility.disconnect();
  document.removeEventListener("visibilitychange", state.wake);
  states.delete(container);
  container.classList.remove("is-running");
}
export function renderRace(container, entries, options = {}) {
  stopRace(container);
  const hidden = container.classList.contains("is-hidden");
  container.className = "race-stage";
  container.classList.toggle("is-hidden", hidden);
  container.replaceChildren();
  const canvas = textElement("game-canvas", "canvas");
  canvas.setAttribute("aria-label", "Cementerio de Halloween. Persecución de participantes.");
  canvas.setAttribute("role", "img");
  const hud = textElement("game-hud");
  const title = textElement("game-location", "span"); title.textContent = "CEMENTERIO DE MEDIANOCHE";
  const count = textElement("game-remaining", "span");
  hud.append(title, count);
  const countdown = textElement("game-countdown");
  countdown.setAttribute("aria-live", "polite");
  const caption = textElement("race-caption");
  const captionTitle = textElement("", "strong"), captionDetail = textElement("", "span");
  caption.append(captionTitle, captionDetail);
  container.append(canvas, hud, countdown, caption);
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const state = { container, canvas, ctx: canvas.getContext("2d", { alpha: false }), count, countdown, captionTitle, captionDetail,
    entries, options, media, width: 960, height: 680, frame: 0, lastFrame: 0, visible: true, started: performance.now(), running: false, done: false, phase: "", emitted: new Set(), pack: [], catches: [], total: 0 };
  state.wake = () => { if (!document.hidden && !state.frame) state.frame = requestAnimationFrame(() => paint(state)); };
  state.resize = new ResizeObserver(() => resize(state));
  state.visibility = new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; if (state.visible) state.wake(); });
  state.resize.observe(container); state.visibility.observe(container);
  document.addEventListener("visibilitychange", state.wake);
  states.set(container, state);
  resize(state);
  return state;
}
function resize(state) {
  const width = state.container.clientWidth || 700;
  state.width = width < 560 ? 600 : 960;
  const rect = state.canvas.getBoundingClientRect();
  state.height = rect.width ? state.width * rect.height / rect.width : 680;
  const ratio = Math.min(devicePixelRatio || 1, 1.75);
  state.canvas.width = Math.max(1, Math.round(rect.width * ratio));
  state.canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const plan = racePlan(state.entries, state.spin || state.options, state.width === 600 || state.height < 630 ? 4 : 6);
  Object.assign(state, plan);
  if (state.options.winnerId && !state.running) state.pack = state.pack.filter(entry => entry.id === state.options.winnerId);
  state.captionTitle.textContent = state.options.winnerId ? "¡Escapó de la medianoche!" : state.total ? "La última persona en pie" : "Agrega participantes para comenzar";
  state.captionDetail.textContent = state.total ? `${Math.min(state.pack.length, state.total)} en pista · ${state.total} participan` : "La noche está por comenzar";
  state.wake();
}
function position(state, index, t, progress) {
  const compact = state.width === 600;
  const x = state.width * (index % 2 ? .76 : .43);
  const y = state.height * (compact ? .59 + Math.floor(index / 2) * .29 : state.pack.length <= 4 ? .59 + Math.floor(index / 2) * .31 : .47 + Math.floor(index / 2) * .23);
  const sway = state.running && progress > 0 && !state.media.matches ? Math.sin(t * 2 + index * 4) * 10 : 0;
  return { x: x + sway, y, scale: compact ? .8 : .84 };
}
function emit(state, key, callback, value) {
  if (state.emitted.has(key)) return;
  state.emitted.add(key); callback?.(value);
}
function paint(state) {
  state.frame = 0;
  if (!state.visible || document.hidden || states.get(state.container) !== state) return;
  const now = performance.now();
  const elapsed = state.spin ? Date.now() - timeOf(state.spin.startedAt) : 0;
  const countdownMs = state.spin?.countdownMs ?? 2100;
  const progress = state.running ? clamp((elapsed - countdownMs) / state.spin.durationMs) : state.done ? 1 : 0;
  const t = state.media.matches ? 0 : (now - state.started) / 1000;
  const interval = state.media.matches ? 180 : state.running ? 0 : 33;
  if (now - state.lastFrame < interval) { state.frame = requestAnimationFrame(() => paint(state)); return; }
  state.lastFrame = now;
  const { ctx, width: w, height: h } = state;
  ctx.setTransform(state.canvas.width / w, 0, 0, state.canvas.height / h, 0, 0);
  let phase = state.running ? elapsed < countdownMs ? "countdown" : progress < .12 ? "walking" : progress < .80 ? "running" : progress < 1 ? "tension" : "winner" : state.options.winnerId ? "winner" : "idle";
  if (state.phase !== phase) { state.phase = phase; state.callbacks?.onPhase?.(phase); }
  state.container.dataset.phase = phase;
  const countdownStep = Math.ceil((countdownMs - elapsed) / 700);
  if (phase === "countdown") {
    state.countdown.textContent = String(Math.max(1, countdownStep));
    emit(state, "count-" + countdownStep, state.callbacks?.onCountdown, countdownStep);
  } else state.countdown.textContent = "";
  const distance = progress * 1800;
  ctx.save();
  const zoom = state.media.matches ? 1 : state.running ? 1 + .018 * Math.sin(progress * Math.PI) : 1;
  ctx.translate(w * (1 - zoom) / 2, h * (1 - zoom) / 2); ctx.scale(zoom,zoom);
  drawScene(ctx,w,h,t,distance);
  const remaining = state.running ? Math.max(1, state.total - Math.floor(clamp((progress - .24) / .65) * (state.total - 1))) : state.options.winnerId ? 1 : state.total;
  state.count.textContent = `${remaining} ${remaining === 1 ? "EN PIE" : "EN PIE"}`;
  state.container.dataset.remaining = remaining;
  if (state.running) {
    state.captionTitle.textContent = phase === "countdown" ? "Preparados…" : phase === "walking" ? "¡Corran!" : phase === "tension" ? "La última oportunidad" : "Que no te alcance";
    state.captionDetail.textContent = `${remaining} de ${state.total} siguen en la carrera`;
  }
  let target = state.catches.find(item => progress < item.at + .06);
  let monsterX = w * .14, monsterY = h * .76, monsterState = phase === "walking" ? "walking" : state.running && progress > 0 ? "running" : "idle";
  const lastCatch = [...state.catches].reverse().find(item => progress >= item.at + .06);
  if (state.running && lastCatch) {
    const last = position(state, state.pack.findIndex(entry => entry.id === lastCatch.id), t, progress);
    monsterX = last.x - 80; monsterY = last.y + 6;
  }
  if (state.running && target && progress > target.at - .14) {
    const index = state.pack.findIndex(entry => entry.id === target.id);
    const pos = position(state,index,t,progress);
    const reach = ease((progress - target.at + .14) / .12);
    monsterX += (pos.x - 80 - monsterX) * reach;
    monsterY += (pos.y + 6 - monsterY) * reach;
    monsterState = progress < target.at ? "attacking" : "eating";
    if (!state.media.matches && Math.abs(progress - target.at) < .018) ctx.translate(Math.sin(t * 95) * 2.2, Math.cos(t * 90) * 1.4);
  }
  const celebrating = phase === "winner";
  const actors = [], labels = [], effects = [];
  let visibleCount = 0;
  state.pack.forEach((entry, index) => {
    const event = state.catches.find(item => item.id === entry.id);
    const caught = state.running && event && progress >= event.at;
    if (caught) emit(state,"catch-" + entry.id, elapsed < countdownMs + (event.at + .08) * state.spin.durationMs ? state.callbacks?.onCatch : undefined, { remaining });
    const pos = position(state,index,t,progress);
    const survivor = (celebrating || state.done || (state.running && progress > .88)) && entry.id === (state.spin?.winnerId || state.options.winnerId);
    if (celebrating && !survivor) return;
    if (caught) {
      const poof = clamp((progress - event.at) / .055);
      if (poof < 1) {
        effects.push(() => {
          drawPoof(ctx,pos.x,pos.y-38,poof,COLORS[index%6]);
          ctx.save(); ctx.globalAlpha = 1 - poof; ctx.fillStyle = "#f3d6a8"; ctx.font = "700 15px Manrope,Arial"; ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText("ELIMINADO", pos.x, pos.y - 92 - poof * 12); ctx.restore();
        });
      }
      return;
    }
    const center = survivor ? ease((progress - .88) / .12) : 0;
    const x = state.options.winnerId ? w*.51 : pos.x+(w*.51-pos.x)*center;
    const y = state.options.winnerId ? h*.72 : pos.y+(h*.72-pos.y)*center;
    const scared = state.running && event && progress > event.at - .08;
    const appearance = [...entry.id].reduce((sum,char)=>sum+char.charCodeAt(0),0)%6;
    const scale = survivor ? pos.scale + (1.3 - pos.scale) * (state.options.winnerId ? 1 : center) : pos.scale;
    visibleCount++;
    actors.push({ y, draw: () => drawRunner(ctx,x,y,scale,t+index*.23,appearance,COLORS[appearance],survivor?"winner":scared?"scared":state.running&&progress>0?"running":"idle") });
    labels.push(() => drawName(ctx,entry.name,x,y-(appearance===0?128:108)*scale-14,state.width===600?166:242,COLORS[appearance],survivor));
    if (scared && !state.media.matches) {
      effects.push(() => { ctx.save(); ctx.fillStyle="#f5c679";ctx.font="bold 27px Manrope";ctx.textAlign="center";ctx.textBaseline="bottom";ctx.fillText("!",x+31,y-70);ctx.restore(); });
    }
  });
  const retreat = celebrating ? 1 : state.running ? ease((progress - .88) / .12) : 0;
  monsterX += (w*.17-monsterX)*retreat;
  monsterY += (h*.88-monsterY)*retreat;
  actors.push({ y: monsterY, draw: () => drawMonster(ctx,monsterX,monsterY,state.width===600?.78:1.04,t,celebrating?"celebrating":monsterState) });
  // Depth-sort bodies, then keep every participant label above the action.
  actors.sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw());
  effects.forEach(draw=>draw());
  labels.forEach(draw=>draw());
  state.container.dataset.visibleCount = String(visibleCount);
  ctx.restore();
  if (state.media.matches && !state.running) return;
  state.frame = requestAnimationFrame(() => paint(state));
}
export function runRace(container, entries, spin, callbacks = {}) {
  const state = renderRace(container,entries);
  state.spin = spin; state.running = true; state.callbacks = callbacks;
  container.classList.add("is-running");
  resize(state);
  const remaining = Math.max(0, (spin.countdownMs ?? 2100) + spin.durationMs - (Date.now() - timeOf(spin.startedAt)));
  state.finishTimer = setTimeout(() => {
    if (states.get(container) !== state) return;
    state.running = false; state.done = true;
    container.classList.remove("is-running");container.classList.add("has-winner");
    state.options = { ...spin };
    state.pack = state.pack.filter(entry => entry.id === spin.winnerId);
    state.captionTitle.textContent = "¡Escapó de la medianoche!";
    state.captionDetail.textContent = spin.winnerName;
    state.countdown.textContent = "";
    state.callbacks?.onPhase?.("winner");
    state.wake();callbacks.onFinish?.();
  }, remaining);
}
export function showRaceWinner(container, entries, winner) {
  const all = entries.some(entry=>entry.id===winner.winnerId) ? entries : [...entries,{id:winner.winnerId,name:winner.winnerName,enabled:false}];
  renderRace(container,all,winner);container.classList.add("has-winner");
}
