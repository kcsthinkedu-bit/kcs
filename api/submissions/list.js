import { list } from '@vercel/blob';

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

function safeTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function buildStudentKey(item) {
  return [
    safeString(item.schoolName).trim().toLowerCase(),
    safeString(item.className).trim().toLowerCase(),
    safeString(item.studentName).trim().toLowerCase(),
    safeString(item.studentNumber).trim().toLowerCase()
  ].join('::');
}

async function readBlobJson(blob) {
  try {
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('blob fetch failed:', blob.url, error);
    return null;
  }
}

function buildItem(blob, data, kind) {
  const submission = data && data.submission && typeof data.submission === 'object' ? data.submission : {};
  const review = data && data.review && typeof data.review === 'object' ? data.review : {};
  const spreads = data && Array.isArray(data.spreads) ? data.spreads : [];

  const schoolName = safeString(submission.schoolName);
  const className = safeString(submission.className);
  const studentName = safeString(submission.studentName);
  const studentNumber = safeString(submission.studentNumber);
  const title = safeString((data && data.title) || submission.bookTitle);
  const paper = safeString((data && data.paper) || submission.paper);
  const sourceUrl = safeString(review.sourceUrl);

  const createdAt =
    safeString(review.savedAt) ||
    safeString(submission.submittedAt) ||
    safeString((data && data.savedAt) || '') ||
    safeString(blob.uploadedAt);

  return {
    kind,
    pathname: blob.pathname,
    url: blob.url,
    uploadedAt: blob.uploadedAt,
    createdAt,
    size: blob.size,
    title,
    paper,
    spreadCount: spreads.length,
    schoolName,
    className,
    studentName,
    studentNumber,
    submittedAt: safeString(submission.submittedAt) || safeString(blob.uploadedAt),
    sourceUrl,
    studentKey: buildStudentKey({
      schoolName,
      className,
      studentName,
      studentNumber
    }),
    editUrl: `/coloringbook/?mode=teacher&loadFrom=${encodeURIComponent(blob.url)}`
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 허용됩니다.' });
  }

  try {
    const [submissionResult, reviewResult] = await Promise.all([
      list({ prefix: 'submissions/' }),
      list({ prefix: 'reviews/' })
    ]);

    const submissionBlobs = Array.isArray(submissionResult.blobs) ? submissionResult.blobs.slice() : [];
    const reviewBlobs = Array.isArray(reviewResult.blobs) ? reviewResult.blobs.slice() : [];

    const [submissionItems, reviewItems] = await Promise.all([
      Promise.all(submissionBlobs.map(async (blob) => buildItem(blob, await readBlobJson(blob), 'submission'))),
      Promise.all(reviewBlobs.map(async (blob) => buildItem(blob, await readBlobJson(blob), 'review')))
    ]);

    const reviewCountBySourceUrl = new Map();
    reviewItems.forEach((item) => {
      if (!item.sourceUrl) return;
      reviewCountBySourceUrl.set(item.sourceUrl, (reviewCountBySourceUrl.get(item.sourceUrl) || 0) + 1);
    });

    const latestTimeByStudent = new Map();
    [...submissionItems, ...reviewItems].forEach((item) => {
      const current = latestTimeByStudent.get(item.studentKey) || 0;
      const next = safeTime(item.createdAt);
      if (next > current) {
        latestTimeByStudent.set(item.studentKey, next);
      }
    });

    const items = [...submissionItems, ...reviewItems]
      .map((item) => {
        const latestStudentTime = latestTimeByStudent.get(item.studentKey) || 0;
        const reviewCount = item.kind === 'submission' ? (reviewCountBySourceUrl.get(item.url) || 0) : 0;
        const reviewed = item.kind === 'review' || reviewCount > 0;

        return {
          ...item,
          reviewCount,
          reviewed,
          isLatestForStudent: safeTime(item.createdAt) === latestStudentTime,
          kindLabel: item.kind === 'review' ? '선생님 수정본' : '학생 원본',
          statusLabel: reviewed ? '검토완료' : '검토필요'
        };
      })
      .sort((a, b) => {
        const aGroup = latestTimeByStudent.get(a.studentKey) || 0;
        const bGroup = latestTimeByStudent.get(b.studentKey) || 0;
        if (bGroup !== aGroup) return bGroup - aGroup;
        return safeTime(b.createdAt) - safeTime(a.createdAt);
      });

    const classes = Array.from(new Set(items.map((item) => item.className).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko-KR'));

    return res.status(200).json({
      ok: true,
      count: items.length,
      classes,
      items
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error && error.message ? error.message : '제출 목록을 불러오지 못했습니다.'
    });
  }
}
