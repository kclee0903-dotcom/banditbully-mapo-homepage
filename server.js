const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'data', 'reviews.json');
const UPLOAD_DIR = path.join(ROOT_DIR, 'public', 'uploads', 'reviews');
const SESSION_COOKIE = 'bandibuli_admin_session';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SITE_TYPES = ['신축 아파트', '구축 올수리', '새가구 반입', '인테리어 후 냄새', '대형시설', '기타'];
const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};

const ensureStorage = async () => {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, '[]', 'utf8'); }
};

const readReviews = async () => {
  await ensureStorage();
  const reviews = JSON.parse(await fs.readFile(DATA_FILE, 'utf8') || '[]');
  return reviews.sort((a, b) => new Date(b.reviewDate || b.createdAt) - new Date(a.reviewDate || a.createdAt));
};

const writeReviews = async (reviews) => {
  await ensureStorage();
  await fs.writeFile(DATA_FILE, JSON.stringify(reviews, null, 2), 'utf8');
};

const sendJson = (res, status, payload, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(payload));
};

const sendError = (res, status, message) => sendJson(res, status, { message });

const readBody = (req, limit = 1024 * 1024) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > limit) {
      reject(new Error('요청 용량이 너무 큽니다.'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const readJson = async (req) => {
  const body = await readBody(req);
  return body.length ? JSON.parse(body.toString('utf8')) : {};
};

const parseCookies = (header = '') => Object.fromEntries(header.split(';').filter(Boolean).map((pair) => {
  const [key, ...value] = pair.trim().split('=');
  return [key, decodeURIComponent(value.join('='))];
}));

const getCredentials = () => ({
  id: process.env.ADMIN_ID || '',
  password: process.env.ADMIN_PASSWORD || '',
  secret: process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
});

const safeCompare = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const signSession = (adminId) => {
  const { secret } = getCredentials();
  const payload = Buffer.from(JSON.stringify({ adminId, createdAt: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
};

const verifySession = (token = '') => {
  const { secret } = getCredentials();
  if (!secret || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeCompare(signature, expected)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Date.now() - session.createdAt < 1000 * 60 * 60 * 12;
  } catch { return false; }
};

const requireAdmin = (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (!verifySession(cookies[SESSION_COOKIE])) {
    sendError(res, 401, '관리자 로그인이 필요합니다.');
    return false;
  }
  return true;
};

const normalizeReview = (body, existing = {}) => {
  const rating = Math.min(5, Math.max(1, Number(body.rating || existing.rating || 5)));
  return {
    ...existing,
    id: existing.id || `review-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name: String(body.name || '').trim() || '익명 고객',
    siteType: SITE_TYPES.includes(body.siteType) ? body.siteType : '기타',
    location: String(body.location || '').trim(),
    rating,
    content: String(body.content || '').trim(),
    afterNote: String(body.afterNote || '').trim(),
    reviewDate: body.reviewDate || existing.reviewDate || new Date().toISOString().slice(0, 10),
    imageUrl: body.imageUrl === '' ? '' : (body.imageUrl || existing.imageUrl || ''),
    imageAlt: String(body.imageAlt || '').trim(),
    createdAt: existing.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

const parseMultipartImage = async (req) => {
  const match = (req.headers['content-type'] || '').match(/boundary=([^;]+)/);
  if (!match) throw new Error('이미지 업로드 형식이 올바르지 않습니다.');
  const body = await readBody(req, MAX_IMAGE_BYTES + 1024 * 200);
  const boundary = Buffer.from(`--${match[1]}`);
  const parts = [];
  let start = body.indexOf(boundary) + boundary.length + 2;
  while (start > boundary.length) {
    const end = body.indexOf(boundary, start);
    if (end === -1) break;
    parts.push(body.subarray(start, end - 2));
    start = end + boundary.length + 2;
  }
  const filePart = parts.find((part) => part.includes(Buffer.from('name="image"')));
  if (!filePart) throw new Error('이미지 파일을 찾을 수 없습니다.');
  const headerEnd = filePart.indexOf(Buffer.from('\r\n\r\n'));
  const header = filePart.subarray(0, headerEnd).toString('utf8');
  const data = filePart.subarray(headerEnd + 4);
  const filename = (header.match(/filename="([^"]+)"/) || [])[1] || 'review-image.jpg';
  const mimeType = (header.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1] || '';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) throw new Error('jpg, jpeg, png, webp 이미지만 업로드할 수 있습니다.');
  if (data.length > MAX_IMAGE_BYTES) throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');
  return { filename, mimeType, data };
};

const handleApi = async (req, res, url) => {
  if (req.method === 'GET' && url.pathname === '/api/reviews') return sendJson(res, 200, await readReviews());

  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    const { id, password, secret } = getCredentials();
    if (!id || !password || !secret) return sendError(res, 500, '관리자 환경변수가 설정되지 않았습니다.');
    const body = await readJson(req);
    if (!safeCompare(body.id || '', id) || !safeCompare(body.password || '', password)) {
      return sendError(res, 401, '아이디 또는 비밀번호를 확인해주세요.');
    }
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `${SESSION_COOKIE}=${encodeURIComponent(signSession(id))}; HttpOnly; SameSite=Strict; Max-Age=43200; Path=/${secure}` });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/` });
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/session') {
    const cookies = parseCookies(req.headers.cookie || '');
    return sendJson(res, 200, { authenticated: verifySession(cookies[SESSION_COOKIE]) });
  }

  if (url.pathname.startsWith('/api/admin/reviews') && !requireAdmin(req, res)) return null;

  if (req.method === 'GET' && url.pathname === '/api/admin/reviews') return sendJson(res, 200, await readReviews());

  if (req.method === 'POST' && url.pathname === '/api/admin/reviews/upload') {
    const file = await parseMultipartImage(req);
    const ext = path.extname(file.filename).toLowerCase() || (file.mimeType === 'image/png' ? '.png' : file.mimeType === 'image/webp' ? '.webp' : '.jpg');
    const safeName = `review-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(5).toString('hex')}${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, safeName), file.data);
    return sendJson(res, 201, { imageUrl: `/uploads/reviews/${safeName}`, imageAlt: file.filename });
  }

  if (req.method === 'POST' && url.pathname === '/api/admin/reviews') {
    const reviews = await readReviews();
    const review = normalizeReview(await readJson(req));
    reviews.push(review);
    await writeReviews(reviews);
    return sendJson(res, 201, review);
  }

  const idMatch = url.pathname.match(/^\/api\/admin\/reviews\/([^/]+)$/);
  if (idMatch && req.method === 'PUT') {
    const reviews = await readReviews();
    const index = reviews.findIndex((review) => review.id === decodeURIComponent(idMatch[1]));
    if (index === -1) return sendError(res, 404, '리뷰를 찾을 수 없습니다.');
    reviews[index] = normalizeReview(await readJson(req), reviews[index]);
    await writeReviews(reviews);
    return sendJson(res, 200, reviews[index]);
  }

  if (idMatch && req.method === 'DELETE') {
    const reviews = await readReviews();
    const nextReviews = reviews.filter((review) => review.id !== decodeURIComponent(idMatch[1]));
    if (nextReviews.length === reviews.length) return sendError(res, 404, '리뷰를 찾을 수 없습니다.');
    await writeReviews(nextReviews);
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 404, 'API 경로를 찾을 수 없습니다.');
};

const serveStatic = async (res, pathname) => {
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(ROOT_DIR, cleanPath));
  if (!filePath.startsWith(ROOT_DIR)) return sendError(res, 403, '접근할 수 없습니다.');
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': STATIC_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  } catch {
    sendError(res, 404, '파일을 찾을 수 없습니다.');
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname === '/admin' || url.pathname === '/admin/reviews') return await serveStatic(res, '/admin-reviews.html');
    if (url.pathname.startsWith('/uploads/')) return await serveStatic(res, `/public${url.pathname}`);
    return await serveStatic(res, decodeURIComponent(url.pathname));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) sendError(res, 500, error.message || '서버 오류가 발생했습니다.');
  }
});

ensureStorage().then(() => {
  server.listen(PORT, () => console.log(`Bandibuli homepage server running on http://localhost:${PORT}`));
});
