import { finishQuestionSpin, getRound, joinPresence, startQuestionSpin, watchEntries, watchPresence, watchQuestions, watchRound } from "./round-service.js?v=20260919-4";
import { playButtonSound, playEliminationSound, playRaceSound, playWheelSound, playWinnerSound, setAmbientMusic, setMasterVolume, stopWheelSound, unlockWheelSound } from "./wheel-sound.js";
import { drawWheel, spinWheel } from "./wheel.js";
import { renderRace, runRace, showRaceWinner, stopRace } from "./race.js?v=20260919-4";

const code = new URLSearchParams(location.search).get("code")?.toUpperCase();
const $ = (selector) => document.querySelector(selector);
const joinView = $("#joinRoomView");
const roomView = $("#roomView");
const wheel = $("#roomWheel");
const wheelStage = $("#roomWheelStage");
const raceStage = $("#roomRaceStage");

let round;
let entries = [];
let questions = [];
let spinId = "";
let questionSpinId = "";
let leavePresence;
let localMuted = false;
let localVolume;

if (!code) location.replace("index.html");

getRound(code).then((foundRound) => {
  if (!foundRound || foundRound.status === "CLOSED") {
    $("#joinRoundTitle").textContent = "Esta ronda no está disponible";
    $("#roomJoinForm").classList.add("is-hidden");
    return;
  }
  round = foundRound;
  $("#joinRoundTitle").textContent = foundRound.title;
}).catch(() => { $("#joinRoundTitle").textContent = "No pudimos cargar la ronda"; });

$("#roomJoinForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("#guestName").value.trim();
  if (!name) return;
  try {
    await unlockWheelSound();
    leavePresence = await joinPresence(code, name);
    joinView.classList.add("is-hidden");
    roomView.classList.remove("is-hidden");
    startRoom();
  } catch {
    $("#roomJoinMessage").textContent = "No pudimos entrar. Revisa tu conexión e inténtalo de nuevo.";
    $("#roomJoinMessage").dataset.tone = "error";
  }
});

function startRoom() {
  $("#roomCode").textContent = code;
  watchEntries(code, (list) => { entries = list; renderSelectionStage(); }, connectionError);
  watchQuestions(code, (list) => { questions = list; renderSelectionStage(); }, connectionError);
  watchPresence(code, renderPresence, connectionError);
  watchRound(code, handleRound, connectionError);
}

function handleRound(nextRound) {
  if (!nextRound) return;
  round = nextRound;
  const effectiveVolume = localMuted ? 0 : (localVolume ?? round.volume ?? .72);
  setMasterVolume(effectiveVolume);
  setAmbientMusic(Boolean(round.sound !== false && round.music && !localMuted));
  if (localVolume === undefined) $("#roomVolume").value = Math.round((round.volume ?? .72) * 100);
  $("#roomTitle").textContent = round.title;
  $("#roomStatus").textContent = round.questionStatus === "WAITING" ? "La persona seleccionada puede girar por una pregunta." : round.questionStatus === "SPINNING" ? "La ruleta de preguntas está girando..." : round.status === "SPINNING" ? "El Pan de Muerto viene detrás del grupo..." : round.status === "FINISHED" ? "Alguien logró escapar." : "Esperando a que el administrador inicie la persecución...";
  renderSelectionStage();

  if (round.status === "SPINNING" && round.spin && spinId !== `${round.spin.spinNumber}-spinning`) {
    spinId = `${round.spin.spinNumber}-spinning`;
    runSpin(round.spin, false);
  }
  if (round.status === "FINISHED" && round.winner && spinId !== `${round.winner.spinNumber}-finished`) {
    spinId = `${round.winner.spinNumber}-finished`;
    stopWheelSound();
    showWinner(round.winner, round.confetti);
  }
  if (round.questionStatus === "SPINNING" && round.questionSpin && questionSpinId !== `${round.questionSpin.spinNumber}-spinning`) {
    $("#roomQuestionPrompt").classList.add("is-hidden");
    questionSpinId = `${round.questionSpin.spinNumber}-spinning`;
    runSpin(round.questionSpin, true);
  }
  if (round.questionStatus === "FINISHED" && round.questionWinner && questionSpinId !== `${round.questionWinner.spinNumber}-finished`) {
    questionSpinId = `${round.questionWinner.spinNumber}-finished`;
    stopWheelSound();
    showQuestionResult(round.questionWinner, round.confetti);
  }
}

function isQuestionWheelActive() { return Boolean(round?.questionMode && ["WAITING", "SPINNING"].includes(round.questionStatus)); }
function renderSelectionStage() {
  const showingQuestions = isQuestionWheelActive();
  wheelStage.classList.toggle("is-hidden", !showingQuestions);
  raceStage.classList.toggle("is-hidden", showingQuestions);
  if (showingQuestions) {
    const items = questions.filter((item) => item.enabled);
    drawWheel(wheel, items);
    $("#roomWheelCount").textContent = items.length;
  } else if (!raceStage.classList.contains("is-running")) {
    renderRace(raceStage, entries);
  }
}

