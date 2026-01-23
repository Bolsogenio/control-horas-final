import { createRepositories } from "./infra/repository.js";
import { domRefs } from "./ui/dom.js";
import { renderPersonaSelect, renderAppState } from "./ui/views.js";
import { bindPersonaSelect } from "./ui/controllers.js";

let _uiRefs = null;
function UI() {
  // Se inicializa después de DOMContentLoaded (legacyInit se llama desde app.js)
  if (!_uiRefs) _uiRefs = domRefs();
  return _uiRefs;
}

const { personasRepo, jornadasRepo } = createRepositories();

function MAX_HORAS_DIA() {
  // Usa el perfil de la persona activa (si existe). Fallback seguro: 8.
  const v = Number(PERFIL_ACTUAL?.maxHorasDia ?? PERFIL_ACTUAL?.horasPorDia);
  return (Number.isFinite(v) && v > 0) ? v : 8;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];


function MAX_LIBRES_QUINCENA() {
  // Usa el perfil de la persona activa (si existe). Fallback seguro: 3.
  const v = Number(PERFIL_ACTUAL?.maxLibresQuincena ?? PERFIL_ACTUAL?.libresPorQuincena);
  return (Number.isFinite(v) && v > 0) ? Math.round(v) : 3;
}


function HORAS_QUINCENA(horasPorDia = 8, libresPorQuincena = 3) {
  const diasTrabajables = 14 - libresPorQuincena;
  return diasTrabajables * horasPorDia;
}

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0..11

let PERFIL_ACTUAL = null;

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];




import {
  ANCHOR_START as DN_ANCHOR_START,
  addDays as dn_addDays,
  toISODate as dn_toISODate,
  normalizarFecha as dn_normalizarFecha,
  normalizarNumero as dn_normalizarNumero,
  formatearDiasHoras8 as dn_formatearDiasHoras8,
  getTipoFromFlags as dn_getTipoFromFlags,

  getQuincenaIndex as dn_getQuincenaIndex,
  getQuincenasQueTocanMes as dn_getQuincenasQueTocanMes,

  calcularTotalesRangoConAsumidos as dn_calcularTotalesRangoConAsumidos,
  calcularResumenMensual as dn_calcularResumenMensual,
  calcularResumenQuincenasQueTocanMes as dn_calcularResumenQuincenasQueTocanMes,
  calcularSaldoLibresTrabajadosGlobal as dn_calcularSaldoLibresTrabajadosGlobal,

  esNumeroValido as dn_esNumeroValido,
  horasHabilitadas as dn_horasHabilitadas,
  validarHoras as dn_validarHoras,
  rangoQuincenaDeFechaStr as dn_rangoQuincenaDeFechaStr,
  contarLibresEnQuincena as dn_contarLibresEnQuincena,
  aplicarTipoAFlags as dn_aplicarTipoAFlags,
  esNormalAsumida80 as dn_esNormalAsumida80,
} from "./domain.js";


/**
 * Helper oficial para generar fecha YYYY-MM-DD en horario LOCAL.
 * No modifica comportamiento actual.
 * Se define para futura migración móvil / control de huso horario.
 */
function getLocalISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


// ==========================
// CONFIGURACIÓN
// ==========================


// ==========================
// PERFIL (reglas base del sistema)
// ==========================
// Importante: por ahora dejamos FULL TIME como perfil activo.
// Este PASO 1 no cambia comportamiento, solo centraliza números.
const PERFIL_FULL_TIME = {
  id: "full_time",
  nombre: "Full time (8h/día, 3 libres/quincena, 88h/quincena)",
  maxHorasDia: 8,
  maxLibresQuincena: 3,
  horasQuincena: 88,
};

const PERFIL_6H_2LIBRES = {
  id: "6h_2libres",
  nombre: "6 hs / 2 libres",
  maxHorasDia: 6,
  maxLibresQuincena: 4,
  horasQuincena: 60,
};

// ==========================
// PRESETS DE PERFIL (para Personas)
// ==========================

const PERFIL_PRESETS = {
  full_time: {
    id: "full_time",
    nombre: "Full time (8h/día, 3 libres/quincena)",
    horasPorDia: 8,
    libresPorQuincena: 3,
    topeQuincena: 88, // fijo por ahora
  },
  "6h_2libres": {
    id: "6h_2libres",
    nombre: "6 hs / 2 libres",
    horasPorDia: 6,
    libresPorQuincena: 4, // (según tu PERFIL_6H_2LIBRES actual)
    topeQuincena: 88, // fijo por ahora
  },
};





// Aplica un preset a la PERSONA ACTIVA (sin UI)
function aplicarPresetPerfilPersonaActiva(presetId) {
  if (!personaActivaId || !personas[personaActivaId]) {
    console.warn("No hay persona activa");
    return false;
  }

  const preset = PERFIL_PRESETS[presetId];
  if (!preset) {
    console.warn("Preset inválido:", presetId);
    return false;
  }

  const p = personas[personaActivaId];
  if (!p.perfil) p.perfil = {};

  p.perfil.horasPorDia = preset.horasPorDia;
  p.perfil.libresPorQuincena = preset.libresPorQuincena;
  p.perfil.topeQuincena = 88; // fijo por ahora

  // Re-activar para que PERFIL_ACTUAL tome el nuevo perfil
  activarPersona(personaActivaId, { render: true, persistir: true });
  return true;
}

// Exponer para probar por consola
window.aplicarPresetPerfilPersonaActiva = (presetId) =>
  aplicarPresetPerfilPersonaActiva(presetId);

window.listarPresetsPerfil = () => Object.keys(PERFIL_PRESETS);


// Perfil activo (por ahora fijo)
// m: 0=enero ... 10=noviembre





// Devuelve todas las quincenas (14 días) que intersectan el mes visible






function renderCalendarHeader() {
  document.getElementById("monthLabel").textContent =
    `${MONTHS[calMonth]} ${calYear}`;

  const wd = document.getElementById("weekdays");
  wd.innerHTML = "";
  WEEKDAYS.forEach(d => {
    const div = document.createElement("div");
    div.className = "cal-weekday";
    div.textContent = d;
    wd.appendChild(div);
  });
}


function bindCalendarNav() {
  const prev = document.getElementById("prevMonthBtn");
  const next = document.getElementById("nextMonthBtn");
  if (prev) {
    prev.onclick = () => {
      calMonth -= 1;
      if (calMonth < 0) { calMonth = 11; calYear -= 1; }
      renderCalendar();
    };
  }
  if (next) {
    next.onclick = () => {
      calMonth += 1;
      if (calMonth > 11) { calMonth = 0; calYear += 1; }
      renderCalendar();
    };
  }
}




function renderResumen() {
  const formatearDiasHoras = (h) => dn_formatearDiasHoras8(h, MAX_HORAS_DIA());

  // ======================
  // MES
  // ======================
  const mr = dn_calcularResumenMensual(calYear, calMonth, jornadas, MAX_HORAS_DIA(), 30);
  const mt = mr.mt;
  const baseMesHastaHoy = mr.baseMesHastaHoy;
  const totalPagoM = mr.totalPagoM;
  const descuentoM = mr.descuentoM;
  const extraM = mr.extraM;
  const crupierHorasM = mr.crupierHorasM;

  document.getElementById("sumMonthLabel").textContent = `${MONTHS[calMonth]} ${calYear}`;

  document.getElementById("sumMonthText").textContent =
    `Sup: ${formatearDiasHoras(mt.supervisor)} (${mt.supervisor}h)` +
    ` | Desc: ${descuentoM}h` +
    ` | Crup: ${formatearDiasHoras(crupierHorasM)} (${crupierHorasM}h)` +
    (extraM > 0 ? ` | Extra: ${extraM}h` : "") +
    ` | Base hasta hoy: ${baseMesHastaHoy}h` +
    ` | Total pago: ${totalPagoM}h`;

  // ======================
  // QUINCENAS (rodantes) que tocan el mes visible
  // ======================
  const quincenas = dn_calcularResumenQuincenasQueTocanMes(
    calYear,
    calMonth,
    jornadas,
    MAX_HORAS_DIA(),
    11
  );

  document.getElementById("sumQuincenaRange").textContent =
    `Quincenas que tocan ${MONTHS[calMonth]} ${calYear}`;

  const partes = [];

  for (const r of quincenas) {
    const qt = r.qt;

    const descuentoQ = r.descuentoQ;
    const extraQ = r.extraQ;
    const crupierHorasQ = r.crupierHorasQ;

    partes.push(
      `${formatDate(r.start)} → ${formatDate(r.end)}` +
      ` | Sup: ${formatearDiasHoras(qt.supervisor)} (${qt.supervisor}h)` +
      ` | Desc: ${descuentoQ}h` +
      ` | Crup: ${formatearDiasHoras(crupierHorasQ)} (${crupierHorasQ}h)` +
      (extraQ > 0 ? ` | Extra: ${extraQ}h` : "")
    );
  }

  const saldoGlobal = dn_calcularSaldoLibresTrabajadosGlobal(jornadas);
  partes.push(`Saldo de libres trabajados disponible: ${saldoGlobal.saldo}`);

  document.getElementById("sumQuincenaText").textContent = partes.join(" // ");
}

