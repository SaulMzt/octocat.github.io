import { getRound, joinPresence, watchEntries, watchPresence, watchRound } from "./round-service.js";
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
let spinId = "";
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
  watchEntries(code, (list) => {
    entries = list;
    const activeEntries = entries.filter((entry) => entry.enabled);
    drawWheel(wheel, activeEntries);
    $("#roomWheelCount").textContent = activeEntries.length;
  }, connectionError);
  watchPresence(code, renderPresence, connectionError);
  watchRound(code, handleRound, connectionError);
}

function handleRound(nextRound) {
  if (!nextRound) return;
  round = nextRound;
  $("#roomTitle").textContent = round.title;
  $("#roomStatus").textContent = round.status === "SPINNING" ? "La ruleta está girando..." : round.status === "FINISHED" ? "Tenemos un ganador." : "Esperando a que el administrador inicie la ronda...";

  if (round.status === "SPINNING" && round.spin && spinId !== `${round.spin.spinNumber}-spinning`) {
    spinId = `${round.spin.spinNumber}-spinning`;
    wheelStage.classList.add("is-spinning");
    if (round.sound) playWheelSound(round.spin.durationMs);
    spinWheel(wheel, round.spin, () => { wheelStage.classList.remove("is-spinning"); stopWheelSound(); });
  }

  if (round.status === "FINISHED" && round.winner && spinId !== `${round.winner.spinNumber}-finished`) {
    spinId = `${round.winner.spinNumber}-finished`;
    wheelStage.classList.remove("is-spinning");
    stopWheelSound();
    showWinner(round.winner, round.confetti);
  }
}

function renderPresence(list) {
  const freshPeople = list.filter((person) => !person.lastSeen?.toMillis || Date.now() - person.lastSeen.toMillis() < 70000);
  $("#connectedCount").textContent = `${freshPeople.length} participante${freshPeople.length === 1 ? "" : "s"} conectado${freshPeople.length === 1 ? "" : "s"}`;
  $("#roomPresenceList").innerHTML = freshPeople.slice(0, 8).map((person) => `<li><span></span>${escapeHtml(person.name)}</li>`).join("");
}

function showWinner(winner, confetti) {
  $("#roomWinnerName").textContent = winner.winnerName;
  $("#roomWinnerDetail").textContent = `Giro #${winner.spinNumber}`;
  $("#roomWinnerOverlay").classList.remove("is-hidden");
  if (confetti) {
    sprinkle($("#roomConfettiLayer"));
    playWinnerSound();
  }
}

function sprinkle(layer) {
  layer.innerHTML = Array.from({ length: 52 }, (_, index) => `<i style="--x:${(index * 37) % 100}%;--d:${.7 + (index % 8) / 10}s;--r:${index * 29}deg"></i>`).join("");
}

function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }
function connectionError() { $("#roomStatus").textContent = "Reconectando..."; }

$("#roomCloseWinner").addEventListener("click", () => $("#roomWinnerOverlay").classList.add("is-hidden"));
window.addEventListener("beforeunload", () => { stopWheelSound(); leavePresence?.(); });
