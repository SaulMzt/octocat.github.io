import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "./firebase-service.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const asData = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });
export const normalizeCode = (code) => String(code || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export async function hashText(value) { const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
export async function createRound({ title, removeWinner }) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = newCode(); const ref = doc(db, "rounds", code);
    if ((await getDoc(ref)).exists()) continue;
    const token = crypto.randomUUID().replace(/-/g, "");
    await setDoc(ref, { code, title: title.trim(), status: "WAITING", createdAt: serverTimestamp(), updatedAt: serverTimestamp(), removeWinner: Boolean(removeWinner), durationMs: 7000, sound: false, confetti: true, adminKeyHash: await hashText(token), spin: null, winner: null, spinCount: 0 });
    sessionStorage.setItem(`ronda-admin-${code}`, token); return code;
  }
  throw new Error("No pudimos generar un código único. Inténtalo otra vez.");
}
export async function isRoundAdmin(round) { const token = sessionStorage.getItem(`ronda-admin-${round.code}`); return Boolean(token && round.adminKeyHash === await hashText(token)); }
export async function getRound(code) { const snap = await getDoc(doc(db, "rounds", normalizeCode(code))); return snap.exists() ? asData(snap) : null; }
export const watchRound = (code, callback, error) => onSnapshot(doc(db, "rounds", code), (snap) => callback(snap.exists() ? asData(snap) : null), error);
export const watchEntries = (code, callback, error) => onSnapshot(query(collection(db, "rounds", code, "entries"), orderBy("position")), (snap) => callback(snap.docs.map(asData)), error);
export const watchHistory = (code, callback, error) => onSnapshot(query(collection(db, "rounds", code, "history"), orderBy("spinNumber", "desc")), (snap) => callback(snap.docs.map(asData)), error);
export const watchPresence = (code, callback, error) => onSnapshot(collection(db, "rounds", code, "presence"), (snap) => callback(snap.docs.map(asData)), error);
export async function addEntry(code, name, position) { const clean = String(name || "").trim(); if (clean) await addDoc(collection(db, "rounds", code, "entries"), { name: clean.slice(0, 100), enabled: true, position, createdAt: serverTimestamp() }); }
export async function addEntries(code, names, startPosition) { const batch = writeBatch(db); names.filter(Boolean).forEach((name, index) => batch.set(doc(collection(db, "rounds", code, "entries")), { name: String(name).trim().slice(0, 100), enabled: true, position: startPosition + index, createdAt: serverTimestamp() })); await batch.commit(); }
export const updateEntry = (code, id, values) => updateDoc(doc(db, "rounds", code, "entries", id), values);
export const removeEntry = (code, id) => deleteDoc(doc(db, "rounds", code, "entries", id));
export async function reorderEntry(code, entries, index, direction) { const otherIndex = index + direction; if (otherIndex < 0 || otherIndex >= entries.length) return; const batch = writeBatch(db); batch.update(doc(db, "rounds", code, "entries", entries[index].id), { position: entries[otherIndex].position }); batch.update(doc(db, "rounds", code, "entries", entries[otherIndex].id), { position: entries[index].position }); await batch.commit(); }
export const updateRound = (code, changes) => updateDoc(doc(db, "rounds", code), { ...changes, updatedAt: serverTimestamp() });
export async function startSpin(round, entries) { const available = entries.filter((entry) => entry.enabled); if (available.length < 2) throw new Error("Agrega al menos dos opciones activas para girar."); const index = Math.floor(Math.random() * available.length); const winner = available[index]; const spinNumber = (round.spinCount || 0) + 1; const spin = { winnerId: winner.id, winnerName: winner.name, targetIndex: index, total: available.length, startedAt: Timestamp.now(), durationMs: round.durationMs || 7000, spinNumber }; await updateRound(round.code, { status: "SPINNING", spin, winner: null, spinCount: spinNumber }); return spin; }
export async function finishSpin(round) { const spin = round.spin; if (!spin) return; const batch = writeBatch(db); batch.set(doc(collection(db, "rounds", round.code, "history")), { winnerId: spin.winnerId, winnerName: spin.winnerName, spinNumber: spin.spinNumber, createdAt: serverTimestamp() }); if (round.removeWinner) batch.update(doc(db, "rounds", round.code, "entries", spin.winnerId), { enabled: false }); batch.update(doc(db, "rounds", round.code), { status: "FINISHED", winner: { ...spin, finishedAt: Timestamp.now() }, updatedAt: serverTimestamp() }); await batch.commit(); }
export const removeHistoryItem = (code, id) => deleteDoc(doc(db, "rounds", code, "history", id));
export async function clearHistory(code) { const snapshots = await getDocs(collection(db, "rounds", code, "history")); const docs = snapshots.docs; for (let index = 0; index < docs.length; index += 450) { const batch = writeBatch(db); docs.slice(index, index + 450).forEach((snapshot) => batch.delete(snapshot.ref)); await batch.commit(); } }
export const resetRound = (code) => updateRound(code, { status: "WAITING", spin: null, winner: null });
export async function joinPresence(code, name) { const id = sessionStorage.getItem(`ronda-presence-${code}`) || crypto.randomUUID(); sessionStorage.setItem(`ronda-presence-${code}`, id); const ref = doc(db, "rounds", code, "presence", id); const save = () => setDoc(ref, { name: name.trim().slice(0, 80), joinedAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge: true }); await save(); const timer = window.setInterval(save, 25000); return () => { window.clearInterval(timer); deleteDoc(ref).catch(() => {}); }; }
