// js/infra/repository.js
// Repositorios de infraestructura.
// Encapsulan el acceso a Storage para que la UI (legacy o nueva) no dependa del backend.

import { Storage } from "./storage.js";

// Repo Personas (estado completo)
export class PersonasRepository {
  loadState() {
    return Storage.loadPersonasState();
  }

  saveState(state) {
    return Storage.savePersonasState(state);
  }
}

// Repo Jornadas (legacy)
// Nota: hoy se usa solo para migración/compatibilidad.
// Las jornadas “reales” viven dentro de cada persona (personasRepo.saveState()).
export class JornadasRepository {
  loadLegacy() {
    return Storage.loadLegacyJornadas();
  }

  saveLegacy(jornadas) {
    return Storage.saveLegacyJornadas(jornadas);
  }
}

// Factory
export function createRepositories() {
  return {
    personasRepo: new PersonasRepository(),
    jornadasRepo: new JornadasRepository(),
  };
}
