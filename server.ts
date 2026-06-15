import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// ===== 简易 JSON 文件数据库 =====
const DB_PATH = join(__dirname, 'db.json');

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data: unknown) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ===== RESTful 路由 =====
function handleAPI(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const url = req.url || '';
  const method = req.method || 'GET';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  if (!url.startsWith('/api/')) return false;

  const path = url.replace('/api', '');

  // GET /api/items
  if (method === 'GET' && path === '/items') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.items));
    return true;
  }

  // GET /api/items/:id
  const itemMatch = path.match(/^\/items\/(.+)$/);
  if (method === 'GET' && itemMatch) {
    const db = readDB();
    const item = db.items.find((i: { id: string | number }) => String(i.id) === itemMatch[1]);
    if (!item) { res.writeHead(404); res.end('Not found'); return true; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(item));
    return true;
  }

  // POST /api/items
  if (method === 'POST' && path === '/items') {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      const db = readDB();
      const newItem = JSON.parse(body);
      db.items.push(newItem);
      writeDB(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newItem));
    });
    return true;
  }

  // PATCH /api/items/:id
  if (method === 'PATCH' && itemMatch) {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      const db = readDB();
      const idx = db.items.findIndex((i: { id: string | number }) => String(i.id) === itemMatch[1]);
      if (idx === -1) { res.writeHead(404); res.end('Not found'); return; }
      db.items[idx] = { ...db.items[idx], ...JSON.parse(body) };
      writeDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.items[idx]));
    });
    return true;
  }

  // DELETE /api/items/:id
  if (method === 'DELETE' && itemMatch) {
    const db = readDB();
    db.items = db.items.filter((i: { id: string | number }) => String(i.id) !== itemMatch[1]);
    writeDB(db);
    res.writeHead(200);
    res.end('{}');
    return true;
  }

  // GET /api/categories
  if (method === 'GET' && path === '/categories') {
    const db = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(db.categories || []));
    return true;
  }

  // POST /api/categories
  if (method === 'POST' && path === '/categories') {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      const db = readDB();
      const cat = JSON.parse(body);
      if (!db.categories) db.categories = [];
      db.categories.push(cat);
      writeDB(db);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cat));
    });
    return true;
  }

  // GET /api/categories?name=xxx
  if (method === 'GET' && path.startsWith('/categories?')) {
    const urlObj = new URL(req.url!, `http://${req.headers.host}`);
    const name = urlObj.searchParams.get('name');
    const db = readDB();
    const cats = (db.categories || []).filter((c: { name: string }) => c.name === name);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cats));
    return true;
  }

  // PATCH /api/categories/:id
  const catMatch = path.match(/^\/categories\/(.+)$/);
  if (method === 'PATCH' && catMatch) {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      const db = readDB();
      const idx = (db.categories || []).findIndex((c: { id: string | number }) => String(c.id) === catMatch[1]);
      if (idx === -1) { res.writeHead(404); res.end('Not found'); return; }
      db.categories[idx] = { ...db.categories[idx], ...JSON.parse(body) };
      writeDB(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(db.categories[idx]));
    });
    return true;
  }

  // DELETE /api/categories/:id
  if (method === 'DELETE' && catMatch) {
    const db = readDB();
    db.categories = (db.categories || []).filter((c: { id: string | number }) => String(c.id) !== catMatch[1]);
    writeDB(db);
    res.writeHead(200);
    res.end('{}');
    return true;
  }

  res.writeHead(404);
  res.end('API not found');
  return true;
}

// ===== 静态文件服务 =====
const DIST_DIR = join(__dirname, 'dist');

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url === '/' ? '/index.html' : req.url || '/index.html';
  const filePath = join(DIST_DIR, url);

  const extMap: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  const contentType = extMap[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    // SPA fallback: serve index.html for all non-API routes
    try {
      const fallback = fs.readFileSync(join(DIST_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fallback);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}

// ===== 启动服务器 =====
const PORT = parseInt(process.env.PORT || '8080', 10);

const server = http.createServer((req, res) => {
  const isAPI = handleAPI(req, res);
  if (!isAPI) serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
