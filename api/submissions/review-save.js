import { put } from '@vercel/blob';
import {
  findClassByCode,
  getTeacherFromRequest,
  normalizeClassCode,
  readBody,
  safePathPart,
  safeString
} from '../_lib/school-store.js';

function getTeacherPassword(req) {
  return String(req.headers['x-teacher-password'] || '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 사용할 수 있습니다.' });
  }

  try {
    const teacher = getTeacherFromRequest(req);
    const expectedTeacherPassword = String(process.env.TEACHER_ACCESS_PASSWORD || '').trim();
    const expectedSubmissionCode = normalizeClassCode(process.env.SUBMISSION_CODE || '');

    if (!teacher) {
      if (!expectedTeacherPassword) {
        return res.status(500).json({ error: '서버 선생님 비밀번호 설정이 없습니다.' });
      }

      const teacherPassword = getTeacherPassword(req);
      if (teacherPassword !== expectedTeacherPassword) {
        return res.status(401).json({ error: '선생님 비밀번호가 맞지 않습니다.' });
      }
    }

    const raw = readBody(req.body);
    const submission = raw && raw.submission ? raw.submission : {};
    const book = raw && raw.book ? raw.book : raw;
    const sourceUrl = safeString(raw && raw.sourceUrl);

    if (!submission.className) {
      return res.status(400).json({ error: '학급명이 필요합니다.' });
    }

    if (!submission.studentName) {
      return res.status(400).json({ error: '학생 이름이 필요합니다.' });
    }

    const submissionCode = normalizeClassCode(submission.submissionCode || submission.classCode);
    if (!submissionCode) {
      return res.status(403).json({ error: '제출코드가 필요합니다.' });
    }

    const classInfo = await findClassByCode(submissionCode);
    if (teacher) {
      if (classInfo && classInfo.teacherId !== teacher.teacherId) {
        return res.status(403).json({ error: '다른 선생님의 학급 작품은 저장할 수 없습니다.' });
      }
      if (submission.teacherId && submission.teacherId !== teacher.teacherId) {
        return res.status(403).json({ error: '다른 선생님의 제출 작품은 저장할 수 없습니다.' });
      }
    } else if (!expectedSubmissionCode || submissionCode !== expectedSubmissionCode) {
      return res.status(403).json({ error: '현재 선생님 제출코드와 일치하지 않습니다.' });
    }

    if (!book || !book.cover || !Array.isArray(book.spreads)) {
      return res.status(400).json({ error: '현재 책 JSON 형식이 필요합니다.' });
    }

    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, '-');
    const schoolName = safeString(submission.schoolName) || safeString(classInfo && classInfo.schoolName);
    const className = safeString(submission.className) || safeString(classInfo && classInfo.className);
    const studentName = safeString(submission.studentName);
    const studentNumber = safeString(submission.studentNumber);
    const teacherId = teacher ? teacher.teacherId : safeString(submission.teacherId);

    const payload = {
      ...book,
      submission: {
        schoolName,
        className,
        studentName,
        studentNumber,
        submissionCode,
        classCode: classInfo ? classInfo.code : submissionCode,
        teacherId,
        teacherName: teacher ? teacher.name : safeString(submission.teacherName),
        bookTitle: safeString(submission.bookTitle || book.title),
        paper: safeString(submission.paper || book.paper || 'A4'),
        submittedAt: submission.submittedAt || null
      },
      review: {
        savedAt: now.toISOString(),
        savedBy: teacher ? teacher.name || 'teacher' : 'teacher',
        sourceUrl
      }
    };

    const studentPart = safePathPart(studentName || 'student', 'student');
    const numberPart = safePathPart(studentNumber || 'no-number', 'no-number');
    const pathname = teacher
      ? `reviews/${safePathPart(teacher.teacherId, 'teacher')}/${payload.submission.classCode}/${stamp}-${studentPart}-${numberPart}-review.json`
      : `reviews/${safePathPart(schoolName || 'school', 'school')}/${safePathPart(className || 'class', 'class')}/${stamp}-${studentPart}-${numberPart}-review.json`;

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
