let audioContext;
let activeNodes = [];

function getContext() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

export async function unlockWheelSound() {
  try {
    const context = getContext();
    if (context.state !== "running") await context.resume();
  } catch {
    // Browsers may block audio until the user has interacted with the page.
  }
}

export function stopWheelSound() {
  activeNodes.forEach(({ oscillator, source, gain }) => { try { (oscillator || source)?.stop(); gain.disconnect(); } catch {} });
  activeNodes = [];
}

export function playWheelSound(durationMs = 7000) {
  stopWheelSound();
  const context = getContext();
  if (context.state !== "running") return;
  const startedAt = context.currentTime;
  const duration = Math.max(0.8, durationMs / 1000);
  let elapsed = 0;

  const addTick = (delay, brightness) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(620 + brightness * 180, startedAt + delay);
    gain.gain.setValueAtTime(0.0001, startedAt + delay);
    gain.gain.exponentialRampToValueAtTime(0.055, startedAt + delay + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + delay + 0.035);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startedAt + delay);
    oscillator.stop(startedAt + delay + 0.05);
    activeNodes.push({ oscillator, gain });
  };

  while (elapsed < duration) {
    const progress = elapsed / duration;
    const interval = 0.045 + (progress * progress * 0.36);
    addTick(elapsed, 1 - progress);
    elapsed += interval;
  }
  window.setTimeout(stopWheelSound, durationMs + 180);
}

export function playWinnerSound() {
  stopWheelSound();
  const context = getContext();
  if (context.state !== "running") return;
  const startedAt = context.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const time = startedAt + index * 0.14;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === notes.length - 1 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(index === notes.length - 1 ? 0.11 : 0.075, time + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (index === notes.length - 1 ? 0.58 : 0.16));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + (index === notes.length - 1 ? 0.62 : 0.2));
    activeNodes.push({ oscillator, gain });
  });

  const buffer = context.createBuffer(1, context.sampleRate * 0.72, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    const envelope = Math.pow(1 - index / data.length, 3.4);
    data[index] = (Math.random() * 2 - 1) * envelope;
  }
  const source = context.createBufferSource();
  const gain = context.createGain();
  const shimmer = context.createBiquadFilter();
  source.buffer = buffer;
  shimmer.type = "highpass";
  shimmer.frequency.value = 2100;
  gain.gain.value = 0.075;
  source.connect(shimmer).connect(gain).connect(context.destination);
  source.start(startedAt + 0.22);
  activeNodes.push({ source, gain });

  window.setTimeout(stopWheelSound, 1250);
}
