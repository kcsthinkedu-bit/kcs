import { del } from '@vercel/blob';

function readBody(body) {
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

// 연습용: teacher 목록에서 바로 삭제 가능
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  try {
    const raw = readBody(req.body);
    const pathname = typeof raw.pathname === 'string' ? raw.pathname.trim() : '';

    if (!pathname) {
      return res.status(400).json({ error: '삭제할 pathname이 필요합니다.' });
    }

    if (!pathname.startsWith('submissions/') && !pathname.startsWith('reviews/')) {
      return res.status(400).json({ error: '연습용 submissions/reviews 파일만 삭제할 수 있습니다.' });
    }

    await del(pathname);

    return res.status(200).json({
      ok: true,
      pathname
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error && error.message ? error.message : '삭제에 실패했습니다.'
    });
  }
}