function renderCalendarGrid() {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstDay = new Date(calYear, calMonth, 1);
  const startOffset = firstDay.getDay(); // 0 = domingo
  const startDate = dn_addDays(firstDay, -startOffset);

  for (let i = 0; i < 42; i++) {
    const d = dn_addDays(startDate, i);
    const cell = document.createElement("div");
    cell.className = "cal-cell";

    const qIndex = dn_getQuincenaIndex(d);
    const qClass = "q" + (((qIndex % 3) + 3) % 3);
    cell.classList.add(qClass);

    if (d.getMonth() !== calMonth) {
      cell.classList.add("other-month");
    }

    const num = document.createElement("div");
    num.className = "cal-daynum";
    num.textContent = d.getDate();

    const summary = document.createElement("div");
    summary.className = "cal-summary";

    // KEY real (storage / comparaciones)
    const fechaKey = dn_toISODate(d);

    const today = getToday();
    const esFuturo = d > today;

    if (!esFuturo) {
      cell.addEventListener("click", () => {
        let idx = ensurePlaceholderJornada(fechaKey);

        if (idx !== -1 && jornadas[idx] && jornadas[idx].fecha === dn_normalizarFecha(fechaKey)) {
          guardarJornadas();
        }

        abrirModalJornada(idx);
      });
    } else {
      cell.classList.add("future");
    }

    const j = buscarJornadaPorFecha(fechaKey);

    if (j) {
      const tipo = dn_getTipoFromFlags(j);

      const cr = Number(j.crupier) || 0;
      const sup = Number(j.supervisor) || 0;

      const fmtCS = (cr, sup) => {
        const total = cr + sup;
        const desc = Math.max(0, MAX_HORAS_DIA() - total);

        if (ES_SOLO_SUP()) {
          if (desc > 0) return `S:${sup} Desc:${desc}`;
          return `S:${sup}`;
        }

        if (desc > 0) return `C:${cr} S:${sup} Desc:${desc}`;
        return `C:${cr} S:${sup}`;
      };

      if (tipo === "falta") {
        summary.textContent = "FALTA";

      } else if (tipo === "compensado") {
        summary.textContent = "COMP";

      } else if (tipo === "libre") {
        summary.textContent = "LIBRE";

      } else if (tipo === "licAnual") {
        summary.textContent = "LIC ANUAL";

      } else if (tipo === "licEnfermedad") {
        summary.textContent = "LIC ENF";

      } else if (tipo === "licSinGoce") {
        summary.textContent = "LIC S/GOCE";

      } else if (tipo === "libreTrabajado") {
        const total = cr + sup;

        const def = DIA_DEFAULT();
        if (cr === def.cr && sup === def.sup && total === MAX_HORAS_DIA()) {
          summary.textContent = "LIBRE TRAB.";
        } else {
          summary.innerHTML =
            `<span class="cal-tag">LIBRE TRAB.</span><br>` +
            `${fmtCS(cr, sup)}`;
        }

      } else {
        // NORMAL

        // ✅ REGLA NUEVA: si es día completo SOLO Supervisor (cr=0 y sup=max), mostrar SUPER (también en CS)
        if (cr === 0 && sup === MAX_HORAS_DIA()) {
          summary.textContent = "SUPER";
        } else {
          summary.textContent = fmtCS(cr, sup);
        }
      }

    } else {
      summary.textContent = "";
    }

    cell.appendChild(num);
    cell.appendChild(summary);
    grid.appendChild(cell);
  }
}




// ==========================
// FUNCIONES DE FECHA
// ==========================





function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}



function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function contarDiasInclusiveHastaHoy(startDate, endDate) {
  const hoy = getToday();

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const hasta = hoy < start ? null : (hoy < end ? hoy : end);
  if (!hasta) return 0;

  const msDia = 24 * 60 * 60 * 1000;
  return Math.floor((hasta - start) / msDia) + 1; // inclusive
}





// ==========================
// RENDER FECHA / QUINCENA
// ==========================

function renderHeader() {
  const today = getToday();
  document.getElementById("todayText").textContent = formatDate(today);
}



// ==========================
// REGISTRO DE JORNADAS (MVP)
// ==========================

// ==========================
// PERSONAS + STORAGE
// ==========================


// Persona activa
let personaActivaId = null;

// Todas las personas
let personas = {};
// Alias usado por toda la app (NO cambiar el resto del código)
let jornadas = [];

// Índice en memoria (NO se persiste). Clave: "YYYY-MM-DD" (fecha ISO LOCAL normalizada)
let jornadasByFecha = new Map();

function rebuildJornadasIndex() {
  // 1) Normaliza fechas + elimina duplicados por fecha (se queda con la última)
  if (!Array.isArray(jornadas)) {
    jornadas = [];
  }

  const usados = new Set();
  const uniqueRev = [];

  for (let i = jornadas.length - 1; i >= 0; i--) {
    const j = jornadas[i];
    if (!j) continue;
    const iso = dn_normalizarFecha(j.fecha);
    if (!iso) continue;

    if (usados.has(iso)) continue; // elimina duplicado (se conserva la última ocurrencia)
    usados.add(iso);

    if (j.fecha !== iso) j.fecha = iso; // normalizar in-place
    uniqueRev.push(j);
  }

  uniqueRev.reverse();

  // Mantener la MISMA referencia de array (importante para el resto del código)
  jornadas.length = 0;
  jornadas.push(...uniqueRev);

  // 2) Reconstruir map
  jornadasByFecha = new Map();
  for (const j of jornadas) {
    const iso = dn_normalizarFecha(j?.fecha);
    if (!iso) continue;
    // j ya está normalizada arriba, pero por seguridad:
    j.fecha = iso;
    jornadasByFecha.set(iso, j);
  }
}

function getJornadaByFecha(fechaIso) {
  const key = dn_normalizarFecha(fechaIso);
  if (!key) return undefined;
  if (!jornadasByFecha || !(jornadasByFecha instanceof Map) || jornadasByFecha.size === 0) {
    rebuildJornadasIndex();
  }
  return jornadasByFecha.get(key);
}

function borrarPersonaActiva() {
  if (!personaActivaId || !personas || !personas[personaActivaId]) return false;
  const nombre = personas[personaActivaId]?.nombre || personaActivaId;
  // Confirmación inline pendiente (por ahora: sin popup)
  // console.warn(`[borrarPersonaActiva] borrando sin confirmación: ${nombre}`);

  const idBorrada = personaActivaId;

  // 1) borrar del objeto en memoria
  delete personas[idBorrada];

  // 2) elegir nueva activa (primera disponible) o null
  const ids = Object.keys(personas || {});
  personaActivaId = ids[0] || null;

  // 3) re-activar (perfil + categoría + alias jornadas) o limpiar todo si quedó vacío
  if (personaActivaId && personas[personaActivaId]) {
    activarPersona(personaActivaId, { render: false, persistir: false });
  } else {
    PERFIL_ACTUAL = null;
    CATEGORIA_ACTUAL = "CS";
    jornadas = [];
    jornadasByFecha = new Map();
  }

  // 4) reconstruir índice (por seguridad)
  rebuildJornadasIndex();

  // 5) persistir (overwrite para que NO reaparezca la persona borrada)
  guardarPersonas({ overwrite: true });

  // 6) estado UI + render único
  setAppState(decideInitialState());
  renderByAppState();

  return true;
}




function findIndexJornadaPorFecha(fechaIso) {
  const key = dn_normalizarFecha(fechaIso);
  if (!key) return -1;
  // El map asegura que como máximo hay 1 por fecha, así que este findIndex es seguro.
  return jornadas.findIndex((j) => dn_normalizarFecha(j?.fecha) === key);
}

