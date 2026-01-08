// js/infra/storage.js
// StorageAdapter + helpers.
// Fase 3: la UI nunca toca localStorage. Solo repositorios llaman a este módulo.

export const STORAGE_KEYS = Object.freeze({
  PERSONAS_STATE: "control-horas-personas",
  JORNADAS_LEGACY: "control-horas-jornadas",
});

function safeParseJSON(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Interfaz mínima pedida por el plan: get/set/remove
export class StorageAdapter {
  get(_key) { throw new Error("StorageAdapter.get() no implementado"); }
  set(_key, _value) { throw new Error("StorageAdapter.set() no implementado"); }
  remove(_key) { throw new Error("StorageAdapter.remove() no implementado"); }
}

// Implementación web (localStorage)
export class WebLocalStorageAdapter extends StorageAdapter {
  constructor(ls = null) {
    super();
    // Permite inyectar otro backend mañana (Capacitor Storage / SQLite / etc.)
    this._ls = ls || (typeof window !== "undefined" ? window.localStorage : null);
  }

  get(key) {
    if (!this._ls) return null;
    return this._ls.getItem(key);
  }

  set(key, value) {
    if (!this._ls) return false;
    this._ls.setItem(key, value);
    return true;
  }

  remove(key) {
    if (!this._ls) return false;
    this._ls.removeItem(key);
    return true;
  }
}

// Instancia por defecto (web)
const adapter = new WebLocalStorageAdapter();

// API de Storage usada por repositorios
export const Storage = {
  adapter,

  // interfaz base
  get(key) { return adapter.get(key); },
  set(key, value) { return adapter.set(key, value); },
  remove(key) { return adapter.remove(key); },

  // helpers de dominio (persistencia)
  loadPersonasState() {
    const raw = adapter.get(STORAGE_KEYS.PERSONAS_STATE);
    return safeParseJSON(raw, null);
  },

  savePersonasState(state) {
    return adapter.set(
      STORAGE_KEYS.PERSONAS_STATE,
      JSON.stringify(state ?? null)
    );
  },

  loadLegacyJornadas() {
    const raw = adapter.get(STORAGE_KEYS.JORNADAS_LEGACY);
    return safeParseJSON(raw, []);
  },

  saveLegacyJornadas(jornadas) {
    return adapter.set(
      STORAGE_KEYS.JORNADAS_LEGACY,
      JSON.stringify(Array.isArray(jornadas) ? jornadas : [])
    );
  },

  // utilidad (debug)
  clearAll() {
    adapter.remove(STORAGE_KEYS.PERSONAS_STATE);
    adapter.remove(STORAGE_KEYS.JORNADAS_LEGACY);
  },
};
