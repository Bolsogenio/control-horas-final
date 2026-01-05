// js/infra/storage.js
// Capa de persistencia: hoy localStorage, mañana se reemplaza por otro backend (Android/iOS) sin tocar UI ni dominio.

const KEYS = {
  PERSONAS: "control-horas-personas",
  JORNADAS_LEGACY: "control-horas-jornadas",
};

function safeParseJSON(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const Storage = {
  // --- Personas (formato nuevo) ---
  loadPersonasState() {
    const raw = localStorage.getItem(KEYS.PERSONAS);
    const data = safeParseJSON(raw, null);
    if (!data || typeof data !== "object") return null;
    return {
      personaActivaId: data.personaActivaId ?? null,
      personas: data.personas ?? {},
    };
  },

  savePersonasState(state) {
    const payload = {
      personaActivaId: state?.personaActivaId ?? null,
      personas: state?.personas ?? {},
    };
    localStorage.setItem(KEYS.PERSONAS, JSON.stringify(payload));
    return true;
  },

  // --- Jornadas (formato viejo / legacy) ---
  loadLegacyJornadas() {
    const raw = localStorage.getItem(KEYS.JORNADAS_LEGACY);
    const data = safeParseJSON(raw, []);
    return Array.isArray(data) ? data : [];
  },

  saveLegacyJornadas(jornadas) {
    localStorage.setItem(
      KEYS.JORNADAS_LEGACY,
      JSON.stringify(Array.isArray(jornadas) ? jornadas : [])
    );
    return true;
  },

  // --- Utilidad (debug) ---
  clearAll() {
    localStorage.removeItem(KEYS.PERSONAS);
    localStorage.removeItem(KEYS.JORNADAS_LEGACY);
  },
};

export const STORAGE_KEYS = KEYS;
