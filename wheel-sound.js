let audioContext;
let masterGain;
let activeNodes = [];
let ambientTimer;
let ambientEnabled = false;
let masterVolume = 0.65;

function getContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (!masterGain) {
    masterGain = audioContext.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

function tone(frequency, start, duration, volume, type = "sine", destination) {
  const context = getContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.02, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(destination || masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
  return { oscillator, gain };
}

export async function unlockWheelSound() {
  try {
    const context = getContext();
    if (context.state !== "running") await context.resume();
  } catch {
    // Audio remains optional when a browser blocks playback.
  }
}

export function setMasterVolume(value) {
  masterVolume = Math.max(0, Math.min(1, Number(value)));
  if (masterGain && audioContext) masterGain.gain.setTargetAtTime(masterVolume, audioContext.currentTime, .04);
}

export function stopWheelSound() {
  activeNodes.forEach(({ oscillator, source, gain }) => {
    try { (oscillator || source)?.stop(); gain?.disconnect(); } catch {}
  });
  activeNodes = [];
}

export function playWheelSound(durationMs = 7000) {
  stopWheelSound();
  const context = getContext();
  if (context.state !== "running") return;
  const startedAt = context.currentTime;
  const duration = Math.max(.8, durationMs / 1000);
  let elapsed = 0;
  while (elapsed < duration) {
    const progress = elapsed / duration;
    activeNodes.push(tone(620 + (1 - progress) * 180, startedAt + elapsed, .045, .045, "triangle"));
    elapsed += .045 + progress * progress * .36;
  }
  window.setTimeout(stopWheelSound, durationMs + 180);
}

export function playRaceSound(durationMs = 7000) {
  stopWheelSound();
  const context = getContext();
  if (context.state !== "running") return;
  const start = context.currentTime;
  const duration = Math.max(1, durationMs / 1000);
  for (let elapsed = 0; elapsed < duration; elapsed += .19) {
    const step = Math.round(elapsed / .19) % 2;
    activeNodes.push(tone(step ? 105 : 82, start + elapsed, .08, .055, "triangle"));
    if (step) activeNodes.push(tone(380, start + elapsed, .025, .018, "square"));
  }
  for (let elapsed = .55; elapsed < duration; elapsed += 1.45) {
    const growl = tone(92, start + elapsed, .42, .045, "sawtooth");
    growl.oscillator.frequency.exponentialRampToValueAtTime(48, start + elapsed + .4);
    activeNodes.push(growl);
  }
  window.setTimeout(stopWheelSound, durationMs + 220);
}

export function playEliminationSound() {
  const context = getContext();
  if (context.state !== "running") return;
  const now = context.currentTime;
  const drop = tone(240, now, .16, .035, "square");
  drop.oscillator.frequency.exponentialRampToValueAtTime(90, now + .15);
  activeNodes.push(drop);
}

export function playButtonSound() {
  const context = getContext();
  if (context.state !== "running") return;
  tone(540, context.currentTime, .055, .025, "triangle");
}

export function playWinnerSound() {
  stopWheelSound();
  const context = getContext();
  if (context.state !== "running") return;
  const startedAt = context.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    activeNodes.push(tone(frequency, startedAt + index * .14, index === 3 ? .58 : .18, index === 3 ? .11 : .075, index === 3 ? "sine" : "triangle"));
  });
}

function playAmbientPhrase() {
  const context = getContext();
  if (!ambientEnabled || context.state !== "running") return;
  const start = context.currentTime;
  const notes = [261.63, 311.13, 392, 466.16, 392, 311.13];
  notes.forEach((frequency, index) => {
    const node = tone(frequency, start + index * .42, .28, .022, "sine");
    node.gain.gain.setValueAtTime(.0001, start + index * .42);
  });
}

export function setAmbientMusic(enabled) {
  const nextEnabled = Boolean(enabled);
  if (nextEnabled === ambientEnabled && Boolean(ambientTimer) === nextEnabled) return;
  ambientEnabled = nextEnabled;
  window.clearInterval(ambientTimer);
  ambientTimer = undefined;
  if (!ambientEnabled) return;
  playAmbientPhrase();
  ambientTimer = window.setInterval(playAmbientPhrase, 3200);
}
