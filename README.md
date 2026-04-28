# Sticky Notes

A single-page sticky notes application built with React 19 + TypeScript + Vite.

Notes can be created, moved, resized, deleted, edited (with rich text), recolored, and persist across reloads. Designed for desktop, minimum resolution 1024×768, tested on Chrome and Firefox.

## Quick start

```bash
npm install
npm run dev          # start dev server on http://localhost:5173
npm run build        # type-check + production build
npm run lint         # eslint
npm test             # run the Vitest suite once
npm run test:watch   # watch mode
```

## How to use

- **Double-click anywhere** on the board to create a note.
- **Click** a note to edit its text. A floating mini-toolbar appears with bold/italic/underline + 5 colors.
- **Drag** a note from anywhere outside the text to move it.
- **Hover** a note → a resize handle appears in the bottom-right corner.
- **Drop** a note onto the Trash zone (bottom of the screen) to delete it.

## Features

### Core (all four implemented; the brief required at least three)

| #   | Requirement                               | Implementation                                                       |
| --- | ----------------------------------------- | -------------------------------------------------------------------- |
| 1   | Create a new note at a specified position | Double-click on the board creates a note centered on the cursor      |
| 2   | Resize a note by dragging                 | Bottom-right handle, minimum size 150×150                            |
| 3   | Move a note by dragging                   | Drag from any non-text area; live position updates                   |
| 4   | Delete by dragging onto a trash zone      | Pill at the bottom; hit area is 360×160px for a forgiving target     |

### Bonus features

- **I — Editing note text**: rich text via `contentEditable` (bold / italic / underline)
- **II — Bring-to-front on overlap**: clicking a note increments its `zIndex`; idempotent (no dispatch when already on top)
- **III — Local persistence**: backed by `localStorage`
- **IV — Multiple colors**: 5 predefined pastel colors, switchable per note from its mini-toolbar
- **V — Async REST-style API**: a mock service with simulated latency wraps `localStorage`; updates are optimistic with rollback on failure

## Architecture

### Layers

```text
src/
├── components/        UI components (presentational + thin orchestration)
│   ├── Board/         Canvas with the dotted background; hosts notes; double-click to create
│   ├── Note/          Sticky note with edit/resize/drag/color
│   ├── HintBar/       Floating instructions pill
│   └── TrashZone/     Glass-pill drop target at the bottom
├── context/           React Context + reducer for global state
│   ├── NotesContext   Notes array, dispatch, drag state
│   ├── notesReducer   Pure reducer + `getNextZIndex` helper
│   └── DropZoneContext / DropZoneProvider   Registry for drop targets
├── hooks/             Reusable behavior
│   ├── usePointerDrag Low-level mouse-drag primitive (delta + threshold + click-vs-drag)
│   ├── useDrag        Note dragging on top of usePointerDrag, hooks into the drop registry
│   ├── useResize      Note resizing on top of usePointerDrag
│   ├── useDropZone    Registers an element as a drop target via a ref
│   ├── useDebouncedCallback  Stable debounce primitive
│   ├── useNotes       Typed accessor for NotesContext with null-check
│   └── useNotesSync   Optimistic API sync with rollback (create / delete / update / bring-to-front / color)
├── services/
│   └── notesApi       Mock async REST API backed by localStorage
├── utils/
│   └── sanitizeHtml   Whitelist sanitizer for the rich-text editor (b, strong, i, em, u, br)
├── constants/notes    Sizes, debounce timings, palette, drag threshold
├── types/             Note type, action types
└── styles/theme.css   CSS variables (palette, radii, shadows, typography, motion)
```

### State management

- **`useReducer`** for the notes array — multiple action types acting on the same collection fit a reducer better than scattered `useState`.
- **Context** for distribution — avoids prop drilling between Board, Note, TrashZone.
- **Action types** are declared as `const + typeof` (not TypeScript `enum`) so nothing extra ships in the JS bundle. The `NoteAction` union is a discriminated union, so each action's payload is type-checked.
- The Context value is **memoized**; without it, every state change would create a new value reference and force every consumer to re-render.

### Drag & drop

I deliberately **didn't** use the HTML5 Drag and Drop API: it can't drive simultaneous drag-and-resize, doesn't expose pointer deltas natively, and its visual feedback is hard to style.

Instead, the system is built on a single primitive — **`usePointerDrag`**:

