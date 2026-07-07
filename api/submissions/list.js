import { list } from '@vercel/blob';
import {
  getTeacherFromRequest,
  normalizeClassCode,
  safeString
} from '../_lib/school-store.js';
import {
  isSupabaseConfigured,
  listSupabaseSubmissionsByCode,
  listSupabaseSubmissionsByTeacher
} from '../_lib/supabase-store.js';

function safeTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getTeacherPassword(req) {
  return String(req.headers['x-teacher-password'] || '').trim();
}

function buildStudentKey(item) {
  return [
    safeString(item.schoolName).toLowerCase(),
    safeString(item.className).toLowerCase(),
    safeString(item.studentName).toLowerCase(),
    safeString(item.studentNumber).toLowerCase()
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
  const submissionCode = normalizeClassCode(submission.submissionCode || submission.classCode);
  const classCode = normalizeClassCode(submission.classCode || submission.submissionCode);
  const teacherId = safeString(submission.teacherId);
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
    submissionCode,
    classCode,
    teacherId,
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

async function listItems(prefixes, kind) {
  const results = await Promise.all(prefixes.map((prefix) => list({ prefix })));
  const blobs = results.flatMap((result) => Array.isArray(result.blobs) ? result.blobs : []);
  return await Promise.all(blobs.map(async (blob) => buildItem(blob, await readBlobJson(blob), kind)));
}

function finishItems(items) {
  const reviewCountBySourceUrl = new Map();
  items.forEach((item) => {
    if (item.kind !== 'review' || !item.sourceUrl) return;
    reviewCountBySourceUrl.set(item.sourceUrl, (reviewCountBySourceUrl.get(item.sourceUrl) || 0) + 1);
  });

  const latestTimeByStudent = new Map();
  items.forEach((item) => {
    const current = latestTimeByStudent.get(item.studentKey) || 0;
    const next = safeTime(item.createdAt);
    if (next > current) {
      latestTimeByStudent.set(item.studentKey, next);
    }
  });

  const finishedItems = items
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

  const classes = Array.from(new Set(finishedItems.map((item) => item.className).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko-KR'));

  return { items: finishedItems, classes };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 사용할 수 있습니다.' });
  }

  try {
    const teacher = getTeacherFromRequest(req);
    let submissionItems = [];
    let reviewItems = [];

    if (isSupabaseConfigured()) {
      let items = [];

      if (teacher) {
        items = await listSupabaseSubmissionsByTeacher(teacher.teacherId);
      } else {
        const expectedTeacherPassword = String(process.env.TEACHER_ACCESS_PASSWORD || '').trim();
        const expectedSubmissionCode = normalizeClassCode(process.env.SUBMISSION_CODE || '');

        if (!expectedTeacherPassword) {
          return res.status(500).json({ error: '서버 선생님 비밀번호 설정이 없습니다.' });
        }

        if (!expectedSubmissionCode) {
          return res.status(500).json({ error: '서버 제출코드 설정이 없습니다.' });
        }

        const teacherPassword = getTeacherPassword(req);
        if (teacherPassword !== expectedTeacherPassword) {
          return res.status(401).json({ error: '선생님 비밀번호가 맞지 않습니다.' });
        }

        items = await listSupabaseSubmissionsByCode(expectedSubmissionCode);
      }

      const finished = finishItems(items);
      return res.status(200).json({
        ok: true,
        storage: 'supabase',
        teacher: teacher || null,
        count: finished.items.length,
        classes: finished.classes,
        items: finished.items
      });
    }

    if (teacher) {
      [submissionItems, reviewItems] = await Promise.all([
        listItems([`submissions/${teacher.teacherId}/`], 'submission'),
        listItems([`reviews/${teacher.teacherId}/`], 'review')
      ]);
    } else {
      const expectedTeacherPassword = String(process.env.TEACHER_ACCESS_PASSWORD || '').trim();
      const expectedSubmissionCode = normalizeClassCode(process.env.SUBMISSION_CODE || '');

      if (!expectedTeacherPassword) {
        return res.status(500).json({ error: '서버 선생님 비밀번호 설정이 없습니다.' });
      }

      if (!expectedSubmissionCode) {
        return res.status(500).json({ error: '서버 제출코드 설정이 없습니다.' });
      }

      const teacherPassword = getTeacherPassword(req);
      if (teacherPassword !== expectedTeacherPassword) {
        return res.status(401).json({ error: '선생님 비밀번호가 맞지 않습니다.' });
      }

      [submissionItems, reviewItems] = await Promise.all([
        listItems(['submissions/'], 'submission'),
        listItems(['reviews/'], 'review')
      ]);

      submissionItems = submissionItems.filter((item) => item.submissionCode === expectedSubmissionCode);
      reviewItems = reviewItems.filter((item) => item.submissionCode === expectedSubmissionCode);
    }

    const { items, classes } = finishItems([...submissionItems, ...reviewItems]);

    return res.status(200).json({
      ok: true,
      teacher: teacher || null,
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
