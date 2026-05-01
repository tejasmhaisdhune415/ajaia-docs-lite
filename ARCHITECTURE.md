# Architecture Note

## Product goal

The goal was to ship a coherent, reviewable document editor slice rather than a shallow clone of Google Docs. I prioritized the workflows reviewers can test quickly: create, edit, save, reopen, import, share, and switch users to verify access behavior.

## Scope choices

### Prioritized

1. **Document lifecycle**
   - Create, rename, edit, save, and reopen documents.
   - Rich-text formatting is preserved as HTML.

2. **Sharing model**
   - Every document has a clear owner.
   - Owners can grant another seeded user view or edit access.
   - The sidebar separates owned documents from shared documents.

3. **Persistence**
   - Documents, users, and shares persist in `data/store.json`.
   - This keeps setup simple and avoids requiring reviewers to configure a database.

4. **File import**
   - `.txt` and `.md` imports create new editable documents.
   - Markdown headings and simple lists are converted to rich-text HTML.

5. **Reviewability**
   - No external services are required locally.
   - Seeded accounts make sharing testable without auth setup.
   - Automated tests cover core API behavior.

### Intentionally deprioritized

- Real authentication
- Real-time collaboration
- Comments and suggestions
- Full `.docx` parsing
- Version history
- Enterprise permissions

Those are important for a production document editor, but they would reduce core reliability within the assessment timebox.

## System design

```text
Browser UI
  ├─ contenteditable rich-text editor
  ├─ user switcher for mocked auth
  ├─ document list grouped by owned/shared
  ├─ file import via browser File API
  └─ fetch calls to backend API

Node HTTP server
  ├─ serves static UI
  ├─ exposes JSON API routes
  ├─ validates user/document/share actions
  └─ persists state through store module

JSON store
  ├─ users
  ├─ documents
  └─ shares
```

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/users` | List seeded users |
| `GET` | `/api/documents?userId=:id` | List documents accessible to user |
| `POST` | `/api/documents` | Create document |
| `GET` | `/api/documents/:id?userId=:id` | Read document if accessible |
| `PATCH` | `/api/documents/:id` | Update title/content if user can edit |
| `POST` | `/api/documents/:id/share` | Owner grants access |
| `POST` | `/api/upload/import` | Import `.txt` or `.md` into a document |

## Data model

```json
{
  "users": [
    { "id": "u1", "name": "Tejas Mhaisdhune", "email": "tejas@example.com" }
  ],
  "documents": [
    {
      "id": "doc_...",
      "title": "Welcome Product Brief",
      "ownerId": "u1",
      "content": "<h1>Welcome</h1>",
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp"
    }
  ],
  "shares": [
    {
      "documentId": "doc_...",
      "targetUserId": "u2",
      "permission": "edit",
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp"
    }
  ]
}
```

## Validation and error handling

- Unknown users are rejected.
- Non-owners cannot share documents.
- View-only users cannot save edits.
- Empty imports are rejected.
- Unsupported file extensions are rejected.
- Script tags and inline event handlers are stripped before rich-text HTML is persisted.

## Tradeoffs

### JSON store vs database

I chose a JSON store because it makes the reviewer setup extremely fast and keeps focus on product behavior. The tradeoff is limited concurrency and durability. In a production implementation, I would migrate to Postgres with tables for users, documents, document_versions, shares, and audit events.

### Native rich-text editing vs editor framework

I used browser-native `contenteditable` and formatting commands because the assessment values a working product slice under time pressure. In production, I would use TipTap/ProseMirror or Lexical to get predictable document schemas, collaborative editing, comments, and safer transforms.

### Mocked users vs real auth

Seeded users make sharing easy to demonstrate. For production, I would add authentication, session management, and organization-level permissions.

## What I would build next with another 2-4 hours

1. Add document version history with restore support.
2. Add comments anchored to selected text.
3. Add a better editor schema using TipTap or Lexical.
4. Add a persistent deployment database such as Postgres.
5. Add role-based permissions with owner/editor/viewer rules in the UI and API.
