let audioContext;
let masterGain;
let effectsGain;
let musicGain;
let activeNodes = [];
let ambientTimer;
let ambientEnabled = false;
let masterVolume = .72;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function getContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error("Web Audio no esta disponible en este navegador.");
    audioContext = new AudioContext();
  }
  if (!masterGain) {
    masterGain = audioContext.createGain();
    effectsGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    masterGain.gain.value = masterVolume;
    effectsGain.gain.value = .98;
    musicGain.gain.value = .68;
    effectsGain.connect(masterGain);
    musicGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
}

function readyContext() {
  try {
    const context = getContext();
    return context.state === "running" ? context : null;
  } catch {
    return null;
  }
}

function disconnect(entry) {
  try { entry.source?.stop(); } catch {}
  try { entry.oscillator?.stop(); } catch {}
  entry.nodes?.forEach((node) => {
    try { node.disconnect(); } catch {}
  });
}

function track(entry, duration) {
  activeNodes.push(entry);
  window.setTimeout(() => {
    const index = activeNodes.indexOf(entry);
    if (index >= 0) activeNodes.splice(index, 1);
    disconnect(entry);
  }, Math.max(80, duration * 1000 + 180));
  return entry;
}

function tone(frequency, start, duration, volume, type = "sine", destination = effectsGain, shouldTrack = true) {
  const context = getContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(.028, duration / 3));
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .04);
  const entry = { oscillator, nodes: [oscillator, gain] };
  return shouldTrack ? track(entry, duration) : entry;
}

function noise(start, duration, volume, filterFrequency = 1200, destination = effectsGain, shouldTrack = true) {
  const context = getContext();
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const length = Math.max(1, Math.ceil(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - index / length);
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFrequency, start);
  filter.Q.value = .8;
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .008);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter).connect(gain).connect(destination);
  source.start(start);
  source.stop(start + duration + .04);
  const entry = { source, nodes: [source, filter, gain] };
  return shouldTrack ? track(entry, duration) : entry;
}

function kick(start, volume = .09, destination = effectsGain, shouldTrack = true) {
  const beat = tone(128, start, .18, volume, "sine", destination, shouldTrack);
  beat.oscillator.frequency.exponentialRampToValueAtTime(42, start + .17);
  return beat;
}

export async function unlockWheelSound() {
  try {
    const context = getContext();
    if (context.state !== "running") await context.resume();
    if (context.state !== "running") return false;
    const warmup = tone(180, context.currentTime, .012, .0002, "sine", effectsGain, false);
    window.setTimeout(() => disconnect(warmup), 80);
    if (ambientEnabled) playAmbientPhrase();
    return true;
  } catch {
    return false;
  }
}

export function setMasterVolume(value) {
  masterVolume = clamp(Number(value) || 0, 0, 1);
  if (masterGain && audioContext) masterGain.gain.setTargetAtTime(masterVolume, audioContext.currentTime, .035);
}

export function stopWheelSound() {
  activeNodes.forEach(disconnect);
  activeNodes = [];
}

export function playButtonSound() {
  const context = readyContext();
  if (!context) return false;
  const now = context.currentTime;
  tone(540, now, .06, .06, "triangle");
  tone(830, now + .045, .08, .038, "sine");
  return true;
}

export function playWheelSound(durationMs = 7000) {
  stopWheelSound();
  const context = readyContext();
  if (!context) return false;
  const start = context.currentTime;
  const duration = Math.max(.8, durationMs / 1000);
  for (let elapsed = 0; elapsed < duration; elapsed += .055 + (elapsed / duration) ** 2 * .28) {
    const progress = elapsed / duration;
    tone(710 - progress * 220, start + elapsed, .05, .085, "triangle");
    if (progress > .58) tone(1120, start + elapsed, .026, .026, "sine");
  }
  window.setTimeout(stopWheelSound, durationMs + 220);
  return true;
}

export function playRaceSound(durationMs = 7000) {
  stopWheelSound();
  const context = readyContext();
  if (!context) return false;
  const start = context.currentTime;
  const duration = Math.max(1, durationMs / 1000);
  for (let elapsed = 0, step = 0; elapsed < duration; elapsed += .23, step += 1) {
    const at = start + elapsed;
    const rightFoot = step % 2 === 1;
    tone(rightFoot ? 124 : 94, at, .1, .095, "triangle");
    noise(at + .012, .075, rightFoot ? .075 : .06, rightFoot ? 1440 : 980);
    if (step % 4 === 0) kick(at, .12);
    if (step % 4 === 2) tone(530, at + .01, .035, .026, "square");
  }
  for (let elapsed = .58; elapsed < duration; elapsed += 1.45) {
    const growl = tone(86, start + elapsed, .5, .095, "sawtooth");
    growl.oscillator.frequency.exponentialRampToValueAtTime(43, start + elapsed + .45);
    noise(start + elapsed + .08, .18, .034, 360);
  }
  window.setTimeout(stopWheelSound, durationMs + 260);
  return true;
}

export function playEliminationSound() {
  const context = readyContext();
  if (!context) return false;
  const now = context.currentTime;
  kick(now, .115);
  const drop = tone(260, now, .28, .09, "square");
  drop.oscillator.frequency.exponentialRampToValueAtTime(68, now + .25);
  noise(now + .025, .18, .09, 620);
  return true;
}

export function playWinnerSound() {
  stopWheelSound();
  const context = readyContext();
  if (!context) return false;
  const startedAt = context.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    tone(frequency, startedAt + index * .13, index === 3 ? .74 : .23, index === 3 ? .17 : .10, index === 3 ? "sine" : "triangle");
  });
  [0, .26, .52].forEach((offset) => noise(startedAt + offset, .07, .045, 2100));
  kick(startedAt + .4, .09);
  return true;
}

export function playSoundTest() {
  if (!readyContext()) return false;
  playButtonSound();
  window.setTimeout(() => playRaceSound(1450), 120);
  window.setTimeout(playWinnerSound, 1700);
  return true;
}

function playAmbientPhrase() {
  const context = readyContext();
  if (!ambientEnabled || !context) return;
  const start = context.currentTime + .02;
  const melody = [392, 466.16, 523.25, 466.16, 440, 392, 349.23, 392];
  melody.forEach((frequency, index) => {
    const at = start + index * .43;
    tone(frequency, at, .31, .055, index % 3 === 0 ? "triangle" : "sine", musicGain, false);
    if (index % 2 === 0) noise(at, .055, .018, 2700, musicGain, false);
    if (index % 4 === 0) kick(at, .045, musicGain, false);
  });
  [0, 4].forEach((index) => tone(index ? 130.81 : 146.83, start + index * .43, .58, .045, "triangle", musicGain, false));
}

export function setAmbientMusic(enabled) {
  const nextEnabled = Boolean(enabled);
  if (nextEnabled === ambientEnabled && Boolean(ambientTimer) === nextEnabled) return;
  ambientEnabled = nextEnabled;
  window.clearInterval(ambientTimer);
  ambientTimer = undefined;
  if (!ambientEnabled) return;
  playAmbientPhrase();
  ambientTimer = window.setInterval(playAmbientPhrase, 3900);
}