function ensurePlaceholderJornada(fechaIso) {
  const key = dn_normalizarFecha(fechaIso);
  if (!key) return -1;

  // Asegurar índice listo
  if (!jornadasByFecha || !(jornadasByFecha instanceof Map)) {
    jornadasByFecha = new Map();
  }
  if (jornadasByFecha.size === 0 && Array.isArray(jornadas) && jornadas.length) {
    rebuildJornadasIndex();
  }

  // Ya existe
  if (jornadasByFecha.has(key)) {
    const idx = findIndexJornadaPorFecha(key);
    return idx;
  }

  // Crear placeholder vacío
  const nueva = {
    fecha: key, // ✅ ISO en storage (LOCAL normalizado)
    crupier: 0,
    supervisor: 0,
    falta: false,
    libre: false,
    libreTrabajado: false,
    compensado: false,
    licAnual: false,
    licEnfermedad: false,
    licSinGoce: false,
  };

  jornadas.push(nueva);
  jornadasByFecha.set(key, nueva);

  return jornadas.length - 1;
}

function removeJornadaAtIndex(idx) {
  if (idx === null || idx === undefined) return;
  const i = Number(idx);
  if (!Number.isFinite(i)) return;
  const j = jornadas[i];
  if (j && j.fecha) {
    const key = dn_normalizarFecha(j.fecha);
    if (key && jornadasByFecha && jornadasByFecha instanceof Map) {
      jornadasByFecha.delete(key);
    }
  }
  jornadas.splice(i, 1);
}


// ==========================
// APP STATE (flujo UI)
// ==========================
// La UI NO decide "por intuición"; decide por appState.
const APP_STATES = Object.freeze({
  NO_PERSONAS: "NO_PERSONAS",
  SETUP_PERSONA: "SETUP_PERSONA",
  READY: "READY",
});

let appState = APP_STATES.NO_PERSONAS;

function setAppState(next) {
  appState = next;
}

function decideInitialState() {
  const ids = Object.keys(personas || {});
  if (ids.length === 0) return APP_STATES.NO_PERSONAS;

  // Si existe una única persona llamada "Persona 1" (caso legacy), tratamos como setup.
  const esPersonaDefault =
    ids.length === 1 &&
    (String(personas[ids[0]]?.nombre || "").trim().toLowerCase() === "persona 1");

  return esPersonaDefault ? APP_STATES.SETUP_PERSONA : APP_STATES.READY;
}

// Mostrar/ocultar UI de setup sin depender de closures dentro de legacyInit()
function psMostrarSetup(mostrar) {
  const card = document.getElementById("personaSetup");
  if (card) card.hidden = !mostrar;

  // Intentamos ocultar el calendario / resumen si no hay personas (sin romper si no existen)
  const h2Cal = Array.from(document.querySelectorAll("h2")).find(
    (h) => (h.textContent || "").toLowerCase().includes("calendario")
  );
  if (h2Cal) h2Cal.hidden = mostrar;

  const posibles = [
    "#calendar", "#calendarGrid", "#calGrid", "#calendarHeader",
    "#resumen", "#resumenWrap", "#resumenMes", "#resumenQuincena",
    ".calendar", ".calendar-grid", ".resumen",
  ];
  posibles.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => { el.hidden = mostrar; });
  });
}

function renderByAppState() {
  // Botón "+ Nueva persona" siempre visible si existe
  const btnNueva = document.getElementById("btnNuevaPersona");
  if (btnNueva) btnNueva.hidden = false;

  const sel = document.getElementById("personaSelect");
  if (sel) sel.disabled = (appState !== APP_STATES.READY);

  // Mini-modal: mantener acciones sincronizadas con el estado
  syncPersonaActionsUI();

  if (appState === APP_STATES.READY) {
    psMostrarSetup(false);
    renderSelectorPersonas();
    bindSelectorPersonas();
    renderHeader();
    renderCalendar();
    renderResumen();
    return;
  }

  // NO_PERSONAS o SETUP_PERSONA
  psMostrarSetup(true);

  // En NO_PERSONAS, dejamos el selector vacío (si existe) y sin interacción.
  if (sel) sel.innerHTML = "";
}
let CATEGORIA_ACTUAL = "CS"; // lo dejamos para no romper otras referencias si existen

// ✅ Fuente de verdad: la persona activa
const ES_SOLO_SUP = () => {
  if (!personaActivaId) return false;
  const p = personas[personaActivaId];
  return !!p && p.categoria === "S";
};

const DIA_DEFAULT = () => (ES_SOLO_SUP()
  ? { cr: 0, sup: MAX_HORAS_DIA() }
  : { cr: MAX_HORAS_DIA(), sup: 0 }
);






// ==========================
// CARGA DESDE STORAGE
// ==========================
function cargarPersonas() {
  try {
    const state = personasRepo.loadState();

    // --- Caso 1: storage nuevo vacío ---
    // Si no hay datos en el storage nuevo, NO crear Persona 1 automáticamente.
    // Solo migramos desde el esquema viejo si existen jornadas viejas reales.
    if (!state) {
      const legacyJornadas = jornadasRepo.loadLegacy();

      if (Array.isArray(legacyJornadas) && legacyJornadas.length > 0) {
        personas = {
          p1: {
            nombre: "Persona 1",
            categoria: "CS",
            perfil: {
              horasPorDia: MAX_HORAS_DIA(),
              libresPorQuincena: MAX_LIBRES_QUINCENA(),
              topeQuincena: HORAS_QUINCENA(),
            },
            jornadas: legacyJornadas,
          },
        };

        personaActivaId = "p1";
        guardarPersonas();
      } else {
        personas = {};
        personaActivaId = null;
        jornadas = [];
        jornadasByFecha = new Map();
      }

      return;
    }

    // --- Caso 2: storage nuevo con datos ---
    personas = state.personas || {};
    personaActivaId = state.personaActivaId;

    // Limpieza: si ya existe storage nuevo, vaciamos legacy para evitar confusión
    try {
      const legacy = jornadasRepo.loadLegacy();
      if (Array.isArray(legacy) && legacy.length > 0) {
        jornadasRepo.saveLegacy([]);
      }
    } catch (e) {
      console.warn("No se pudo limpiar legacy jornadas:", e);
    }

    if (!personaActivaId || !personas[personaActivaId]) {
      personaActivaId = Object.keys(personas)[0] || null;
    }

    // Activar persona (aplica perfil + jornadas)
    if (personaActivaId) {
      activarPersona(personaActivaId, { render: false, persistir: false });
    } else {
      jornadas = [];
    }
  } catch (e) {
    console.error("Error cargando personas:", e);
    personas = {};
    personaActivaId = null;
    jornadas = [];
  }
}



// ==========================
// GUARDAR
// ==========================



function guardarPersonas(opts = {}) {
  const { overwrite = false } = (opts && typeof opts === "object") ? opts : {};
  try {
    // Si overwrite=true, guardamos EXACTAMENTE lo que hay en memoria.
    // Esto es clave para operaciones destructivas (ej: borrar persona),
    // porque un merge con storage reintroduce claves borradas.
    const stored = overwrite ? null : (personasRepo.loadState() || null);
    const storedPersonas =
      stored && stored.personas && typeof stored.personas === "object"
        ? stored.personas
        : {};

    const mergedPersonas = overwrite
      ? { ...(personas && typeof personas === "object" ? personas : {}) }
      : {
          ...storedPersonas,
          ...(personas && typeof personas === "object" ? personas : {}),
        };

    // La persona activa siempre guarda SUS jornadas actuales
    if (personaActivaId && mergedPersonas[personaActivaId]) {
      mergedPersonas[personaActivaId] = {
        ...mergedPersonas[personaActivaId],
        jornadas: Array.isArray(jornadas) ? jornadas : [],
      };
    }

    // Persistir el state completo
    const newState = {
      personaActivaId: personaActivaId || stored?.personaActivaId || null,
      personas: mergedPersonas,
    };

    personasRepo.saveState(newState);

    // Mantener memoria alineada
    personas = mergedPersonas;
    personaActivaId = newState.personaActivaId;
  } catch (e) {
    console.error("Error guardando personas:", e);
  }
}





// ==========================
// PERSONA ACTIVA (cambio de persona)
// ==========================

function perfilDesdePersona(p) {
  const pf = p?.perfil || {};

  // Normalizamos a la estructura que ya usa la app
  const horasPorDia = Number(pf.horasPorDia) || 8;
  const libresPorQuincena = Number(pf.libresPorQuincena) || 3;
  const topeQuincena = Number(pf.topeQuincena) || 88;

  return {
    id: `persona_${p?.nombre || "sin_nombre"}`,
    nombre: `Perfil de ${p?.nombre || "Persona"}`,
    maxHorasDia: horasPorDia,
    maxLibresQuincena: libresPorQuincena,
    horasQuincena: topeQuincena,
  };
}

