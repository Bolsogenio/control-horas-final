# Control de Horas — Refactor base (Fase 0)

Objetivo de este paquete:
- Introducir un **bootstrap único** (`js/app.js`) como punto de entrada.
- Mantener **100% la funcionalidad actual** importando el código existente como **legacy** (`js/app_legacy.js`).
- Preparar carpetas para separar responsabilidades en fases posteriores.

Importante:
- `index.html` sigue apuntando a `js/app.js`.
- `js/app.js` solo importa `js/app_legacy.js` (sin lógica).
- `js/app_legacy.js` es el `app.js` original tal cual.

Próxima fase (a hacer después):
- Crear `init()` único en `js/app.js` y mover bindings de forma ordenada, paso a paso.
