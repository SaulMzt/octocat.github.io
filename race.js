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

function featuredEntries(entries, winnerId, spinNumber = 0) {
  const active = entries.filter((entry) => entry.enabled || entry.id === winnerId);
  if (active.length <= 12) return active;
  const winner = active.find((entry) => entry.id === winnerId);
  const others = active.filter((entry) => entry.id !== winnerId);
  const offset = (spinNumber * 7) % others.length;
  const rotated = [...others.slice(offset), ...others.slice(0, offset)].slice(0, winner ? 11 : 12);
  return winner ? [...rotated, winner] : rotated;
}

function runnerMarkup(entry, index, count) {
  const lane = index % Math.min(count, 10);
  const laneCount = Math.min(count, 10);
  const top = 16 + lane * (68 / Math.max(1, laneCount - 1));
  const left = 27 + (index % 4) * 7;
  return `
    <div class="race-runner" data-runner-id="${escapeHtml(entry.id)}" style="--runner-top:${top}%;--runner-left:${left}%;--runner-color:${RUNNER_COLORS[index % RUNNER_COLORS.length]}">
      <span class="runner-name">${escapeHtml(entry.name)}</span>
      <span class="runner-person" aria-hidden="true"><i class="runner-head"></i><i class="runner-body"></i><i class="runner-arm"></i><i class="runner-legs"></i></span>
    </div>`;
}

export function renderRace(container, entries, options = {}) {
  const wasHidden = container.classList.contains("is-hidden");
  clearRace(container);
  const available = entries.filter((entry) => entry.enabled);
  const pack = featuredEntries(entries, options.winnerId, options.spinNumber);
  const hiddenCount = Math.max(0, available.length - pack.filter((entry) => entry.enabled).length);
  container.className = "race-stage";
  container.classList.toggle("is-hidden", wasHidden);
  container.innerHTML = `
    <div class="papel-race" aria-hidden="true"></div>
    <div class="race-moon" aria-hidden="true"><span></span></div>
    <div class="race-horizon" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="race-track" aria-label="Persecución de participantes">
      ${pack.map((entry, index) => runnerMarkup(entry, index, pack.length)).join("")}
      <div class="pan-monster" aria-hidden="true"><img src="assets/pan-monster.webp" alt="" /></div>
    </div>
    <div class="race-caption"><strong>${available.length ? "Escapa del Pan de Muerto" : "Carga participantes para comenzar"}</strong><span>${hiddenCount ? `12 corredores visibles · ${available.length} participan en el sorteo` : `${available.length} participante${available.length === 1 ? "" : "s"} en la carrera`}</span></div>`;
}

export function runRace(container, entries, spin, options = {}) {
  renderRace(container, entries, { winnerId: spin.winnerId, spinNumber: spin.spinNumber });
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

  runners.forEach((runner, index) => {
    const distance = container.clientWidth * (.28 + (index % 3) * .025);
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

  others.forEach((runner, index) => {
    const catchAt = fullDuration * (.42 + (index / Math.max(1, others.length)) * .42) - elapsed;
    const markCaught = () => {
      runner.classList.add("is-caught");
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
  renderRace(container, entries, { winnerId: winner.winnerId, spinNumber: winner.spinNumber });
  container.classList.add("has-winner");
  const survivor = container.querySelector(`[data-runner-id="${CSS.escape(winner.winnerId)}"]`);
  survivor?.classList.add("is-survivor");
}

export function stopRace(container) {
  clearRace(container);
  container.classList.remove("is-running");
}
