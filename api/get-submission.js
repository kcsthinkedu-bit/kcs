import { allowCors, json, kvGetJson } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  try {
    const id = String(req.query.id || '').trim();
    if (!id) return json(res, { error: 'id is required' }, 400);
    const item = await kvGetJson(id);
    if (!item || item.deleted) return json(res, { error: 'Not found' }, 404);
    return json(res, { item });
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
