## Frontend Architecture Overview

This document explains how the React + Vite + Tauri frontend is organized so contributors can quickly onboard and extend features confidently.

### Tech Stack
- React 19 (functional components)
- React Router (client-side routing)
- PropTypes for runtime prop validation
- Vite for dev/build
- Tauri for desktop packaging (see `src-tauri/`)

### High-level Layout
- Left panel: conversation navigator (`LeftNavigator` component)
- Main area: routed content; the default route shows the chat window
- Theme: black background with white surfaces; CSS variables in `src/index.css`

### Directory Map

```
frontend/
  src/
    App.jsx                # App shell + routes
    main.jsx               # App bootstrap + router
    index.css              # Global theme and layout styles

    components/            # Reusable UI components
      LeftNavigator.jsx    # Side panel: actions + conversation list
      ChatWindow.jsx       # Chat message list + composer

    pages/                 # Routed pages (screen-level components)
      SettingsPage.jsx     # App settings (API keys, models, preferences)
      LibraryPage.jsx      # Docs/prompts/tools library
      NotFoundPage.jsx     # 404 guard

    router/
      routes.jsx           # Central registry for lazy-loaded routes (optional)

    state/
      AppStateContext.jsx  # Global state provider (e.g., API key, model)

    services/              # Network/API clients, side effects
      apiClient.js         # fetch helpers: getJson/postJson
      chatService.js       # chat-specific requests (placeholder)

    hooks/                 # Custom React hooks
      useConversations.js  # example data-fetch hook

    utils/
      formatters.js        # formatting helpers (e.g., relative time)

  src-tauri/               # Tauri configuration and Rust-side code
  index.html               # Vite entry
  vite.config.js           # Vite config
```

### App Entry Points
- `src/main.jsx`: mounts React, wraps in `BrowserRouter`.
- `src/App.jsx`: renders the two-column layout and declares `<Routes>`:
  - `/` → chat (default)
  - `/chat/:id` → chat for a specific conversation
  - `/settings` → settings page
  - `/library` → library page
  - Fallback `*` → 404

### Data Flow Overview
- Pages (routed) use hooks/services to fetch data, then render components.
- Components are presentational and receive data via props.
- Global, cross-cutting state (e.g., API key, selected model) lives in `state/AppStateContext.jsx`.
- Network requests are encapsulated in `services/` to keep UI pure and testable.

```
Route → Page → (Hooks) → Services → API
                ↓
            Components
```

### Styling
- Centralized CSS variables in `:root` (see `src/index.css`).
- Layout styles for the shell (app grid), left navigator, chat window, messages, and composer.
- Keep most component styles global for now; consider collocating styles as the project grows.

### Conventions
- Files are PascalCase for components (`ChatWindow.jsx`), camelCase for utilities (`formatters.js`).
- Export one primary component per file (default export).
- Use PropTypes for shared/public components.
- Keep network effects inside `services/`; keep React logic in hooks/components.
- Avoid deep prop drilling: prefer Context for truly global settings.

### Adding a New Screen
1. Create a page component in `src/pages/FeaturePage.jsx`.
2. Add a route in `src/App.jsx` (or register it in `src/router/routes.jsx`).
3. If the page needs data:
   - Add a service in `src/services/featureService.js`.
   - Optionally add a hook in `src/hooks/useFeatureThing.js`.
4. Add/reuse components under `src/components/` or introduce a feature folder (see below).

### Feature-Folder Option (scales well)
If a feature grows large, collocate it under `src/features/<feature>/`:

```
src/features/chat/
  components/     # feature-local components
  pages/
  hooks/
  services/
  index.ts        # public API of the feature module
```

You can then import from `features/chat` instead of scattered paths.

### UI Utilities (reusable)
- `src/components/ContextMenu.jsx`: generic right-click menu. Provide `items: [{label, onClick}]`, `position: {x,y}`, and `onClose`.
- `src/components/Modal.jsx`:
  - `Modal`: base modal with overlay.
  - `ConfirmDialog`: simple confirm/cancel with customizable text.

The left navigator folders support right-click to Rename/Delete. Deleting a folder prompts a centered confirmation modal; confirming deletes the folder and its chats.

### Chat Example: Where Things Live
- Conversation list and actions: `src/components/LeftNavigator.jsx`
- Chat messages + composer: `src/components/ChatWindow.jsx`
- Message sending (placeholder): `src/services/chatService.js`
- Fetch conversations (placeholder): `src/hooks/useConversations.js`

### Environment & Config
- Add environment variables via Vite’s `.env` files (e.g., `VITE_API_BASE_URL`).
- Tauri-specific config lives under `src-tauri/`.

### Scripts
- `npm run dev` → start web dev server
- `npm run build` → build web
- `npm run preview` → preview build
- `npm run tauri:dev` → Tauri dev (desktop)
- `npm run tauri:build` → Tauri build (desktop)

### Roadmap Notes
- Replace placeholder services with real API endpoints.
- Hook `ChatWindow` to route `/chat/:id` via `useParams`.
- Implement settings form bound to `AppStateContext`.
- Add feature folder structure as modules grow (chat, settings, library, auth, etc.).


