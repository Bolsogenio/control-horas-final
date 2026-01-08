// js/ui/dom.js
// Mapa + helpers DOM (sin lógica de negocio).
// Sin side effects: no agrega listeners automáticamente.

export function el(id) {
    return document.getElementById(id);
}

export function qs(selector, root = document) {
    return root.querySelector(selector);
}

export function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export function setHidden(node, hidden) {
    if (!node) return;
    node.hidden = Boolean(hidden);
}

export function show(node) {
    setHidden(node, false);
}

export function hide(node) {
    setHidden(node, true);
}

export function setText(node, text) {
    if (!node) return;
    node.textContent = text == null ? "" : String(text);
}

export function clear(node) {
    if (!node) return;
    node.innerHTML = "";
}

export function on(node, event, handler, options) {
    if (!node) return () => { };
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}

// Mapa de elementos (centraliza ids del HTML actual)
export function domRefs() {
    return {
        // Persona / setup
        personaSelect: el("personaSelect"),
        btnNuevaPersona: el("btnNuevaPersona"),
        personaSetup: el("personaSetup"),
        psNombre: el("psNombre"),
        psCategoria: el("psCategoria"),
        psHoras: el("psHoras"),
        psLibres: el("psLibres"),
        psCrearBtn: el("psCrearBtn"),
        psMsg: el("psMsg"),

        // Header / calendario
        todayText: el("todayText"),
        prevMonthBtn: el("prevMonthBtn"),
        nextMonthBtn: el("nextMonthBtn"),
        monthLabel: el("monthLabel"),
        weekdays: el("weekdays"),
        calendarGrid: el("calendarGrid"),

        // Resumen
        sumQuincenaRange: el("sumQuincenaRange"),
        sumQuincenaText: el("sumQuincenaText"),
        sumMonthLabel: el("sumMonthLabel"),
        sumMonthText: el("sumMonthText"),

        // Modal jornada
        modalJornada: el("modalJornada"),
        mjInfo: el("mjInfo"),
        mjCambiando: el("mjCambiando"),
        mjCrupier: el("mjCrupier"),
        mjSupervisor: el("mjSupervisor"),
        mjMsg: el("mjMsg"),
        mjCancel: el("mjCancel"),
        mjReset: el("mjReset"),
        mjOk: el("mjOk"),
        mjTipos: el("mjTipos"),
    };
}
