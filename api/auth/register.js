import {
  createToken,
  findTeacherByEmail,
  hashPassword,
  hashText,
  normalizeEmail,
  publicTeacherProfile,
  readBody,
  safeString,
  saveJson,
  sendError
} from '../_lib/school-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 요청만 사용할 수 있습니다.' });
  }

  try {
    const body = readBody(req.body);
    const name = safeString(body.name);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const schoolName = safeString(body.schoolName);

    if (!name) return res.status(400).json({ error: '선생님 이름을 입력해 주세요.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: '이메일을 올바르게 입력해 주세요.' });
    if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6글자 이상으로 입력해 주세요.' });

    const existing = await findTeacherByEmail(email);
    if (existing) {
      return res.status(409).json({ error: '이미 가입된 이메일입니다. 로그인해 주세요.' });
    }

    const now = new Date().toISOString();
    const teacher = {
      teacherId: `t_${hashText(`${email}:${now}`).slice(0, 18)}`,
      name,
      email,
      schoolName,
      password: hashPassword(password),
      createdAt: now
    };

    await saveJson(`teachers/id/${teacher.teacherId}.json`, teacher);
    await saveJson(`teachers/email/${hashText(email)}.json`, teacher);

    return res.status(200).json({
      ok: true,
      teacher: publicTeacherProfile(teacher),
      token: createToken(teacher)
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, '선생님 가입에 실패했습니다.');
  }
}
