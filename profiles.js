const KEY = "ronda-custom-profiles-v1";
const QUESTION_KEY = "ronda-custom-question-profiles-v1";

export const BUILT_IN_PROFILES = [
  {
    id: "participantes-capacitacion",
    name: "Participantes capacitación",
    locked: true,
    entries: [
      "17101", "17102", "17105", "17106", "17107", "MANUEL LARIOS", "GUSTAVO LOPEZ",
      "6101", "6102", "6103", "6104", "6105", "6106", "6107", "6108", "6109", "6110", "Jasiel Alvarez Solis", "Joel Bernal Diaz",
      "4101", "4102", "4103", "4104", "4107", "4108", "4109", "4113", "4114", "4115", "4120", "4123", "4144", "4160", "4170", "4171", "4172", "4174",
      "ALVARO QUINTANAR GARCIA", "LORENA CARRILLO CRUZ", "ALBERTO EUGENIO LOPEZ CASTRO", "FRANCISCO JAVIER SOTO ANGULO",
      "JOSE HUGO HERNANDEZ GONZALEZ", "HECTOR DANIEL RUIZ BUSTAMANTE", "ELIUT ANDRES RUIZ BORREGO", "Angel Velazquez",
      "32102", "32103", "32104", "32105", "32106", "32107", "32108", "32109", "32110", "32111", "32112", "32113", "32114", "32115", "32116", "32117", "32118", "32119", "32121", "32122", "32123", "32124",
      "CESAR AGUILAR", "ARTURO VEGA HERNANDEZ", "SERGIO LIMA", "GERARDO GARCÍA",
      "4125", "4126", "4127", "4128", "4141", "4142", "Emanuel Rocha Galicia", "Ismael Raul Rico Garcia"
    ]
  },
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
  {
    id: "preguntas-productos",
    name: "Preguntas de capacitación",
    locked: true,
    entries: [
      "¿Nuestros rellenos están elaborados con fruta natural, pulpa de fruta o una combinación de ambas?",
      "¿Cuál es la temperatura máxima que soportan los rellenos San Antonio y las pasteleras LeChef?",
      "¿Cuáles son las principales diferencias entre el queso crema Gloria y el queso crema LeChef?",
      "¿Qué sabores de Mix para Pan de Muerto de Backaldrin están disponibles exclusivamente en presentación de bulto de 20 kilos?",
      "¿Cuáles son los 4 sabores disponibles de Mix para Pan de Muerto de Backaldrin y cuál es el código de producto correspondiente a cada sabor?",
      "¿Cuáles son las 3 principales ventajas de nuestros Mix para Pan de Muerto de Backaldrin?",
      "¿Cuáles son las 3 recetas de preparación disponibles para nuestros Mix de Pan de Muerto?",
      "¿Cuáles son 5 aplicaciones específicas de repostería o panificación en las que podemos utilizar nuestro Queso Crema Gloria y qué función cumple en cada una?",
      "¿Cuáles son 3 productos específicos en los que podemos utilizar el Queso Crema Gloria como ingrediente, relleno o cobertura?",
      "¿Cuál es el perfil de nuestro Queso Crema LeChef?",
      "¿Cuáles son 3 productos específicos en los que podemos utilizar el Queso Crema LeChef como ingrediente, relleno o cobertura?",
      "¿Cuáles son las 3 principales ventajas de nuestro Relleno San Antonio?",
      "¿Cuáles son las 3 principales ventajas de nuestras Pasteleras LeChef?",
      "¿Cuáles son 5 aplicaciones específicas de nuestras Pasteleras LeChef en productos de repostería y pastelería, y qué función cumple el producto en cada aplicación?",
      "¿Qué significa para ti la temporada de Día de Muertos y qué representa para ti compartir y colocar el tradicional Pan de Muerto en una ofrenda para recordar y honrar a nuestros seres queridos?"
    ]
  },
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
