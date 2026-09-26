import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebase-service.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const asData = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
export const normalizeCode = (code) => String(code || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
const randomUint32 = () => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
};
const randomIndex = (length) => {
  const upperBound = 0x100000000 - (0x100000000 % length);
  let value;
  do { value = randomUint32(); } while (value >= upperBound);
  return value % length;
};
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[randomIndex(ALPHABET.length)]).join("");

export async function hashText(value) { const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
export async function createRound({ title }) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = newCode(); const ref = doc(db, "rounds", code);
    if ((await getDoc(ref)).exists()) continue;
    const token = crypto.randomUUID().replace(/-/g, "");
    await setDoc(ref, { code, title: title.trim(), status: "WAITING", createdAt: serverTimestamp(), updatedAt: serverTimestamp(), removeWinner: true, durationMs: 7000, sound: true, music: true, volume: 0.72, confetti: true, questionMode: false, questionStatus: null, questionSpin: null, questionWinner: null, questionSpinCount: 0, adminKeyHash: await hashText(token), spin: null, winner: null, spinCount: 0 });
    sessionStorage.setItem(`ronda-admin-${code}`, token); return code;
  }
  throw new Error("No pudimos generar un código único. Inténtalo otra vez.");
}
export async function isRoundAdmin(round) { const token = sessionStorage.getItem(`ronda-admin-${round.code}`); return Boolean(token && round.adminKeyHash === await hashText(token)); }
export async function getRound(code) { const snap = await getDoc(doc(db, "rounds", normalizeCode(code))); return snap.exists() ? asData(snap) : null; }
export const watchRound = (code, callback, error) => onSnapshot(doc(db, "rounds", code), (snap) => callback(snap.exists() ? asData(snap) : null), error);
export const watchEntries = (code, callback, error) => onSnapshot(query(collection(db, "rounds", code, "entries"), orderBy("position")), (snap) => callback(snap.docs.map(asData).filter((item) => item.kind !== "question")), error);
export const watchQuestions = (code, callback, error) => onSnapshot(query(collection(db, "rounds", code, "entries"), orderBy("position")), (snap) => callback(snap.docs.map(asData).filter((item) => item.kind === "question")), error);
export const watchHistory = (code, callback, error) => onSnapshot(query(collection(db, "rounds", code, "history"), orderBy("spinNumber", "desc")), (snap) => callback(snap.docs.map(asData)), error);
export const watchPresence = (code, callback, error) => onSnapshot(collection(db, "rounds", code, "presence"), (snap) => callback(snap.docs.map(asData)), error);
export async function addEntry(code, name, position) { const clean = String(name || "").trim(); if (clean) await addDoc(collection(db, "rounds", code, "entries"), { name: clean.slice(0, 100), kind: "entry", enabled: true, position, createdAt: serverTimestamp() }); }
export async function addEntries(code, names, startPosition) { const batch = writeBatch(db); names.filter(Boolean).forEach((name, index) => batch.set(doc(collection(db, "rounds", code, "entries")), { name: String(name).trim().slice(0, 100), kind: "entry", enabled: true, position: startPosition + index, createdAt: serverTimestamp() })); await batch.commit(); }
export async function addQuestion(code, text, position) { const clean = String(text || "").trim(); if (clean) await addDoc(collection(db, "rounds", code, "entries"), { name: clean.slice(0, 360), kind: "question", enabled: true, position, createdAt: serverTimestamp() }); }
export async function addQuestions(code, questions, startPosition) { const batch = writeBatch(db); questions.filter(Boolean).forEach((text, index) => batch.set(doc(collection(db, "rounds", code, "entries")), { name: String(text).trim().slice(0, 360), kind: "question", enabled: true, position: startPosition + index, createdAt: serverTimestamp() })); await batch.commit(); }
async function replaceTypedList(code, kind, values, maxLength) { const listRef = collection(db, "rounds", code, "entries"); const snapshots = await getDocs(listRef); const matchingDocs = snapshots.docs.filter((snapshot) => kind === "question" ? snapshot.data().kind === "question" : snapshot.data().kind !== "question"); for (let index = 0; index < matchingDocs.length; index += 400) { const batch = writeBatch(db); matchingDocs.slice(index, index + 400).forEach((snapshot) => batch.delete(snapshot.ref)); await batch.commit(); } const cleanValues = values.map((value) => String(value || "").trim()).filter(Boolean); for (let index = 0; index < cleanValues.length; index += 400) { const batch = writeBatch(db); cleanValues.slice(index, index + 400).forEach((value, offset) => batch.set(doc(listRef), { name: value.slice(0, maxLength), kind, enabled: true, position: index + offset, createdAt: serverTimestamp() })); await batch.commit(); } }
export const replaceEntries = (code, names) => replaceTypedList(code, "entry", names, 100);
export const replaceQuestions = (code, questions) => replaceTypedList(code, "question", questions, 360);
export const updateEntry = (code, id, values) => updateDoc(doc(db, "rounds", code, "entries", id), values);
export const removeEntry = (code, id) => deleteDoc(doc(db, "rounds", code, "entries", id));
export const updateQuestion = (code, id, values) => updateDoc(doc(db, "rounds", code, "entries", id), values);
export const removeQuestion = (code, id) => deleteDoc(doc(db, "rounds", code, "entries", id));
export async function reorderEntry(code, entries, index, direction) { const otherIndex = index + direction; if (otherIndex < 0 || otherIndex >= entries.length) return; const batch = writeBatch(db); batch.update(doc(db, "rounds", code, "entries", entries[index].id), { position: entries[otherIndex].position }); batch.update(doc(db, "rounds", code, "entries", entries[otherIndex].id), { position: entries[index].position }); await batch.commit(); }
export async function reorderQuestion(code, questions, index, direction) { const otherIndex = index + direction; if (otherIndex < 0 || otherIndex >= questions.length) return; const batch = writeBatch(db); batch.update(doc(db, "rounds", code, "entries", questions[index].id), { position: questions[otherIndex].position }); batch.update(doc(db, "rounds", code, "entries", questions[otherIndex].id), { position: questions[index].position }); await batch.commit(); }
export const updateRound = (code, changes) => updateDoc(doc(db, "rounds", code), { ...changes, updatedAt: serverTimestamp() });
export async function retireHistoricalWinners(code) {
  const [historySnapshot, entriesSnapshot] = await Promise.all([
    getDocs(collection(db, "rounds", code, "history")),
    getDocs(collection(db, "rounds", code, "entries"))
  ]);
  const winnerIds = new Set(historySnapshot.docs.map((snapshot) => snapshot.data().winnerId).filter(Boolean));
  const retiredEntries = entriesSnapshot.docs.filter((snapshot) => winnerIds.has(snapshot.id) && !snapshot.data().retired);
  for (let index = 0; index < retiredEntries.length; index += 400) {
    const batch = writeBatch(db);
    retiredEntries.slice(index, index + 400).forEach((snapshot) => batch.update(snapshot.ref, { enabled: false, retired: true, retiredAt: Timestamp.now() }));
    await batch.commit();
  }
}
export async function startSpin(round, entries) {
  const available = entries.filter(entry => entry.enabled && !entry.retired);
  if (!available.length) throw new Error("Agrega participantes activos para iniciar la persecución.");
  const index = randomIndex(available.length), winner = available[index];
  const ref = doc(db, "rounds", round.code);
  return runTransaction(db, async transaction => {
    const live = (await transaction.get(ref)).data();
    const selected = (await transaction.get(doc(db, "rounds", round.code, "entries", winner.id))).data();
    if (!live || live.status === "SPINNING" || ["WAITING", "SPINNING"].includes(live.questionStatus)) throw new Error("Ya hay una selección en curso.");
    if (!selected?.enabled || selected.retired) throw new Error("La lista cambió. Vuelve a iniciar la persecución.");
    const spinNumber = (live.spinCount || 0) + 1;
    const spin = { winnerId: winner.id, winnerName: selected.name, targetIndex: index, total: available.length, visualSeed: randomUint32(), startedAt: Timestamp.now(), countdownMs: 2100, durationMs: live.durationMs || 7000, spinNumber };
    transaction.update(ref, { status: "SPINNING", spin, winner: null, spinCount: spinNumber, questionStatus: null, questionSpin: null, questionWinner: null, updatedAt: serverTimestamp() });
    return spin;
  });
}
export async function finishSpin(round) {
  if (!round.spin) return;
  const ref = doc(db, "rounds", round.code);
  await runTransaction(db, async transaction => {
    const live = (await transaction.get(ref)).data();
    if (live?.status !== "SPINNING" || live.spin?.spinNumber !== round.spin.spinNumber) return;
    const spin = live.spin;
    const winnerRef = doc(db, "rounds", round.code, "entries", spin.winnerId);
    const winner = await transaction.get(winnerRef);
    transaction.set(doc(db, "rounds", round.code, "history", `spin-${spin.spinNumber}`), { winnerId: spin.winnerId, winnerName: spin.winnerName, spinNumber: spin.spinNumber, createdAt: serverTimestamp() });
    if (winner.exists()) transaction.update(winnerRef, { enabled: false, retired: true, retiredAt: Timestamp.now() });
    transaction.update(ref, { status: "FINISHED", winner: { ...spin, finishedAt: Timestamp.now() }, questionStatus: live.questionMode ? "WAITING" : null, questionSpin: null, questionWinner: null, updatedAt: serverTimestamp() });
  });
}
export async function startQuestionSpin(round, questions) { const available = questions.filter((question) => question.enabled && !question.retired); if (!available.length) throw new Error("Agrega al menos una pregunta activa."); const index = randomIndex(available.length); const question = available[index]; const roundRef = doc(db, "rounds", round.code); let questionSpin; await runTransaction(db, async (transaction) => { const snapshot = await transaction.get(roundRef); const liveRound = snapshot.data(); const selected = (await transaction.get(doc(db, "rounds", round.code, "entries", question.id))).data(); if (!selected?.enabled || selected.retired) throw new Error("La pregunta ya fue seleccionada. Vuelve a intentarlo."); if (!liveRound?.questionMode || liveRound.questionStatus !== "WAITING" || !liveRound.winner) throw new Error("La ruleta de preguntas ya fue iniciada o no está disponible."); const spinNumber = (liveRound.questionSpinCount || 0) + 1; questionSpin = { winnerId: question.id, winnerName: question.name, targetIndex: index, total: available.length, visualSeed: randomUint32(), startedAt: Timestamp.now(), durationMs: liveRound.durationMs || 7000, spinNumber }; transaction.update(roundRef, { questionStatus: "SPINNING", questionSpin, questionWinner: null, questionSpinCount: spinNumber, updatedAt: serverTimestamp() }); }); return questionSpin; }
export async function finishQuestionSpin(round) {
  const questionSpin = round.questionSpin;
  if (!questionSpin) return;
  const ref = doc(db, "rounds", round.code);
  await runTransaction(db, async transaction => {
    const live = (await transaction.get(ref)).data();
    if (live?.questionStatus !== "SPINNING" || live.questionSpin?.spinNumber !== questionSpin.spinNumber) return;
    const questionRef = doc(db, "rounds", round.code, "entries", questionSpin.winnerId);
    const question = await transaction.get(questionRef);
    if (question.exists()) transaction.update(questionRef, { enabled: false, retired: true, retiredAt: Timestamp.now() });
    transaction.update(ref, { questionStatus: "FINISHED", questionWinner: { ...questionSpin, finishedAt: Timestamp.now() }, updatedAt: serverTimestamp() });
  });
}
export const removeHistoryItem = (code, id) => deleteDoc(doc(db, "rounds", code, "history", id));
export async function clearHistory(code) { const snapshots = await getDocs(collection(db, "rounds", code, "history")); const docs = snapshots.docs; for (let index = 0; index < docs.length; index += 450) { const batch = writeBatch(db); docs.slice(index, index + 450).forEach((snapshot) => batch.delete(snapshot.ref)); await batch.commit(); } }
export const resetRound = (code) => updateRound(code, { status: "WAITING", spin: null, winner: null, questionStatus: null, questionSpin: null, questionWinner: null });
export const skipQuestionRound = (code) => runTransaction(db, async transaction => {
  const ref = doc(db, "rounds", code);
  const round = (await transaction.get(ref)).data();
  if (round?.questionStatus !== "WAITING") return false;
  transaction.update(ref, { questionStatus: null, questionSpin: null, questionWinner: null, updatedAt: serverTimestamp() });
  return true;
});
export async function joinPresence(code, name) { const id = sessionStorage.getItem(`ronda-presence-${code}`) || crypto.randomUUID(); sessionStorage.setItem(`ronda-presence-${code}`, id); const ref = doc(db, "rounds", code, "presence", id); const save = () => setDoc(ref, { name: name.trim().slice(0, 80), joinedAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge: true }); await save(); const timer = window.setInterval(save, 25000); return () => { window.clearInterval(timer); deleteDoc(ref).catch(() => {}); }; }
