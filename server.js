const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const store = require('./src/store');

const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res) {
  const parsed = url.parse(req.url);
  const safePath = path.normalize(decodeURIComponent(parsed.pathname)).replace(/^\.+[\/\\]/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
  }[extension] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function getDocumentId(pathname, suffix = '') {
  const pattern = suffix
    ? new RegExp(`^/api/documents/([^/]+)/${suffix}$`)
    : /^\/api\/documents\/([^/]+)$/;
  const match = pathname.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleApi(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  try {
    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true, service: 'Ajaia Docs Lite' });
    }

    if (method === 'GET' && pathname === '/api/users') {
      const data = store.readData();
      return sendJson(res, 200, { users: data.users });
    }

    if (method === 'GET' && pathname === '/api/documents') {
      const result = store.listDocumentsForUser(parsed.query.userId);
      if (result.error) return sendError(res, result.status, result.error);
      return sendJson(res, 200, result);
    }

    if (method === 'POST' && pathname === '/api/documents') {
      const body = await readJsonBody(req);
      const result = store.createDocument(body);
      if (result.error) return sendError(res, result.status, result.error);
      return sendJson(res, 201, { document: result });
    }

    const documentId = getDocumentId(pathname);
    if (documentId && method === 'GET') {
      const result = store.getDocument(documentId, parsed.query.userId);
      if (result.error) return sendError(res, result.status, result.error);
      return sendJson(res, 200, { document: result });
    }

    if (documentId && method === 'PATCH') {
      const body = await readJsonBody(req);
      const result = store.updateDocument(documentId, body);
      if (result.error) return sendError(res, result.status, result.error);
      return sendJson(res, 200, { document: result });
    }

    const shareDocumentId = getDocumentId(pathname, 'share');
    if (shareDocumentId && method === 'POST') {
      const body = await readJsonBody(req);
      const result = store.shareDocument(shareDocumentId, body);
      if (result.error) return sendError(res, result.status, result.error);
      return sendJson(res, 200, { document: result });
    }

    if (method === 'POST' && pathname === '/api/upload/import') {
      const body = await readJsonBody(req);
      const result = store.importTextFile(body);
      if (result.error) return sendError(res, result.status, result.error);
      return sendJson(res, 201, { document: result });
    }

    sendError(res, 404, 'API route not found');
  } catch (error) {
    sendError(res, 500, error.message || 'Unexpected server error');
  }
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      return handleApi(req, res);
    }
    return serveStatic(req, res);
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Ajaia Docs Lite running at http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
