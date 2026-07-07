import { put } from '@vercel/blob';
import {
  findClassByCode,
  normalizeClassCode,
  readBody,
  safePathPart,
  safeString
} from '../_lib/school-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 사용할 수 있습니다.' });
  }

  try {
    const raw = readBody(req.body);
    const submission = raw && raw.submission ? raw.submission : {};
    const book = raw && raw.book ? raw.book : raw;

    if (!submission.className) {
      return res.status(400).json({ error: '학급명을 입력해 주세요.' });
    }

    if (!submission.studentName) {
      return res.status(400).json({ error: '학생 이름을 입력해 주세요.' });
    }

    const submissionCode = normalizeClassCode(submission.submissionCode);
    if (!submissionCode) {
      return res.status(400).json({ error: '학급 코드가 필요합니다.' });
    }

    const classInfo = await findClassByCode(submissionCode);
    const legacySubmissionCode = normalizeClassCode(process.env.SUBMISSION_CODE || '');
    const isLegacyCode = !classInfo && legacySubmissionCode && submissionCode === legacySubmissionCode;

    if (!classInfo && !isLegacyCode) {
      return res.status(403).json({ error: '학급 코드가 맞지 않습니다. 선생님이 만든 학급 코드를 다시 확인해 주세요.' });
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

    const studentPart = safePathPart(studentName || 'student', 'student');
    const numberPart = safePathPart(studentNumber || 'no-number', 'no-number');

    const payload = {
      ...book,
      submission: {
        schoolName,
        className,
        studentName,
        studentNumber,
        submissionCode,
        classCode: classInfo ? classInfo.code : submissionCode,
        teacherId: classInfo ? classInfo.teacherId : '',
        teacherName: classInfo ? classInfo.teacherName : '',
        bookTitle: safeString(submission.bookTitle || book.title),
        paper: safeString(submission.paper || book.paper || 'A4'),
        submittedAt: submission.submittedAt || now.toISOString()
      }
    };

    const pathname = classInfo
      ? `submissions/${safePathPart(classInfo.teacherId, 'teacher')}/${classInfo.code}/${stamp}-${studentPart}-${numberPart}.json`
      : `submissions/${safePathPart(schoolName || 'school', 'school')}/${safePathPart(className || 'class', 'class')}/${stamp}-${studentPart}-${numberPart}.json`;

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
    return res.status(500).json({ error: error && error.message ? error.message : '작품 제출 처리에 실패했습니다.' });
  }
}
