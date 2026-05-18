import { allowCors, getBody, json, kvGetJson, kvPutJson, normalizeCode, randomCode } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);
  try {
    const body = getBody(req);
    const label = String(body.label || '').trim();
    const note = String(body.note || '').trim();
    const manualCode = normalizeCode(body.manualCode || '');
    if (!label) return json(res, { error: '학급 이름이 필요합니다.' }, 400);

    let code = manualCode;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (!code) code = randomCode();
      const id = `code:${code}`;
      const existing = await kvGetJson(id);
      if (existing) {
        if (manualCode) return json(res, { error: '이미 사용 중인 반 코드입니다.' }, 409);
        code = '';
        continue;
      }
      const item = { id, code, label, note, status: 'active', createdAt: new Date().toISOString() };
      await kvPutJson(id, item);
      return json(res, { ok: true, item });
    }
    return json(res, { error: '고유한 반 코드를 만들지 못했습니다. 다시 시도해 주세요.' }, 500);
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
