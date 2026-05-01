const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getDataFile() {
  return process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'store.json');
}

function ensureStore() {
  const dataFile = getDataFile();
  const dataDir = path.dirname(dataFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(dataFile)) {
    const now = new Date().toISOString();
    const seed = {
      users: [
        { id: 'u1', name: 'Tejas Mhaisdhune', email: 'tejas@example.com' },
        { id: 'u2', name: 'Ava Reviewer', email: 'ava.reviewer@example.com' },
        { id: 'u3', name: 'Jordan PM', email: 'jordan.pm@example.com' }
      ],
      documents: [
        {
          id: createId('doc'),
          title: 'Welcome Product Brief',
          ownerId: 'u1',
          content: '<h1>Welcome to Ajaia Docs Lite</h1><p>This prototype supports document creation, rich text editing, saving, reopening, file import, and basic sharing.</p><ul><li>Use the toolbar for formatting.</li><li>Upload a .txt or .md file to turn it into a document.</li><li>Share an owned document with another seeded user.</li></ul>',
          createdAt: now,
          updatedAt: now
        }
      ],
      shares: []
    };
    writeData(seed);
  }
}

function readData() {
  ensureStore();
  const raw = fs.readFileSync(getDataFile(), 'utf8');
  return JSON.parse(raw);
}

function writeData(data) {
  const dataFile = getDataFile();
  const dataDir = path.dirname(dataFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getUser(data, userId) {
  return data.users.find((user) => user.id === userId);
}

function getAccess(data, documentId, userId) {
  const doc = data.documents.find((item) => item.id === documentId);
  if (!doc || !getUser(data, userId)) return null;

  if (doc.ownerId === userId) {
    return { accessType: 'owned', permission: 'edit', owner: true };
  }

  const share = data.shares.find(
    (item) => item.documentId === documentId && item.targetUserId === userId
  );

  if (!share) return null;
  return { accessType: 'shared', permission: share.permission || 'view', owner: false };
}

function listDocumentsForUser(userId) {
  const data = readData();
  if (!getUser(data, userId)) return { error: 'Unknown user', status: 400 };

  const documents = data.documents
    .map((doc) => {
      const access = getAccess(data, doc.id, userId);
      if (!access) return null;
      const owner = getUser(data, doc.ownerId);
      return {
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        ownerName: owner ? owner.name : 'Unknown owner',
        accessType: access.accessType,
        permission: access.permission,
        updatedAt: doc.updatedAt,
        createdAt: doc.createdAt
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return { users: data.users, documents };
}

function getDocument(documentId, userId) {
  const data = readData();
  const doc = data.documents.find((item) => item.id === documentId);
  const access = getAccess(data, documentId, userId);

  if (!doc) return { error: 'Document not found', status: 404 };
  if (!access) return { error: 'You do not have access to this document', status: 403 };

  const owner = getUser(data, doc.ownerId);
  const shares = data.shares
    .filter((share) => share.documentId === documentId)
    .map((share) => ({
      ...share,
      targetUser: getUser(data, share.targetUserId)
    }));

  return {
    ...doc,
    ownerName: owner ? owner.name : 'Unknown owner',
    accessType: access.accessType,
    permission: access.permission,
    shares
  };
}

function createDocument({ ownerId, title = 'Untitled Document', content = '<p></p>' }) {
  const data = readData();
  if (!getUser(data, ownerId)) return { error: 'Unknown owner', status: 400 };

  const safeTitle = normalizeTitle(title);
  const safeContent = sanitizeRichText(content);
  const timestamp = nowIso();
  const doc = {
    id: createId('doc'),
    title: safeTitle,
    ownerId,
    content: safeContent,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  data.documents.push(doc);
  writeData(data);
  return doc;
}

function updateDocument(documentId, { userId, title, content }) {
  const data = readData();
  const doc = data.documents.find((item) => item.id === documentId);
  const access = getAccess(data, documentId, userId);

  if (!doc) return { error: 'Document not found', status: 404 };
  if (!access) return { error: 'You do not have access to this document', status: 403 };
  if (access.permission !== 'edit') return { error: 'You only have view access', status: 403 };

  if (typeof title === 'string') doc.title = normalizeTitle(title);
  if (typeof content === 'string') doc.content = sanitizeRichText(content);
  doc.updatedAt = nowIso();

  writeData(data);
  return getDocument(documentId, userId);
}

function shareDocument(documentId, { ownerId, targetUserId, permission = 'edit' }) {
  const data = readData();
  const doc = data.documents.find((item) => item.id === documentId);

  if (!doc) return { error: 'Document not found', status: 404 };
  if (doc.ownerId !== ownerId) return { error: 'Only the owner can share this document', status: 403 };
  if (!getUser(data, targetUserId)) return { error: 'Target user does not exist', status: 400 };
  if (targetUserId === ownerId) return { error: 'Owner already has access', status: 400 };
  if (!['view', 'edit'].includes(permission)) return { error: 'Permission must be view or edit', status: 400 };

  const existing = data.shares.find(
    (item) => item.documentId === documentId && item.targetUserId === targetUserId
  );

  if (existing) {
    existing.permission = permission;
    existing.updatedAt = nowIso();
  } else {
    data.shares.push({
      documentId,
      targetUserId,
      permission,
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }

  doc.updatedAt = nowIso();
  writeData(data);
  return getDocument(documentId, ownerId);
}

function importTextFile({ ownerId, filename, content }) {
  if (!filename || !/\.(txt|md)$/i.test(filename)) {
    return { error: 'Only .txt and .md files are supported in this prototype', status: 400 };
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return { error: 'Uploaded file is empty or unreadable', status: 400 };
  }

  const title = filename.replace(/\.(txt|md)$/i, '').replace(/[-_]/g, ' ').trim() || 'Imported Document';
  const html = convertPlainTextToHtml(content);
  return createDocument({ ownerId, title, content: html });
}

function normalizeTitle(title) {
  const safeTitle = String(title || '').trim().slice(0, 120);
  return safeTitle || 'Untitled Document';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function convertPlainTextToHtml(text) {
  const normalized = String(text).replace(/\r\n/g, '\n').trim();

  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      if (/^#\s+/.test(block)) return `<h1>${escapeHtml(block.replace(/^#\s+/, ''))}</h1>`;
      if (/^##\s+/.test(block)) return `<h2>${escapeHtml(block.replace(/^##\s+/, ''))}</h2>`;

      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return `<ol>${lines.map((line) => `<li>${escapeHtml(line.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
      }

      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

function sanitizeRichText(html) {
  const input = String(html || '');
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 200000);
}

module.exports = {
  readData,
  writeData,
  listDocumentsForUser,
  getDocument,
  createDocument,
  updateDocument,
  shareDocument,
  importTextFile,
  sanitizeRichText,
  convertPlainTextToHtml
};
