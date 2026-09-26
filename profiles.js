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

  {
    id: "people",
    name: "Participantes",
    locked: true,
    entries: [
      "Andrea",
      "Bruno",
      "Camila",
      "Daniel",
      "Elena",
      "Felipe",
      "Gabriela",
      "Hugo"
    ]
  },

  {
    id: "teams",
    name: "Equipos",
    locked: true,
    entries: [
      "Equipo Aurora",
      "Equipo Brisa",
      "Equipo Cima",
      "Equipo Delta",
      "Equipo Eclipse",
      "Equipo Faro"
    ]
  },

  {
    id: "prizes",
    name: "Premios",
    locked: true,
    entries: [
      "Premio sorpresa",
      "Tarjeta de regalo",
      "Kit especial",
      "Entrada doble",
      "Experiencia VIP",
      "Segundo intento"
    ]
  },

  {
    id: "colors",
    name: "Colores",
    locked: true,
    entries: [
      "Rojo",
      "Azul",
      "Verde",
      "Amarillo",
      "Morado",
      "Naranja"
    ]
  }
];


// ============================================================
// PERFILES PERSONALIZADOS
// ============================================================

function readCustomProfiles() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCustomProfiles(profiles) {
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function getProfiles() {
  return [
    ...BUILT_IN_PROFILES,
    ...readCustomProfiles()
  ];
}

export function saveProfile(name, entries) {
  const profile = {
    id: crypto.randomUUID(),

    name: name
      .trim()
      .slice(0, 48),

    entries: entries
      .map((entry) => entry.trim())
      .filter(Boolean),

    locked: false
  };

  writeCustomProfiles([
    ...readCustomProfiles(),
    profile
  ]);

  return profile;
}

export function renameProfile(id, name) {
  const profiles = readCustomProfiles().map((profile) =>
    profile.id === id
      ? {
          ...profile,
          name: name.trim().slice(0, 48)
        }
      : profile
  );

  writeCustomProfiles(profiles);
}

export function deleteProfile(id) {
  writeCustomProfiles(
    readCustomProfiles().filter(
      (profile) => profile.id !== id
    )
  );
}


// ============================================================
// PERFILES DE PREGUNTAS
// ============================================================

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

  {
    id: "icebreakers",
    name: "Rompehielos",
    locked: true,

    entries: [
      "¿Cuál fue tu mejor momento de la semana?",
      "¿Qué habilidad te gustaría dominar?",
      "¿Qué te inspira a aprender?",
      "¿Qué consejo le darías a tu yo de hace un año?"
    ]
  },

  {
    id: "reflection",
    name: "Reflexión",
    locked: true,

    entries: [
      "¿Cuál es la idea más importante de hoy?",
      "¿Qué aplicarás primero?",
      "¿Qué te resultó más desafiante?",
      "¿Qué pregunta sigue abierta?"
    ]
  },

  {
    id: "feedback",
    name: "Retroalimentación",
    locked: true,

    entries: [
      "¿Qué parte de la sesión fue más útil?",
      "¿Qué podríamos mejorar?",
      "¿Qué tema quieres explorar después?",
      "¿Recomendarías esta dinámica?"
    ]
  }
];


// ============================================================
// PREGUNTAS PERSONALIZADAS
// ============================================================

function readQuestionProfiles() {
  try {
    return JSON.parse(
      localStorage.getItem(QUESTION_KEY) || "[]"
    );
  } catch {
    return [];
  }
}

function writeQuestionProfiles(profiles) {
  localStorage.setItem(
    QUESTION_KEY,
    JSON.stringify(profiles)
  );
}

export function getQuestionProfiles() {
  return [
    ...BUILT_IN_QUESTION_PROFILES,
    ...readQuestionProfiles()
  ];
}

export function saveQuestionProfile(name, entries) {
  const profile = {
    id: crypto.randomUUID(),

    name: name
      .trim()
      .slice(0, 48),

    entries: entries
      .map((entry) => entry.trim())
      .filter(Boolean),

    locked: false
  };

  writeQuestionProfiles([
    ...readQuestionProfiles(),
    profile
  ]);

  return profile;
}

export function renameQuestionProfile(id, name) {
  const profiles = readQuestionProfiles().map(
    (profile) =>
      profile.id === id
        ? {
            ...profile,
            name: name.trim().slice(0, 48)
          }
        : profile
  );

  writeQuestionProfiles(profiles);
}

export function deleteQuestionProfile(id) {
  writeQuestionProfiles(
    readQuestionProfiles().filter(
      (profile) => profile.id !== id
    )
  );
}


// ============================================================
// CONFIGURACIÓN GENERAL DE LA CARRERA HALLOWEEN
// ============================================================
//
// Esta configuración NO elimina ni modifica ninguna de las
// funciones anteriores.
//
// Sirve para controlar:
// - Monstruo
// - Corredores
// - Animaciones
// - Sonidos
// - Persecución
// - Eliminaciones
// - Preguntas
// - Ganador
// - Ambientación Halloween
//
// ============================================================

