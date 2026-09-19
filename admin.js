import { ADMIN_PASSWORD_HASH } from "./firebase-config.js";
import {
  addEntries, addEntry, addQuestion, addQuestions, clearHistory, createRound, finishQuestionSpin,
  finishSpin, getRound, hashText, isRoundAdmin, removeEntry, removeHistoryItem, removeQuestion,
  reorderEntry, reorderQuestion, replaceEntries, replaceQuestions, resetRound, startQuestionSpin, startSpin, updateEntry, updateQuestion,
  updateRound, watchEntries, watchHistory, watchPresence, watchQuestions, watchRound
} from "./round-service.js";
import { readPublishedSheet, readSpreadsheet, valuesForColumn } from "./import-service.js";
import { deleteProfile, deleteQuestionProfile, getProfiles, getQuestionProfiles, renameProfile, renameQuestionProfile, saveProfile, saveQuestionProfile } from "./profiles.js";
import { playWheelSound, playWinnerSound, stopWheelSound, unlockWheelSound } from "./wheel-sound.js";
import { drawWheel, spinWheel } from "./wheel.js";

const $ = (selector) => document.querySelector(selector);
const wheel = $("#adminWheel");
const wheelStage = $("#adminWheelStage");
const wheelDock = $("#wheelDock");
const fullscreenOverlay = $("#wheelFullscreen");
const fullscreenMount = $("#fullscreenWheelMount");

let currentRound = null;
let entries = [];
let questions = [];
let imported = null;
let spinStarted = "";
let questionSpinStarted = "";
let finishTimer = null;
let unsubscribers = [];

