import { allowCors, getBody, json, kvGetJson, kvPutJson } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);
  try {
    const body = getBody(req);
    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();
    if (!id || !status) return json(res, { error: 'id and status are required' }, 400);
    const item = await kvGetJson(id);
    if (!item || item.deleted) return json(res, { error: 'Not found' }, 404);
    item.status = status;
    item.updatedAt = new Date().toISOString();
    await kvPutJson(id, item);
    return json(res, { ok: true, item });
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