export const HALLOWEEN_GAME_CONFIG = {

  enabled: true,


  // ==========================================================
  // INICIO DE LA RONDA
  // ==========================================================

  countdown: {

    enabled: true,

    messages: [
      "PREPARADOS...",
      "3",
      "2",
      "1",
      "¡CORRAN!"
    ],

    interval: 1000,

    animation: true,

    sound: true
  },


  // ==========================================================
  // MONSTRUO
  // ==========================================================

  monster: {

    enabled: true,

    states: {

      IDLE: "idle",

      WALKING: "walking",

      RUNNING: "running",

      ATTACKING: "attacking",

      EATING: "eating",

      CELEBRATING: "celebrating"
    },

    defaultState: "idle",


    // --------------------------------------------------------
    // MOVIMIENTO
    // --------------------------------------------------------

    movement: {

      enabled: true,

      smooth: true,

      acceleration: true,

      deceleration: true,

      maxSpeed: 1,

      minSpeed: 0.25,

      rotationSmoothness: true
    },


    // --------------------------------------------------------
    // ANIMACIONES
    // --------------------------------------------------------

    animations: {

      idle: true,

      walking: true,

      running: true,

      attacking: true,

      eating: true,

      celebrating: true
    },


    // --------------------------------------------------------
    // SONIDOS
    // --------------------------------------------------------

    sounds: {

      enabled: true,


      movement: {

        enabled: true,

        volume: 0.35,

        loop: true
      },


      nearPlayer: {

        enabled: true,

        volume: 0.45
      },


      attack: {

        enabled: true,

        volume: 0.7
      },


      eat: {

        enabled: true,

        volume: 0.85
      },


      celebration: {

        enabled: true,

        volume: 0.65
      }
    }
  },


  // ==========================================================
  // PARTICIPANTES / CORREDORES
  // ==========================================================

  runners: {

    enabled: true,

    showNames: true,


    // --------------------------------------------------------
    // ANIMACIONES DE PERSONAS
    // --------------------------------------------------------

    animations: {

      idle: true,

      running: true,

      scared: true,

      dodging: true,

      eliminated: true,

      winner: true
    },


    // --------------------------------------------------------
    // MOVIMIENTO
    // --------------------------------------------------------

    movement: {

      smooth: true,

      randomVariation: true,

      avoidance: true,

      randomDirectionChanges: true,

      dynamicSpeed: true
    },


    // --------------------------------------------------------
    // SONIDOS
    // --------------------------------------------------------

    sounds: {

      enabled: true,

      footsteps: true,

      scared: true,

      eliminated: true,

      winner: true
    }
  },


  // ==========================================================
  // SISTEMA DE PERSECUCIÓN
  // ==========================================================

  chase: {

    enabled: true,

    monsterTargetsRunner: true,

    dynamicTargetSelection: true,

    randomTargetChanges: true,

    targetClosestRunner: true,

    allowTargetEscape: true,


    camera: {

      enabled: true,

      smooth: true,

      dynamic: true,

      shakeOnAttack: true,

      shakeOnEat: true
    }
  },


  // ==========================================================
  // ELIMINACIÓN DE PARTICIPANTES
  // ==========================================================

  elimination: {

    enabled: true,

    monsterEatAnimation: true,

    removeRunnerAfterAnimation: true,


    effects: {

      screenShake: true,

      particles: true,

      sound: true,

      flash: true
    }
  },


  // ==========================================================
  // GANADOR
  // ==========================================================

  winner: {

    enabled: true,

    celebrationAnimation: true,


    effects: {

      confetti: true,

      particles: true,

      sound: true
    },


    showQuestionsAfterWinner: true
  },


  // ==========================================================
  // SISTEMA DE PREGUNTAS
  // ==========================================================

  questions: {

    enabled: true,

    useQuestionProfiles: true,

    defaultProfileId: "preguntas-productos",

    showAfterWinner: true,

    randomQuestion: true
  },


  // ==========================================================
  // AMBIENTACIÓN HALLOWEEN
  // ==========================================================

  environment: {

    theme: "halloween",

    animations: true,

    parallax: true,

    fog: true,

    particles: true,


    decorations: {

      pumpkins: true,

      bats: true,

      ghosts: true,

      candles: true,

      cemetery: true,

      spiderWebs: true,

      tombstones: true,

      deadTrees: true
    },


    ambientSounds: true,


    lighting: {

      dynamic: true,

      flickeringLights: true,

      moonLight: true
    }
  },


  // ==========================================================
  // EFECTOS GENERALES
  // ==========================================================

  effects: {

    particles: true,

    screenShake: true,

    transitions: true,

    glow: true,

    shadows: true,

    motionEffects: true
  },


  // ==========================================================
  // AUDIO GENERAL
  // ==========================================================

  audio: {

    enabled: true,

    ambientMusic: true,

    ambientEffects: true,

    monsterSounds: true,

    runnerSounds: true,

    uiSounds: true,

    masterVolume: 0.8
  }
};


