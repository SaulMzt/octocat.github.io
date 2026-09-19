const KEY = "ronda-custom-profiles-v1";

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