function setMessage(message, tone = "") {
  const target = $("#spinMessage");
  target.textContent = message;
  target.dataset.tone = tone;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function stopWatching() {
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
}

async function authenticate(event) {
  event.preventDefault();
  const submittedHash = await hashText($("#adminPassword").value);
  if (submittedHash !== ADMIN_PASSWORD_HASH) {
    $("#loginMessage").textContent = "La contraseña no es correcta.";
    $("#loginMessage").dataset.tone = "error";
    return;
  }
  sessionStorage.setItem("ronda-control-access", "true");
  showAdmin();
}

function showAdmin() {
  $("#adminLogin").classList.add("is-hidden");
  $("#adminApp").classList.remove("is-hidden");
  renderProfiles();
  renderQuestionProfiles();
  const existingCode = sessionStorage.getItem("ronda-current-admin");
  if (existingCode) loadRound(existingCode);
}

async function createNewRound(event) {
  event.preventDefault();
  const title = $("#roundTitle").value.trim();
  if (!title) return;
  const button = event.submitter;
  button.disabled = true;
  try {
    const code = await createRound({ title, removeWinner: $("#removeWinner").checked });
    sessionStorage.setItem("ronda-current-admin", code);
    await loadRound(code);
  } catch (error) {
    $("#createMessage").textContent = error.message || "No pudimos crear la ronda.";
    $("#createMessage").dataset.tone = "error";
  } finally {
    button.disabled = false;
  }
}

async function loadRound(code) {
  const foundRound = await getRound(code);
  if (!foundRound || !await isRoundAdmin(foundRound)) {
    sessionStorage.removeItem("ronda-current-admin");
    $("#createMessage").textContent = "Esta sesión ya no tiene acceso administrativo a esa ronda.";
    return;
  }

  currentRound = foundRound;
  stopWatching();
  $("#roundSetup").classList.add("is-hidden");
  $("#roundDashboard").classList.remove("is-hidden");
  $("#roundCodeDisplay").textContent = code;
  $("#dashboardTitle").textContent = foundRound.title;
  $("#durationSelect").value = foundRound.durationMs || 7000;
  $("#soundToggle").checked = Boolean(foundRound.sound);
  $("#confettiToggle").checked = foundRound.confetti !== false;
  $("#questionModeToggle").checked = Boolean(foundRound.questionMode);
  setQuestionPanelVisible(Boolean(foundRound.questionMode));

  unsubscribers = [
    watchRound(code, handleRoundUpdate, connectionError),
    watchEntries(code, renderEntries, connectionError),
    watchQuestions(code, renderQuestions, questionConnectionError),
    watchPresence(code, renderPresence, connectionError),
    watchHistory(code, renderHistory, connectionError)
  ];
}

function handleRoundUpdate(round) {
  if (!round) return;
  currentRound = round;
  $("#dashboardTitle").textContent = round.title;
  $("#roundState").textContent = stateLabel(round.status);
  const questionWaiting = round.questionMode && round.questionStatus === "WAITING";
  const questionSpinning = round.questionStatus === "SPINNING";
  $("#spinButton").disabled = round.status === "SPINNING" || questionSpinning;
  $("#spinButton").textContent = questionWaiting ? "GIRAR PREGUNTA" : "GIRAR RULETA";
  $("#fullscreenSpinButton").disabled = round.status === "SPINNING" || questionSpinning;
  $("#fullscreenSpinButton").textContent = questionWaiting ? "GIRAR PREGUNTA" : "GIRAR RULETA";
  $("#stageHint").textContent = hintFor(round.status);
  $("#questionModeToggle").checked = Boolean(round.questionMode);
  setQuestionPanelVisible(Boolean(round.questionMode));
  renderWheel();

  if (round.status === "SPINNING" && round.spin && spinStarted !== `${round.spin.spinNumber}-spinning`) {
    spinStarted = `${round.spin.spinNumber}-spinning`;
    runSpin(round.spin, round.sound, true);
  }

  if (round.status === "FINISHED" && round.winner && spinStarted !== `${round.winner.spinNumber}-finished`) {
    spinStarted = `${round.winner.spinNumber}-finished`;
    stopWheelSound();
    showWinner(round.winner, round.confetti);
  }

  if (round.questionStatus === "SPINNING" && round.questionSpin && questionSpinStarted !== `${round.questionSpin.spinNumber}-spinning`) {
    $("#questionPromptOverlay").classList.add("is-hidden");
    $("#fullscreenWinner").classList.add("is-hidden");
    questionSpinStarted = `${round.questionSpin.spinNumber}-spinning`;
    runQuestionSpin(round.questionSpin, round.sound);
  }

  if (round.questionStatus === "FINISHED" && round.questionWinner && questionSpinStarted !== `${round.questionWinner.spinNumber}-finished`) {
    questionSpinStarted = `${round.questionWinner.spinNumber}-finished`;
    stopWheelSound();
    showQuestionResult(round.questionWinner, round.confetti);
  }
}

function runSpin(spin, soundEnabled, completeRound) {
  wheelStage.classList.add("is-spinning");
  if (soundEnabled) playWheelSound(spin.durationMs);
  spinWheel(wheel, spin, () => {
    wheelStage.classList.remove("is-spinning");
    stopWheelSound();
    if (completeRound) finishAfterSpin();
  });
}

function runQuestionSpin(spin, soundEnabled) {
  wheelStage.classList.add("is-spinning");
  if (soundEnabled) playWheelSound(spin.durationMs);
  spinWheel(wheel, spin, () => {
    wheelStage.classList.remove("is-spinning");
    stopWheelSound();
    finishQuestionAfterSpin();
  });
}

function renderEntries(list) {
  entries = list;
  $("#entryCount").textContent = entries.length;
  $("#entryList").innerHTML = entries.map((entry, index) => `
    <li class="entry-row ${entry.enabled ? "" : "disabled"}">
      <button class="entry-enable" data-action="toggle" data-id="${entry.id}" title="${entry.enabled ? "Desactivar" : "Activar"}" aria-label="${entry.enabled ? "Desactivar" : "Activar"}"></button>
      <span>${escapeHtml(entry.name)}</span>
      <div class="entry-actions">
        <button data-action="up" data-index="${index}" class="entry-action" title="Subir" aria-label="Subir">↑</button>
        <button data-action="down" data-index="${index}" class="entry-action" title="Bajar" aria-label="Bajar">↓</button>
        <button data-action="edit" data-id="${entry.id}" class="entry-action" title="Editar" aria-label="Editar">✎</button>
        <button data-action="delete" data-id="${entry.id}" class="entry-action delete" title="Eliminar" aria-label="Eliminar">×</button>
      </div>
    </li>`).join("") || "<li class=\"empty-list\">Aún no hay opciones.</li>";
}

function renderQuestions(list) {
  questions = list;
  $("#questionCount").textContent = questions.length;
  $("#questionList").innerHTML = questions.map((question, index) => `
    <li class="question-row ${question.enabled ? "" : "disabled"}">
      <button class="entry-enable" data-question-action="toggle" data-question-id="${question.id}" title="${question.enabled ? "Desactivar" : "Activar"}" aria-label="${question.enabled ? "Desactivar" : "Activar"}"></button>
      <span>${escapeHtml(question.name)}</span>
      <div class="entry-actions">
        <button data-question-action="up" data-question-index="${index}" class="entry-action" title="Subir" aria-label="Subir">↑</button>
        <button data-question-action="down" data-question-index="${index}" class="entry-action" title="Bajar" aria-label="Bajar">↓</button>
        <button data-question-action="edit" data-question-id="${question.id}" class="entry-action" title="Editar" aria-label="Editar">✎</button>
        <button data-question-action="delete" data-question-id="${question.id}" class="entry-action delete" title="Eliminar" aria-label="Eliminar">×</button>
      </div>
    </li>`).join("") || "<li class=\"empty-list\">Añade las preguntas para la segunda ruleta.</li>";
  renderWheel();
}

function isQuestionWheelActive() {
  return Boolean(currentRound?.questionMode && ["WAITING", "SPINNING", "FINISHED"].includes(currentRound.questionStatus));
}

function renderWheel() {
  const showingQuestions = isQuestionWheelActive();
  const items = (showingQuestions ? questions : entries).filter((item) => item.enabled);
  drawWheel(wheel, items);
  $("#wheelCount").textContent = items.length;
  $("#wheelKind").textContent = showingQuestions ? "preguntas" : "opciones";
}

function setQuestionPanelVisible(show) {
  $("#questionsPanel").classList.toggle("is-hidden", !show);
}

function renderPresence(list) {
  const freshPeople = list.filter((person) => !person.lastSeen?.toMillis || Date.now() - person.lastSeen.toMillis() < 70000);
  $("#presenceCount").textContent = freshPeople.length;
  $("#presenceList").innerHTML = freshPeople.map((person) => `<li><span></span>${escapeHtml(person.name)}</li>`).join("") || "<li class=\"empty-list\">Todavía no hay participantes.</li>";
}

function renderHistory(list) {
  $("#historyList").innerHTML = list.map((winner) => `
    <li>
      <span class="history-trophy">🏆</span>
      <div><strong>${escapeHtml(winner.winnerName)}</strong><small>Giro #${winner.spinNumber}${winner.createdAt ? ` · ${winner.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</small></div>
      <button class="history-delete" data-history-id="${winner.id}" title="Eliminar del historial" aria-label="Eliminar ${escapeHtml(winner.winnerName)} del historial">×</button>
    </li>`).join("") || "<li class=\"empty-list\">Los ganadores aparecerán aquí.</li>";
}

async function addSingleEntry(event) {
  event.preventDefault();
  await addEntry(currentRound.code, $("#entryName").value, entries.length);
  $("#entryName").value = "";
}

async function handleEntryAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const entry = entries.find((item) => item.id === button.dataset.id);
  if (action === "toggle" && entry) await updateEntry(currentRound.code, entry.id, { enabled: !entry.enabled });
  if (action === "delete" && entry && confirm(`¿Eliminar a ${entry.name}?`)) await removeEntry(currentRound.code, entry.id);
  if (action === "edit" && entry) {
    const name = prompt("Nombre de la opción", entry.name);
    if (name?.trim()) await updateEntry(currentRound.code, entry.id, { name: name.trim().slice(0, 100) });
  }
  if (["up", "down"].includes(action)) await reorderEntry(currentRound.code, entries, Number(button.dataset.index), action === "up" ? -1 : 1);
}

async function addSingleQuestion(event) {
  event.preventDefault();
  try {
    await addQuestion(currentRound.code, $("#questionEntryText").value, questions.length);
    $("#questionEntryText").value = "";
  } catch (error) {
    reportQuestionError(error);
  }
}

async function handleQuestionAction(event) {
  const button = event.target.closest("button[data-question-action]");
  if (!button) return;
  const action = button.dataset.questionAction;
  const question = questions.find((item) => item.id === button.dataset.questionId);
  if (action === "toggle" && question) await updateQuestion(currentRound.code, question.id, { enabled: !question.enabled });
  if (action === "delete" && question && confirm("¿Eliminar esta pregunta?")) await removeQuestion(currentRound.code, question.id);
  if (action === "edit" && question) {
    const text = prompt("Texto de la pregunta", question.name);
    if (text?.trim()) await updateQuestion(currentRound.code, question.id, { name: text.trim().slice(0, 360) });
  }
  if (["up", "down"].includes(action)) await reorderQuestion(currentRound.code, questions, Number(button.dataset.questionIndex), action === "up" ? -1 : 1);
}

function renderProfiles(selectedId) {
  const profiles = getProfiles();
  const select = $("#profileSelect");
  const currentId = selectedId || select.value || profiles[0]?.id;
  select.innerHTML = profiles.map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)}${profile.locked ? " · predefinido" : ""}</option>`).join("");
  select.value = profiles.some((profile) => profile.id === currentId) ? currentId : profiles[0]?.id;
  updateProfileActions();
}

function selectedProfile() { return getProfiles().find((profile) => profile.id === $("#profileSelect").value); }
function updateProfileActions() {
  const profile = selectedProfile();
  const disabled = !profile || profile.locked;
  $("#profileRenameButton").disabled = disabled;
  $("#profileDeleteButton").disabled = disabled;
}

async function loadSelectedProfile() {
  const profile = selectedProfile();
  if (!profile) return;
  if (entries.length && !confirm(`¿Reemplazar la lista actual con el perfil “${profile.name}”?`)) return;
  await replaceEntries(currentRound.code, profile.entries);
  setMessage(`Perfil “${profile.name}” cargado. La lista anterior fue reemplazada.`);
}

function saveCurrentProfile() {
  const names = entries.map((entry) => entry.name);
  if (!names.length) { setMessage("Agrega opciones antes de guardar un perfil.", "error"); return; }
  const name = prompt("Nombre para este perfil", "Mi lista");
  if (!name?.trim()) return;
  const profile = saveProfile(name, names);
  renderProfiles(profile.id);
  setMessage(`Perfil “${profile.name}” guardado.`);
}

function renameSelectedProfile() {
  const profile = selectedProfile();
  if (!profile || profile.locked) return;
  const name = prompt("Nuevo nombre del perfil", profile.name);
  if (!name?.trim()) return;
  renameProfile(profile.id, name);
  renderProfiles(profile.id);
}

function deleteSelectedProfile() {
  const profile = selectedProfile();
  if (!profile || profile.locked || !confirm(`¿Eliminar el perfil “${profile.name}”?`)) return;
  deleteProfile(profile.id);
  renderProfiles();
}

function renderQuestionProfiles(selectedId) {
  const profiles = getQuestionProfiles();
  const select = $("#questionProfileSelect");
  const currentId = selectedId || select.value || profiles[0]?.id;
  select.innerHTML = profiles.map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)}${profile.locked ? " · predefinido" : ""}</option>`).join("");
  select.value = profiles.some((profile) => profile.id === currentId) ? currentId : profiles[0]?.id;
  updateQuestionProfileActions();
}

function selectedQuestionProfile() { return getQuestionProfiles().find((profile) => profile.id === $("#questionProfileSelect").value); }
function updateQuestionProfileActions() {
  const profile = selectedQuestionProfile();
  const disabled = !profile || profile.locked;
  $("#questionProfileRenameButton").disabled = disabled;
  $("#questionProfileDeleteButton").disabled = disabled;
}

async function loadSelectedQuestionProfile() {
  const profile = selectedQuestionProfile();
  if (!profile) return;
  if (questions.length && !confirm(`¿Reemplazar las preguntas actuales con el perfil “${profile.name}”?`)) return;
  try {
    await replaceQuestions(currentRound.code, profile.entries);
    setMessage(`Perfil de preguntas “${profile.name}” cargado. La lista anterior fue reemplazada.`);
  } catch (error) {
    reportQuestionError(error);
  }
}

function saveCurrentQuestionProfile() {
  const texts = questions.map((question) => question.name);
  if (!texts.length) { setMessage("Agrega preguntas antes de guardar un perfil.", "error"); return; }
  const name = prompt("Nombre para este perfil de preguntas", "Mis preguntas");
  if (!name?.trim()) return;
  const profile = saveQuestionProfile(name, texts);
  renderQuestionProfiles(profile.id);
  setMessage(`Perfil de preguntas “${profile.name}” guardado.`);
}

function renameSelectedQuestionProfile() {
  const profile = selectedQuestionProfile();
  if (!profile || profile.locked) return;
  const name = prompt("Nuevo nombre del perfil de preguntas", profile.name);
  if (!name?.trim()) return;
  renameQuestionProfile(profile.id, name);
  renderQuestionProfiles(profile.id);
}

function deleteSelectedQuestionProfile() {
  const profile = selectedQuestionProfile();
  if (!profile || profile.locked || !confirm(`¿Eliminar el perfil de preguntas “${profile.name}”?`)) return;
  deleteQuestionProfile(profile.id);
  renderQuestionProfiles();
}

function reportQuestionError(error) {
  const permissionError = error?.code === "permission-denied" || /permission/i.test(error?.message || "");
  setMessage(permissionError ? "Firebase bloqueó las preguntas. Publica la versión actual de firestore.rules y vuelve a intentarlo." : (error?.message || "No se pudo actualizar la lista de preguntas."), "error");
  console.error(error);
}

async function openSpreadsheet(file) {
  imported = await readSpreadsheet(file);
  openImportDialog();
}

function openImportDialog() {
  const select = $("#importColumn");
  select.innerHTML = imported.columns.map((column, index) => `<option value="${index}">${escapeHtml(column)}</option>`).join("");
  select.onchange = renderImportPreview;
  renderImportPreview();
  $("#importDialog").showModal();
}

function renderImportPreview() {
  const values = valuesForColumn(imported, Number($("#importColumn").value));
  $("#importSummary").textContent = `Se encontraron ${values.length} registros en la columna seleccionada.`;
  $("#importPreview").innerHTML = values.slice(0, 12).map((value) => `<span>${escapeHtml(value)}</span>`).join("");
  $("#importConfirmButton").textContent = `Importar ${values.length} registros`;
}

async function startRoundSpin() {
  if (currentRound?.questionMode && currentRound.questionStatus === "WAITING") {
    await startQuestionRoundSpin();
    return;
  }
  try {
    await unlockWheelSound();
    setMessage("Preparando el giro para toda la sala...");
    const spin = await startSpin(currentRound, entries);
    spinStarted = `${spin.spinNumber}-spinning`;
    runSpin(spin, currentRound.sound, true);
  } catch (error) {
    setMessage(error.message || "No se pudo iniciar el giro.", "error");
  }
}

function startFullscreenSpin() {
  if (currentRound?.questionMode && currentRound.questionStatus === "WAITING") {
    startQuestionRoundSpin();
    return;
  }
  startRoundSpin();
}

function finishAfterSpin() {
  clearTimeout(finishTimer);
  finishTimer = window.setTimeout(async () => {
    const freshRound = await getRound(currentRound.code);
    if (freshRound?.status === "SPINNING") await finishSpin(freshRound);
  }, 180);
}

async function startQuestionRoundSpin() {
  try {
    await unlockWheelSound();
    $("#questionPromptOverlay").classList.add("is-hidden");
    const questionSpin = await startQuestionSpin(currentRound, questions);
    questionSpinStarted = `${questionSpin.spinNumber}-spinning`;
    runQuestionSpin(questionSpin, currentRound.sound);
  } catch (error) {
    setMessage(error.message || "No se pudo iniciar la ruleta de preguntas.", "error");
  }
}

function finishQuestionAfterSpin() {
  clearTimeout(finishTimer);
  finishTimer = window.setTimeout(async () => {
    const freshRound = await getRound(currentRound.code);
    if (freshRound?.questionStatus === "SPINNING") await finishQuestionSpin(freshRound);
  }, 180);
}

function showWinner(winner, confettiEnabled) {
  if (fullscreenOverlay.contains(wheelStage)) {
    showFullscreenResult("TENEMOS GANADOR", winner.winnerName, "Continuar", "winner", confettiEnabled);
    return;
  }
  $("#winnerName").textContent = winner.winnerName;
  $("#winnerDetail").textContent = `Giro #${winner.spinNumber}`;
  $("#winnerOverlay").classList.remove("is-hidden");
  if (confettiEnabled) {
    sprinkle($("#confettiLayer"));
    playWinnerSound();
  }
}

