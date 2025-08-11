## Frontend (React + Vite + Tauri)

Development
- Web: `npm i` then `npm run dev`
- Desktop: `npm i` then `npm run tauri:dev`

Build
- Web: `npm run build` then `npm run preview`
- Desktop: `npm run tauri:build`

Documentation
- See `docs/ARCHITECTURE.md` for project structure and conventions.

UI notes
- Left navigator: `src/components/LeftNavigator.jsx`. In collapsed mode it shows the brand initial "A" (Axon) with action icons stacked below.
  - Right-click a folder to Rename or Delete. Deleting asks for confirmation in a centered modal.
  - The shrinker toggle is now a simple arrow icon without a border.
- Chat screen: `src/pages/ChatPage.jsx`, built from reusable parts in `src/components/chat/`:
  - `ChatHeader.jsx` (model select, export button, mobile nav toggle)
  - `MessageList.jsx` (auto-scrolling list)
  - `EmptyHero.jsx` (intro hero with lamp animation)
  - `PromptBar.jsx` (quick prompts)
  - `Composer.jsx` (textarea + send button)
