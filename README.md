# Ajaia Docs Lite

Ajaia Docs Lite is a lightweight full-stack collaborative document editor built for the Technical Program and Project Manager, AI Delivery assessment. The product slice focuses on document creation, rich-text editing, persistence, file import, and basic sharing between seeded users.

## What works

- Create a new document
- Rename a document
- Edit rich-text content in the browser
- Format content with bold, italic, underline, headings, bulleted lists, and numbered lists
- Save and reopen documents after refresh
- Import `.txt` or `.md` files as new editable documents
- Simulate users with seeded accounts
- Share an owned document with another seeded user
- See a clear distinction between owned and shared documents
- Persist documents and sharing data in a local JSON store
- Run automated API tests for create/edit/share/import flows

## Seeded users

Use the **Review as** dropdown in the top-right corner to switch between users.

| User | Purpose |
| --- | --- |
| Tejas Mhaisdhune | Default owner account |
| Ava Reviewer | Reviewer account for sharing flow |
| Jordan PM | Additional collaborator account |

## Local setup

### Requirements

- Node.js 20 or newer
- No paid service or external database required

### Run locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

### Run tests

```bash
npm test
```

The test suite verifies that a document can be created, edited, shared, listed for the shared user, imported from Markdown, and rejects unsupported file types.

## File upload behavior

This prototype supports importing `.txt` and `.md` files.

Current behavior:

1. Select a `.txt` or `.md` file from the sidebar.
2. The browser reads the file.
3. The backend converts the file content into a new editable document.
4. The imported document becomes owned by the active user.

Unsupported file types such as `.pdf` and `.docx` are intentionally rejected with a visible error message. I scoped file handling this way so the working product demonstrates a useful import path without spending the timebox on heavy document parsing.

## Sharing flow to test

1. Use `Tejas Mhaisdhune` as the active user.
2. Create or open a document.
3. Use the **Share document** panel to grant access to `Ava Reviewer` or `Jordan PM`.
4. Switch the **Review as** dropdown to the shared user.
5. The document appears under **Shared with me**.
6. If shared with edit permission, the collaborator can edit and save the document.

## Deployment option

This app is a single Node.js web service and can be deployed on Render, Railway, Fly.io, or any platform that supports Node.

Recommended Render setup:

- New Web Service
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `PORT` is supplied by Render automatically

For a review deployment, the local JSON store is sufficient. For production, I would move persistence to Postgres or Supabase and add real authentication.

## Known limitations

- Mocked users instead of real authentication
- JSON-file persistence instead of production database storage
- Rich-text editor uses native browser editing commands, which are acceptable for this prototype but would be replaced with TipTap, ProseMirror, Slate, or Lexical for production
- File import is limited to `.txt` and `.md`
- No concurrent editing conflict resolution
- No version history or comments yet

## Project structure

```text
.
├── public/
│   ├── index.html      # UI shell
│   ├── styles.css      # Responsive product styling
│   └── app.js          # Frontend behavior and API calls
├── src/
│   └── store.js        # JSON persistence, access checks, import conversion
├── test/
│   └── app.test.js     # Automated tests
├── server.js           # Node HTTP server and API routes
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
├── SUBMISSION.md
└── WALKTHROUGH_SCRIPT.md
```
