import { allowCors, getBody, json, kvDelete, kvGetJson } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);
  try {
    const body = getBody(req);
    const id = String(body.id || '').trim();
    if (!id) return json(res, { error: 'id is required' }, 400);
    const item = await kvGetJson(id);
    if (!item || item.deleted) return json(res, { error: 'Not found' }, 404);
    await kvDelete(id);
    return json(res, { ok: true, id });
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
