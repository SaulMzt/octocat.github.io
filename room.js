import { finishQuestionSpin, getRound, joinPresence, startQuestionSpin, watchEntries, watchPresence, watchQuestions, watchRound } from "./round-service.js";
import { playWheelSound, playWinnerSound, stopWheelSound, unlockWheelSound } from "./wheel-sound.js";
import { drawWheel, spinWheel } from "./wheel.js";

const code = new URLSearchParams(location.search).get("code")?.toUpperCase();
const $ = (selector) => document.querySelector(selector);
const joinView = $("#joinRoomView");
const roomView = $("#roomView");
const wheel = $("#roomWheel");
const wheelStage = $("#roomWheelStage");

let round;
let entries = [];
let questions = [];
let spinId = "";
let questionSpinId = "";
let leavePresence;

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
  watchEntries(code, (list) => { entries = list; renderWheel(); }, connectionError);
  watchQuestions(code, (list) => { questions = list; renderWheel(); }, connectionError);
  watchPresence(code, renderPresence, connectionError);
  watchRound(code, handleRound, connectionError);
}

function handleRound(nextRound) {
  if (!nextRound) return;
  round = nextRound;
  $("#roomTitle").textContent = round.title;
  $("#roomStatus").textContent = round.questionStatus === "WAITING" ? "La persona seleccionada puede girar por una pregunta." : round.questionStatus === "SPINNING" ? "La ruleta de preguntas está girando..." : round.status === "SPINNING" ? "La ruleta está girando..." : round.status === "FINISHED" ? "Tenemos un ganador." : "Esperando a que el administrador inicie la ronda...";
  renderWheel();

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
function renderWheel() {
  const showingQuestions = isQuestionWheelActive();
  const items = (showingQuestions ? questions : entries).filter((item) => item.enabled);
  drawWheel(wheel, items);
  $("#roomWheelCount").textContent = items.length;
  $("#roomWheelKind").textContent = showingQuestions ? "preguntas" : "opciones";
}

function runSpin(spin, questionSpin) {
  wheelStage.classList.add("is-spinning");
  if (round.sound) playWheelSound(spin.durationMs);
  spinWheel(wheel, spin, () => {
    wheelStage.classList.remove("is-spinning");
    stopWheelSound();
    if (questionSpin) finishQuestionAfterSpin();
  });
}

function showWinner(winner, confetti) {
  $("#roomWinnerName").textContent = winner.winnerName;
  $("#roomWinnerDetail").textContent = `Giro #${winner.spinNumber}`;
  $("#roomWinnerOverlay").classList.remove("is-hidden");
  if (confetti) { sprinkle($("#roomConfettiLayer")); playWinnerSound(); }
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
    questionSpinId = `${spin.spinNumber}-spinning`;
    runSpin(spin, true);
  } catch (error) {
    $("#roomQuestionPromptDetail").textContent = error.message || "No se pudo girar la ruleta de preguntas.";
  }
}

function finishQuestionAfterSpin() {
  window.setTimeout(async () => {
    const freshRound = await getRound(code);
    if (freshRound?.questionStatus === "SPINNING") await finishQuestionSpin(freshRound);
  }, 180);
}

function showQuestionResult(question, confetti) {
  $("#roomQuestionResultText").textContent = question.winnerName;
  $("#roomQuestionResult").classList.remove("is-hidden");
  if (confetti) { sprinkle($("#roomQuestionConfetti")); playWinnerSound(); }
}

function renderPresence(list) {
  const freshPeople = list.filter((person) => !person.lastSeen?.toMillis || Date.now() - person.lastSeen.toMillis() < 70000);
  $("#connectedCount").textContent = `${freshPeople.length} participante${freshPeople.length === 1 ? "" : "s"} conectado${freshPeople.length === 1 ? "" : "s"}`;
  $("#roomPresenceList").innerHTML = freshPeople.slice(0, 8).map((person) => `<li><span></span>${escapeHtml(person.name)}</li>`).join("");
}

function sprinkle(layer) { layer.innerHTML = Array.from({ length: 52 }, (_, index) => `<i style="--x:${(index * 37) % 100}%;--d:${.7 + (index % 8) / 10}s;--r:${index * 29}deg"></i>`).join(""); }
function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
function connectionError() { $("#roomStatus").textContent = "Reconectando..."; }

$("#roomCloseWinner").addEventListener("click", () => { $("#roomWinnerOverlay").classList.add("is-hidden"); showQuestionPrompt(); });
$("#roomQuestionSpinButton").addEventListener("click", spinQuestion);
$("#roomCloseQuestionResult").addEventListener("click", () => $("#roomQuestionResult").classList.add("is-hidden"));
window.addEventListener("beforeunload", () => { stopWheelSound(); leavePresence?.(); });