function activarPersona(personaId, opts = {}) {
  const { render = true, persistir = true } = opts;

  if (!personas || !personas[personaId]) {
    console.warn("activarPersona: persona inexistente", personaId);
    return;
  }

  personaActivaId = personaId;

  // ✅ Sincronizar categoría activa desde la persona (S o CS)
  CATEGORIA_ACTUAL = (personas[personaId].categoria === "S") ? "S" : "CS";


  // Alias de jornadas para el resto del legacy
  jornadas = Array.isArray(personas[personaId].jornadas) ? personas[personaId].jornadas : [];

  // Reconstruir índice
  rebuildJornadasIndex();

  if (persistir) guardarPersonas();
  if (render) renderByAppState();
}


// API interna requerida por el legacy/UI
function getPersonas() {
  return Object.keys(personas || {});
}

function getPersonaActiva() {
  return personaActivaId;
}

function setPersonaActiva(id) {
  activarPersona(id, { render: true, persistir: true });
}

// Compat: exponer para test manual (si lo querés usar desde consola)
window.setPersonaActiva = setPersonaActiva;
window.getPersonaActiva = getPersonaActiva;
window.getPersonas = getPersonas;

// ==========================
// CREAR PERSONA (sin UI)
// ==========================

function _nuevoIdPersona() {
  const ids = Object.keys(personas || {});
  let n = 1;
  while (ids.includes("p" + n)) n++;
  return "p" + n;
}

function _clampNumero(x, min, max, def) {
  const v = Number(x);
  if (!Number.isFinite(v)) return def;
  return Math.min(max, Math.max(min, v));
}

function crearPersona(nombre, categoria, horasPorDia, libresPorQuincena, activar = false) {
  const id = _nuevoIdPersona();

  const nombreOk = (String(nombre || "").trim() || `Persona ${id}`).trim();
  const cat = (categoria === "S") ? "S" : "CS";

  const h = _clampNumero(horasPorDia, 0.5, 9, 8);
  // redondeo a múltiplos de 0.5
  const horas = Math.round(h * 2) / 2;

  const libres = Math.round(_clampNumero(libresPorQuincena, 2, 12, 3));

  personas[id] = {
    nombre: nombreOk,
    categoria: cat,
    perfil: {
      horasPorDia: horas,
      libresPorQuincena: libres,
      topeQuincena: 88, // por ahora fijo según tu regla
    },
    jornadas: [],
  };

  // Guardar
  guardarPersonas();

  // Activar si se pidió
  if (activar) {
    activarPersona(id, { render: true, persistir: true });
  }

  return id;
}

// Exponer para test manual
window.crearPersona = (nombre, categoria, horasPorDia, libresPorQuincena, activar = false) =>
  crearPersona(nombre, categoria, horasPorDia, libresPorQuincena, activar);




// ==========================
// JORNADAS - PERSISTENCIA
// ==========================
// Fase 3: la UI no toca localStorage. Toda persistencia pasa por repositorios.
// En esta versión legacy, las jornadas se guardan dentro de la persona activa (guardarPersonas()).

function guardarJornadas() {
  guardarPersonas();
}



// ==========================================================
// HERRAMIENTA (manual, una sola vez):
// Limpia del storage todas las jornadas "fantasma" NORMAL 8/0 sin flags.
// Uso (con la app abierta): abrir consola y ejecutar:
//   limpiarJornadasFantasma80()
// Devuelve un resumen por consola y re-renderiza.
// ==========================================================
window.limpiarJornadasFantasma80 = function limpiarJornadasFantasma80() {
  const antes = jornadas.length;

  const nuevas = jornadas.filter(j => {
    // Remover solamente NORMAL 8/0 sin flags (día asumido)
    if (dn_esNormalAsumida80(j)) return false;
    return true;
  });

  const removidas = antes - nuevas.length;
  jornadas.length = 0;
  jornadas.push(...nuevas);

  if (removidas > 0) guardarJornadas();
}
  ;

function cargarJornadas() {
  const data = (() => {
    try {
      return jornadasRepo.loadLegacy();
    } catch (e) {
      console.error("cargarJornadas: error leyendo storage legacy:", e);
      return [];
    }
  })();
  if (!Array.isArray(data) || data.length === 0) return;

  let huboMigracion = false;

  const normalizadas = data
    .map((j) => {
      if (!j || !j.fecha) return null;

      // Normaliza DMY/Date/ISO a ISO YYYY-MM-DD
      const iso = dn_normalizarFecha(j.fecha);
      if (!iso) return null;

      if (j.fecha !== iso) huboMigracion = true;

      return {
        ...j,
        fecha: iso,
      };
    })
    .filter(Boolean);

  // mantener referencia del array original
  jornadas.length = 0;
  jornadas.push(...normalizadas);
  // Reconstruir índice en memoria + eliminar duplicados
  rebuildJornadasIndex();

  // Si migramos, re-guardamos para no repetir conversiones
  if (huboMigracion) {
    guardarJornadas();
}
}


function buscarJornadaPorFecha(fecha) {
  return getJornadaByFecha(fecha);
}



function pedirHorasConReintento(titulo, valorActual) {
  while (true) {
    const s = uiPrompt(titulo, valorActual);
    if (s === null) return null; // canceló

    const n = dn_normalizarNumero(s);

    if (!dn_esNumeroValido(n)) {
      uiAlert("Valor inválido. Usá múltiplos de 0.5 (ej: 6, 7.5) y no negativos.");
      continue;
    }

    return n; // válido
  }
}


function pedirSupervisorConTope(crupier, valorActual, maxTotal = MAX_HORAS_DIA()) {
  while (true) {
    const sup = pedirHorasConReintento(
      "Horas de Supervisor (múltiplos de 0.5):",
      valorActual
    );
    if (sup === null) return null;

    const v = dn_validarHoras(crupier, sup, maxTotal);
    if (!v.ok) {
      uiAlert(v.msg);
      continue; // vuelve a pedir supervisor
    }

    return sup;
  }
}




function editarJornada(index) {

  _mjIndexActual = index;

  const j = jornadas[index] || {};

  // Tipo por flags (lógica pura en domain)
  const tipo = dn_getTipoFromFlags(j);

  // Radios
  const r = document.querySelector(`input[name="mjTipo"][value="${tipo}"]`);
  if (r) r.checked = true;

  // Inputs horas
  const inpCr = document.getElementById("mjDesc");
  const inpSup = document.getElementById("mjSupervisor");
  if (inpCr) inpCr.value = (j.crupier ?? 0);
  if (inpSup) inpSup.value = (j.supervisor ?? 0);

  // Modal
  const modal = document.getElementById("modalJornada");
  if (!modal) {
    console.error("No existe #modalJornada en el HTML");
    return;
  }

  // ====== ✅ Tope LIBRE: deshabilitar radio si ya hay 3 en la quincena ======
  try {
    const radioLibre = document.querySelector('input[name="mjTipo"][value="libre"]');
    if (radioLibre) {
      const keyActual = dn_normalizarFecha(j.fecha);
      let qIndexActual = null;

      const firstDay = new Date(calYear, calMonth, 1);
      const startOffset = firstDay.getDay();
      const startDate = dn_addDays(firstDay, -startOffset);



      for (let i = 0; i < 42; i++) {
        const d = dn_addDays(startDate, i);
        const keyD = dn_toISODate(d);
        if (keyD === keyActual) {
          qIndexActual = dn_getQuincenaIndex(d);
          break;
        }
      }

      if (qIndexActual !== null) {
        let libres = 0;

        for (let i = 0; i < jornadas.length; i++) {
          const jj = jornadas[i];
          if (!jj || !jj.fecha) continue;
          if (jj.libre !== true) continue;

          const keyJJ = dn_normalizarFecha(jj.fecha);
          let qIdx = null;

          for (let k = 0; k < 42; k++) {
            const d = dn_addDays(startDate, k);
            const keyD = dn_toISODate(d);
            if (keyD === keyJJ) {
              qIdx = dn_getQuincenaIndex(d);
              break;
            }
          }

          if (qIdx === qIndexActual) libres++;
        }

        const estaFechaYaEsLibre = (j.libre === true);
        const deboBloquear = (libres >= MAX_LIBRES_QUINCENA()) && !estaFechaYaEsLibre;
        radioLibre.disabled = deboBloquear;
      } else {
        radioLibre.disabled = false;
      }
    }
  } catch (e) {
    console.warn("No se pudo aplicar tope de LIBRE:", e);
  }
  // ====== FIN TOPE LIBRE ======

  // Aplicar UI según tipo si existe helper
  if (window._mj_aplicarUIporTipo) window._mj_aplicarUIporTipo();

  // Mostrar (forzado y limpio)
  modal.hidden = false;
  modal.removeAttribute("hidden");
  modal.style.display = "";

}




function changeMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}






function renderCalendar() {
  renderCalendarHeader();
  renderCalendarGrid();
  renderResumen();
}

// ===== Modal Jornada (HTML) - controlador =====
let _mjIndexActual = null;

let _mjPaso = "sup";  // "sup" o "desc"
let _mjTempDesc = 0;
let _mjTempSup = 0;

let _mjTipoPrev = null;

// Guardamos el estado original del registro al abrir el modal (para decidir si es un "placeholder vacío")
let _mjEraPlaceholderVacio = false;
let _mjOriginalCr = 0;
let _mjOriginalSup = 0;

// Leyendas del modal
let _mjTipoOriginal = "normal";
let _mjFechaOriginal = null;


function _mjLabelDeInput(inputId) {
  const inp = document.getElementById(inputId);
  return inp ? inp.closest("label") : null;
}

function _mjSetPaso(paso) {
  _mjPaso = paso;

  const lblDesc = _mjLabelDeInput("mjDesc");
  const lblSup = _mjLabelDeInput("mjSupervisor");
  const btnOk = _mjEl("mjOk");

  const soloSup = ES_SOLO_SUP();

  if (paso === "sup") {
    if (lblSup) lblSup.hidden = false;
    if (lblDesc) lblDesc.hidden = true;

    // ✅ En Supervisor permanente no hay paso 2: se guarda desde sup
    if (btnOk) btnOk.textContent = soloSup ? "Guardar" : "Continuar";

    setTimeout(() => {
      const inp = _mjEl("mjSupervisor");
      if (inp) { inp.focus(); inp.select(); }
    }, 0);
    return;
  }

  // paso === "desc"
  if (lblSup) lblSup.hidden = true;
  if (lblDesc) lblDesc.hidden = false;
  if (btnOk) btnOk.textContent = "Guardar";
  setTimeout(() => {
    const inp = _mjEl("mjDesc");
    if (inp) { inp.focus(); inp.select(); }
  }, 0);
}



function _mjEl(id) { return document.getElementById(id); }

function _mjGetTipo() {
  const r = document.querySelector('input[name="mjTipo"]:checked');
  return r ? r.value : "normal";
}

function _mjSetTipo(tipo) {
  const radio = document.querySelector(`input[name="mjTipo"][value="${tipo}"]`);
  if (radio) radio.checked = true;
}


function _mjMostrarMsg(txt) {
  const box = _mjEl("mjMsg");
  if (!box) return;

  if (!txt || String(txt).trim() === "") {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }

  box.hidden = false;
  box.innerHTML = String(txt).replace(/\n/g, "<br>");
}






// ==========================
// LEYENDAS (mjInfo / mjCambiando)
// ==========================

function _mjTipoLabel(tipo) {
  switch (tipo) {
    case "normal": return "Normal";
    case "falta": return "Falta";
    case "libre": return "Libre";
    case "libreTrabajado": return "Libre trabajado";
    case "compensado": return "Compensado";
    case "licAnual": return "Licencia anual";
    case "licEnfermedad": return "Licencia enfermedad";
    case "licSinGoce": return "Licencia sin goce";
    default: return String(tipo || "");
  }
}

function _mjFormatoFechaDMY(isoLike) {
  const key = dn_normalizarFecha(isoLike);
  if (!key) return "—";
  // key: YYYY-MM-DD
  const y = key.slice(0, 4);
  const m = key.slice(5, 7);
  const d = key.slice(8, 10);
  return `${d}/${m}/${y}`;
}

function _mjImpactoTexto(tipo, j) {
  // Nota: esto es SOLO UI (texto humano). No cambia reglas del negocio.
  const cr = Number(j?.crupier) || 0;
  const sup = Number(j?.supervisor) || 0;
  const total = cr + sup;

  if (tipo === "falta") {
    return `Genera descuento de ${MAX_HORAS_DIA()} hs`;
  }

  if (tipo === "libre") {
    return `LIBRE (tope ${MAX_LIBRES_QUINCENA()} por quincena).`;
  }

  if (tipo === "compensado") {
    return "Usa 1 saldo de LIBRE TRABAJADO.";
  }

  if (tipo === "libreTrabajado") {
    return "Aumenta saldo de LIBRE TRABAJADO.";
  }

  // normal
  if (total >= MAX_HORAS_DIA()) return "Trabajado sin descuento.";
  if (total > 0) return `Genera descuento de ${MAX_HORAS_DIA() - total} hs`;
  return "Día normal";
}

function _mjSetInfo(txt) {
  const el = _mjEl("mjInfo");
  if (el) el.textContent = txt || "—";
}

function _mjSetCambiando(txt, visible) {
  const el = _mjEl("mjCambiando");
  if (!el) return;
  if (visible) {
    el.hidden = false;
    el.textContent = txt || "";
  } else {
    el.hidden = true;
    el.textContent = "";
  }
}





function _mjActualizarLeyendas() {
  if (_mjIndexActual === null) return;

  const j = jornadas[_mjIndexActual];
  if (!j) return;

  // Tipo seleccionado actualmente (target)
  const tipoActual = _mjGetTipo ? _mjGetTipo() : dn_getTipoFromFlags(j);

  // ¿Cambia el tipo respecto al original?
  const difiereTipo = (tipoActual !== _mjTipoOriginal);

  // ¿Cambia horas respecto al original?
  const crTxt = ((_mjEl("mjDesc")?.value || "") + "").trim().replace(",", ".");
  const supTxt = ((_mjEl("mjSupervisor")?.value || "") + "").trim().replace(",", ".");
  const cr = crTxt === "" ? 0 : Number(crTxt);
  const sup = supTxt === "" ? 0 : Number(supTxt);
  const difiereHoras = (cr !== _mjOriginalCr) || (sup !== _mjOriginalSup);

  const hayCambios = difiereTipo || difiereHoras;

  // IMPORTANTE: NO tocamos mjInfo acá.
  // mjInfo queda como "estado actual/original" (lo setea al abrir con _mjSetInfoSuperior).

  if (hayCambios) {
    _mjSetCambiando(`Cambiando a: ${_mjTipoLabel(tipoActual)}`, true);
  } else {
    // Si preferís ocultarlo en vez de "Sin cambios.", lo cambiamos después (otro paso)
    _mjSetCambiando("Sin cambios.", true);
  }
}


const aplicarUIporTipo = () => {
  const tipo = _mjGetTipo();
  const descInp = _mjEl("mjDesc");
  const supInp = _mjEl("mjSupervisor");
  const btnOk = _mjEl("mjOk");

  const habil = dn_horasHabilitadas(tipo);

  if (descInp) descInp.disabled = !habil;
  if (supInp) supInp.disabled = !habil;

  const lblDesc = _mjLabelDeInput("mjDesc");
  const lblSup = _mjLabelDeInput("mjSupervisor");

  _mjMostrarMsg("");

  // Tipos sin horas
  if (!habil) {
    if (lblDesc) lblDesc.hidden = true;
    if (lblSup) lblSup.hidden = true;
    if (btnOk) btnOk.textContent = "Continuar";

    if (descInp) descInp.value = "0";
    if (supInp) supInp.value = "0";

    _mjPaso = "sup";
    _mjTempDesc = 0;
    _mjTempSup = 0;
    _mjTipoPrev = tipo;
    return;
  }

  // Tipos con horas: SIEMPRE arrancar pidiendo Supervisor (Paso 1)
  // ✅ En Supervisor permanente: NO hay paso 2, el botón debe decir "Guardar"
  const soloSup = ES_SOLO_SUP();

  // Si venimos de un tipo sin horas y pasamos a Normal/Libre trabajado, forzamos un arranque determinista
  if ((tipo === "normal" || tipo === "libreTrabajado") && _mjTipoPrev && _mjTipoPrev !== tipo) {
    if (supInp) supInp.value = "0";
    if (descInp) descInp.value = "0"; // queda oculto hasta el paso 2 (CS)
  }

  if (lblSup) lblSup.hidden = false;
  if (lblDesc) lblDesc.hidden = true;

  _mjPaso = "sup";
  if (btnOk) btnOk.textContent = soloSup ? "Guardar" : "Continuar";

  setTimeout(() => {
    if (supInp) { supInp.focus(); supInp.select(); }
  }, 0);

  _mjTipoPrev = tipo;
};




