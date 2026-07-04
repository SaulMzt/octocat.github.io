import { ADMIN_PASSWORD_HASH } from "./firebase-config.js";
import { getAllQuestions, toggleAnswered as localToggle, removeQuestion as localRemove, resetAll, subscribe } from "./local-db.js";

const loginView = document.querySelector("#loginView");
const adminView = document.querySelector("#adminView");
const loginForm = document.querySelector("#loginForm");
const adminPassword = document.querySelector("#adminPassword");
const loginMessage = document.querySelector("#loginMessage");

const rainBoard = document.querySelector("#rainBoard");
const quizBoard = document.querySelector("#quizBoard");

const totalCount = document.querySelector("#totalCount");
const pendingCount = document.querySelector("#pendingCount");
const quizCount = document.querySelector("#quizCount");

const diceButton = document.querySelector("#diceButton");
const diceCube = document.querySelector("#diceCube");
const resetButton = document.querySelector("#resetButton");
const winnerOverlay = document.querySelector("#winnerOverlay");
const winnerQuestion = document.querySelector("#winnerQuestion");
const winnerMeta = document.querySelector("#winnerMeta");
const closeWinner = document.querySelector("#closeWinner");

const quizAdminBtn = document.querySelector("#quizAdminBtn");
const quizConfigOverlay = document.querySelector("#quizConfigOverlay");
const closeQuizConfig = document.querySelector("#closeQuizConfig");
const endQuizBtn = document.querySelector("#endQuizBtn");
const correctAnswerInput = document.querySelector("#correctAnswer");
const podiumOverlay = document.querySelector("#podiumOverlay");
const closePodium = document.querySelector("#closePodium");
const podiumName1 = document.querySelector("#podiumName1");
const podiumName2 = document.querySelector("#podiumName2");
const podiumName3 = document.querySelector("#podiumName3");
const correctAnswersList = document.querySelector("#correctAnswersList");
const incorrectAnswersList = document.querySelector("#incorrectAnswersList");
const chartCorrect = document.querySelector("#chartCorrect");
const chartIncorrect = document.querySelector("#chartIncorrect");
const txtCorrectCount = document.querySelector("#txtCorrectCount");
const txtIncorrectCount = document.querySelector("#txtIncorrectCount");

let questions = [];
let unsubscribe = null;
let selectedWinnerId = null;
let rouletteAudio = null;

function formatTime(value, fallback) {
  const date = new Date(value || fallback || Date.now());
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()??]/g, "")
    .trim();
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function renderQuestions() {
  rainBoard.innerHTML = "";
  quizBoard.innerHTML = "";

  const soloPreguntas = questions.filter(q => q.docType !== "quiz");
  const soloQuizz = questions.filter(q => q.docType === "quiz");

  if (!soloPreguntas.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Esperando preguntas...";
    rainBoard.append(emptyState);
  }

  soloPreguntas.forEach((item) => {
    const card = document.createElement("article");
    card.className = `question-card${item.answered ? " is-answered" : ""}`;

    const name = document.createElement("strong");
    name.textContent = item.name || "Anónimo";

    const question = document.createElement("p");
    question.textContent = item.question;

    const meta = document.createElement("span");
    meta.textContent = formatTime(item.createdAt, item.localCreatedAt);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const answeredButton = document.createElement("button");
    answeredButton.type = "button";
    answeredButton.className = "mini-button";
    answeredButton.textContent = item.answered ? "Pendiente" : "Respondida";
    answeredButton.addEventListener("click", () => toggleAnswered(item));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mini-button danger";
    deleteButton.textContent = "Eliminar";
    deleteButton.addEventListener("click", () => removeQuestion(item.id));

    actions.append(answeredButton, deleteButton);
    card.append(name, question, meta, actions);
    rainBoard.append(card);
  });

  if (!soloQuizz.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Esperando respuestas...";
    quizBoard.append(emptyState);
  }

  soloQuizz.forEach((item) => {
    const card = document.createElement("article");
    card.className = "question-card quiz-card";

    const name = document.createElement("strong");
    name.textContent = item.name || "Anónimo";

    const question = document.createElement("p");
    question.textContent = item.question;

    const meta = document.createElement("span");
    meta.textContent = formatTime(item.createdAt, item.localCreatedAt);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mini-button danger";
    deleteButton.textContent = "Eliminar";
    deleteButton.addEventListener("click", () => removeQuestion(item.id));

    actions.append(deleteButton);
    card.append(name, question, meta, actions);
    quizBoard.append(card);
  });

  const answered = soloPreguntas.filter((item) => item.answered).length;
  totalCount.textContent = soloPreguntas.length;
  pendingCount.textContent = soloPreguntas.length - answered;
  quizCount.textContent = soloQuizz.length;
}

