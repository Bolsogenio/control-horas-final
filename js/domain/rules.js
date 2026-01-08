// js/domain/rules.js
// Reglas de negocio puras.
// IMPORTANTE: no usan DOM, no usan localStorage.
// Hoy el legacy usa funciones en domain.js; estas reglas quedan listas para el salto a Servicios.

import { TIPOS_JORNADA } from "./models.js";

/** Múltiplos de 0.5, no negativo */
export function esHoraValida(x) {
  return Number.isFinite(x) && x >= 0 && Number.isInteger(x * 2);
}

/** Devuelve {ok, msg} para el par (crupier, supervisor) */
export function validarHorasDiarias(crupier, supervisor, maxTotal = 8) {
  const cr = Number(crupier);
  const sup = Number(supervisor);

  if (!esHoraValida(cr) || !esHoraValida(sup)) {
    return {
      ok: false,
      msg: "Horas inválidas. Usá múltiplos de 0.5 (ej: 6, 7.5) y no negativos.",
    };
  }

  const total = cr + sup;
  if (total > maxTotal) {
    return {
      ok: false,
      msg: `Horas incorrectas: ${total}. El total diario no puede superar ${maxTotal} horas.`,
    };
  }

  return { ok: true, msg: "" };
}

/** True si el tipo usa horas (normal/libreTrabajado) */
export function tipoUsaHoras(tipo) {
  return tipo === TIPOS_JORNADA.NORMAL || tipo === TIPOS_JORNADA.LIBRE_TRABAJADO;
}

/**
 * Para mostrar en la celda del calendario:
 * devuelve {desc, extra} según horasPorDia.
 * (Solo cálculo, la UI decide el texto final)
 */
export function calcularDescExtra(totalHoras, horasPorDia = 8) {
  const t = Number(totalHoras) || 0;
  const base = Number(horasPorDia) || 8;

  const desc = Math.max(0, base - t);
  const extra = Math.max(0, t - base);
  return { desc, extra };
}