function showQuestionPrompt() {
  if (!currentRound?.questionMode || currentRound.questionStatus !== "WAITING") return;
  if (fullscreenOverlay.contains(wheelStage)) {
    showFullscreenResult("SEGUNDA RULETA", "Ahora gira por una pregunta", "GIRAR PREGUNTA", "question-prompt", false);
    return;
  }
  $("#questionPromptDetail").textContent = `${currentRound.winner?.winnerName || "La persona seleccionada"} elegirá el siguiente tema.`;
  $("#questionPromptOverlay").classList.remove("is-hidden");
}

function showQuestionResult(question, confettiEnabled) {
  if (fullscreenOverlay.contains(wheelStage)) {
    showFullscreenResult("PREGUNTA SELECCIONADA", question.winnerName, "Continuar", "question-result", confettiEnabled);
    return;
  }
  $("#questionResultText").textContent = question.winnerName;
  $("#questionResultOverlay").classList.remove("is-hidden");
  if (confettiEnabled) {
    sprinkle($("#questionConfettiLayer"));
    playWinnerSound();
  }
}

function showFullscreenResult(label, text, buttonText, mode, confettiEnabled) {
  $("#fullscreenWinnerLabel").textContent = label;
  $("#fullscreenWinnerName").textContent = text;
  $("#fullscreenWinnerContinue").textContent = buttonText;
  $("#fullscreenWinnerContinue").dataset.mode = mode;
  $("#fullscreenWinner").classList.remove("is-hidden");
  if (confettiEnabled) {
    sprinkle($("#fullscreenConfettiLayer"));
    playWinnerSound();
  }
}

