import { allowCors, getBody, json, kvGetJson, kvPutJson, normalizeCode, stableSubmissionId } from '../lib/vercel-kv.js';

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed' }, 405);
  try {
    const body = getBody(req);
    const classCode = normalizeCode(body.classCode || '');
    const studentName = String(body.studentName || '').trim();
    const toolType = String(body.toolType || 'coloringbook').trim();
    const title = String(body.title || '제목 없음').trim();
    const pageCount = Number(body.pageCount || 0);
    const stateJson = body.stateJson || {};
    if (!classCode || !studentName) return json(res, { error: '반 코드와 이름이 필요합니다.' }, 400);

    const classInfo = await kvGetJson(`code:${classCode}`);
    if (!classInfo || classInfo.status !== 'active' || classInfo.deleted) {
      return json(res, { error: '유효한 반 코드를 입력해 주세요.' }, 400);
    }

    const id = await stableSubmissionId(classCode, studentName, toolType);
    const existing = await kvGetJson(id);
    const now = new Date().toISOString();
    const overwritten = !!(existing && !existing.deleted);
    const item = {
      id,
      classCode,
      studentName,
      toolType,
      title,
      pageCount,
      status: overwritten ? (existing.status || 'submitted') : 'submitted',
      firstSubmittedAt: overwritten ? (existing.firstSubmittedAt || existing.submittedAt || now) : now,
      submittedAt: now,
      updatedAt: now,
      submitCount: overwritten ? Number(existing.submitCount || 1) + 1 : 1,
      stateJson,
    };

    await kvPutJson(id, item);
    return json(res, { ok: true, id, item, overwritten });
  } catch (error) {
    return json(res, { error: error.message || 'Unknown error' }, error.statusCode || 500);
  }
}
