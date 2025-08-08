## Frontend (React + Vite + Tauri)

Development
- Web: `npm i` then `npm run dev`
- Desktop: `npm i` then `npm run tauri:dev`

Build
- Web: `npm run build` then `npm run preview`
- Desktop: `npm run tauri:build`

Documentation
- See `docs/ARCHITECTURE.md` for project structure and conventions.

UI note: The left navigator component is `src/components/LeftNavigator.jsx`. In collapsed mode it shows the brand initial "A" (Axon) with action icons stacked below.
 - Right-click a folder to Rename or Delete. Deleting asks for confirmation in a centered modal.
 - The shrinker toggle is now a simple arrow icon without a border.
