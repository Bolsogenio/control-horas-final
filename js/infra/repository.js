// js/infra/repository.js
// Repositorios de infraestructura.
// Encapsulan el acceso a Storage para que el legacy no dependa de él.

import { Storage } from "./storage.js";

// Repo Personas
export class PersonasRepository {
  loadState() {
    return Storage.loadPersonasState();
  }

  saveState(state) {
    return Storage.savePersonasState(state);
  }
}

// Repo Jornadas (legacy)
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
