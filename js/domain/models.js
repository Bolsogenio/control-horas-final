// js/domain/models.js
// Modelos de dominio (POO donde suma). Sin DOM, sin localStorage.
// Nota: por ahora son "opt-in": el legacy puede seguir usando objetos planos.
// Sirven para: validación, normalización y conversión JSON ⇄ objetos.

export const CATEGORIAS = Object.freeze({
  CS: "CS", // Crupier/Supervisor
  S: "S",   // Solo Supervisor
});

export const TIPOS_JORNADA = Object.freeze({
  NORMAL: "normal",
  FALTA: "falta",
  LIBRE: "libre",
  LIBRE_TRABAJADO: "libreTrabajado",
  COMPENSADO: "compensado",
  LIC_ANUAL: "licAnual",
  LIC_ENFERMEDAD: "licEnfermedad",
  LIC_SIN_GOCE: "licSinGoce",
});

function _isIsoDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function _toNumberOr(x, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
}

function _roundToHalf(n) {
  return Math.round(n * 2) / 2;
}

function _clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export class Perfil {
  constructor({
    id = null,
    nombre = "",
    horasPorDia = 8,
    libresPorQuincena = 3,
    topeQuincena = null,
  } = {}) {
    this.id = id ?? null;
    this.nombre = String(nombre ?? "");

    // Normalizamos a números válidos para el negocio (múltiplos de 0.5)
    const h = _roundToHalf(_clamp(_toNumberOr(horasPorDia, 8), 0.5, 24));
    const l = Math.round(_clamp(_toNumberOr(libresPorQuincena, 3), 2, 12));
    const t = topeQuincena === null ? null : _toNumberOr(topeQuincena, null);

    this.horasPorDia = h;
    this.libresPorQuincena = l;
    this.topeQuincena = t;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      horasPorDia: this.horasPorDia,
      libresPorQuincena: this.libresPorQuincena,
      topeQuincena: this.topeQuincena,
    };
  }

  static fromRaw(raw = {}) {
    return new Perfil(raw || {});
  }
}

export class Jornada {
  constructor({
    fecha, // ISO YYYY-MM-DD
    crupier = 0,
    supervisor = 0,
    falta = false,
    libre = false,
    libreTrabajado = false,
    compensado = false,
    licAnual = false,
    licEnfermedad = false,
    licSinGoce = false,
  } = {}) {
    if (!_isIsoDate(fecha)) {
      throw new Error(`Jornada.fecha inválida (se espera ISO YYYY-MM-DD): ${String(fecha)}`);
    }

    this.fecha = fecha;

    // horas en múltiplos de 0.5 y no negativas (la validación de "total <= max" vive en reglas/domain)
    this.crupier = _roundToHalf(Math.max(0, _toNumberOr(crupier, 0)));
    this.supervisor = _roundToHalf(Math.max(0, _toNumberOr(supervisor, 0)));

    // flags
    this.falta = Boolean(falta);
    this.libre = Boolean(libre);
    this.libreTrabajado = Boolean(libreTrabajado);
    this.compensado = Boolean(compensado);
    this.licAnual = Boolean(licAnual);
    this.licEnfermedad = Boolean(licEnfermedad);
    this.licSinGoce = Boolean(licSinGoce);
  }

  get total() {
    return (Number(this.crupier) || 0) + (Number(this.supervisor) || 0);
  }

  toJSON() {
    return {
      fecha: this.fecha,
      crupier: this.crupier,
      supervisor: this.supervisor,
      falta: this.falta,
      libre: this.libre,
      libreTrabajado: this.libreTrabajado,
      compensado: this.compensado,
      licAnual: this.licAnual,
      licEnfermedad: this.licEnfermedad,
      licSinGoce: this.licSinGoce,
    };
  }

  static fromRaw(raw = {}) {
    return new Jornada(raw || {});
  }
}

export class Persona {
  constructor({
    id,
    nombre,
    categoria = CATEGORIAS.CS,
    perfil = null,
    jornadas = [],
  } = {}) {
    if (!id) throw new Error("Persona.id es requerido");

    this.id = String(id);
    this.nombre = String(nombre ?? "").trim() || `Persona ${this.id}`;

    const cat = String(categoria || "").toUpperCase();
    this.categoria = (cat === CATEGORIAS.S) ? CATEGORIAS.S : CATEGORIAS.CS;

    this.perfil = perfil instanceof Perfil ? perfil : Perfil.fromRaw(perfil || {});
    this.jornadas = Array.isArray(jornadas)
      ? jornadas.map((j) => (j instanceof Jornada ? j : Jornada.fromRaw(j)))
      : [];
  }

  toJSON() {
    return {
      nombre: this.nombre,
      categoria: this.categoria,
      perfil: this.perfil?.toJSON?.() ?? null,
      jornadas: (this.jornadas || []).map((j) => j?.toJSON?.() ?? j),
    };
  }

  static fromRaw(id, raw = {}) {
    return new Persona({ id, ...(raw || {}) });
  }
}

// ===============================
// Helpers de conversión (NO obligatorios)
// ===============================

export function personasMapFromRaw(rawPersonas = {}) {
  const out = {};
  if (!rawPersonas || typeof rawPersonas !== "object") return out;

  for (const [id, p] of Object.entries(rawPersonas)) {
    try {
      out[id] = Persona.fromRaw(id, p);
    } catch {
      // si algo está roto en storage, lo ignoramos (no tiramos abajo la app)
    }
  }
  return out;
}

export function personasMapToRaw(personasMap = {}) {
  const out = {};
  if (!personasMap || typeof personasMap !== "object") return out;

  for (const [id, p] of Object.entries(personasMap)) {
    out[id] = (p && typeof p.toJSON === "function") ? p.toJSON() : p;
  }
  return out;
}
