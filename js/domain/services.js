// js/domain/services.js
// Casos de uso (servicios).
// Fase 5 (Paso 1): Personas.
// - No DOM
// - No localStorage directo
// - Todo va por repositorios (infra)

import { Perfil, Persona } from "./models.js";

const DEFAULT_PERFIL_RAW = Object.freeze({
  horasPorDia: 8,
  libresPorQuincena: 3,
  topeQuincena: 88,
});

function _normalizarCategoria(cat) {
  const c = String(cat || "").toUpperCase();
  return (c === "S") ? "S" : "CS";
}

function _nuevoIdPersona(personasRaw = {}) {
  const ids = Object.keys(personasRaw || {});
  let n = 1;
  while (ids.includes("p" + n)) n++;
  return "p" + n;
}

/**
 * Crea un "service layer" con los repositorios actuales.
 * Espera el shape: { personasRepo, jornadasRepo? }
 */
export function createServices({ personasRepo, jornadasRepo } = {}) {
  if (!personasRepo) throw new Error("createServices requiere personasRepo");

  // ==========================
  // PERSONAS (raw, para compatibilidad legacy)
  // ==========================

  /**
   * Carga state (personaActivaId + personas raw) desde repo.
   * Si no existe state aún, y hay jornadas legacy reales, migra a p1 una sola vez.
   */
  function personasLoad() {
    const state = personasRepo.loadState();

    // Caso 1: storage nuevo vacío
    if (!state) {
      const legacy = jornadasRepo?.loadLegacy?.();
      if (Array.isArray(legacy) && legacy.length > 0) {
        const personas = {
          p1: {
            nombre: "Persona 1",
            categoria: "CS",
            perfil: { ...DEFAULT_PERFIL_RAW },
            jornadas: legacy,
          },
        };
        const personaActivaId = "p1";
        personasRepo.saveState({ personaActivaId, personas });
        return { personaActivaId, personas };
      }

      return { personaActivaId: null, personas: {} };
    }

    // Caso 2: storage nuevo con datos
    const personas = (state.personas && typeof state.personas === "object") ? state.personas : {};
    let personaActivaId = state.personaActivaId ?? null;

    if (!personaActivaId || !personas[personaActivaId]) {
      personaActivaId = Object.keys(personas)[0] || null;
    }

    return { personaActivaId, personas };
  }

  /** Guarda state (personaActivaId + personas raw) en repo. */
  function personasSave({ personaActivaId, personas } = {}) {
    return personasRepo.saveState({
      personaActivaId: personaActivaId ?? null,
      personas: (personas && typeof personas === "object") ? personas : {},
    });
  }

  /** Define persona activa. No toca jornadas; solo cambia el id activo y persiste. */
  function personasSetActiva(id) {
    const { personas } = personasLoad();
    if (!id || !personas[id]) return false;
    personasSave({ personaActivaId: id, personas });
    return true;
  }

  /**
   * Crea persona y la deja activa. Persiste.
   * Devuelve { id, personaActivaId, personas }
   */
  function personasCrear({ nombre, categoria, perfil } = {}) {
    const state = personasLoad();
    const personas = state.personas;

    const id = _nuevoIdPersona(personas);
    const cat = _normalizarCategoria(categoria);

    // Normalizamos perfil con el modelo (múltiplos 0.5, clamps, etc.)
    const pf = new Perfil({
      ...(perfil || {}),
      topeQuincena:
        (perfil && Object.prototype.hasOwnProperty.call(perfil, "topeQuincena"))
          ? perfil.topeQuincena
          : DEFAULT_PERFIL_RAW.topeQuincena,
    });

    const persona = new Persona({
      id,
      nombre,
      categoria: cat,
      perfil: pf,
      jornadas: [],
    });

    // Guardamos como RAW (legacy usa objetos planos)
    personas[id] = persona.toJSON();

    const personaActivaId = id;
    personasSave({ personaActivaId, personas });

    return { id, personaActivaId, personas };
  }

  return {
    personas: {
      load: personasLoad,
      save: personasSave,
      setActiva: personasSetActiva,
      crear: personasCrear,
    },
  };
}
