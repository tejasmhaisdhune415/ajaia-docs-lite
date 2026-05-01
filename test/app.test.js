const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../server');

function makeTempStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ajaia-docs-test-'));
  process.env.DATA_FILE = path.join(dir, 'store.json');
}

async function startTestServer() {
  makeTempStore();
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return { server, baseUrl };
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json();
  return { response, payload };
}

test('creates, edits, shares, and lists a shared document', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const created = await request(baseUrl, '/api/documents', {
      method: 'POST',
      body: JSON.stringify({ ownerId: 'u1', title: 'Launch Plan', content: '<h1>Plan</h1><p>Draft</p>' })
    });
    assert.equal(created.response.status, 201);
    const docId = created.payload.document.id;

    const updated = await request(baseUrl, `/api/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'u1', title: 'Updated Launch Plan', content: '<p><strong>Ready</strong></p>' })
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.document.title, 'Updated Launch Plan');
    assert.match(updated.payload.document.content, /strong/);

    const shared = await request(baseUrl, `/api/documents/${docId}/share`, {
      method: 'POST',
      body: JSON.stringify({ ownerId: 'u1', targetUserId: 'u2', permission: 'edit' })
    });
    assert.equal(shared.response.status, 200);
    assert.equal(shared.payload.document.shares.length, 1);

    const listForSharedUser = await request(baseUrl, '/api/documents?userId=u2');
    assert.equal(listForSharedUser.response.status, 200);
    assert.ok(listForSharedUser.payload.documents.some((doc) => doc.id === docId && doc.accessType === 'shared'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('imports a .md file as an editable document and rejects unsupported file types', async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const imported = await request(baseUrl, '/api/upload/import', {
      method: 'POST',
      body: JSON.stringify({ ownerId: 'u1', filename: 'meeting-notes.md', content: '# Notes\n\n- Decision one\n- Decision two' })
    });
    assert.equal(imported.response.status, 201);
    assert.equal(imported.payload.document.title, 'meeting notes');
    assert.match(imported.payload.document.content, /<h1>Notes<\/h1>/);
    assert.match(imported.payload.document.content, /<ul>/);

    const unsupported = await request(baseUrl, '/api/upload/import', {
      method: 'POST',
      body: JSON.stringify({ ownerId: 'u1', filename: 'deck.pdf', content: 'PDF body' })
    });
    assert.equal(unsupported.response.status, 400);
    assert.match(unsupported.payload.error, /Only \.txt and \.md/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