function listenForQuestions() {
  unsubscribe = subscribe((data) => {
    questions = data;
    renderQuestions();
  });
}

async function toggleAnswered(item) {
  localToggle(item.id);
}

async function removeQuestion(id) {
  localRemove(id);
}

function startRouletteSound() {
  if (rouletteAudio) {
    rouletteAudio.stop();
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  context.resume();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.04;
  masterGain.connect(context.destination);

  let step = 0;
  const playTick = () => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 420 + (step % 8) * 34;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.45, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.075);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.085);
    step += 1;
  };

  playTick();
  const timer = window.setInterval(playTick, 95);

  rouletteAudio = {
    stop() {
      window.clearInterval(timer);
      masterGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
      window.setTimeout(() => context.close(), 140);
      rouletteAudio = null;
    }
  };

  return rouletteAudio;
}

async function resetSession() {
  if (!confirm("¿Reiniciar la sesión y eliminar todas las preguntas y respuestas?")) return;
  resetAll();
}

function pickWinner() {
  const soloPreguntas = questions.filter(q => q.docType !== "quiz");
  const available = soloPreguntas.filter((item) => !item.answered);
  const pool = available.length ? available : soloPreguntas;

  if (!pool.length) {
    alert("No hay preguntas disponibles para sortear.");
    return;
  }

  selectedWinnerId = null;
  diceButton.disabled = true;
  diceCube.classList.add("is-rolling");
  diceButton.classList.add("is-rolling");
  const sound = startRouletteSound();

  const shuffleTimer = window.setInterval(() => {
    const preview = pool[Math.floor(Math.random() * pool.length)];
    winnerQuestion.textContent = preview.question;
    winnerMeta.textContent = `${preview.name || "Anónimo"} • ${formatTime(preview.createdAt, preview.localCreatedAt)}`;
    winnerOverlay.classList.remove("is-hidden");
    winnerOverlay.classList.add("is-drawing");
  }, 120);

  window.setTimeout(() => {
    window.clearInterval(shuffleTimer);
    if (sound) sound.stop();
    const winner = pool[Math.floor(Math.random() * pool.length)];
    selectedWinnerId = winner.id;
    winnerQuestion.textContent = winner.question;
    winnerMeta.textContent = `${winner.name || "Anónimo"} • ${formatTime(winner.createdAt, winner.localCreatedAt)}`;
    winnerOverlay.classList.remove("is-drawing");
    winnerOverlay.classList.add("is-winner");
    diceCube.classList.remove("is-rolling");
    diceButton.classList.remove("is-rolling");
    diceButton.disabled = false;
  }, 2200);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const passwordHash = await sha256(adminPassword.value);

  if (passwordHash !== ADMIN_PASSWORD_HASH) {
    loginMessage.textContent = "Contraseña incorrecta.";
    loginMessage.dataset.tone = "error";
    return;
  }

  loginView.classList.add("is-hidden");
  adminView.classList.remove("is-hidden");
  listenForQuestions();
});

