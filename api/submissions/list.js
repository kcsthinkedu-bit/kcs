import { list } from '@vercel/blob';

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 허용됩니다.' });
  }

  try {
    const result = await list({ prefix: 'submissions/' });
    const blobs = Array.isArray(result.blobs) ? result.blobs.slice() : [];
    blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    const items = await Promise.all(
      blobs.slice(0, 100).map(async (blob) => {
        let data = null;
        try {
          const response = await fetch(blob.url, { cache: 'no-store' });
          if (response.ok) {
            data = await response.json();
          }
        } catch (error) {
          console.error('submission fetch failed:', blob.url, error);
        }

        const submission = data && data.submission && typeof data.submission === 'object' ? data.submission : {};
        const spreads = data && Array.isArray(data.spreads) ? data.spreads : [];

        return {
          pathname: blob.pathname,
          url: blob.url,
          uploadedAt: blob.uploadedAt,
          size: blob.size,
          title: safeString((data && data.title) || submission.bookTitle),
          paper: safeString((data && data.paper) || submission.paper),
          spreadCount: spreads.length,
          schoolName: safeString(submission.schoolName),
          className: safeString(submission.className),
          studentName: safeString(submission.studentName),
          studentNumber: safeString(submission.studentNumber),
          submittedAt: safeString(submission.submittedAt) || blob.uploadedAt,
          editUrl: `/coloringbook/?mode=teacher&loadFrom=${encodeURIComponent(blob.url)}`
        };
      })
    );

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error && error.message ? error.message : '제출 목록을 불러오지 못했습니다.' });
  }
}