function _mjLeerHoras() {
  const crTxt = (_mjEl("mjDesc").value || "").trim().replace(",", ".");
  const supTxt = (_mjEl("mjSupervisor").value || "").trim().replace(",", ".");

  const cr = crTxt === "" ? 0 : Number(crTxt);
  const sup = supTxt === "" ? 0 : Number(supTxt);

  // ✅ Validación centralizada en domain.js
  const v = dn_validarHoras(cr, sup, MAX_HORAS_DIA());
  if (!v.ok) return { ok: false, msg: v.msg };

  return { ok: true, cr, sup };
}



/*
const MAX_LIBRES_POR_QUINCENA = 3;

function bloquearRadioLibreSiCorresponde(fecha, jornadaActual) {
  const qIndex = dn_getQuincenaIndex(fecha);

  const libres = jornadas.filter(
    j => j.qIndex === qIndex && j.tipo === "LIBRE"
  ).length;

  const estaFechaYaEsLibre =
    jornadaActual && jornadaActual.tipo === "LIBRE";

  const radioLibre = document.getElementById("radioLibre");
  const msg = document.getElementById("msgTopeLibre");

  const deboBloquear =
    libres >= MAX_LIBRES_POR_QUINCENA && !estaFechaYaEsLibre;

  if (radioLibre) radioLibre.disabled = deboBloquear;

  if (msg) {
    msg.style.display = deboBloquear ? "block" : "none";
    msg.textContent = deboBloquear
      ? `Tope alcanzado: máximo ${MAX_LIBRES_POR_QUINCENA} libres en la quincena.`
      : "";
  }
}
*/
function abrirModalJornada(index) {
  _mjIndexActual = index;

  const j = jornadas[index];
  _mjSetInfoSuperior(j);

  // Valores almacenados (modelo legacy)
  const crStored = Number(j.crupier) || 0;
  const supStored = Number(j.supervisor) || 0;

  // Estado original (para decidir si este registro nació como 'día vacío')
  _mjEraPlaceholderVacio = (
    crStored === 0 &&
    supStored === 0 &&
    !j.falta && !j.libre && !j.libreTrabajado && !j.compensado &&
    !j.licAnual && !j.licEnfermedad && !j.licSinGoce
  );

  // Tipo según flags existentes
  const tipo = dn_getTipoFromFlags(j);
  _mjSetTipo(tipo);

  // Guardar estado original para leyendas
  _mjTipoOriginal = tipo;
  _mjFechaOriginal = j.fecha;

  // ----------------------------
  // UI: los inputs son SUP + DESC (CR se deriva)
  // DESC = BASE - (CR + SUP)
  // En categoría "S" (solo supervisor/permanente): se ingresa SOLO DESC (en mjSupervisor)
  // ----------------------------
  const base = MAX_HORAS_DIA();
  let descStored = base - (crStored + supStored);
  if (!Number.isFinite(descStored)) descStored = 0;
  if (descStored < 0) descStored = 0;
  if (descStored > base) descStored = base;

  const soloSup = ES_SOLO_SUP();

  // Originales (para "Sin cambios" / "Cambiando a…")
  _mjOriginalCr = soloSup ? 0 : descStored;          // mjDesc (solo en CS)
  _mjOriginalSup = soloSup ? descStored : supStored; // mjSupervisor (en S = DESC)

  // Precargar inputs según categoría
  const inpDesc = _mjEl("mjDesc");
  const inpSup = _mjEl("mjSupervisor");

  if (soloSup) {
    // S: se ingresa DESCUENTO (en mjSupervisor)
    if (inpDesc) inpDesc.value = "0";
    if (inpSup) inpSup.value = String(_mjOriginalSup ?? 0);
  } else {
    // CS: paso 1 = Supervisor, paso 2 = Descuento
    if (inpDesc) inpDesc.value = String(_mjOriginalCr ?? 0);
    if (inpSup) inpSup.value = String(_mjOriginalSup ?? 0);
  }

  // Aplicar UI correcta (la que maneja labels + pasos)
  if (window._mj_aplicarUIporTipo) {
    window._mj_aplicarUIporTipo();
  } else {
    aplicarUIporTipo();
  }

  // Forzar paso inicial coherente
  if (dn_horasHabilitadas(tipo)) {
    _mjTempSup = 0;
    _mjTempDesc = 0;
    _mjSetPaso("sup");
  } else {
    setTimeout(() => _mjEl("mjOk")?.focus(), 0);
  }

  _mjActualizarLeyendas();
  _mjEl("modalJornada").hidden = false;
}




function cerrarModalJornada() {
  // Si este registro nació como placeholder vacío (0/0 sin flags)
  // y el usuario cierra el modal sin guardar nada real, lo eliminamos
  // para evitar "días fantasma" 0/0 en el calendario.
  if (_mjIndexActual !== null) {
    const j = jornadas[_mjIndexActual];

    if (j && _mjEraPlaceholderVacio) {
      const cr = Number(j.crupier) || 0;
      const sup = Number(j.supervisor) || 0;

      const sinFlags = !j.falta && !j.libre && !j.libreTrabajado && !j.compensado && !j.licAnual && !j.licEnfermedad && !j.licSinGoce;

      if (sinFlags && cr === 0 && sup === 0) {
        removeJornadaAtIndex(_mjIndexActual);
        guardarJornadas();
        renderCalendar();
      }
    }
  }

  _mjEl("modalJornada").hidden = true;
  _mjIndexActual = null;
  _mjEraPlaceholderVacio = false;
  _mjMostrarMsg("");
}









// Inicializar listeners del modal (1 sola vez)

