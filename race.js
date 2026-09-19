const raceStates = new WeakMap();
const RUNNER_COLORS = ["#f15a29", "#00a7a5", "#e83e8c", "#f5b700", "#6f4bd8", "#2e9f62"];

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function clearRace(container) {
  const state = raceStates.get(container);
  state?.animations.forEach((animation) => animation.cancel());
  state?.timers.forEach((timer) => window.clearTimeout(timer));
  raceStates.delete(container);
}

function seededRandom(seed) {
  let value = (Number(seed) || 1) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function shuffled(items, seed) {
  const random = seededRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function featuredEntries(entries, winnerId, spinNumber = 0, visualSeed = 0) {
  const active = entries.filter((entry) => entry.enabled || entry.id === winnerId);
  const seed = Number(visualSeed) || (spinNumber * 2654435761);
  if (active.length <= 12) return shuffled(active, seed);
  const winner = active.find((entry) => entry.id === winnerId);
  const others = active.filter((entry) => entry.id !== winnerId);
  const visible = shuffled(others, seed).slice(0, winner ? 11 : 12);
  return winner ? shuffled([...visible, winner], seed ^ 0x9e3779b9) : visible;
}

function runnerMarkup(entry, index, count) {
  const lane = index % Math.min(count, 10);
  const laneCount = Math.min(count, 10);
  const top = 16 + lane * (68 / Math.max(1, laneCount - 1));
  const left = 27 + (index % 4) * 7;
  const delay = (index % 5) * .035;
  const sway = index % 2 ? 1 : -1;
  return `
    <div class="race-runner" data-runner-id="${escapeHtml(entry.id)}" style="--runner-top:${top}%;--runner-left:${left}%;--runner-color:${RUNNER_COLORS[index % RUNNER_COLORS.length]};--runner-delay:${delay}s;--runner-sway:${sway}">
      <span class="runner-name">${escapeHtml(entry.name)}</span>
      <span class="runner-shadow" aria-hidden="true"></span>
      <span class="runner-person" aria-hidden="true"><i class="runner-head"></i><i class="runner-body"></i><i class="runner-arm"></i><i class="runner-legs"></i></span>
      <span class="runner-dust" aria-hidden="true"></span>
    </div>`;
}

export function renderRace(container, entries, options = {}) {
  const wasHidden = container.classList.contains("is-hidden");
  clearRace(container);
  const available = entries.filter((entry) => entry.enabled);
  const pack = featuredEntries(entries, options.winnerId, options.spinNumber, options.visualSeed);
  const hiddenCount = Math.max(0, available.length - pack.filter((entry) => entry.enabled).length);
  container.className = "race-stage";
  container.classList.toggle("is-hidden", wasHidden);
  container.innerHTML = `
    <div class="papel-race" aria-hidden="true"></div>
    <img class="race-altar" src="assets/ofrenda/altar.webp" alt="" aria-hidden="true" />
    <img class="race-pan-charm" src="assets/ofrenda/pan-floral.webp" alt="" aria-hidden="true" />
    <div class="race-moon" aria-hidden="true"><span></span></div>
    <div class="race-horizon" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="race-speed-lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="race-track" aria-label="Persecución de participantes">
      ${pack.map((entry, index) => runnerMarkup(entry, index, pack.length)).join("")}
      <div class="pan-monster" aria-hidden="true"><img src="assets/pan-monster.webp" alt="" /></div>
    </div>
    <div class="race-caption"><strong>${available.length ? "Escapa del Pan de Muerto" : "Carga participantes para comenzar"}</strong><span>${hiddenCount ? `12 corredores visibles · ${available.length} participan en el sorteo` : `${available.length} participante${available.length === 1 ? "" : "s"} en la carrera`}</span></div>`;
}

export function runRace(container, entries, spin, options = {}) {
  renderRace(container, entries, { winnerId: spin.winnerId, spinNumber: spin.spinNumber, visualSeed: spin.visualSeed });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elapsed = Math.max(0, Date.now() - (spin.startedAt?.toMillis?.() || Date.now()));
  const fullDuration = reducedMotion ? Math.min(900, spin.durationMs) : spin.durationMs;
  const duration = Math.max(250, fullDuration - Math.min(elapsed, fullDuration - 250));
  const startProgress = Math.min(.92, elapsed / Math.max(1, fullDuration));
  const runners = [...container.querySelectorAll(".race-runner")];
  const winner = runners.find((runner) => runner.dataset.runnerId === spin.winnerId);
  const others = runners.filter((runner) => runner !== winner);
  const monster = container.querySelector(".pan-monster");
  const animations = [];
  const timers = [];
  container.classList.add("is-running");

  const motionRandom = seededRandom(spin.visualSeed || spin.spinNumber);
  runners.forEach((runner) => {
    const distance = container.clientWidth * (.24 + motionRandom() * .13);
    const animation = runner.animate(
      [{ transform: `translate3d(${distance * startProgress}px,0,0)` }, { transform: `translate3d(${distance}px,0,0)` }],
      { duration, easing: "cubic-bezier(.18,.72,.25,1)", fill: "forwards" }
    );
    animations.push(animation);
  });

  if (monster) {
    animations.push(monster.animate(
      [{ transform: `translate3d(${container.clientWidth * .56 * startProgress}px,0,0) scale(${.82 + startProgress * .21})` }, { transform: `translate3d(${container.clientWidth * .56}px,0,0) scale(1.03)` }],
      { duration, easing: "cubic-bezier(.2,.66,.18,1)", fill: "forwards" }
    ));
  }

  shuffled(others, (spin.visualSeed || spin.spinNumber) ^ 0x85ebca6b).forEach((runner, index) => {
    const catchAt = fullDuration * (.42 + (index / Math.max(1, others.length)) * .42) - elapsed;
    const markCaught = () => {
      runner.classList.add("is-caught");
      container.classList.add("is-catching");
      window.setTimeout(() => container.classList.remove("is-catching"), 420);
      options.onCatch?.();
    };
    if (catchAt <= 0) markCaught();
    else timers.push(window.setTimeout(markCaught, catchAt));
  });

  timers.push(window.setTimeout(() => {
    container.classList.remove("is-running");
    container.classList.add("has-winner");
    winner?.classList.add("is-survivor");
    options.onFinish?.();
  }, duration));
  raceStates.set(container, { animations, timers });
}

export function showRaceWinner(container, entries, winner) {
  renderRace(container, entries, { winnerId: winner.winnerId, spinNumber: winner.spinNumber, visualSeed: winner.visualSeed });
  container.classList.add("has-winner");
  const survivor = [...container.querySelectorAll(".race-runner")].find((runner) => runner.dataset.runnerId === winner.winnerId);
  survivor?.classList.add("is-survivor");
}

export function stopRace(container) {
  clearRace(container);
  container.classList.remove("is-running");
}
