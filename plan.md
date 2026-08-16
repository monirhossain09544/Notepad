# plan.md

## 1. Objectives
- Deliver a modern, premium **single-user** notepad (no auth) with rich-text editing, organization (folders/tags/pin/archive/trash), fast search, command palette, and quality-of-life features.
- Prove the highest-risk core upfront: **MongoDB persistence + search for rich notes** and **Emergent LLM assistant** actions.
- Ship V1 end-to-end (FastAPI + React/shadcn + Tailwind) with **light/dark mode**, responsive layout (desktop 3‑pane + mobile sheets), autosave, shortcuts, export/duplicate.
- Maintain a forward-looking Phase 3 backlog for polish, performance and “delight” upgrades.

## 2. Implementation Steps

### Phase 1 — Core POC (Isolation): `/app/test_core.py` (must pass before Phase 2)
**Status: COMPLETE (22/22 PASSED on first run)**

**User stories**
1. As a user, I want a note saved with rich HTML + plain text so formatting persists and search works.
2. As a user, I want to soft-delete to trash and restore notes so I don’t lose work.
3. As a user, I want to search notes by words in the body/title so I can find anything fast.
4. As a user, I want AI to summarize and extract action items so I can grasp a note quickly.
5. As a user, I want AI to rewrite/improve my note and suggest tags so my notes stay clean and organized.

**Implemented POC checks**
- MongoDB connect + ensure indexes (text index on `title` + `plain_text`).
- CRUD rich note (preserve HTML), datetime-safe JSON serialization.
- Search: Mongo `$text` + regex partial-match fallback.
- Filters: folder/tag; lifecycle: trash/restore/archive/duplicate/permanent delete.
- AI via EMERGENT_LLM_KEY (openai/gpt-5.4):
  - auto-title
  - summarize (JSON bullets)
  - improve writing (HTML)
  - continue writing
  - tone rewrite
  - action item extraction
  - note-scoped Q&A grounded in note
  - tag suggestions (parseable JSON)

**Success criteria**
- Script runs end-to-end with real DB + real LLM calls; all assertions pass; outputs are parseable and non-empty.

---

### Phase 2 — V1 App Development (Backend + Frontend) + 1 testing round
**Status: COMPLETE + tested (backend 41/41 tests passed; frontend flows verified)**

**User stories**
1. As a user, I want to create/edit notes in a rich editor with autosave so I never lose changes.
2. As a user, I want folders and colored tags so I can organize and filter my notes.
3. As a user, I want pin/archive/trash flows so my workspace stays tidy.
4. As a user, I want instant search + command palette so I can jump to any note/action.
5. As a user, I want AI tools (title, summary, rewrite, action items, tone, tag suggestions, note Q&A) so I can improve notes quickly.
6. As a user, I want light/dark mode and mobile-friendly UI so the app feels premium everywhere.

**Backend (FastAPI, all routes `/api`, bind `0.0.0.0:8001`) — Implemented**
- `db.py`: Motor client, JSON-safe serialization, `ensure_indexes()`.
- `models.py`: Pydantic models.
- `utils.py`: `html_to_text`, `count_words`, `make_snippet`, `slugify`, `html_to_markdown`.
- `ai_service.py`: Emergent LLM integration using `stream_message()`; prompt library; JSON parsing + HTML cleanup.
- Routers:
  - `routers_notes.py`: list (view/folder/tag/q/sort), create/get/update, duplicate, pin, archive, trash/restore, delete, empty trash, export (md/txt/html), per-note chat history GET/DELETE.
  - `routers_meta.py`: folders CRUD, tags CRUD, `/api/stats` with per-folder/per-tag counts + total word counts.
  - `routers_ai.py`: title/summarize/improve/continue/tone/action-items/suggest-tags/ask + `ask/stream` SSE (with `X-Accel-Buffering: no`).
- `server.py`: lifespan creates indexes, CORS, `/api` prefix.

**Frontend (React CRA + shadcn/ui + Tailwind) — Implemented**
- Design system: `index.css` includes complete light/dark tokens, TipTap prose typography, task-list checkbox styling, grain + paper wash, thin scrollbars, reduced-motion support.
- App shell: responsive 3-pane layout; mobile sheets for sidebar/list; global keyboard shortcuts.
- Editor: TipTap + toolbar (headings, formatting, lists, tasks, code, links, align), autosave debounce, save-status indicator, footer meta (word/char/reading time), print, export, duplicate.
- Organization: sidebar smart views (All/Pinned/Archive/Trash), folders + tags (colored), per-note accent color, grid/list toggle, sort dropdown.
- Search: debounced search with match-centered snippet highlighting.
- Command palette: Ctrl/Cmd+K with note jump + quick actions.
- AI assistant: right sheet panel with 8 actions + “apply/insert/copy” affordances and note-scoped streaming Q&A; per-note chat history persisted.
- UX fixes applied post-test:
  - Counts computed from editor text (CharacterCount storage issue avoided).
  - Reopen last edited note on reload (`np:lastNote`).
  - New note focuses title; Enter jumps to body.
  - Restore opens restored note.
  - Removed duplicate sheet close UI.
  - Tailwind ambiguous duration utilities removed.
  - Mobile sheet header padding fixed.