// ===============================
// LEGACY INIT (migrado a init único)
// ===============================
export function legacyInit() {
  if (legacyInit._didRun) return;
  legacyInit._didRun = true;



  // ===============================
  // Reiniciar (solo UI, no guarda)
  // ===============================
  const btnReset = document.getElementById("mjReset");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (_mjIndexActual === null) return;

      // 1) Volver al tipo ORIGINAL (radio)
      _mjSetTipo(_mjTipoOriginal);

      // 2) Reaplicar UI del tipo (igual que cuando cambiás radios)
      if (window._mj_aplicarUIporTipo) window._mj_aplicarUIporTipo();

      // 3) Volver a horas ORIGINALES (sin inventar MAX/0)
      const cr = document.getElementById("mjDesc");
      const sup = document.getElementById("mjSupervisor");
      if (cr) cr.value = String(_mjOriginalCr ?? 0);
      if (sup) sup.value = String(_mjOriginalSup ?? 0);

      // 4) Reset del flujo de 2 pasos (Normal / Libre Trab.)
      _mjTempDesc = 0;
      _mjTempSup = 0;
      _mjPaso = "sup";

      // 5) Limpiar mensaje (si estuviera)
      if (typeof _mjMostrarMsg === "function") _mjMostrarMsg("");

      // 6) Recalcular leyendas (debe quedar sin “Cambiando a…”)
      _mjActualizarLeyendas();

      // 7) Foco coherente
      const tipo = _mjGetTipo();
      const habil = dn_horasHabilitadas(tipo);
      if (habil) {
        setTimeout(() => {
          if (cr) {
            cr.focus();
            cr.select();
          }
        }, 0);
      } else {
        setTimeout(() => _mjEl("mjOk")?.focus(), 0);
      }
    });
  }



  const modal = _mjEl("modalJornada");
  if (!modal) return;

  // asegurar cerrado al cargar
  modal.hidden = true;

  // Estado flujo 2 pasos
  _mjPaso = "sup";
  _mjTempDesc = 0;

  // UI del modal (unificada): usamos aplicarUIporTipo + _mjSetPaso globales

  // Cancelar
  _mjEl("mjCancel").addEventListener("click", () => cerrarModalJornada());




  _mjEl("mjOk").addEventListener("click", () => {
    if (_mjIndexActual === null) return;

    const j = jornadas[_mjIndexActual];
    const tipo = _mjGetTipo();

    // ===============================
    // Control: máximo LIBRES por quincena (según perfil)
    // ===============================
    if (tipo === "libre") {
      const fechaActual = dn_normalizarFecha(j?.fecha);
      const yaEraLibre = !!j?.libre;

      if (!yaEraLibre && fechaActual) {
        const qIndexActual = dn_getQuincenaIndex(
          new Date(fechaActual + "T00:00:00")
        );

        let libres = 0;

        for (let i = 0; i < jornadas.length; i++) {
          const jj = jornadas[i];
          if (!jj || jj.libre !== true) continue;

          const keyJJ = dn_normalizarFecha(jj.fecha);
          if (!keyJJ) continue;

          const qIdx = dn_getQuincenaIndex(
            new Date(keyJJ + "T00:00:00")
          );

          if (qIdx === qIndexActual) {
            libres++;
          }
        }

        // ✅ Bloquear al intentar marcar el (máximo + 1)
        if (libres >= MAX_LIBRES_QUINCENA()) {
          _mjMostrarMsg(
            "Ya se alcanzó el máximo de días LIBRES en esta quincena. Elegí otra opción o presioná Cancelar."
          );
          return;
        }
      }
    }


    // ===============================
    // Aplicar tipo (flags)
    // ===============================
    dn_aplicarTipoAFlags(j, tipo);

    // ===============================
    // Tipos sin horas → guardar directo
    // ===============================
    if (!dn_horasHabilitadas(tipo)) {
      j.crupier = 0;
      j.supervisor = 0;

      guardarJornadas();
      cerrarModalJornada();
      renderCalendar();
      return;
    }

    // ===============================
        const cr = _mjEl("mjDesc");
    const sup = _mjEl("mjSupervisor");

    // ===============================
    // PASO SUPERVISOR (1)  — primero
    // ===============================
    if (_mjPaso === "sup") {
      const supTxt = (sup.value || "").trim().replace(",", ".");
      const supVal = supTxt === "" ? 0 : Number(supTxt);

      const max = MAX_HORAS_DIA();

      // Validación básica (solo SUP)
      const vSup = dn_validarHoras(0, supVal, max);
      if (!vSup.ok) {
        _mjMostrarMsg(vSup.msg);
        return;
      }

      // ⚠️ Categoría S (solo supervisor): se mantiene el comportamiento actual por ahora
      if (ES_SOLO_SUP()) {
        j.crupier = 0;
        j.supervisor = supVal;

        guardarJornadas();
        cerrarModalJornada();
        renderCalendar();
        return;
      }

      // Si SUP completa la jornada: termina acá (no pedir descuento)
      if (supVal >= max) {
        j.crupier = 0;
        j.supervisor = max;

        guardarJornadas();
        cerrarModalJornada();
        renderCalendar();
        return;
      }

      // SUP parcial: pasar a DESCUENTO
      _mjTempSup = supVal;

      // Default del descuento: saldo restante (BASE - SUP)
      const descDefault = Math.max(0, max - supVal);
      cr.value = String(descDefault);

      // Limpiar mensaje
      _mjMostrarMsg("");

      _mjSetPaso("desc");
      return;
    }

    // ===============================
    // PASO DESCUENTO (2) — condicional
    // ===============================
    const descTxt = (cr.value || "").trim().replace(",", ".");
    const descVal = descTxt === "" ? 0 : Number(descTxt);

    const max = MAX_HORAS_DIA();
    const supVal = Number(_mjTempSup) || 0;

    // Validación (SUP + DESC <= MAX)
    const v = dn_validarHoras(descVal, supVal, max);
    if (!v.ok) {
      _mjMostrarMsg(v.msg);
      return;
    }

    // Normal / Libre trabajado: no puede ser 0 horas trabajadas (descuento completo)
    if ((tipo === "normal" || tipo === "libreTrabajado") && descVal >= max) {
      _mjMostrarMsg(
        "No podés marcar Normal/Libre trabajado si no trabajó horas (descuento completo)."
      );
      return;
    }

    const crCalc = Math.max(0, max - supVal - descVal);

    // ===============================
    // Regla DÍA VACÍO (normal 8/0)
    // ===============================
    const defCS = DIA_DEFAULT();
    if (tipo === "normal" && crCalc === defCS.cr && supVal === defCS.sup) {
      // si queda igual al default (ej: 8/0), no guardamos registro
      jornadas.splice(_mjIndexActual, 1);
      guardarJornadas();
      cerrarModalJornada();
      renderCalendar();
      return;
    }

    // ===============================
    // Guardar jornada (modelo REAL)
    // BASE = CR + SUP + DESC
    // ===============================
    j.crupier = crCalc;
    j.supervisor = supVal;

    guardarJornadas();
    cerrarModalJornada();
    renderCalendar();
  });





  // Cambios de radio
  document.querySelectorAll('input[name="mjTipo"]').forEach(r => {
    r.addEventListener("change", () => {
      aplicarUIporTipo();
      _mjActualizarLeyendas();

      // ✅ Advertencia COMPENSADO sin saldo (solo si NO estaba ya en compensado)
      const tipo = _mjGetTipo();

      const msgBox = _mjEl("mjMsg");
      const msgActual = (msgBox && !msgBox.hidden) ? (msgBox.textContent || "") : "";

      const ES_MSG_SALDO_COMP =
        msgActual.includes("COMPENSADO") && msgActual.toLowerCase().includes("saldo");

      if (tipo === "compensado" && _mjTipoOriginal !== "compensado") {
        const saldoGlobal = dn_calcularSaldoLibresTrabajadosGlobal(jornadas);
        if ((Number(saldoGlobal.saldo) || 0) < 1) {
          _mjMostrarMsg(
            "⚠️ COMPENSADO sin saldo de Libres Trabajados.\n" +
            "Si querés continuar igual, presioná Aceptar.\n" +
            "Si no, Reiniciar o Cancelar."
          );
        } else {
          // Si hay saldo, limpiar solo si era nuestro mensaje
          if (ES_MSG_SALDO_COMP) _mjMostrarMsg("");
        }
      } else {
        // Si sale de compensado, limpiar solo si era nuestro mensaje
        if (ES_MSG_SALDO_COMP) _mjMostrarMsg("");
      }
    });
  });
  // ===== SETUP PRIMERA PERSONA (UI) =====
  function _psEl(id) { return document.getElementById(id); }

  function _psMsg(txt) {
    const el = _psEl("psMsg");
    if (el) el.textContent = txt || "";
  }

  function _psClamp(x, min, max, def) {
    const n = Number(x);
    if (!Number.isFinite(n)) return def;
    return Math.max(min, Math.min(max, n));
  }

  function _psMostrarSetup(mostrar) {
    const card = _psEl("personaSetup");
    if (card) card.hidden = !mostrar;

    // Intentamos ocultar el calendario / resumen si no hay personas (sin romper si no existen)
    const h2Cal = Array.from(document.querySelectorAll("h2")).find(h => (h.textContent || "").toLowerCase().includes("calendario"));
    if (h2Cal) h2Cal.hidden = mostrar;

    const posibles = [
      "#calendar", "#calendarGrid", "#calGrid", "#calendarHeader",
      "#resumen", "#resumenWrap", "#resumenMes", "#resumenQuincena",
      ".calendar", ".calendar-grid", ".resumen"
    ];
    posibles.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.hidden = mostrar; });
    });
  }




// Compat: si algo lo llama desde afuera, lo mantenemos.
window._psBindCrearPersona = function _psBindCrearPersona() {
  bindPersonaSetup();
};



  // =====================================

  // ===== INIT PERSONAS/UI (un solo flujo) =====
  cargarPersonas();
  // cargarJornadas();  // DESACTIVADO: las jornadas viven dentro de cada persona (evita pisadas/intermitencia)
  bindCalendarNav();

  // Bind setup (crear persona) una sola vez
  bindPersonaSetup();

  // [DESACTIVADO] Bind directo de "+ Nueva persona" (reemplazado por bindPersonaActions)
  // Botón "+ Nueva persona" -> SIEMPRE entra a SETUP_PERSONA
  // const btnNueva = document.getElementById("btnNuevaPersona");
  // if (btnNueva) {
  //   btnNueva.onclick = () => {
  //     bindPersonaSetup();
  //     setAppState(APP_STATES.SETUP_PERSONA);
  //     renderByAppState();
  //     setTimeout(() => _psEl("psNombre")?.focus(), 0);
  //   };
  // }

  // ✅ Binder único del bloque de acciones (delegación)
  bindPersonaActions();

  // Estado inicial + render inicial
  setAppState(decideInitialState());
  renderByAppState();

  // Exponer para usarlo al abrir el modal
  window._mj_aplicarUIporTipo = aplicarUIporTipo;
}

// ===================================================
// SETUP PERSONA - BIND (movido fuera de legacyInit)
// ===================================================
// Bind del botón "Crear" del setup (idempotente)
let _psCrearBound = false;