function continueFromFullscreenResult() {
  const button = $("#fullscreenWinnerContinue");
  const mode = button.dataset.mode;
  $("#fullscreenWinner").classList.add("is-hidden");
  if (mode === "winner") showQuestionPrompt();
  if (mode === "question-prompt") startQuestionRoundSpin();
}

function sprinkle(layer) {
  layer.innerHTML = Array.from({ length: 52 }, (_, index) => `<i style="--x:${(index * 37) % 100}%;--d:${0.7 + (index % 8) / 10}s;--r:${index * 29}deg"></i>`).join("");
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => setMessage("Copiado al portapapeles.")).catch(() => setMessage("No pudimos copiar automáticamente.", "error"));
}

function openFullscreenWheel() {
  fullscreenOverlay.classList.remove("is-hidden");
  fullscreenMount.append(wheelStage);
  document.body.classList.add("wheel-mode");
  fullscreenOverlay.requestFullscreen?.().catch(() => {});
}

function closeFullscreenWheel() {
  if (fullscreenOverlay.contains(wheelStage)) wheelDock.append(wheelStage);
  fullscreenOverlay.classList.add("is-hidden");
  document.body.classList.remove("wheel-mode");
  if (document.fullscreenElement === fullscreenOverlay) document.exitFullscreen?.().catch(() => {});
}

