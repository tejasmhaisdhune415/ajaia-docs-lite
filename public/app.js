const state = {
  users: [],
  currentUserId: localStorage.getItem('ajaia.currentUserId') || 'u1',
  documents: [],
  currentDocument: null,
  dirty: false
};

const els = {
  userSelect: document.getElementById('userSelect'),
  newDocBtn: document.getElementById('newDocBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  fileInput: document.getElementById('fileInput'),
  uploadStatus: document.getElementById('uploadStatus'),
  docList: document.getElementById('docList'),
  emptyState: document.getElementById('emptyState'),
  editorArea: document.getElementById('editorArea'),
  titleInput: document.getElementById('titleInput'),
  docMeta: document.getElementById('docMeta'),
  saveStatus: document.getElementById('saveStatus'),
  saveBtn: document.getElementById('saveBtn'),
  editor: document.getElementById('editor'),
  toolbar: document.querySelector('.toolbar'),
  sharePanel: document.getElementById('sharePanel'),
  shareUserSelect: document.getElementById('shareUserSelect'),
  permissionSelect: document.getElementById('permissionSelect'),
  shareBtn: document.getElementById('shareBtn'),
  shareList: document.getElementById('shareList'),
  toast: document.getElementById('toast')
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  let payload = {};
  try { payload = await response.json(); } catch (_) { payload = {}; }

  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 3000);
}

function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date(iso));
}

function setDirty(isDirty) {
  state.dirty = isDirty;
  els.saveStatus.textContent = isDirty ? 'Unsaved changes' : 'Saved';
  els.saveStatus.className = `save-status ${isDirty ? 'dirty' : 'saved'}`;
}

function renderUsers() {
  els.userSelect.innerHTML = state.users
    .map((user) => `<option value="${user.id}">${user.name}</option>`)
    .join('');
  els.userSelect.value = state.currentUserId;
}

function renderShareUsers() {
  if (!state.currentDocument) return;
  const options = state.users
    .filter((user) => user.id !== state.currentDocument.ownerId)
    .map((user) => `<option value="${user.id}">${user.name}</option>`)
    .join('');
  els.shareUserSelect.innerHTML = options;
}

function renderDocumentList() {
  const owned = state.documents.filter((doc) => doc.accessType === 'owned');
  const shared = state.documents.filter((doc) => doc.accessType === 'shared');

  const renderGroup = (label, docs) => {
    if (!docs.length) return '';
    return `<div class="doc-section-label">${label}</div>${docs.map(renderDocItem).join('')}`;
  };

  els.docList.innerHTML =
    renderGroup('Owned by me', owned) +
    renderGroup('Shared with me', shared) ||
    '<p class="muted">No documents yet. Create or import one.</p>';
}

function renderDocItem(doc) {
  const active = state.currentDocument && state.currentDocument.id === doc.id ? 'active' : '';
  return `
    <button class="doc-item ${active}" data-doc-id="${doc.id}">
      <span class="doc-title">
        <span>${escapeHtml(doc.title)}</span>
        <span class="badge">${doc.accessType === 'owned' ? 'Owner' : doc.permission}</span>
      </span>
      <span class="doc-subtitle">${doc.accessType === 'owned' ? 'You own this' : `Owner: ${escapeHtml(doc.ownerName)}`} · ${formatDate(doc.updatedAt)}</span>
    </button>`;
}

function renderEditor() {
  if (!state.currentDocument) {
    els.emptyState.classList.remove('hidden');
    els.editorArea.classList.add('hidden');
    return;
  }

  const doc = state.currentDocument;
  const canEdit = doc.permission === 'edit';

  els.emptyState.classList.add('hidden');
  els.editorArea.classList.remove('hidden');
  els.titleInput.value = doc.title;
  els.titleInput.disabled = !canEdit;
  els.editor.innerHTML = doc.content || '<p></p>';
  els.editor.setAttribute('contenteditable', String(canEdit));
  els.saveBtn.disabled = !canEdit;
  els.toolbar.querySelectorAll('button').forEach((button) => (button.disabled = !canEdit));

  els.docMeta.textContent = `${doc.accessType === 'owned' ? 'Owned by you' : `Shared by ${doc.ownerName}`} · ${doc.permission === 'edit' ? 'Can edit' : 'View only'} · Last saved ${formatDate(doc.updatedAt)}`;

  if (doc.accessType === 'owned') {
    els.sharePanel.classList.remove('hidden');
    renderShareUsers();
    renderShares();
  } else {
    els.sharePanel.classList.add('hidden');
  }

  setDirty(false);
  renderDocumentList();
}

