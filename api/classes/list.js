import {
  findTeacherById,
  getTeacherFromRequest,
  listTeacherClasses,
  publicTeacherProfile,
  sendError
} from '../_lib/school-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 사용할 수 있습니다.' });
  }

  try {
    const session = getTeacherFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: '선생님 로그인이 필요합니다.' });
    }

    const teacher = await findTeacherById(session.teacherId);
    const classes = await listTeacherClasses(session.teacherId);
    return res.status(200).json({
      ok: true,
      teacher: publicTeacherProfile(teacher || session),
      classes
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, '학급 목록을 불러오지 못했습니다.');
  }
}
