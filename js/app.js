// js/app.js
// Bootstrap único: la app se inicia desde aquí (un solo punto de entrada)

import { legacyInit } from "./app_legacy.js";

document.addEventListener("DOMContentLoaded", () => {
  try {
    legacyInit();
  } catch (err) {
    console.error("Error en legacyInit():", err);
    alert("Error al iniciar la app. Mirá la consola (F12) para detalles.");
  }
});