diceButton.addEventListener("click", pickWinner);
resetButton.addEventListener("click", resetSession);
closeWinner.addEventListener("click", async () => {
  closeWinner.disabled = true;
  try {
    if (selectedWinnerId) {
      await removeQuestion(selectedWinnerId);
      selectedWinnerId = null;
    }
    winnerOverlay.classList.add("is-hidden");
    winnerOverlay.classList.remove("is-winner", "is-drawing");
  } catch (error) {
    console.error(error);
    winnerMeta.textContent = "No se pudo eliminar la pregunta. Intenta cerrar otra vez.";
  } finally {
    closeWinner.disabled = false;
  }
});

quizAdminBtn.addEventListener("click", () => {
  correctAnswerInput.value = "";
  quizConfigOverlay.classList.remove("is-hidden");
});

closeQuizConfig.addEventListener("click", () => {
  quizConfigOverlay.classList.add("is-hidden");
});

closePodium.addEventListener("click", () => {
  podiumOverlay.classList.add("is-hidden");
});

endQuizBtn.addEventListener("click", () => {
  const correctStr = correctAnswerInput.value.trim();
  if(!correctStr) {
    alert("Ingresa una respuesta correcta para evaluar");
    return;
  }

  quizConfigOverlay.classList.add("is-hidden");

  const quizAnswers = questions.filter(q => q.docType === "quiz");
  const corrects = [];
  const incorrects = [];

  const normCorrect = normalizeText(correctStr);

  quizAnswers.forEach(ans => {
    const normUser = normalizeText(ans.question);
    if(normUser.includes(normCorrect) && normCorrect.length > 0) {
      corrects.push(ans);
    } else {
      incorrects.push(ans);
    }
  });

  corrects.sort((a, b) => new Date(a.localCreatedAt) - new Date(b.localCreatedAt));

  podiumName1.textContent = corrects[0] ? corrects[0].name : "Nadie";
  podiumName2.textContent = corrects[1] ? corrects[1].name : "Nadie";
  podiumName3.textContent = corrects[2] ? corrects[2].name : "Nadie";

  correctAnswersList.innerHTML = "";
  if (corrects.length === 0) {
    correctAnswersList.innerHTML = "<li style='list-style:none; color:var(--muted);'>Ningún participante acertó.</li>";
  } else {
    corrects.forEach((c, idx) => {
      const li = document.createElement("li");
      let suffix = ` (${idx + 1}º lugar)`;
      if (idx === 0) suffix = " (1er lugar)";
      else if (idx === 1) suffix = " (2do lugar)";
      else if (idx === 2) suffix = " (3er lugar)";
      li.innerHTML = `<strong>${c.name}</strong>${suffix} <span style="font-size:0.75rem; color:var(--muted); font-weight:normal;">- ${formatTime(c.createdAt, c.localCreatedAt)}</span>`;
      correctAnswersList.appendChild(li);
    });
  }

  incorrectAnswersList.innerHTML = "";
  if (incorrects.length === 0) {
    incorrectAnswersList.innerHTML = "<li style='list-style:none; color:var(--muted);'>¡No hubo respuestas incorrectas!</li>";
  } else {
    incorrects.forEach(inc => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${inc.name}</strong> respondió: <span style="color:#ff9e96;">"${inc.question}"</span>`;
      incorrectAnswersList.appendChild(li);
    });
  }

  const total = quizAnswers.length;
  const correctCount = corrects.length;
  const incorrectCount = incorrects.length;

  const pctCorrect = total === 0 ? 0 : (correctCount / total) * 100;
  const pctIncorrect = total === 0 ? 0 : (incorrectCount / total) * 100;

  chartCorrect.style.width = `${pctCorrect}%`;
  chartIncorrect.style.width = `${pctIncorrect}%`;
  txtCorrectCount.textContent = correctCount;
  txtIncorrectCount.textContent = incorrectCount;

  podiumOverlay.classList.remove("is-hidden");
});

window.addEventListener("beforeunload", () => {
  if (unsubscribe) unsubscribe();
});