function connectionError() {
  $("#connectionStatus").textContent = "Reconectando";
  $("#connectionStatus").dataset.status = "offline";
}

function questionConnectionError(error) {
  connectionError();
  reportQuestionError(error);
}

function stateLabel(status) { return ({ WAITING: "ESPERANDO", READY: "LISTA", SPINNING: "GIRANDO", FINISHED: "FINALIZADA" })[status] || status; }
function hintFor(status) { return ({ WAITING: "Configura las opciones para comenzar.", SPINNING: "Todos ven el mismo giro.", FINISHED: "Puedes volver a girar o reiniciar la ronda." })[status] || "La ronda está lista."; }

$("#loginForm").addEventListener("submit", authenticate);
$("#logoutButton").addEventListener("click", () => { stopWatching(); sessionStorage.removeItem("ronda-control-access"); location.reload(); });
$("#createRoundForm").addEventListener("submit", createNewRound);
$("#newRoundButton").addEventListener("click", () => { stopWatching(); sessionStorage.removeItem("ronda-current-admin"); currentRound = null; $("#roundDashboard").classList.add("is-hidden"); $("#roundSetup").classList.remove("is-hidden"); });
$("#addEntryForm").addEventListener("submit", addSingleEntry);
$("#entryList").addEventListener("click", handleEntryAction);
$("#addQuestionForm").addEventListener("submit", addSingleQuestion);
$("#questionList").addEventListener("click", (event) => handleQuestionAction(event).catch(reportQuestionError));
$("#profileSelect").addEventListener("change", updateProfileActions);
$("#profileLoadButton").addEventListener("click", loadSelectedProfile);
$("#profileSaveButton").addEventListener("click", saveCurrentProfile);
$("#profileRenameButton").addEventListener("click", renameSelectedProfile);
$("#profileDeleteButton").addEventListener("click", deleteSelectedProfile);
$("#questionProfileSelect").addEventListener("change", updateQuestionProfileActions);
$("#questionProfileLoadButton").addEventListener("click", loadSelectedQuestionProfile);
$("#questionProfileSaveButton").addEventListener("click", saveCurrentQuestionProfile);
$("#questionProfileRenameButton").addEventListener("click", renameSelectedQuestionProfile);
$("#questionProfileDeleteButton").addEventListener("click", deleteSelectedQuestionProfile);
$("#bulkOpenButton").addEventListener("click", () => $("#bulkDialog").showModal());
$("#bulkConfirmButton").addEventListener("click", async (event) => { event.preventDefault(); const names = $("#bulkText").value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean); if (names.length) await addEntries(currentRound.code, names, entries.length); $("#bulkText").value = ""; $("#bulkDialog").close(); });
$("#bulkQuestionsOpenButton").addEventListener("click", () => $("#bulkQuestionsDialog").showModal());
$("#bulkQuestionsConfirmButton").addEventListener("click", async (event) => { event.preventDefault(); const text = $("#bulkQuestionsText").value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean); try { if (text.length) await addQuestions(currentRound.code, text, questions.length); $("#bulkQuestionsText").value = ""; $("#bulkQuestionsDialog").close(); } catch (error) { reportQuestionError(error); } });
$("#excelFile").addEventListener("change", async (event) => { const file = event.target.files[0]; if (!file) return; try { await openSpreadsheet(file); } catch (error) { setMessage(error.message, "error"); } finally { event.target.value = ""; } });
$("#importConfirmButton").addEventListener("click", async (event) => { event.preventDefault(); await addEntries(currentRound.code, valuesForColumn(imported, Number($("#importColumn").value)), entries.length); $("#importDialog").close(); });
$("#sheetsOpenButton").addEventListener("click", () => $("#sheetsDialog").showModal());
$("#sheetPreviewButton").addEventListener("click", async (event) => { event.preventDefault(); try { imported = await readPublishedSheet($("#sheetUrl").value.trim()); $("#sheetsDialog").close(); openImportDialog(); } catch (error) { $("#sheetMessage").textContent = error.message; $("#sheetMessage").dataset.tone = "error"; } });
$("#spinButton").addEventListener("click", startRoundSpin);
$("#resetRoundButton").addEventListener("click", async () => { if (confirm("¿Reiniciar el estado de la ronda? La lista de opciones se conserva.")) await resetRound(currentRound.code); });
$("#historyList").addEventListener("click", async (event) => { const button = event.target.closest("[data-history-id]"); if (button && confirm("¿Eliminar este ganador del historial?")) await removeHistoryItem(currentRound.code, button.dataset.historyId); });
$("#clearHistoryButton").addEventListener("click", async () => { if (confirm("¿Borrar todo el historial de ganadores? Esta acción no se puede deshacer.")) await clearHistory(currentRound.code); });
$("#durationSelect").addEventListener("change", (event) => updateRound(currentRound.code, { durationMs: Number(event.target.value) }));
$("#soundToggle").addEventListener("change", async (event) => { currentRound.sound = event.target.checked; await unlockWheelSound(); await updateRound(currentRound.code, { sound: event.target.checked }); if (event.target.checked) playWheelSound(520); });
$("#confettiToggle").addEventListener("change", (event) => updateRound(currentRound.code, { confetti: event.target.checked }));
$("#questionModeToggle").addEventListener("change", async (event) => { currentRound.questionMode = event.target.checked; if (!event.target.checked) currentRound.questionStatus = null; setQuestionPanelVisible(event.target.checked); renderWheel(); await updateRound(currentRound.code, event.target.checked ? { questionMode: true } : { questionMode: false, questionStatus: null, questionSpin: null, questionWinner: null }); });
$("#copyCodeButton").addEventListener("click", () => copyText(currentRound.code));
$("#copyLinkButton").addEventListener("click", () => copyText(`${location.origin}${location.pathname.replace(/admin\.html$/, "")}room.html?code=${currentRound.code}`));
$("#closeWinnerButton").addEventListener("click", () => { $("#winnerOverlay").classList.add("is-hidden"); showQuestionPrompt(); });
$("#questionPromptSpinButton").addEventListener("click", startQuestionRoundSpin);
$("#closeQuestionResultButton").addEventListener("click", () => $("#questionResultOverlay").classList.add("is-hidden"));
$("#fullscreenButton").addEventListener("click", openFullscreenWheel);
$("#exitFullscreenButton").addEventListener("click", closeFullscreenWheel);
$("#fullscreenSpinButton").addEventListener("click", startFullscreenSpin);
$("#fullscreenWinnerContinue").addEventListener("click", continueFromFullscreenResult);
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && fullscreenOverlay.contains(wheelStage)) closeFullscreenWheel(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && fullscreenOverlay.contains(wheelStage)) closeFullscreenWheel(); });

if (sessionStorage.getItem("ronda-control-access")) showAdmin();