- `mousedown` is captured on the source element, then `mousemove` and `mouseup` listeners are attached to `window` (so the pointer leaving the element doesn't break the drag).
- A **3-pixel threshold** distinguishes a click from a drag.
- Reports `onStart`, `onMove(deltaX, deltaY)`, `onEnd`, and `onClick` (fires only when no drag occurred).
- Listeners are added on press and removed on release — no global listener loops while idle.

`useDrag` and `useResize` are thin wrappers on top, each adding domain-specific concerns (clamping for resize, drop-zone resolution for drag).

### Drop zones

Decoupled via a small registry:

- `DropZoneProvider` exposes `register(zone)` and `resolveDrop(point, draggingId)`.
- `useDropZone(onDrop)` registers an element ref as a target; the registry calls `onDrop(draggingId)` when a drag ends inside its bounding rect.
- Adding a second drop zone (e.g. archive, favorites) is one component; no changes needed in `useDrag`.

### Optimistic persistence with rollback

`useNotesSync` wraps `notesApi` and exposes `createNote`, `deleteNote`, `persistNote`, `bringNoteToFront`, `changeNoteColor`. Each call:

1. Dispatches the local change immediately (optimistic UI).
2. Awaits the API.
3. On failure: `createNote` and `deleteNote` are rolled back. Updates are left ahead of the server — reverting an in-flight edit would be more disruptive than the lag.

Position and size updates are persisted on `mouseup` (one API call per gesture, not per frame). Text edits are debounced 400 ms.

### Rich text

The editor is a `contentEditable` div using `document.execCommand('bold' | 'italic' | 'underline')` — deprecated but the only API consistently supported across browsers without a 50 KB+ editor library. `styleWithCSS` is forced off so the browser emits `<b>` / `<i>` / `<u>` instead of inline-styled spans, which the sanitizer would otherwise strip.

The HTML is sanitized through a small whitelist (`b, strong, i, em, u, br`) on every input, on blur, and on paste (paste is also forced to plain text). Attributes are dropped wholesale; everything outside the whitelist has its tags removed but text preserved.

The editor is **uncontrolled**: `innerHTML` is seeded once on mount from a ref. Re-syncing on every state change would reset the user's caret position.

### Performance

- **Live drag/resize state is local to the note being interacted with.** During a gesture the `<Note>` updates its own `livePos` / `liveSize` state and renders only itself. The global reducer is dispatched only once on `mouseup`. Without this, every `mousemove` would produce a new `notes` array and force every Context consumer to re-evaluate.
- `Note` is wrapped in `React.memo` — protects siblings from re-rendering when an unrelated note's props update.
- `useRef` for transient drag/resize state (start mouse, last position) — these don't need to trigger re-renders.
- An `isInteractingRef` prevents external prop changes (e.g. a debounced API echo) from clobbering the local geometry mid-gesture.
- `useDebouncedCallback` keeps the debounced function reference stable across renders, with a ref to the latest callback so consumers don't need to manage dependencies.
- Mousemove listeners are attached on press and removed on release — no global listeners while idle.
- Persistence happens once per gesture (drag/resize on `mouseup`, text edits debounced 400 ms), not per frame.

### Drag UX details

The note is draggable from anywhere outside the editor area. The editor uses:

- `pointer-events: none` while not editing, so a press anywhere on the note routes to the drag handler.
- `contentEditable={false}` while not editing, to prevent caret placement.
- A "click without drag" callback enters edit mode, focuses the editor at end-of-text, and brings the note to front. Switching to edit mode also re-enables `pointer-events` on the editor via state.
- While editing, the editor stops propagation on `mousedown` so text selection doesn't fight with drag.

This pattern (drag-from-anywhere-but-edit-on-click) matches Figma / Miro / Notion behavior.

## Testing

Vitest + React Testing Library, with `jsdom` for the DOM. The Vitest config extends `vite.config.ts` so the TypeScript path aliases are reused with no duplication.

```bash
npm test             # one-shot
npm run test:watch   # watch mode
npm run test:ui      # browser UI
```

Coverage focuses on the parts where bugs hurt: pure logic, security-critical sanitization, async control flow, and a smoke test of the main interactive component.

- **`context/notesReducer.test.ts`** — every action, immutability, `BRING_TO_FRONT` guards (already-on-top, missing id), `getNextZIndex` empty case.
- **`utils/sanitizeHtml.test.ts`** — allowlist preservation, nested tags, attribute stripping, `<script>` / `<style>` blocked entirely, mixed siblings.
- **`hooks/useDebouncedCallback.test.ts`** — delay, reset on re-call, latest-callback pickup, `flush()` cancels, cleanup on unmount.
- **`hooks/useNotesSync.test.tsx`** — optimistic create/delete with API rollback on failure; `bringNoteToFront` and `changeNoteColor` no-op when redundant.
- **`components/Note/Note.test.tsx`** — rendering, geometry from props, click-to-edit reveals the formatting toolbar, active color shown in the mini-toolbar.

The sanitizer tests caught a real bug: `<script>` tags were stripped but their text contents (e.g. `alert(1)`) were preserved. The fix added a small **blocklist** (`SCRIPT, STYLE, IFRAME, OBJECT, EMBED, NOSCRIPT, TEMPLATE`) whose contents are dropped wholesale, complementing the existing **allowlist** (`B, STRONG, I, EM, U, BR`).

## Trade-offs

| Decision          | Chosen                                        | Rejected                    | Reason                                                                                     |
| ----------------- | --------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| Language          | TypeScript                                    | JavaScript                  | Type safety + IDE help on a small but state-heavy app                                      |
| Framework         | React                                         | Vanilla JS                  | Ergonomics for state distribution and component composition                                |
| State             | Context + useReducer                          | Zustand, Redux              | No external dep; right scale for ~8 actions on one collection                              |
| Styles            | CSS Modules                                   | styled-components, Tailwind | No deps; auto-scoped class names                                                           |
| Drag & drop       | Custom mouse events                           | HTML5 DnD API               | Need pointer-precise control + simultaneous drag/resize                                    |
| Action types      | `const + typeof`                              | TS `enum`                   | No extra JS at runtime; modern pattern                                                     |
| Rich text         | `contentEditable` + execCommand               | TipTap / Slate / Lexical    | A 50–100 KB editor for a tiny note is overkill; deprecated APIs work everywhere we target  |
| HTML sanitization | Custom allowlist + blocklist                  | DOMPurify                   | 6 allowed tags + 7 hard-blocked; one small file beats adding a dep                         |
| Path aliases      | Per-directory (`@hooks`, `@components`, etc.) | Single `@/`                 | Easier to read at a glance                                                                 |

## Browser support

Latest Chrome and Firefox (per the brief). Uses `crypto.randomUUID`, `backdrop-filter`, `clip-path`, `useId` — all stable in current evergreen browsers.

## Project conventions

- Components are colocated with their CSS module (`Note/Note.tsx` + `Note/Note.module.css`).
- Hooks return objects only when there are multiple values (otherwise return the value directly).
- One concern per hook; cross-cutting state lives in Context.
- Comments explain *why*, not *what*. Names should carry the rest.
