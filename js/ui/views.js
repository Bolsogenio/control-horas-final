// js/ui/views.js
// Render puro. No toca storage, no llama services, no agrega listeners.

import { clear, setHidden, setText } from "./dom.js";

export function renderAppState(refs, { state }) {
    // state: "NO_PERSONAS" | "SETUP_PERSONA" | "READY"
    const showSetup = state === "NO_PERSONAS" || state === "SETUP_PERSONA";
    setHidden(refs.personaSetup, !showSetup);
}

export function renderPersonaSelect(refs, { personas, activaId }) {
    const sel = refs.personaSelect;
    if (!sel) return;

    clear(sel);

    const ids = Object.keys(personas || {});
    for (const id of ids) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = personas?.[id]?.nombre || id;
        if (id === activaId) opt.selected = true;
        sel.appendChild(opt);
    }
}

export function renderToday(refs, { text }) {
    setText(refs.todayText, text ?? "—");
}

export function renderMonthLabel(refs, { text }) {
    setText(refs.monthLabel, text ?? "—");
}

export function renderResumen(refs, { quincenaRange, quincenaText, monthLabel, monthText }) {
    setText(refs.sumQuincenaRange, quincenaRange ?? "—");
    setText(refs.sumQuincenaText, quincenaText ?? "—");
    setText(refs.sumMonthLabel, monthLabel ?? "—");
    setText(refs.sumMonthText, monthText ?? "—");
}