function renderShares() {
  const shares = state.currentDocument.shares || [];
  if (!shares.length) {
    els.shareList.innerHTML = '<p class="muted">Not shared with anyone yet.</p>';
    return;
  }
  els.shareList.innerHTML = shares
    .map((share) => `<span class="share-chip">${escapeHtml(share.targetUser?.name || share.targetUserId)} · ${share.permission}</span>`)
    .join('');
}

async function loadUsers() {
  const payload = await api('/api/users');
  state.users = payload.users;
  if (!state.users.some((user) => user.id === state.currentUserId)) {
    state.currentUserId = state.users[0]?.id || 'u1';
  }
  renderUsers();
}

async function loadDocuments() {
  const payload = await api(`/api/documents?userId=${encodeURIComponent(state.currentUserId)}`);
  state.documents = payload.documents;
  renderDocumentList();
}

async function loadDocument(documentId) {
  const payload = await api(`/api/documents/${encodeURIComponent(documentId)}?userId=${encodeURIComponent(state.currentUserId)}`);
  state.currentDocument = payload.document;
  renderEditor();
}

async function createDocument() {
  const payload = await api('/api/documents', {
    method: 'POST',
    body: JSON.stringify({ ownerId: state.currentUserId, title: 'Untitled Document', content: '<h1>Untitled Document</h1><p>Start writing here...</p>' })
  });
  await loadDocuments();
  await loadDocument(payload.document.id);
  showToast('New document created');
}

async function saveDocument() {
  if (!state.currentDocument || state.currentDocument.permission !== 'edit') return;
  els.saveStatus.textContent = 'Saving...';
  try {
    const payload = await api(`/api/documents/${encodeURIComponent(state.currentDocument.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        userId: state.currentUserId,
        title: els.titleInput.value,
        content: els.editor.innerHTML
      })
    });
    state.currentDocument = payload.document;
    await loadDocuments();
    renderEditor();
    showToast('Document saved');
  } catch (error) {
    els.saveStatus.textContent = error.message;
    els.saveStatus.className = 'save-status error';
  }
}

async function shareCurrentDocument() {
  if (!state.currentDocument) return;
  const targetUserId = els.shareUserSelect.value;
  const permission = els.permissionSelect.value;
  const payload = await api(`/api/documents/${encodeURIComponent(state.currentDocument.id)}/share`, {
    method: 'POST',
    body: JSON.stringify({ ownerId: state.currentUserId, targetUserId, permission })
  });
  state.currentDocument = payload.document;
  renderEditor();
  showToast('Access granted');
}

async function importFile(file) {
  if (!file) return;
  els.uploadStatus.textContent = 'Reading file...';

  if (!/\.(txt|md)$/i.test(file.name)) {
    els.uploadStatus.textContent = 'Only .txt and .md imports are supported.';
    return;
  }

  const content = await file.text();
  try {
    const payload = await api('/api/upload/import', {
      method: 'POST',
      body: JSON.stringify({ ownerId: state.currentUserId, filename: file.name, content })
    });
    els.uploadStatus.textContent = `Imported ${file.name}`;
    await loadDocuments();
    await loadDocument(payload.document.id);
    showToast('File imported as a new editable document');
  } catch (error) {
    els.uploadStatus.textContent = error.message;
  } finally {
    els.fileInput.value = '';
  }
}

function executeToolbarAction(event) {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  els.editor.focus();

  if (button.dataset.command) {
    document.execCommand(button.dataset.command, false, null);
  }

  if (button.dataset.block) {
    document.execCommand('formatBlock', false, button.dataset.block);
  }

  setDirty(true);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bindEvents() {
  els.userSelect.addEventListener('change', async () => {
    state.currentUserId = els.userSelect.value;
    localStorage.setItem('ajaia.currentUserId', state.currentUserId);
    state.currentDocument = null;
    renderEditor();
    await loadDocuments();
  });

  els.newDocBtn.addEventListener('click', createDocument);
  els.refreshBtn.addEventListener('click', loadDocuments);
  els.saveBtn.addEventListener('click', saveDocument);
  els.shareBtn.addEventListener('click', shareCurrentDocument);
  els.fileInput.addEventListener('change', (event) => importFile(event.target.files[0]));

  els.docList.addEventListener('click', (event) => {
    const item = event.target.closest('[data-doc-id]');
    if (!item) return;
    if (state.dirty && !confirm('You have unsaved changes. Continue without saving?')) return;
    loadDocument(item.dataset.docId);
  });

  els.titleInput.addEventListener('input', () => setDirty(true));
  els.editor.addEventListener('input', () => setDirty(true));
  els.toolbar.addEventListener('click', executeToolbarAction);

  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveDocument();
    }
  });
}

async function init() {
  bindEvents();
  await loadUsers();
  await loadDocuments();
  renderEditor();
}

init().catch((error) => {
  console.error(error);
  showToast(error.message || 'Failed to load app');
});
