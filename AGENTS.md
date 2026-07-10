# Resume Studio — Agent Guide

## Project Overview

This repository is a local-first Chinese resume editor. It provides a form-based editor, live A4 preview, rich-text content, automatic multi-page layout, JSON persistence, and browser PDF printing.

The application is intentionally single-user and local. There is no authentication, database, cloud sync, or external API dependency.

## Technology Stack

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4 through `@tailwindcss/vite`
- Express 5 local API
- Zod for shared runtime validation
- dnd-kit for section ordering
- DOMPurify for rich-text sanitization
- Vitest, Testing Library, and Supertest

Node.js 22 or newer is recommended.

## Common Commands

```bash
npm install
npm run dev
npm test
npm run build
npm start
```

- `npm run dev` starts the API on port `4174` and Vite on port `5173`.
- `npm run build` performs TypeScript checking before the Vite build.
- `npm start` serves the production build and API through Express.

Before handing off a change, run both `npm test` and `npm run build`.

## Important Files

- `src/App.tsx`: application shell, drawers, responsive editor/preview switching, and document title used for the PDF filename.
- `src/state/ResumeContext.tsx`: loading, editing, undo/redo, validation, debounced autosave, and save status.
- `src/components/EditorPanel.tsx`: basic information and structured section/item editing.
- `src/components/RichTextEditor.tsx`: simple rich-text toolbar and editable content.
- `src/components/ResumePreview.tsx`: hidden measurement layout, A4 pagination, visible pages, and print page structure.
- `src/components/StylePanel.tsx`: theme color, custom color, font, font size, line height, and page margin controls.
- `src/components/ModuleManager.tsx`: visibility, renaming, deletion, keyboard ordering, and drag ordering.
- `src/richText.ts`: legacy content conversion and HTML sanitization.
- `shared/resume.ts`: shared Zod schemas and TypeScript types.
- `shared/defaultResume.ts`: bundled example used when no data file exists.
- `server/storage.ts`: file creation, legacy-style migration, validation, and atomic writes.
- `server/app.ts`: `/api/resume` HTTP endpoints and production static serving.
- `data/resume.json`: the user's live resume data.

## Data and Persistence

The browser loads the document from `GET /api/resume` whenever the app opens. Valid changes are saved with `PUT /api/resume`.

Autosave is debounced by approximately 600 ms. Manual save uses the same persistence path. Writes go to a temporary file and are atomically renamed so a failed write does not corrupt the existing resume.

Treat `data/resume.json` as user-owned content:

- Never replace it with default data during implementation or testing.
- Do not remove or rewrite unrelated user content.
- Browser acceptance checks that change data must restore the exact original value.
- Automated API tests must use temporary directories, never the real data file.

Vite must continue ignoring `data/**` in its file watcher. Watching this directory causes autosave to reload the page and reset the active editor tab.

## Resume Document Model

`ResumeDocument` contains:

- `schemaVersion`
- `basics`: name, headline, phone, email, city, and website
- `style`: accent color, font family, font size, line height, and page margin
- ordered `sections`

Each section has an ID, type, title, visibility flag, and ordered items. Items contain titles, organization/role metadata, dates, legacy description/bullets, and optional sanitized `contentHtml`.

Style values for font size, line height, and page margin are integer pixels from 1 to 100. Legacy multiplier line heights (such as `1.55`) are converted to equivalent pixels while reading the file.

When changing the public document shape:

1. Update the Zod schema and inferred types.
2. Preserve compatibility with existing `data/resume.json` files.
3. Add a read-time migration when old values need new semantics.
4. Update the bundled default document.
5. Add validation and API migration tests.

## State Management Rules

Use the existing React Context and reducer rather than adding a separate global state library.

- All user edits must go through the context `change` callback.
- A normal edit must create an undo snapshot and mark the document dirty.
- Undo and redo must also trigger normal autosave.
- In-flight save responses must not mark newer unsaved edits as saved.
- Reloading fresh data should retain the current editor tab if that section still exists.
- Validation failures must preserve the user's in-memory edits.

The page title follows `姓名-简历`; browsers use it as the default printed PDF filename.

## Styling Rules

Use Tailwind utility class names directly in React components.

- Do not introduce `@apply`.
- Prefer static Tailwind strings so Vite can discover and generate the classes.
- Keep responsive utilities next to the component they affect.
- Use inline styles only for truly dynamic values, such as theme CSS variables, color picker values, and dnd-kit transforms.
- `src/index.css` is reserved for rules that cannot be attached directly to generated elements: rich-text descendants, preview scaling, print directives, and minimal global browser defaults.
- Preserve the current neutral application branding; do not copy WonderCV logos or proprietary assets.

## Rich Text Rules

Rich text supports undo/redo, bold, italic, unordered and ordered lists, indentation, links, and format clearing.

- New rich-text edits are stored in `contentHtml`.
- Existing `description` and `bullets` are converted on display, so legacy data remains visible.
- All stored and rendered HTML must pass through `sanitizeRichText`.
- Do not add support for scripts, media, arbitrary styles, or unsafe attributes.
- Pasted content is intentionally converted to plain text before formatting.

## Pagination and Printing

The preview uses real independent A4 page elements, not a horizontally flowing CSS column layout.

`ResumePreview` renders a hidden measurement copy at the configured content width. It measures the header, section headings, and resume items, then builds page specifications and renders `.resume-sheet` elements vertically.

Important pagination invariants:

- Pages are 794 × 1123 CSS pixels on screen before preview zoom.
- Page margin, font size, and line height affect measurement and must trigger repagination.
- The first page includes the resume header; continuation pages do not.
- A section may be divided between pages at item boundaries, with its heading repeated.
- Visible pages are stacked vertically with a gap.
- Hidden measurement content must never appear or print.

Printing uses one `.resume-sheet` per physical A4 page. Each sheet has an explicit page break, while the last sheet suppresses the trailing break to prevent an empty final page.

When editing pagination, test with enough content to produce at least two pages and verify both screen positions and print CSS.

## API Behavior

### `GET /api/resume`

- Creates the default file only when the data file does not exist.
- Returns `422` for corrupt or structurally invalid existing files.
- Never overwrites a corrupt file with defaults.

### `PUT /api/resume`

- Validates the full document.
- Returns `400` with validation issues for invalid input.
- Uses an atomic write.
- Returns `500` with a clear error when the target cannot be written.

## Testing Expectations

Existing tests cover:

- reducer history and tab retention
- schema validation
- legacy style migration
- API creation, reading, writing, validation, corruption protection, and write errors
- live preview updates and autosave
- module visibility
- style selection
- rich-text conversion and sanitization

Add tests for every behavior change. For visual or layout changes, also run the local app and inspect it in a real browser. Check browser console warnings and errors before handoff.

## Safety and Maintenance

- Preserve unrelated files and user edits.
- Do not use destructive Git commands.
- Do not commit build output or dependencies.
- Keep the app local-first and dependency-light.
- Prefer updating existing components and shared helpers over adding parallel implementations.
- Maintain Chinese user-facing copy unless the requested product language changes.
