import { allowCors, json, kvGetJson, normalizeCode } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  try {
    const code = normalizeCode(req.query.code || '');
    if (!code) return json(res, { error: 'code is required' }, 400);
    const item = await kvGetJson(`code:${code}`);
    if (!item || item.status !== 'active') return json(res, { valid: false, error: '사용할 수 없는 반 코드입니다.' }, 404);
    return json(res, { valid: true, item });
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
