import {
  createTeacherClass,
  findTeacherById,
  getTeacherFromRequest,
  readBody,
  sendError
} from '../_lib/school-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 사용할 수 있습니다.' });
  }

  try {
    const session = getTeacherFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: '선생님 로그인이 필요합니다.' });
    }

    const teacher = await findTeacherById(session.teacherId);
    const teacherProfile = teacher || session;
    const classInfo = await createTeacherClass(teacherProfile, readBody(req.body));
    return res.status(200).json({
      ok: true,
      classInfo
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, '학급 코드 생성에 실패했습니다.');
  }
}
