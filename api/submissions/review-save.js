import { put } from '@vercel/blob';

function safePathPart(value, fallback) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

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

function getTeacherPassword(req) {
  return String(req.headers['x-teacher-password'] || '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 허용됩니다.' });
  }

  try {
    const expectedTeacherPassword = String(process.env.TEACHER_ACCESS_PASSWORD || '').trim();
    const expectedSubmissionCode = String(process.env.SUBMISSION_CODE || '').trim();

    if (!expectedTeacherPassword) {
      return res.status(500).json({ error: '서버 선생님 비밀번호 설정이 없습니다.' });
    }

    if (!expectedSubmissionCode) {
      return res.status(500).json({ error: '서버 제출코드 설정이 없습니다.' });
    }

    const teacherPassword = getTeacherPassword(req);
    if (teacherPassword !== expectedTeacherPassword) {
      return res.status(401).json({ error: '선생님 비밀번호가 올바르지 않습니다.' });
    }

    const raw = readBody(req.body);
    const submission = raw && raw.submission ? raw.submission : {};
    const book = raw && raw.book ? raw.book : raw;
    const sourceUrl = String(raw && raw.sourceUrl ? raw.sourceUrl : '').trim();

    if (!submission.className) {
      return res.status(400).json({ error: '학급명이 필요합니다.' });
    }

    if (!submission.studentName) {
      return res.status(400).json({ error: '학생 이름이 필요합니다.' });
    }

    const submissionCode = String(submission.submissionCode || '').trim();
    if (!submissionCode || submissionCode !== expectedSubmissionCode) {
      return res.status(403).json({ error: '이 제출본은 현재 선생님 제출코드와 일치하지 않습니다.' });
    }

    if (!book || !book.cover || !Array.isArray(book.spreads)) {
      return res.status(400).json({ error: '현재 KCS 책 JSON 형식이 필요합니다.' });
    }

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, '-');
    const schoolPart = safePathPart(submission.schoolName || 'school', 'school');
    const classPart = safePathPart(submission.className || 'class', 'class');
    const studentPart = safePathPart(submission.studentName || 'student', 'student');
    const numberPart = safePathPart(submission.studentNumber || 'no-number', 'no-number');

    const payload = {
      ...book,
      submission: {
        schoolName: String(submission.schoolName || '').trim(),
        className: String(submission.className || '').trim(),
        studentName: String(submission.studentName || '').trim(),
        studentNumber: String(submission.studentNumber || '').trim(),
        submissionCode,
        bookTitle: String(submission.bookTitle || book.title || '').trim(),
        paper: String(submission.paper || book.paper || 'A4').trim(),
        submittedAt: submission.submittedAt || null
      },
      review: {
        savedAt: now.toISOString(),
        savedBy: 'teacher',
        sourceUrl
      }
    };

    const pathname = `reviews/${schoolPart}/${classPart}/${stamp}-${studentPart}-${numberPart}-review.json`;

    const blob = await put(pathname, JSON.stringify(payload, null, 2), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json; charset=utf-8'
    });

    return res.status(200).json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      editUrl: `/coloringbook/?mode=teacher&loadFrom=${encodeURIComponent(blob.url)}`,
      teacherUrl: '/teacher/'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error && error.message ? error.message : '선생님 수정본 저장에 실패했습니다.'
    });
  }
}
