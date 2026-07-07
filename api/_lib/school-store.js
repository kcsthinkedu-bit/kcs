import { list, put } from '@vercel/blob';
import crypto from 'crypto';

const TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

export function readBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }
  return body;
}

export function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function safePathPart(value, fallback = 'item') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

export function normalizeEmail(value) {
  return safeString(value).toLowerCase();
}

export function normalizeClassCode(value) {
  return safeString(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function makeClassCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return code;
}

export function hashText(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function getSecret() {
  return safeString(process.env.BOOK_HELPER_AUTH_SECRET)
    || safeString(process.env.TEACHER_ACCESS_PASSWORD)
    || safeString(process.env.SUBMISSION_CODE);
}

export function requireAuthSecret() {
  const secret = getSecret();
  if (!secret) {
    const error = new Error('서버 인증 비밀키가 설정되어 있지 않습니다. BOOK_HELPER_AUTH_SECRET 또는 TEACHER_ACCESS_PASSWORD를 설정해 주세요.');
    error.statusCode = 500;
    throw error;
  }
  return secret;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function parseBase64urlJson(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

export function createToken(profile) {
  const secret = requireAuthSecret();
  const payload = {
    teacherId: profile.teacherId,
    email: profile.email,
    name: profile.name,
    iat: Date.now(),
    exp: Date.now() + TOKEN_MAX_AGE_MS
  };
  const encoded = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token) {
  const secret = requireAuthSecret();
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  const payload = parseBase64urlJson(encoded);
  if (!payload || !payload.teacherId || !payload.exp || Date.now() > Number(payload.exp)) return null;
  return payload;
}

export function getBearerToken(req) {
  const header = String(req.headers.authorization || req.headers.Authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

export function getTeacherFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(password || ''), salt, 120000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.salt || !stored.hash) return false;
  const next = hashPassword(password, stored.salt).hash;
  return crypto.timingSafeEqual(Buffer.from(next), Buffer.from(stored.hash));
}

async function readBlobJson(blob) {
  try {
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('blob json read failed:', error);
    return null;
  }
}

export async function readFirstJsonByPrefix(prefix) {
  const result = await list({ prefix });
  const blobs = Array.isArray(result.blobs) ? result.blobs : [];
  if (!blobs.length) return null;
  return await readBlobJson(blobs[0]);
}

export async function listJsonByPrefix(prefix) {
  const result = await list({ prefix });
  const blobs = Array.isArray(result.blobs) ? result.blobs : [];
  const items = await Promise.all(blobs.map(async (blob) => ({
    blob,
    data: await readBlobJson(blob)
  })));
  return items.filter((item) => item.data);
}

export async function saveJson(pathname, data) {
  return await put(pathname, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8'
  });
}

export async function findTeacherByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return await readFirstJsonByPrefix(`teachers/email/${hashText(normalized)}.json`);
}

export async function findTeacherById(teacherId) {
  const safeTeacherId = safePathPart(teacherId, '');
  if (!safeTeacherId) return null;
  return await readFirstJsonByPrefix(`teachers/id/${safeTeacherId}.json`);
}

export function publicTeacherProfile(teacher) {
  if (!teacher) return null;
  return {
    teacherId: teacher.teacherId,
    name: teacher.name,
    email: teacher.email,
    schoolName: teacher.schoolName || '',
    createdAt: teacher.createdAt
  };
}

export async function findClassByCode(code) {
  const safeCode = normalizeClassCode(code);
  if (!safeCode) return null;
  const data = await readFirstJsonByPrefix(`classes/code/${safeCode}.json`);
  return data && data.active !== false ? data : null;
}

export async function listTeacherClasses(teacherId) {
  const items = await listJsonByPrefix(`classes/teacher/${teacherId}/`);
  return items
    .map((item) => item.data)
    .filter((item) => item && item.active !== false)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function createTeacherClass(teacher, input = {}) {
  const teacherId = teacher.teacherId;
  const schoolName = safeString(input.schoolName || teacher.schoolName);
  const className = safeString(input.className);
  if (!className) {
    const error = new Error('학급명을 입력해 주세요.');
    error.statusCode = 400;
    throw error;
  }

  let code = normalizeClassCode(input.code);
  if (code && code.length < 4) {
    const error = new Error('학급 코드는 4글자 이상으로 입력해 주세요.');
    error.statusCode = 400;
    throw error;
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const nextCode = code || makeClassCode();
    const existing = await findClassByCode(nextCode);
    if (!existing) {
      const now = new Date().toISOString();
      const classInfo = {
        code: nextCode,
        teacherId,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        schoolName,
        className,
        active: true,
        createdAt: now
      };
      await saveJson(`classes/code/${nextCode}.json`, classInfo);
      await saveJson(`classes/teacher/${teacherId}/${nextCode}.json`, classInfo);
      return classInfo;
    }

    if (code) {
      const error = new Error('이미 사용 중인 학급 코드입니다. 다른 코드를 입력해 주세요.');
      error.statusCode = 409;
      throw error;
    }
  }

  const error = new Error('학급 코드를 만들지 못했습니다. 다시 시도해 주세요.');
  error.statusCode = 500;
  throw error;
}

export function sendError(res, error, fallback = '요청 처리에 실패했습니다.') {
  const statusCode = Number(error && error.statusCode) || 500;
  return res.status(statusCode).json({
    error: error && error.message ? error.message : fallback
  });
}