function runSpin(spin, questionSpin) {
  if (questionSpin) {
    wheelStage.classList.add("is-spinning");
    if (round.sound !== false && !localMuted) playWheelSound(spin.durationMs);
    spinWheel(wheel, spin, () => {
      wheelStage.classList.remove("is-spinning");
      stopWheelSound();
      finishQuestionAfterSpin();
    });
    return;
  }
  if (round.sound !== false && !localMuted) playRaceSound(spin.durationMs);
  runRace(raceStage, entries, spin, { onCatch: round.sound !== false && !localMuted ? playEliminationSound : undefined });
}

function showWinner(winner, confetti) {
  showRaceWinner(raceStage, entries, winner);
  $("#roomWinnerName").textContent = winner.winnerName;
  $("#roomWinnerDetail").textContent = `Persecución #${winner.spinNumber}`;
  $("#roomWinnerOverlay").classList.remove("is-hidden");
  if (confetti) sprinkle($("#roomConfettiLayer"));
  if (round.sound !== false && !localMuted) playWinnerSound();
}

function showQuestionPrompt() {
  if (!round?.questionMode || round.questionStatus !== "WAITING") return;
  $("#roomQuestionPromptDetail").textContent = `${round.winner?.winnerName || "La persona seleccionada"} puede iniciar la segunda ruleta.`;
  $("#roomQuestionPrompt").classList.remove("is-hidden");
}

async function spinQuestion() {
  try {
    await unlockWheelSound();
    $("#roomQuestionPrompt").classList.add("is-hidden");
    const spin = await startQuestionSpin(round, questions);
    const spinKey = `${spin.spinNumber}-spinning`;
    if (questionSpinId !== spinKey) {
      questionSpinId = spinKey;
      runSpin(spin, true);
    }
  } catch (error) {
    $("#roomQuestionPromptDetail").textContent = error.message || "No se pudo girar la ruleta de preguntas.";
    $("#roomQuestionPrompt").classList.remove("is-hidden");
  }
}

function finishQuestionAfterSpin() {
  window.setTimeout(async () => {
    const freshRound = await getRound(code);
    if (freshRound?.questionStatus === "SPINNING") await finishQuestionSpin(freshRound);
  }, 180);
}

function showQuestionResult(question, confetti) {
  setAdaptiveQuestionText($("#roomQuestionResultText"), question.winnerName);
  $("#roomQuestionResult").classList.remove("is-hidden");
  if (confetti) sprinkle($("#roomQuestionConfetti"));
  if (round.sound !== false && !localMuted) playWinnerSound();
}

function setAdaptiveQuestionText(element, text) {
  element.textContent = text;
  element.classList.toggle("long-question", text.length > 105);
  element.classList.toggle("very-long-question", text.length > 175);
}

function renderPresence(list) {
  const freshPeople = list.filter((person) => !person.lastSeen?.toMillis || Date.now() - person.lastSeen.toMillis() < 70000);
  $("#connectedCount").textContent = `${freshPeople.length} participante${freshPeople.length === 1 ? "" : "s"} conectado${freshPeople.length === 1 ? "" : "s"}`;
  $("#roomPresenceList").innerHTML = freshPeople.slice(0, 8).map((person) => `<li><span></span>${escapeHtml(person.name)}</li>`).join("");
}

function sprinkle(layer) { layer.innerHTML = Array.from({ length: 52 }, (_, index) => `<i style="--x:${(index * 37) % 100}%;--d:${.7 + (index % 8) / 10}s;--r:${index * 29}deg"></i>`).join(""); }
function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
function connectionError() { $("#roomStatus").textContent = "Reconectando..."; }

$("#roomCloseWinner").addEventListener("click", () => { $("#roomWinnerOverlay").classList.add("is-hidden"); window.requestAnimationFrame(showQuestionPrompt); });
$("#roomQuestionSpinButton").addEventListener("click", spinQuestion);
$("#roomCloseQuestionResult").addEventListener("click", () => $("#roomQuestionResult").classList.add("is-hidden"));
$("#roomAudioToggle").addEventListener("click", async () => { await unlockWheelSound(); localMuted = !localMuted; $("#roomAudioToggle").textContent = localMuted ? "×" : "♪"; $("#roomAudioToggle").setAttribute("aria-label", localMuted ? "Activar audio" : "Silenciar audio"); setMasterVolume(localMuted ? 0 : (localVolume ?? round?.volume ?? .72)); setAmbientMusic(Boolean(round?.sound !== false && round?.music && !localMuted)); if (!localMuted) playButtonSound(); });
$("#roomVolume").addEventListener("input", async (event) => { await unlockWheelSound(); localVolume = Number(event.target.value) / 100; localMuted = false; $("#roomAudioToggle").textContent = "♪"; setMasterVolume(localVolume); if (round?.sound !== false) playButtonSound(); });
document.addEventListener("click", (event) => { if (round?.sound !== false && !localMuted && event.target.closest("button")) playButtonSound(); });
document.addEventListener("pointerdown", () => unlockWheelSound(), { once: true });
document.addEventListener("keydown", () => unlockWheelSound(), { once: true });
window.addEventListener("beforeunload", () => { stopWheelSound(); stopRace(raceStage); setAmbientMusic(false); leavePresence?.(); });
