import {
  createToken,
  findTeacherByEmail,
  normalizeEmail,
  publicTeacherProfile,
  readBody,
  sendError,
  verifyPassword
} from '../_lib/school-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 사용할 수 있습니다.' });
  }

  try {
    const body = readBody(req.body);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');

    const teacher = await findTeacherByEmail(email);
    if (!teacher || !verifyPassword(password, teacher.password)) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 맞지 않습니다.' });
    }

    return res.status(200).json({
      ok: true,
      teacher: publicTeacherProfile(teacher),
      token: createToken(teacher)
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, '로그인에 실패했습니다.');
  }
}
