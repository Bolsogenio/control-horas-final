// js/ui/controllers.js
// Controladores/eventos. No renderiza, no toca storage.

import { on } from "./dom.js";

export function bindPersonaSelect(refs, { onChangePersona }) {
    const sel = refs.personaSelect;
    if (!sel) return () => { };

    return on(sel, "change", () => {
        onChangePersona?.(sel.value);
    });
}

export function bindBtnNuevaPersona(refs, { onClickNuevaPersona }) {
    const btn = refs.btnNuevaPersona;
    if (!btn) return () => { };

    return on(btn, "click", () => {
        onClickNuevaPersona?.();
    });
}

export function bindSetupCrear(refs, { onCrear }) {
    const btn = refs.psCrearBtn;
    if (!btn) return () => { };

    return on(btn, "click", () => {
        const payload = {
            nombre: refs.psNombre?.value ?? "",
            categoria: refs.psCategoria?.value ?? "cs",
            horasPorDia: refs.psHoras?.value ?? 8,
            libresPorQuincena: refs.psLibres?.value ?? 3,
        };
        onCrear?.(payload);
    });
}

export function bindCalendarNav(refs, { onPrev, onNext }) {
    const offPrev = on(refs.prevMonthBtn, "click", () => onPrev?.());
    const offNext = on(refs.nextMonthBtn, "click", () => onNext?.());
    return () => {
        offPrev?.();
        offNext?.();
    };
}
