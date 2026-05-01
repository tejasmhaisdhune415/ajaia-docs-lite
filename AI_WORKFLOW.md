# AI Workflow Note

## AI tools used

- ChatGPT as a coding and product-structuring assistant
- AI-assisted decomposition for the assessment requirements
- AI-assisted generation of starter code, tests, README, architecture note, and walkthrough outline

## Where AI materially sped up the work

1. **Requirement decomposition**
   - I used AI to break the open-ended prompt into a small product slice: document editing, upload/import, sharing, persistence, validation, tests, and review documentation.

2. **Scope control**
   - AI helped identify the highest-value features for the timebox and avoid overbuilding Google Docs-level complexity.

3. **Implementation scaffolding**
   - AI accelerated creation of the Node server, frontend structure, JSON persistence layer, and API tests.

4. **Documentation**
   - AI helped draft reviewer-facing documentation so the submission is easier to evaluate quickly.

## AI-generated output I changed or rejected

- I rejected a heavier stack that would require reviewers to install a database or paid service.
- I avoided `.docx` parsing because it added dependency and reliability risk within the timebox.
- I simplified real authentication into seeded users to keep the sharing flow testable.
- I kept native rich-text editing for the prototype, but documented that a production version should use TipTap, ProseMirror, Slate, or Lexical.
- I reviewed access-control logic to ensure non-owners cannot share and view-only users cannot save edits.

## Verification approach

I verified correctness using three methods:

1. **Manual product flow checks**
   - Create a document.
   - Rename and edit it.
   - Save and refresh.
   - Import a `.txt` or `.md` file.
   - Share a document from the owner account.
   - Switch users and confirm the document appears under shared documents.

2. **Automated tests**
   - `npm test` validates create, update, share, shared listing, file import, and unsupported file rejection.

3. **UX review**
   - I checked that reviewer-facing flows are visible: seeded users, owned/shared distinction, supported upload types, save status, and share state.

## Prompting strategy used

I used iterative prompting rather than asking AI for one final answer. The workflow was:

1. Convert the assessment into product requirements.
2. Prioritize the smallest useful full-stack slice.
3. Generate an implementation plan.
4. Build the backend and frontend.
5. Add automated tests.
6. Add reviewer documentation.
7. Review tradeoffs and limitations clearly.

## Human judgment retained

The key decisions were not outsourced to AI. I made explicit product tradeoffs around storage, file types, authentication, editor complexity, and deployment simplicity. AI was used to accelerate execution and documentation, while final scope and reviewer-readiness were driven by product judgment.
