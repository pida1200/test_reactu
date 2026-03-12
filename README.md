# test_reactu – Akcie (React + Node API)

React aplikace s tabulkou akcií, výběrem data a načítáním kurzů z Yahoo Finance. Backend: Node.js (Express) + SQLite.

## Spuštění

1. **Backend:** `cd server && npm install && npm run init-db && npm run start` (běží na http://localhost:3000)
2. **Frontend:** v kořeni projektu `npm install && npm run dev` (běží na http://localhost:5173)

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
