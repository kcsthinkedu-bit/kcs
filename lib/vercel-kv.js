const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL || '';
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN || '';

export function json(res, data, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.json(data);
}

export function normalizeCode(value) {
  return String(value || '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function assertEnv() {
  if (!REST_URL || !REST_TOKEN) {
    const error = new Error('KV env vars are missing');
    error.statusCode = 500;
    throw error;
  }
}

async function redisGet(pathname, init = {}) {
  assertEnv();
  const url = `${REST_URL.replace(/\/$/, '')}${pathname}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { result: null, error: text };
  }
  if (!response.ok || (data && data.error)) {
    const error = new Error((data && data.error) || `Redis REST failed: ${response.status}`);
    error.statusCode = response.status || 500;
    throw error;
  }
  return data?.result;
}

export async function kvGetJson(key) {
  const result = await redisGet(`/get/${encodeURIComponent(key)}`);
  if (result == null) return null;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

export async function kvPutJson(key, value) {
  await redisGet(`/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: JSON.stringify(value),
  });
}

export async function kvDelete(key) {
  await redisGet(`/del/${encodeURIComponent(key)}`);
}

export async function listKeys(prefix = '') {
  const keys = [];
  let cursor = '0';
  do {
    const parts = ['/scan', encodeURIComponent(cursor)];
    if (prefix) {
      parts.push('MATCH', encodeURIComponent(`${prefix}*`));
    }
    parts.push('COUNT', '500');
    const result = await redisGet(parts.join('/'));
    cursor = String(Array.isArray(result) ? result[0] : '0');
    const batch = Array.isArray(result) && Array.isArray(result[1]) ? result[1] : [];
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

export async function listAllJson(prefix = '') {
  const keys = await listKeys(prefix);
  const items = await Promise.all(keys.map((key) => kvGetJson(key)));
  return items.filter(Boolean);
}

export function getBody(req) {
  return req.body || {};
}

export async function stableSubmissionId(classCode, studentName, toolType) {
  const raw = `${toolType}::${classCode}::${studentName}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
  return `submission:${hex.slice(0, 32)}`;
}

export function allowCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