**Testing (Phase 2)**
- `testing_agent_v3` iteration 1: backend 41/41 passed; frontend feature set passed; no critical/UI/design issues.
- Additional browser automation checks performed: AI apply-to-editor, persistence after reload, checkbox persistence, match-centered highlighting, trash lifecycle, empty state + welcome note, command palette, mobile sheets, dark mode.

**Success criteria**
- End-to-end flows work: create/edit/autosave, organize, search, lifecycle, AI actions apply to editor.
- Premium UI: light/dark, responsive, solid floating surfaces, keyboard-first.
- Testing round complete with zero critical issues.

---

### Phase 3 — Polish/Refactor + Delight + 1 more testing round
**Status: NOT STARTED (optional / backlog)**

**User stories**
1. As a user, I want an even smoother distraction-free focus mode (less chrome, better reading width controls).
2. As a user, I want safer AI rewrites with preview + undo so I can apply changes confidently.
3. As a user with many notes, I want the app to remain fast (pagination, virtualization, optimized queries).
4. As a user, I want templates and internal linking so my notes become a knowledge base.
5. As a user, I want optional offline-first cache so notes remain usable without internet.

**Revised steps**
- Backend refactor:
  - Split into a `routers/` package + service layer.
  - Add pagination (`limit/offset` or cursor), and optional `updated_at` cursor for note list.
  - Harden validation/error handling; structured error codes.
- AI improvements:
  - Streaming for long-form actions (improve/continue/tone), not only Q&A.
  - Diff-style preview and one-click undo for rewrites.
  - Stronger note-scoped grounding and prompt safety.
- UX delight:
  - Note templates.
  - Note linking/backlinks.
  - Reminders (optional).
  - List virtualization for very large datasets.
  - Offline/local cache.
- Optional product expansion:
  - Multi-user auth/accounts if requested.
- Run testing-agent again; fix regressions.

**Success criteria**
- Measurably smoother UX, stable performance with large datasets, safer AI apply flows, and no regressions.

## 3. API Surface (Phase 2 — Implemented)
- Health:
  - `GET /api/` (status + AI configured)
- Notes:
  - `GET /api/notes?view=all|pinned|archive|trash|folder|tag&folder_id=&tag_id=&q=&sort=updated|created|title&limit=`
  - `POST /api/notes`
  - `GET /api/notes/{id}`
  - `PUT /api/notes/{id}`
  - `POST /api/notes/{id}/duplicate`
  - `POST /api/notes/{id}/trash`
  - `POST /api/notes/{id}/restore`
  - `DELETE /api/notes/{id}`
  - `POST /api/notes/{id}/archive` (body `{ value: true|false }`)
  - `POST /api/notes/{id}/pin` (body `{ value: true|false }`)
  - `POST /api/notes/trash/empty`
  - `GET /api/notes/{id}/export?format=md|txt|html`
  - `GET /api/notes/{id}/chat`
  - `DELETE /api/notes/{id}/chat`
- Folders:
  - `GET /api/folders`
  - `POST /api/folders`
  - `PUT /api/folders/{id}`
  - `DELETE /api/folders/{id}`
- Tags:
  - `GET /api/tags`
  - `POST /api/tags`
  - `PUT /api/tags/{id}`
  - `DELETE /api/tags/{id}`
- Stats:
  - `GET /api/stats`
- AI (note-scoped):
  - `POST /api/ai/title`
  - `POST /api/ai/summarize`
  - `POST /api/ai/improve`
  - `POST /api/ai/continue`
  - `POST /api/ai/tone`
  - `POST /api/ai/action-items`
  - `POST /api/ai/suggest-tags`
  - `POST /api/ai/ask`
  - `POST /api/ai/ask/stream` (SSE)

## 4. Data Model (MongoDB)
- `notes`:
  - `id`, `title`, `html_content`, `plain_text`, `word_count`, `folder_id|null`, `tag_ids:[]`,
  - `pinned:bool`, `archived:bool`, `trashed:bool`, `color|null`,
  - `created_at`, `updated_at`, `trashed_at|null`, plus `snippet` derived in responses.
- `folders`:
  - `id`, `name`, `created_at`, `updated_at`
- `tags`:
  - `id`, `name`, `color`, `created_at`, `updated_at`
- `ai_chats`:
  - `id`, `note_id`, `role` (user|assistant), `content`, `created_at`

## 5. Next Actions
1. (Optional) Phase 3 kickoff: pagination + virtualization to support very large workspaces.
2. (Optional) Add AI rewrite preview/diff + one-click undo; add streaming for rewrite actions.
3. Add templates + backlinks if desired.
4. Run a second testing-agent round after Phase 3 changes.

## 6. Success Criteria (Overall)
- Phase 1 POC passes reliably (done).
- V1 is fully usable and premium: rich editor + organization + search + AI assistant + responsive light/dark (done).
- If Phase 3 is implemented: performance and delight upgrades ship with no regressions after a second full testing round.
