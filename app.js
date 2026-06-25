import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { firebaseConfig, QUESTIONS_COLLECTION } from "./firebase-config.js";

const form = document.querySelector("#questionForm");
const identityMode = document.querySelector("#identityMode");
const nameGroup = document.querySelector("#nameGroup");
const participantName = document.querySelector("#participantName");
const questionText = document.querySelector("#questionText");
const submitButton = document.querySelector("#submitButton");
const statusMessage = document.querySelector("#statusMessage");
const submitButtonLabel = submitButton.querySelector("span");

let firebaseReady = false;

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

  initializeApp(firebaseConfig);
  firebaseReady = true;
}

async function saveQuestion({ name, question }) {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${QUESTIONS_COLLECTION}?key=${firebaseConfig.apiKey}`;
  const sentAt = new Date().toISOString();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields: {
        name: { stringValue: name || "Anónimo" },
        question: { stringValue: question },
        answered: { booleanValue: false },
        createdAt: { timestampValue: sentAt },
        localCreatedAt: { stringValue: sentAt }
      }
    })
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const firebaseMessage = details?.error?.message || "No se pudo guardar en Firestore.";
    const reason = details?.error?.details?.[0]?.reason;
    if (reason === "SERVICE_DISABLED") {
      throw new Error("Activa Cloud Firestore API y crea la base de datos Firestore en Firebase.");
    }
    throw new Error(firebaseMessage);
  }
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

  if (!firebaseReady) {
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
  submitButtonLabel.textContent = "Enviando...";

  try {
    await saveQuestion({ name, question });
    form.reset();
    nameGroup.classList.add("is-hidden");
    participantName.required = false;
    setStatus("Gracias por compartirnos tu pregunta");
  } catch (error) {
    console.error(error);
    setStatus(`No pudimos enviar la pregunta: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButtonLabel.textContent = "Enviar pregunta";
  }
});

initFirebase();
