import { del } from '@vercel/blob';
import {
  getTeacherFromRequest,
  readBody,
  safePathPart
} from '../_lib/school-store.js';
import {
  deleteSupabaseSubmission,
  getSupabaseSubmissionId,
  isSupabaseConfigured
} from '../_lib/supabase-store.js';

function getTeacherPassword(req) {
  return String(req.headers['x-teacher-password'] || '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 사용할 수 있습니다.' });
  }

  try {
    const raw = readBody(req.body);
    const pathname = typeof raw.pathname === 'string' ? raw.pathname.trim() : '';

    if (!pathname) {
      return res.status(400).json({ error: '삭제할 pathname이 필요합니다.' });
    }

    const teacher = getTeacherFromRequest(req);
    const supabaseId = getSupabaseSubmissionId(pathname);
    if (supabaseId) {
      if (!isSupabaseConfigured()) {
        return res.status(400).json({ error: 'Supabase 제출물 경로를 처리할 수 없습니다.' });
      }

      if (!teacher) {
        const expectedTeacherPassword = String(process.env.TEACHER_ACCESS_PASSWORD || '').trim();
        if (!expectedTeacherPassword) {
          return res.status(500).json({ error: '서버 선생님 비밀번호 설정이 없습니다.' });
        }

        const teacherPassword = getTeacherPassword(req);
        if (teacherPassword !== expectedTeacherPassword) {
          return res.status(401).json({ error: '선생님 비밀번호가 맞지 않습니다.' });
        }
      }

      const deleted = await deleteSupabaseSubmission(supabaseId, teacher ? teacher.teacherId : '');
      if (!deleted) {
        return res.status(404).json({ error: '삭제할 제출물을 찾지 못했습니다.' });
      }

      return res.status(200).json({
        ok: true,
        pathname
      });
    }

    if (teacher) {
      const teacherPart = safePathPart(teacher.teacherId, 'teacher');
      const allowed =
        pathname.startsWith(`submissions/${teacherPart}/`) ||
        pathname.startsWith(`reviews/${teacherPart}/`);

      if (!allowed) {
        return res.status(403).json({ error: '자신의 학급 제출물만 삭제할 수 있습니다.' });
      }
    } else {
      const expectedTeacherPassword = String(process.env.TEACHER_ACCESS_PASSWORD || '').trim();
      if (!expectedTeacherPassword) {
        return res.status(500).json({ error: '서버 선생님 비밀번호 설정이 없습니다.' });
      }

      const teacherPassword = getTeacherPassword(req);
      if (teacherPassword !== expectedTeacherPassword) {
        return res.status(401).json({ error: '선생님 비밀번호가 맞지 않습니다.' });
      }

      if (!pathname.startsWith('submissions/') && !pathname.startsWith('reviews/')) {
        return res.status(400).json({ error: 'submissions/reviews 파일만 삭제할 수 있습니다.' });
      }
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