// ============================================================
// OBTENER CONFIGURACIÓN
// ============================================================

export function getHalloweenGameConfig() {

  return HALLOWEEN_GAME_CONFIG;
}


// ============================================================
// OBTENER ESTADOS DEL MONSTRUO
// ============================================================

export function getMonsterStates() {

  return HALLOWEEN_GAME_CONFIG.monster.states;
}


// ============================================================
// OBTENER PERFIL DE PREGUNTAS PREDETERMINADO
// ============================================================

export function getDefaultQuestionProfile() {

  return getQuestionProfiles().find(
    (profile) =>
      profile.id ===
      HALLOWEEN_GAME_CONFIG.questions.defaultProfileId
  );
}


// ============================================================
// OBTENER PREGUNTA ALEATORIA
// ============================================================

export function getRandomQuestion(
  profileId =
    HALLOWEEN_GAME_CONFIG.questions.defaultProfileId
) {

  const profile = getQuestionProfiles().find(
    (item) => item.id === profileId
  );

  if (
    !profile ||
    !profile.entries ||
    !profile.entries.length
  ) {

    return null;
  }

  const index = Math.floor(
    Math.random() * profile.entries.length
  );

  return profile.entries[index];
}


// ============================================================
// OBTENER PARTICIPANTE ALEATORIO
// ============================================================

export function getRandomParticipant(
  profileId = "participantes-capacitacion"
) {

  const profile = getProfiles().find(
    (item) => item.id === profileId
  );

  if (
    !profile ||
    !profile.entries ||
    !profile.entries.length
  ) {

    return null;
  }

  const index = Math.floor(
    Math.random() * profile.entries.length
  );

  return profile.entries[index];
}


// ============================================================
// OBTENER PERFIL POR ID
// ============================================================

export function getProfileById(id) {

  return getProfiles().find(
    (profile) => profile.id === id
  ) || null;
}


// ============================================================
// OBTENER PERFIL DE PREGUNTAS POR ID
// ============================================================

export function getQuestionProfileById(id) {

  return getQuestionProfiles().find(
    (profile) => profile.id === id
  ) || null;
}


// ============================================================
// OBTENER PARTICIPANTES DE UN PERFIL
// ============================================================

export function getParticipantsFromProfile(
  profileId = "participantes-capacitacion"
) {

  const profile = getProfileById(profileId);

  if (!profile) {
    return [];
  }

  return [...profile.entries];
}


// ============================================================
// OBTENER PREGUNTAS DE UN PERFIL
// ============================================================

export function getQuestionsFromProfile(
  profileId =
    HALLOWEEN_GAME_CONFIG.questions.defaultProfileId
) {

  const profile = getQuestionProfileById(profileId);

  if (!profile) {
    return [];
  }

  return [...profile.entries];
}


// ============================================================
// MEZCLAR LISTA
// ============================================================

export function shuffleEntries(entries = []) {

  const list = [...entries];

  for (
    let i = list.length - 1;
    i > 0;
    i--
  ) {

    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [
      list[i],
      list[j]
    ] = [
      list[j],
      list[i]
    ];
  }

  return list;
}


// ============================================================
// OBTENER PARTICIPANTES MEZCLADOS
// ============================================================

export function getShuffledParticipants(
  profileId = "participantes-capacitacion"
) {

  return shuffleEntries(
    getParticipantsFromProfile(profileId)
  );
}


// ============================================================
// OBTENER PREGUNTAS MEZCLADAS
// ============================================================

export function getShuffledQuestions(
  profileId =
    HALLOWEEN_GAME_CONFIG.questions.defaultProfileId
) {

  return shuffleEntries(
    getQuestionsFromProfile(profileId)
  );
}


// ============================================================
// ESTADÍSTICAS
// ============================================================

export function getProfileStats() {

  const profiles = getProfiles();

  const questionProfiles =
    getQuestionProfiles();

  return {

    profileCount:
      profiles.length,

    questionProfileCount:
      questionProfiles.length,

    participantCount:
      profiles.reduce(
        (total, profile) =>
          total + profile.entries.length,
        0
      ),

    questionCount:
      questionProfiles.reduce(
        (total, profile) =>
          total + profile.entries.length,
        0
      )
  };
}


// ============================================================
// COMPROBAR SI UN PERFIL ESTÁ BLOQUEADO
// ============================================================

export function isProfileLocked(id) {

  const profile = getProfileById(id);

  return profile
    ? Boolean(profile.locked)
    : false;
}


// ============================================================
// COMPROBAR SI UN PERFIL DE PREGUNTAS ESTÁ BLOQUEADO
// ============================================================

export function isQuestionProfileLocked(id) {

  const profile =
    getQuestionProfileById(id);

  return profile
    ? Boolean(profile.locked)
    : false;
}
