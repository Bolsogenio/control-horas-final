// js/domain/services.js
// Casos de uso (servicios).
// Todavía NO se usan por el legacy. Los dejamos listos para la Fase 5.
// - No DOM
// - No localStorage directo
// - Todo va por repositorios

import { Persona, Perfil, personasMapToRaw, personasMapFromRaw } from "./models.js";

/**
 * Crea un "service layer" con los repositorios actuales.
 * Espera el shape: { personasRepo }
 */
export function createServices({ personasRepo } = {}) {
  if (!personasRepo) throw new Error("createServices requiere personasRepo");

  function loadState() {
    const state = personasRepo.loadState();
    if (!state) return { personaActivaId: null, personas: {} };

    // Convertimos a modelos (no rompe si falla algo)
    const personas = personasMapFromRaw(state.personas || {});
    const personaActivaId = state.personaActivaId ?? null;

    return { personaActivaId, personas };
  }

  function saveState({ personaActivaId, personas }) {
    return personasRepo.saveState({
      personaActivaId: personaActivaId ?? null,
      personas: personasMapToRaw(personas || {}),
    });
  }

  function crearPersona({ nombre, categoria, perfil } = {}) {
    const state = loadState();
    const personas = state.personas;

    // nuevo id incremental pN
    const ids = Object.keys(personas);
    let n = 1;
    while (ids.includes("p" + n)) n++;
    const id = "p" + n;

    const p = new Persona({
      id,
      nombre,
      categoria,
      perfil: perfil instanceof Perfil ? perfil : new Perfil(perfil || {}),
      jornadas: [],
    });

    personas[id] = p;
    const personaActivaId = id;

    saveState({ personaActivaId, personas });

    return { id, personaActivaId, persona: p };
  }

  return {
    loadState,
    saveState,
    crearPersona,
  };
}
