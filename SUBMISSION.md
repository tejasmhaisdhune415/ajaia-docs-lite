# Submission Checklist

## Included in this Google Drive folder

- Source code for Ajaia Docs Lite
- `README.md` with setup, run, test, and review instructions
- `ARCHITECTURE.md` with architecture notes, tradeoffs, and next steps
- `AI_WORKFLOW.md` explaining AI usage and verification
- `SUBMISSION.md` listing exactly what is included
- `WALKTHROUGH_SCRIPT.md` for the 3-5 minute walkthrough video
- `sample-import.md` to test the file import feature

## Live product URL

Paste deployed URL here:

```text
https://ajaia-docs-lite.onrender.com/
```

## Walkthrough video URL

Paste Loom / YouTube / Google Drive video URL here:

```text
https://www.loom.com/share/e68745d2862649139d8797db5c05f42c
```

## Test accounts / seeded users

No passwords are required. Use the **Review as** dropdown in the application.

| User | Purpose |
| --- | --- |
| Tejas Mhaisdhune | Default owner account |
| Ava Reviewer | Shared-user test account |
| Jordan PM | Additional collaborator test account |

## Local run instructions

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Automated tests

```bash
npm test
```

## What is working

- Document creation
- Rename document
- Rich-text editing in browser
- Save and reopen after refresh
- `.txt` and `.md` import into new editable document
- Owner-based sharing
- Owned vs shared document grouping
- View/edit permission enforcement in API
- JSON persistence
- Automated tests

## What is incomplete / intentionally scoped out

- Real authentication
- Real-time collaboration
- `.docx` import
- Comments and suggestion mode
- Version history
- Production-grade database and migrations

## What I would build next with another 2-4 hours

1. Add version history and restore.
2. Add comments on selected text.
3. Replace native editing with TipTap or Lexical for stronger document schema control.
4. Add Postgres persistence for deployment durability.
5. Add real authentication and role-based sharing controls.
