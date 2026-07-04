import { saveQuestion as localSave, getAllQuestions } from "./local-db.js";

const form = document.querySelector("#questionForm");
const identityMode = document.querySelector("#identityMode");
const nameGroup = document.querySelector("#nameGroup");
const participantName = document.querySelector("#participantName");
const questionText = document.querySelector("#questionText");
const submitButton = document.querySelector("#submitButton");
const statusMessage = document.querySelector("#statusMessage");
const submitButtonLabel = submitButton.querySelector("#submitLabel");
const tabQuestion = document.querySelector("#tabQuestion");
const tabQuiz = document.querySelector("#tabQuiz");
const currentModeInput = document.querySelector("#currentMode");
const identityWrapper = document.querySelector("#identityWrapper");
const textLabel = document.querySelector("#textLabel");
const tabsContainer = document.querySelector(".tabs-container");
const quizSuccessBlock = document.querySelector("#quizSuccessBlock");
const nextChallengeBtn = document.querySelector("#nextChallengeBtn");

if (tabQuestion && tabQuiz) {
  tabQuestion.addEventListener("click", () => {
    tabQuestion.classList.add("is-active");
    tabQuiz.classList.remove("is-active");
    currentModeInput.value = "question";
    identityWrapper.classList.remove("is-hidden");
    textLabel.textContent = "Pregunta";
    questionText.placeholder = "Escribe aquí tu pregunta";
    submitButtonLabel.textContent = "Enviar pregunta";
    identityMode.dispatchEvent(new Event("change"));
  });

  tabQuiz.addEventListener("click", () => {
    tabQuiz.classList.add("is-active");
    tabQuestion.classList.remove("is-active");
    currentModeInput.value = "quiz";
    identityWrapper.classList.add("is-hidden");
    nameGroup.classList.remove("is-hidden");
    participantName.required = true;
    textLabel.textContent = "Respuesta";
    questionText.placeholder = "Escribe aquí tu respuesta";
    submitButtonLabel.textContent = "Enviar respuesta";
  });
}

function setStatus(message, tone = "success") {
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
}

function saveQuestion({ name, question, docType }) {
  localSave({ name, question, mode: docType || currentModeInput.value });
}

identityMode.addEventListener("change", () => {
  if (currentModeInput.value === "quiz") return;
  const showName = identityMode.value === "named";
  nameGroup.classList.toggle("is-hidden", !showName);
  participantName.required = showName;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const mode = currentModeInput.value;
  const question = questionText.value.trim();
  const name = (mode === "quiz" || identityMode.value === "named") ? participantName.value.trim() : "";

  if (!question) {
    setStatus(mode === "quiz" ? "Escribe tu respuesta antes de enviarla." : "Escribe tu pregunta antes de enviarla.", "error");
    questionText.focus();
    return;
  }

  if ((mode === "quiz" || identityMode.value === "named") && !name) {
    setStatus("Escribe tu nombre para mostrarlo.", "error");
    participantName.focus();
    return;
  }

  submitButton.disabled = true;
  submitButtonLabel.textContent = "Enviando...";

  try {
    saveQuestion({ name, question, docType: mode });
    if (mode === "quiz") {
      form.classList.add("is-hidden");
      if (tabsContainer) tabsContainer.classList.add("is-hidden");
      if (quizSuccessBlock) quizSuccessBlock.classList.remove("is-hidden");
      setStatus("");
    } else {
      questionText.value = "";
      setStatus("Gracias por compartirnos tu pregunta");
    }
  } catch (error) {
    console.error(error);
    setStatus(`No pudimos enviar la información: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButtonLabel.textContent = mode === "quiz" ? "Enviar respuesta" : "Enviar pregunta";
  }
});

if (nextChallengeBtn) {
  nextChallengeBtn.addEventListener("click", () => {
    questionText.value = "";
    if (quizSuccessBlock) quizSuccessBlock.classList.add("is-hidden");
    form.classList.remove("is-hidden");
    if (tabsContainer) tabsContainer.classList.remove("is-hidden");
    setStatus("");
    questionText.focus();
  });
}
