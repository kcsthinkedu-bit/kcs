import { allowCors, json, listAllJson } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  try {
    const items = await listAllJson('code:');
    return json(res, { items: items.filter((item) => item && !item.deleted) });
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
