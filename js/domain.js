// ==========================
// DOMAIN — LÓGICA PURA
// (sin DOM, sin localStorage, sin alert/confirm)
// ==========================

export const ANCHOR_START = new Date(2025, 11, 8); // mes 11 = diciembre (0-index)

/** Suma días a una fecha (mantiene zona local). */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** "DD/MM/AAAA" -> Date */
export function parseFechaDMY(fechaStr) {
  const [dd, mm, yyyy] = String(fechaStr).split("/").map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1);
}

export function toISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * Normaliza a "YYYY-MM-DD" para usar como key/orden.
 * Acepta Date, "YYYY-MM-DD", "YYYY-MM-DDTHH...", o "DD/MM/YYYY".
 */
export function normalizarFecha(fecha) {
  if (!fecha) return null;

  if (fecha instanceof Date) {
    return toISODate(fecha);
  }

  const s = String(fecha).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) {
    const [, dd, mm, yyyy] = m1;
    return `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) return toISODate(d);

  return null;
}

// ===============================
// Quincenas (rodantes, 14 días)
// ===============================

export function getQuincenaIndex(date, anchor = ANCHOR_START) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const d0 = new Date(date);
  d0.setHours(0, 0, 0, 0);
  const a0 = new Date(anchor);
  a0.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((d0 - a0) / MS_PER_DAY);
  return Math.floor(diffDays / 14);
}

export function getQuincenaRangeFromIndex(index, anchor = ANCHOR_START) {
  const start = addDays(anchor, index * 14);
  const end = addDays(start, 13);
  return { start, end };
}

/** Devuelve { start: Date, end: Date } para la quincena correspondiente a una fecha str. */
export function rangoQuincenaDeFechaStr(fechaStr, anchor = ANCHOR_START) {
  const iso = normalizarFecha(fechaStr);
  const d0 = iso ? new Date(iso + "T00:00:00") : new Date();
  d0.setHours(0, 0, 0, 0);

  const idx = getQuincenaIndex(d0, anchor);
  let start = new Date(d0);

  // retroceder hasta el inicio real de esa quincena
  for (let k = 0; k < 13; k++) {
    const prev = addDays(start, -1);
    if (getQuincenaIndex(prev, anchor) !== idx) break;
    start = prev;
  }

  const end = addDays(start, 13);
  return { start, end };
}

/** Devuelve array de quincenas (rango start/end) que tocan el mes visible. */
export function getQuincenasQueTocanMes(year, month) {
  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);

  const out = [];
  const seen = new Set();

  for (let i = 0; i < 32; i++) {
    const d = addDays(monthStart, i);
    if (d.getMonth() !== month) break;

    const qIndex = getQuincenaIndex(d);
    if (seen.has(qIndex)) continue;
    seen.add(qIndex);

    out.push(getQuincenaRangeFromIndex(qIndex));
  }

  out.sort((a, b) => a.start - b.start);
  return out;
}

// ===============================
// Validaciones / formato
// ===============================

export function esNumeroValido(x) {
  return Number.isFinite(x) && x >= 0 && Number.isInteger(x * 2);
}

export function normalizarNumero(str) {
  return Number(String(str).trim().replace(",", "."));
}

export function formatearDiasHoras8(h, horasPorDia = 8) {
  const total = Number(h) || 0;
  const dias = Math.floor(total / horasPorDia);
  let resto = total - dias * horasPorDia;
  resto = Math.round(resto * 100) / 100;
  if (resto >= horasPorDia) return `${dias + 1} días 0 hs`;
  return `${dias} días ${resto} hs`;
}

// ===============================
// Tipos de jornada (por flags)
// ===============================
//
// Soportados:
// - normal (sin flags)
// - falta
// - libre
// - libreTrabajado
// - compensado
// - licAnual
// - licEnfermedad
// - licSinGoce
//

export function getTipoFromFlags(j) {
  if (!j) return "normal";
  if (j.licAnual) return "licAnual";
  if (j.licEnfermedad) return "licEnfermedad";
  if (j.licSinGoce) return "licSinGoce";
  if (j.libreTrabajado) return "libreTrabajado";
  if (j.compensado) return "compensado";
  if (j.libre) return "libre";
  if (j.falta) return "falta";
  return "normal";
}

export function esNormalAsumida80(j, horasPorDia = 8) {
  if (!j) return false;
  const cr = Number(j.crupier) || 0;
  const sup = Number(j.supervisor) || 0;
  const sinFlags = !j.falta && !j.libre && !j.libreTrabajado && !j.compensado && !j.licAnual && !j.licEnfermedad && !j.licSinGoce;
  return sinFlags && cr === horasPorDia && sup === 0;
}

/** Resetea y setea flags según tipo (no toca horas). */
export function aplicarTipoAFlags(j, tipo) {
  if (!j) return;

  j.falta = false;
  j.libre = false;
  j.compensado = false;
  j.libreTrabajado = false;
  j.licAnual = false;
  j.licEnfermedad = false;
  j.licSinGoce = false;

  if (tipo === "falta") j.falta = true;
  else if (tipo === "libre") j.libre = true;
  else if (tipo === "compensado") j.compensado = true;
  else if (tipo === "libreTrabajado") j.libreTrabajado = true;
  else if (tipo === "licAnual") j.licAnual = true;
  else if (tipo === "licEnfermedad") j.licEnfermedad = true;
  else if (tipo === "licSinGoce") j.licSinGoce = true;
}

export function horasHabilitadas(tipo) {
  return tipo === "normal" || tipo === "libreTrabajado";
}

export function validarHoras(crupier, supervisor, maxTotal = 8) {
  if (!esNumeroValido(crupier) || !esNumeroValido(supervisor)) {
    return {
      ok: false,
      msg: "Horas inválidas. Usá números en múltiplos de 0.5 (ej: 6, 7.5) y no negativos."
    };
  }

  const total = crupier + supervisor;
  if (total > maxTotal) {
    return {
      ok: false,
      msg: `Horas incorrectas: ${total}. El total diario no puede superar ${maxTotal} horas.`
    };
  }

  return { ok: true, msg: "" };
}

// ===============================
// Libres trabajados (saldo global)
// ===============================

export function calcularSaldoLibresTrabajadosGlobal(jornadas) {
  let lt = 0;
  let comp = 0;

  for (const j of (jornadas || [])) {
    if (!j) continue;
    if (j.libreTrabajado === true) lt++;
    if (j.compensado === true) comp++;
  }

  return { libresTrabajados: lt, compensados: comp, saldo: lt - comp };
}

/** Cuenta #LIBRE (no trabajado) en la quincena que contiene la fecha dada. */
export function contarLibresEnQuincena(jornadas, fechaISO) {
  const iso = normalizarFecha(fechaISO);
  if (!iso) return 0;

  const { start, end } = rangoQuincenaDeFechaStr(iso);
  const startISO = toISODate(start);
  const endISO = toISODate(end);

  let n = 0;
  for (const j of (jornadas || [])) {
    const f = normalizarFecha(j?.fecha);
    if (!f) continue;
    if (f < startISO || f > endISO) continue;
    if (j.libre === true) n++;
  }
  return n;
}

// ===============================
// Totales en rango con asumidos
// ===============================

function _iterarDiasInclusive(startDate, endDate, cb) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    cb(new Date(d));
  }
}

/**
 * Totales del rango (start..end inclusive) hasta HOY inclusive.
 * - Si NO existe registro para un día pasado, se asume NORMAL con (horasBaseCrupier/0).
 * - LIBRE y COMPENSADO NO suman horas.
 * - FALTA y LIC_SIN_GOCE NO suman horas (se descuenta en el resumen, no aquí).
 * - LIC_ANUAL / LIC_ENFERMEDAD suman licenciaHoras (=horasBaseCrupier) y NO suman crupier/supervisor.
 */
export function calcularTotalesRangoConAsumidos(
  startDate,
  endDate,
  jornadas,
  horasBaseCrupier = 8,
  maxDiasBase = Infinity, // por compatibilidad: no se usa para cortar días; el tope se aplica en resúmenes
  hoy = new Date()
) {
  const hoy0 = new Date(hoy);
  hoy0.setHours(0, 0, 0, 0);

  const map = new Map();
  for (const j of (jornadas || [])) {
    const f = normalizarFecha(j?.fecha);
    if (!f) continue;
    map.set(f, j);
  }

  let crupier = 0;
  let supervisor = 0;
  let total = 0;

  let diasLibres = 0;
  let diasCompensados = 0;
  let diasFalta = 0;
  let diasLibreTrabajado = 0;

  let diasLicencia = 0;
  let licenciaHoras = 0;

  let diasAsumidos = 0;

  _iterarDiasInclusive(startDate, endDate, (d) => {
    if (d > hoy0) return; // futuro: ignorar
    const iso = toISODate(d);
    const j = map.get(iso);

    if (!j) {
      // asumido normal
      crupier += horasBaseCrupier;
      total += horasBaseCrupier;
      diasAsumidos++;
      return;
    }

    const tipo = getTipoFromFlags(j);

    if (tipo === "libre") {
      diasLibres++;
      return;
    }

    if (tipo === "compensado") {
      diasCompensados++;
      return;
    }

    if (tipo === "falta" || tipo === "licSinGoce") {
      diasFalta++;
      return;
    }

    if (tipo === "licAnual" || tipo === "licEnfermedad") {
      diasLicencia++;
      licenciaHoras += horasBaseCrupier;
      return;
    }

    // normal / libreTrabajado
    const cr = Number(j.crupier) || 0;
    const sup = Number(j.supervisor) || 0;
    const t = cr + sup;

    crupier += cr;
    supervisor += sup;
    total += t;

    if (tipo === "libreTrabajado") diasLibreTrabajado++;
  });

  // maxDiasBase se conserva para compatibilidad; el cálculo de base y descuento lo hacen los resúmenes.

  return {
    crupier,
    supervisor,
    total,
    diasAsumidos,
    diasLibres,
    diasCompensados,
    diasFalta,
    diasLibreTrabajado,
    diasLicencia,
    licenciaHoras,
  };
}

// ===============================
// Resumen mensual (hasta hoy)
// ===============================

export function calcularResumenMensual(
  year,
  month, // 0-11
  jornadas,
  horasBaseCrupier = 8,
  maxDiasBase = 30,
  hoy = new Date(),
  maxHorasMes = 240
) {
  const monthStart = new Date(year, month, 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(0, 0, 0, 0);

  const hoy0 = new Date(hoy);
  hoy0.setHours(0, 0, 0, 0);

  const end = hoy0 < monthEnd ? hoy0 : monthEnd;

  const mt = calcularTotalesRangoConAsumidos(
    monthStart,
    end,
    jornadas,
    horasBaseCrupier,
    maxDiasBase,
    hoy0
  );

  // Días calendario hasta HOY (incl)
  const MS_DIA = 24 * 60 * 60 * 1000;
  const diasCalendario = Math.floor((end - monthStart) / MS_DIA) + 1;
  const diasTope = Math.min(maxDiasBase, Math.max(0, diasCalendario));

  // Base pagable mensual: días hasta hoy - libres
  const baseDias = Math.max(0, diasTope - (mt.diasLibres || 0));
  const baseMesHastaHoy = baseDias * horasBaseCrupier;

  const totalPagoSinTope = (Number(mt.total) || 0) + (Number(mt.licenciaHoras) || 0);
  const descuentoM = Math.max(0, baseMesHastaHoy - totalPagoSinTope);
  const extraM = Math.max(0, totalPagoSinTope - baseMesHastaHoy);

  const excesoMes = Math.max(0, totalPagoSinTope - maxHorasMes);
  const totalPagoMCapped = Math.min(maxHorasMes, totalPagoSinTope);

  const crupierHorasM = Math.max(0, (Number(mt.total) || 0) - (Number(mt.supervisor) || 0));

  return {
    monthStart,
    monthEnd,
    end,
    mt,
    diasCalendario: diasTope,
    baseDias,
    baseMesHastaHoy,
    totalPagoSinTope,
    totalPagoMCapped,
    excesoMes,
    descuentoM,
    extraM,
    crupierHorasM,
    maxHorasMes,
  };
}

// ===============================
// Resumen de quincenas que tocan el mes (hasta hoy)
// ===============================

export function calcularResumenQuincenasQueTocanMes(
  year,
  month,
  jornadas,
  horasBaseCrupier = 8,
  maxDiasPagables = 11,
  hoy = new Date(),
  maxLibresQuincena = 3
) {
  const MS_DIA_LOCAL = 24 * 60 * 60 * 1000;

  const hoy0 = new Date(hoy);
  hoy0.setHours(0, 0, 0, 0);

  const quincenas = getQuincenasQueTocanMes(year, month);
  const out = [];

  for (const q of quincenas) {
    const qt = calcularTotalesRangoConAsumidos(
      q.start,
      q.end,
      jornadas,
      horasBaseCrupier,
      maxDiasPagables,
      hoy0
    );

    const diasHastaHoy = contarDiasInclusiveHastaHoy(q.start, q.end);
    const diasCalendario = Math.min(diasHastaHoy, 14);

    const libresHastaHoy = Math.min(Number(qt.diasLibres || 0), maxLibresQuincena);
    const compensadosHastaHoy = Number(qt.diasCompensados) || 0;

    // Días pagables base: (hasta hoy) - libres, con tope
    let diasPagables = Math.min(
      maxDiasPagables,
      Math.max(0, diasCalendario - libresHastaHoy)
    );

    // ✅ Si hay licencia anual/enfermedad en la quincena, habilita +1 día pagable (8h) (ej: 96h en vez de 88h).
    const hayLicencia = (Number(qt.diasLicencia) || 0) > 0;
    if (hayLicencia) {
      diasPagables = Math.min(14, diasPagables + 1);
    }

    const baseHoras = diasPagables * horasBaseCrupier;

    // Total pago incluye licenciaHoras
    const totalPago = (Number(qt.total) || 0) + (Number(qt.licenciaHoras) || 0);
    const descuentoQ = Math.max(0, baseHoras - totalPago);
    const extraQ = Math.max(0, totalPago - baseHoras);

    const crupierHorasQ = Math.max(
      0,
      (Number(qt.total) || 0) - (Number(qt.supervisor) || 0)
    );

    out.push({
      start: q.start,
      end: q.end,
      qt,
      diasHastaHoy,
      diasCalendario,
      diasPagables,
      baseHoras,
      totalPago,
      descuentoQ,
      extraQ,
      crupierHorasQ
    });
  }

  return out;
}
function contarDiasInclusiveHastaHoy(startDate, endDate) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(startDate);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(endDate);
  fin.setHours(0, 0, 0, 0);

  let count = 0;
  let d = new Date(inicio);

  while (d <= fin && d <= hoy) {
    count++;
    d.setDate(d.getDate() + 1);
  }

  return count;
}

