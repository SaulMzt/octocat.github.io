const KEY = "ronda-custom-profiles-v1";
const QUESTION_KEY = "ronda-custom-question-profiles-v1";

export const BUILT_IN_PROFILES = [
  { id: "people", name: "Participantes", locked: true, entries: ["Andrea", "Bruno", "Camila", "Daniel", "Elena", "Felipe", "Gabriela", "Hugo"] },
  { id: "teams", name: "Equipos", locked: true, entries: ["Equipo Aurora", "Equipo Brisa", "Equipo Cima", "Equipo Delta", "Equipo Eclipse", "Equipo Faro"] },
  { id: "prizes", name: "Premios", locked: true, entries: ["Premio sorpresa", "Tarjeta de regalo", "Kit especial", "Entrada doble", "Experiencia VIP", "Segundo intento"] },
  { id: "colors", name: "Colores", locked: true, entries: ["Rojo", "Azul", "Verde", "Amarillo", "Morado", "Naranja"] }
];

function readCustomProfiles() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function writeCustomProfiles(profiles) { localStorage.setItem(KEY, JSON.stringify(profiles)); }

export function getProfiles() { return [...BUILT_IN_PROFILES, ...readCustomProfiles()]; }
export function saveProfile(name, entries) {
  const profile = { id: crypto.randomUUID(), name: name.trim().slice(0, 48), entries: entries.map((entry) => entry.trim()).filter(Boolean), locked: false };
  writeCustomProfiles([...readCustomProfiles(), profile]);
  return profile;
}
export function renameProfile(id, name) {
  const profiles = readCustomProfiles().map((profile) => profile.id === id ? { ...profile, name: name.trim().slice(0, 48) } : profile);
  writeCustomProfiles(profiles);
}
export function deleteProfile(id) { writeCustomProfiles(readCustomProfiles().filter((profile) => profile.id !== id)); }

export const BUILT_IN_QUESTION_PROFILES = [
  { id: "icebreakers", name: "Rompehielos", locked: true, entries: ["¿Cuál fue tu mejor momento de la semana?", "¿Qué habilidad te gustaría dominar?", "¿Qué te inspira a aprender?", "¿Qué consejo le darías a tu yo de hace un año?"] },
  { id: "reflection", name: "Reflexión", locked: true, entries: ["¿Cuál es la idea más importante de hoy?", "¿Qué aplicarás primero?", "¿Qué te resultó más desafiante?", "¿Qué pregunta sigue abierta?"] },
  { id: "feedback", name: "Retroalimentación", locked: true, entries: ["¿Qué parte de la sesión fue más útil?", "¿Qué podríamos mejorar?", "¿Qué tema quieres explorar después?", "¿Recomendarías esta dinámica?"] }
];

function readQuestionProfiles() {
  try { return JSON.parse(localStorage.getItem(QUESTION_KEY) || "[]"); } catch { return []; }
}

function writeQuestionProfiles(profiles) { localStorage.setItem(QUESTION_KEY, JSON.stringify(profiles)); }

export function getQuestionProfiles() { return [...BUILT_IN_QUESTION_PROFILES, ...readQuestionProfiles()]; }
export function saveQuestionProfile(name, entries) {
  const profile = { id: crypto.randomUUID(), name: name.trim().slice(0, 48), entries: entries.map((entry) => entry.trim()).filter(Boolean), locked: false };
  writeQuestionProfiles([...readQuestionProfiles(), profile]);
  return profile;
}
export function renameQuestionProfile(id, name) {
  const profiles = readQuestionProfiles().map((profile) => profile.id === id ? { ...profile, name: name.trim().slice(0, 48) } : profile);
  writeQuestionProfiles(profiles);
}
export function deleteQuestionProfile(id) { writeQuestionProfiles(readQuestionProfiles().filter((profile) => profile.id !== id)); }
