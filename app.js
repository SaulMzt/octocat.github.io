import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, QUESTIONS_COLLECTION } from "./firebase-config.js";

const form = document.querySelector("#questionForm");
const identityMode = document.querySelector("#identityMode");
const nameGroup = document.querySelector("#nameGroup");
const participantName = document.querySelector("#participantName");
const questionText = document.querySelector("#questionText");
const submitButton = document.querySelector("#submitButton");
const statusMessage = document.querySelector("#statusMessage");

let db;

function hasFirebaseConfig() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("TU_");
}

function setStatus(message, tone = "success") {
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

function initFirebase() {
  if (!hasFirebaseConfig()) {
    setStatus("Configura Firebase para activar el envío en tiempo real.", "error");
    submitButton.disabled = true;
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

identityMode.addEventListener("change", () => {
  const showName = identityMode.value === "named";
  nameGroup.classList.toggle("is-hidden", !showName);
  participantName.required = showName;
  if (!showName) {
    participantName.value = "";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!db) {
    setStatus("Configura Firebase para activar el envío en tiempo real.", "error");
    return;
  }

  const question = questionText.value.trim();
  const name = identityMode.value === "named" ? participantName.value.trim() : "";

  if (!question) {
    setStatus("Escribe tu pregunta antes de enviarla.", "error");
    questionText.focus();
    return;
  }

  if (identityMode.value === "named" && !name) {
    setStatus("Escribe tu nombre para mostrarlo.", "error");
    participantName.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    await addDoc(collection(db, QUESTIONS_COLLECTION), {
      name: name || "Anónimo",
      question,
      answered: false,
      createdAt: serverTimestamp(),
      localCreatedAt: new Date().toISOString()
    });

    form.reset();
    nameGroup.classList.add("is-hidden");
    participantName.required = false;
    setStatus("Gracias por compartirnos tu pregunta");
  } catch (error) {
    console.error(error);
    setStatus("No pudimos enviar la pregunta. Inténtalo de nuevo.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar pregunta";
  }
});

initFirebase();
