# test_reactu – Akcie (React + Node API)

**Verze:** 1.0.0

React aplikace s tabulkou akcií, výběrem data, načítáním kurzů z Yahoo Finance a grafy. Backend: Node.js (Express) + SQLite.

## Pravidla architektury

Aplikace je třívrstvá; pravidla jsou v `.cursor/rules/`:

- **Frontend** (React): pouze UI a volání vlastního API
- **Backend** (Node.js): business logika a integrace (Yahoo Finance apod.)
- **DB** (SQLite): perzistence

## Spuštění

**Důležité:** Aplikace potřebuje běžet **obě** části. Pořadí:

1. **Terminál 1 – API server:**  
   `npm run server`  
   (nebo `cd server && npm install && npm run start`)  
   Musí běžet na http://localhost:3000.

2. **Terminál 2 – React:**  
   `npm install && npm run dev`  
   Pak otevři v prohlížeči **http://localhost:5173** (ne soubor index.html).

Pokud vidíš „Chyba: Failed to fetch“, API neběží – spusť nejdřív `npm run server`.
Volitelně naplň DB seed daty: `npm run server:init-db` (jednou).

## Stack

- React (Vite), Express, SQLite (better-sqlite3), Yahoo Finance Chart API

---

# React + Vite (šablona)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
