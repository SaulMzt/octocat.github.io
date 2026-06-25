import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { ADMIN_PASSWORD_HASH, firebaseConfig, QUESTIONS_COLLECTION } from "./firebase-config.js";

const loginView = document.querySelector("#loginView");
const adminView = document.querySelector("#adminView");
const loginForm = document.querySelector("#loginForm");
const adminPassword = document.querySelector("#adminPassword");
const loginMessage = document.querySelector("#loginMessage");
const rainBoard = document.querySelector("#rainBoard");
const totalCount = document.querySelector("#totalCount");
const pendingCount = document.querySelector("#pendingCount");
const answeredCount = document.querySelector("#answeredCount");
const diceButton = document.querySelector("#diceButton");
const diceCube = document.querySelector("#diceCube");
const resetButton = document.querySelector("#resetButton");
const winnerOverlay = document.querySelector("#winnerOverlay");
const winnerQuestion = document.querySelector("#winnerQuestion");
const winnerMeta = document.querySelector("#winnerMeta");
const closeWinner = document.querySelector("#closeWinner");

let db;
let questions = [];
let unsubscribe = null;
let firebaseReady = false;
let selectedWinnerId = null;
let rouletteAudio = null;

function hasFirebaseConfig() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("TU_");
}

function initFirebase() {
  if (!hasFirebaseConfig()) {
    loginMessage.textContent = "Configura Firebase antes de abrir el panel.";
    loginMessage.dataset.tone = "error";
    return false;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  firebaseReady = true;
  return true;
}

function formatTime(value, fallback) {
  const date = value?.toDate ? value.toDate() : new Date(fallback || Date.now());
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function cardPosition(index) {
  const lane = index % 5;
  const top = 8 + lane * 15 + Math.random() * 8;
  const left = 3 + Math.random() * 82;
  const duration = 13 + Math.random() * 9;
  return { top, left, duration };
}

function renderQuestions() {
  rainBoard.innerHTML = "";

  if (!questions.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Esperando preguntas...";
    rainBoard.append(emptyState);
  }

  questions.forEach((item, index) => {
    const position = cardPosition(index);
    const card = document.createElement("article");
    card.className = `question-card${item.answered ? " is-answered" : ""}`;
    card.style.setProperty("--top", `${position.top}%`);
    card.style.setProperty("--left", `${position.left}%`);
    card.style.setProperty("--float-duration", `${position.duration}s`);

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

  const answered = questions.filter((item) => item.answered).length;
  totalCount.textContent = questions.length;
  answeredCount.textContent = answered;
  pendingCount.textContent = questions.length - answered;
}

function listenForQuestions() {
  const questionsQuery = query(collection(db, QUESTIONS_COLLECTION), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(questionsQuery, (snapshot) => {
    questions = snapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data()
    }));
    renderQuestions();
  }, (error) => {
    console.error(error);
    rainBoard.innerHTML = "";
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "No se pudo conectar con Firestore. Revisa la configuración y las reglas.";
    rainBoard.append(emptyState);
  });
}

async function toggleAnswered(item) {
  await updateDoc(doc(db, QUESTIONS_COLLECTION, item.id), {
    answered: !item.answered
  });
}

async function removeQuestion(id) {
  await deleteDoc(doc(db, QUESTIONS_COLLECTION, id));
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
  if (!confirm("¿Reiniciar la sesión y eliminar todas las preguntas?")) return;

  const snapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
  const batch = writeBatch(db);
  snapshot.forEach((entry) => batch.delete(entry.ref));
  await batch.commit();
}

function pickWinner() {
  const available = questions.filter((item) => !item.answered);
  const pool = available.length ? available : questions;

  if (!pool.length) return;

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

  if (!firebaseReady) {
    loginMessage.textContent = "Configura Firebase antes de abrir el panel.";
    loginMessage.dataset.tone = "error";
    return;
  }

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

window.addEventListener("beforeunload", () => {
  if (unsubscribe) unsubscribe();
});

initFirebase();