function bindPersonaSetup() {
  const btn = document.getElementById("psCrearBtn");
  // Si el DOM todavía no tiene el setup, no marcamos bound (porque después sí va a existir)
  if (!btn) return;

  if (_psCrearBound) return;
  _psCrearBound = true;

  const msgEl = document.getElementById("psMsg");
  const setMsg = (t) => { if (msgEl) msgEl.textContent = t || ""; };

  const clamp = (x, min, max, def) => {
    const n = Number(x);
    if (!Number.isFinite(n)) return def;
    return Math.max(min, Math.min(max, n));
  };

  btn.addEventListener("click", () => {
    setMsg("");

    const nombre = (document.getElementById("psNombre")?.value || "").trim();
    if (!nombre) { setMsg("Ingresá un nombre."); return; }

    // ✅ Normalizar categoría del select (acepta "s", "S", "cs", "CS", etc.)
    const rawCat = document.getElementById("psCategoria")?.value || "cs";
    const categoria = (String(rawCat).trim().toUpperCase() === "S") ? "S" : "CS";

    const horasPorDia = clamp(document.getElementById("psHoras")?.value, 0.5, 9, 8);
    const libresPorQuincena = clamp(document.getElementById("psLibres")?.value, 3, 12, 3);

    crearPersona(nombre, categoria, horasPorDia, libresPorQuincena, true);

    // Transición de estado: al crear, pasamos a READY.
    setAppState(APP_STATES.READY);
    renderByAppState();
  });

  // Bind del botón "Cancelar" del setup (si existe)
  const btnCancel = document.getElementById("psCancelarBtn");
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      setMsg("");
      psMostrarSetup(false);
      setAppState(decideInitialState());
      renderByAppState();
    });
  }
}


// (Opcional) exponer para debug manual
window.legacyInit = legacyInit;

// ==========================
// UI MINIMA - SELECTOR PERSONA
// ==========================

function renderSelectorPersonas() {
  const refs = UI();

  const ids = getPersonas();
  const activaId = getPersonaActiva();

  renderPersonaSelect(refs, { personas, activaId });
}

let _personaSelectBound = false;



function bindSelectorPersonas() {
  if (_personaSelectBound) return;
  _personaSelectBound = true;

  const refs = UI();

  bindPersonaSelect(refs, {
    onChangePersona: (id) => {
      setPersonaActiva(id);
      renderSelectorPersonas(); // re-sincroniza selección
    },
  });
}


// ===================================================
// MINI-MODAL / TOOLBAR - ACCIONES DE PERSONA
// ===================================================

let _personaActionsBound = false;

// Estado interno de confirmación (NO window/global)
let _personaDeleteConfirmOpen = false;

function _personaDeleteNombreActual() {
  if (!personaActivaId || !personas || !personas[personaActivaId]) return "";
  return String(personas[personaActivaId]?.nombre || personaActivaId).trim();
}

function _personaDeleteCanAskConfirm() {
  const ids = Object.keys(personas || {});
  const hayPersonas = ids.length > 0;
  const activaValida = !!(personaActivaId && personas && personas[personaActivaId]);
  return hayPersonas && activaValida;
}

function personaDeleteConfirmClose() {
  _personaDeleteConfirmOpen = false;
  syncPersonaActionsUI();
}

function personaDeleteConfirmOpen() {
  if (!_personaDeleteCanAskConfirm()) return;
  _personaDeleteConfirmOpen = true;
  syncPersonaActionsUI();
}

/**
 * Binder único del bloque #personaActions
 * - Event delegation
 * - Idempotente
 * - Sin lógica de negocio
 */
function bindPersonaActions() {
  if (_personaActionsBound) return;
  _personaActionsBound = true;

  const container = document.getElementById("personaActions");
  if (!container) return;

  container.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;

    // Cancelar confirmación
    if (btn.id === "btnCancelarBorrarPersona") {
      personaDeleteConfirmClose();
      return;
    }

    // Confirmar borrado
    if (btn.id === "btnConfirmarBorrarPersona") {
      if (!_personaDeleteCanAskConfirm()) {
        personaDeleteConfirmClose();
        return;
      }
      // Cerrar primero: evita UI colgada si el render reacomoda todo
      _personaDeleteConfirmOpen = false;
      borrarPersonaActiva();
      return;
    }

    // Click en "Borrar" => abre confirmación inline
    if (btn.id === "btnBorrarPersona") {
      if (!_personaDeleteConfirmOpen) personaDeleteConfirmOpen();
      return;
    }

    // "+ Nueva persona"
    if (btn.id === "btnNuevaPersona") {
      if (_personaDeleteConfirmOpen) personaDeleteConfirmClose();
      personaActionsNuevaPersona();
      return;
    }
  });
}


/**
 * Flujo existente de "+ Nueva persona"
 * (extraído para que el binder no tenga lógica)
 */
function personaActionsNuevaPersona() {
  setAppState(APP_STATES.SETUP_PERSONA);
  renderByAppState();
  // Ahora que el DOM del setup existe, hacemos el bind del botón Crear
  bindPersonaSetup();
  setTimeout(() => {
    const input = document.getElementById("psNombre");
    if (input) input.focus();
  }, 0);
}

/**
 * Mini-modal: decide visibilidad/habilitación del botón borrar
 * en base al estado actual.
 */
function syncPersonaActionsUI() {
  const btnBorrar = document.getElementById("btnBorrarPersona");
  const btnNueva = document.getElementById("btnNuevaPersona");
  const sel = document.getElementById("personaSelect");

  const row = document.getElementById("personaDeleteConfirmRow");
  const txt = document.getElementById("personaDeleteConfirmText");
  const btnCancel = document.getElementById("btnCancelarBorrarPersona");
  const btnConfirm = document.getElementById("btnConfirmarBorrarPersona");

  // Si falta algo del DOM principal, no rompemos
  if (!btnBorrar) return;

  const ids = Object.keys(personas || {});
  const hayPersonas = ids.length > 0;
  const activaValida = !!(personaActivaId && personas && personas[personaActivaId]);

  // Botón borrar: visible solo si hay personas
  btnBorrar.hidden = !hayPersonas;
  btnBorrar.disabled = !(hayPersonas && activaValida);

  // Si ya no se puede confirmar (por ejemplo borraste y quedó vacío), cerramos confirmación
  if (_personaDeleteConfirmOpen && !(hayPersonas && activaValida)) {
    _personaDeleteConfirmOpen = false;
  }

  // Confirm row: siempre ocupa lugar, solo cambia clase off/on
  if (row) {
    if (_personaDeleteConfirmOpen) row.classList.remove("pa-confirm--off");
    else row.classList.add("pa-confirm--off");
  }

  if (txt) {
  if (_personaDeleteConfirmOpen) {
    txt.textContent = "¿Borrar ésta persona y sus jornadas?";
  } else {
    txt.textContent = "";
  }
}


  // Bloquear controles durante confirmación (evita cambios de persona mientras confirmás)
  const lock = _personaDeleteConfirmOpen;

  if (btnConfirm) btnConfirm.disabled = !(lock && hayPersonas && activaValida);
  if (btnCancel) btnCancel.disabled = !lock;

  if (btnNueva) btnNueva.disabled = lock;
  if (sel) sel.disabled = lock || (appState !== APP_STATES.READY);
}





/* === Leyenda superior del modal === */
function _mjNombreTipo(tipo) {
  switch (tipo) {
    case "normal": return "Normal";
    case "falta": return "Falta";
    case "libre": return "Libre";
    case "libreTrabajado": return "Libre trabajado";
    case "compensado": return "Compensado";
    case "licAnual": return "Licencia anual";
    case "licEnfermedad": return "Licencia enfermedad";
    case "licSinGoce": return "Licencia sin goce";
    default: return tipo || "Normal";
  }
}

function _mjImpactoOperativo(tipo) {
  switch (tipo) {
    case "falta":
      return `Genera descuento de ${MAX_HORAS_DIA()} hs`;
    case "libre":
      return "No descuenta horas (día libre)";
    case "libreTrabajado":
      return "Suma 1 día LT";
    case "compensado":
      return "Usa 1 día LT (compensa)";
    case "normal":
    default:
      return "Trabajado sin descuento";
  }
}

function _mjSetInfoSuperior(jornada) {
  const el = document.getElementById("mjInfo");
  if (!el) return;

  const fechaISO = jornada?.fecha || "";
  const fechaTxt = fechaISO ? formatDate(new Date(fechaISO)) : "—";

  const tipo = dn_getTipoFromFlags(jornada);
  const tipoTxt = _mjNombreTipo(tipo);
  const impacto = _mjImpactoOperativo(tipo);

  el.innerHTML = `
    <div>${fechaTxt} · ${tipoTxt}</div>
    <div>Impacto: ${impacto}</div>
  `;
}