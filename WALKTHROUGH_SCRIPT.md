# 3-5 Minute Walkthrough Script

## 0:00-0:30 — Intro

This is Ajaia Docs Lite, a lightweight collaborative document editor built for the assessment. I intentionally scoped it around the core reviewer flows: create, edit, save, import, share, and verify owned versus shared access.

## 0:30-1:30 — Main user flow

1. Start as Tejas Mhaisdhune in the user dropdown.
2. Create a new document.
3. Rename it.
4. Add content using the rich-text editor.
5. Demonstrate bold, italic, underline, heading, and list formatting.
6. Save the document.
7. Refresh the page and reopen the document to show persistence.

## 1:30-2:10 — File import

1. Import `sample-import.md` from the project folder.
2. Explain that the prototype supports `.txt` and `.md` files.
3. Show that the uploaded file becomes a new editable document.

## 2:10-3:00 — Sharing

1. Open an owned document.
2. Share it with Ava Reviewer using edit permission.
3. Switch the active user dropdown to Ava Reviewer.
4. Show that the document appears under Shared with me.
5. Make a small edit and save to prove end-to-end shared access.

## 3:00-4:00 — Implementation decisions

I used a single Node.js server with a vanilla frontend to reduce setup friction. Data persists in a JSON store with users, documents, and shares. The access logic lives on the backend, so non-owners cannot share and view-only users cannot save.

## 4:00-4:40 — Tradeoffs

I intentionally deprioritized real authentication, real-time collaboration, `.docx` import, comments, and version history. Those are production-important, but the timebox favored a reliable, reviewable core workflow.

## 4:40-5:00 — AI workflow

AI helped decompose the prompt, scaffold code, generate tests, and draft documentation. I reviewed and adjusted the scope, rejected heavier stack choices, ran tests, and verified the end-to-end UX manually.
