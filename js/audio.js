let context, master, compressor, noiseBuffer, scheduler;
const channels = {};
const voices = new Set();
let volume = .72, effectsEnabled = true, musicEnabled = false, musicPhase = "idle";
let nextNote = 0, noteIndex = 0, raceEnd = 0, nextStep = 0, raceStart = 0, stepIndex = 0, lastUi = 0;
let wheelStart = 0, wheelEnd = 0, nextTick = 0;
const levels = { music: .42, effects: .7, monster: .72, players: .50, ui: .48 };
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));

function initialize() {
  if (context) return context;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  context = new AudioContext();
  master = context.createGain(); master.gain.value = volume;
  compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -15; compressor.knee.value = 18; compressor.ratio.value = 5;
  master.connect(compressor).connect(context.destination);
  for (const [name, gain] of Object.entries(levels)) {
    channels[name] = context.createGain(); channels[name].gain.value = name === "music" ? (musicEnabled ? gain : 0) : effectsEnabled ? gain : 0;
    channels[name].connect(master);
  }
  noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  return context;
}
function ready() { return context?.state === "running"; }
function remove(voice) {
  voices.delete(voice);
  try { voice.source.stop(); } catch {}
  voice.nodes.forEach(node => { try { node.disconnect(); } catch {} });
}
function stopCategories(categories) {
  [...voices].filter(voice => categories.includes(voice.category)).forEach(remove);
}
function voice(frequency, at, duration, gain, category = "effects", type = "triangle", endFrequency) {
  if (!ready() || (category === "music" ? !musicEnabled : !effectsEnabled) || volume === 0) return;
  if (voices.size >= 48) remove(voices.values().next().value);
  const source = type === "noise" ? context.createBufferSource() : context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  if (type === "noise") { source.buffer = noiseBuffer; filter.type = "bandpass"; filter.frequency.value = frequency; filter.Q.value = .7; }
  else { source.type = type; source.frequency.setValueAtTime(frequency, at); filter.type = "lowpass"; filter.frequency.value = 2300; if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, at + duration); }
  envelope.gain.setValueAtTime(.0001, at);
  envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), at + .012);
  envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
  source.connect(filter).connect(envelope).connect(channels[category]);
  const entry = { source, nodes: [source, filter, envelope], category };
  voices.add(entry); source.onended = () => remove(entry);
  source.start(at); source.stop(at + duration + .03);
}
function schedule() {
  if (!ready() || document.hidden) return;
  const now = context.currentTime;
  if (musicEnabled && nextNote < now + .12) {
    if (nextNote < now) nextNote = now + .02;
    const tension = musicPhase === "tension", chase = ["running", "walking", "tension"].includes(musicPhase);
    const melody = tension ? [293.66,311.13,440,415.3] : [293.66,349.23,440,587.33,554.37,440,349.23,277.18];
    const frequency = melody[noteIndex % melody.length];
    voice(frequency, nextNote, .55, .075, "music", "sine");
    voice(frequency * 2, nextNote + .015, .2, .018, "music", "triangle");
    if (noteIndex % 4 === 0) voice(noteIndex % 8 ? 110 : 146.83, nextNote, .9, .065, "music", "sine");
    if (chase && noteIndex % 2 === 0) voice(160, nextNote, .09, .075, "music", "triangle", 65);
    nextNote += tension ? .21 : chase ? .29 : .48; noteIndex++;
  }
  if (raceEnd > now && nextStep < now + .12) {
    if (nextStep < now) nextStep = now + .01;
    const progress = Math.min(1, (now - raceStart) / Math.max(.1, raceEnd - raceStart));
    voice(stepIndex % 2 ? 143 : 125, nextStep, .13, .15, "monster", "sine", 46);
    voice(1100, nextStep + .025, .055, .09, "players", "noise");
    if (stepIndex % 7 === 0) voice(91, nextStep, .35, .06, "monster", "sawtooth", 51);
    if (progress > .72 && stepIndex % 3 === 0) voice(67, nextStep + .09, .15, .12, "effects", "sine", 39);
    nextStep += .28 - progress * .12; stepIndex++;
  }
  if (wheelEnd > now && nextTick < now + .12) {
    if (nextTick < now) nextTick = now + .01;
    voice(790, nextTick, .04, .08, "effects", "triangle");
    nextTick += .09 + ((now - wheelStart) / Math.max(.1, wheelEnd - wheelStart)) ** 2 * .24;
  }
}
export async function unlockWheelSound() {
  try {
    if (!initialize()) return false;
    if (context.state !== "running") await context.resume();
    if (!scheduler) scheduler = setInterval(schedule, 80);
    return ready();
  } catch { return false; }
}
export function setMasterVolume(value) {
  volume = clamp(value);
  if (master) master.gain.setTargetAtTime(volume, context.currentTime, .025);
}
export function setEffectsEnabled(enabled) {
  effectsEnabled = Boolean(enabled);
  if (!context) return;
  for (const category of ["effects","monster","players","ui"]) channels[category].gain.setTargetAtTime(effectsEnabled ? levels[category] : 0, context.currentTime, .018);
  if (!effectsEnabled) stopCategories(["effects","monster","players","ui"]);
}
export function setAmbientMusic(enabled) {
  musicEnabled = Boolean(enabled);
  if (!context) return;
  channels.music.gain.setTargetAtTime(musicEnabled ? levels.music : 0, context.currentTime, .08);
  if (!musicEnabled) stopCategories(["music"]);
}
export function setMusicPhase(phase) { musicPhase = phase; }
export function stopWheelSound() { raceEnd = 0; wheelEnd = 0; stopCategories(["effects","monster","players"]); musicPhase = "idle"; }
export function playButtonSound() {
  if (!ready() || performance.now() - lastUi < 65) return false;
  lastUi = performance.now();
  voice(690,context.currentTime,.075,.09,"ui","sine",920); return true;
}
export function playCountdownSound(step) {
  if (!ready()) return;
  voice(step ? 440 : 880,context.currentTime,.14,.13,"effects","triangle");
}
export function playRaceSound(durationMs = 7000) {
  stopWheelSound();
  if (!ready()) return false;
  raceStart = context.currentTime; raceEnd = raceStart + durationMs / 1000;
  nextStep = raceStart; stepIndex = 0; musicPhase = "running"; playCountdownSound(0); return true;
}
export function playWheelSound(durationMs = 7000) {
  stopWheelSound(); if (!ready()) return false;
  wheelStart = context.currentTime; wheelEnd = wheelStart + durationMs / 1000; nextTick = wheelStart;
  return true;
}
export function playEliminationSound() {
  if (!ready()) return false;
  const now = context.currentTime;
  voice(230,now,.17,.12,"monster","triangle",62);
  voice(850,now+.025,.09,.16,"monster","noise");
  voice(500,now+.06,.16,.055,"players","sine",190); return true;
}
export function playWinnerSound() {
  stopWheelSound(); if (!ready()) return false;
  const at = context.currentTime;
  [293.66,349.23,440,587.33,880].forEach((note,i) => {
    voice(note,at+i*.115,i===4?.8:.25,.14,"effects","triangle");
    voice(note*2,at+i*.115+.045,.22,.035,"effects","sine");
  });
  voice(1800,at+.44,.23,.07,"effects","noise"); return true;
}
export function playSoundTest() {
  if (!ready()) return false;
  playWinnerSound(); return true;
}
export function audioDiagnostics() { return { state: context?.state || "uninitialized", voices: voices.size, categories: Object.keys(channels), volume, effectsEnabled, musicEnabled, musicPhase }; }
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopCategories(["music", "effects", "monster", "players", "ui"]);
  else { nextNote = 0; }
});
window.addEventListener("pagehide", () => { clearInterval(scheduler); scheduler = undefined; [...voices].forEach(remove); context?.suspend(); });
window.addEventListener("pageshow", () => { if (context && !scheduler) scheduler = setInterval(schedule,80); });
