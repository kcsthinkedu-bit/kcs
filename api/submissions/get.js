import {
  getSupabaseSubmissionBook,
  isSupabaseConfigured
} from '../_lib/supabase-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 사용할 수 있습니다.' });
  }

  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({ error: 'Supabase 저장소가 설정되어 있지 않습니다.' });
    }

    const id = String(req.query && req.query.id ? req.query.id : '').trim();
    if (!id) {
      return res.status(400).json({ error: '제출물 id가 필요합니다.' });
    }

    const book = await getSupabaseSubmissionBook(id);
    if (!book) {
      return res.status(404).json({ error: '제출물을 찾지 못했습니다.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(book);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error && error.message ? error.message : '제출물을 불러오지 못했습니다.'
    });
  }
}
