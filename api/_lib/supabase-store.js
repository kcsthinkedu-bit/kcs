const TABLES = {
  teachers: 'book_teachers',
  classes: 'book_classes',
  submissions: 'book_submissions'
};

function cleanUrl(value) {
  return String(value || '').trim().replace(/\/+$/g, '');
}

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return safeString(value).toLowerCase();
}

function normalizeClassCode(value) {
  return safeString(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function getSupabaseConfig() {
  const url = cleanUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = safeString(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE
  );

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseConfig();
  return !!url && !!key;
}

function makeRestUrl(path, query = {}) {
  const { url } = getSupabaseConfig();
  const restUrl = new URL(`${url}/rest/v1/${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      restUrl.searchParams.set(key, String(value));
    }
  });

  return restUrl;
}

async function supabaseRequest(path, options = {}) {
  const { key } = getSupabaseConfig();
  const method = options.method || 'GET';
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  const response = await fetch(makeRestUrl(path, options.query), {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && data.message
        ? data.message
        : `Supabase 요청 실패 (${response.status})`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function selectOne(table, filters, select = '*') {
  if (!isSupabaseConfigured()) return null;
  const query = { select, limit: 1 };
  Object.entries(filters || {}).forEach(([key, value]) => {
    query[key] = `eq.${value}`;
  });
  const rows = await supabaseRequest(table, { query });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function upsertOne(table, row, conflictColumn) {
  const rows = await supabaseRequest(table, {
    method: 'POST',
    query: conflictColumn ? { on_conflict: conflictColumn } : {},
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: row
  });
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

function mapTeacherRow(row) {
  if (!row) return null;
  return {
    teacherId: row.teacher_id,
    name: row.name || '',
    email: row.email || '',
    schoolName: row.school_name || '',
    password: row.password_hash || null,
    createdAt: row.created_at || ''
  };
}

function mapClassRow(row) {
  if (!row) return null;
  return {
    code: row.code,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name || '',
    teacherEmail: row.teacher_email || '',
    schoolName: row.school_name || '',
    className: row.class_name || '',
    active: row.active !== false,
    createdAt: row.created_at || ''
  };
}

function getSubmissionFromBook(book) {
  return book && book.submission && typeof book.submission === 'object' ? book.submission : {};
}

function getReviewFromBook(book) {
  return book && book.review && typeof book.review === 'object' ? book.review : {};
}

function getSubmissionUrl(id) {
  return `/api/submissions/get?id=${encodeURIComponent(id)}`;
}

export function getSupabaseSubmissionId(pathname) {
  const value = safeString(pathname);
  if (value.startsWith('supabase:')) return value.slice('supabase:'.length);
  if (value.startsWith('book_submissions/')) return value.slice('book_submissions/'.length);
  return '';
}

export function isSupabaseSubmissionPath(pathname) {
  return !!getSupabaseSubmissionId(pathname);
}

export function mapSubmissionRow(row) {
  if (!row) return null;
  const id = row.id;
  const url = getSubmissionUrl(id);
  const classCode = normalizeClassCode(row.class_code || row.submission_code);
  const submissionCode = normalizeClassCode(row.submission_code || row.class_code);
  const createdAt = row.saved_at || row.submitted_at || row.created_at || '';
  const sourceUrl = safeString(row.source_url);

  return {
    id,
    kind: row.kind || 'submission',
    pathname: `supabase:${id}`,
    url,
    uploadedAt: row.created_at || '',
    createdAt,
    size: 0,
    title: row.title || '',
    paper: row.paper || 'A4',
    spreadCount: Number(row.spread_count || 0),
    schoolName: row.school_name || '',
    className: row.class_name || '',
    studentName: row.student_name || '',
    studentNumber: row.student_number || '',
    submissionCode,
    classCode,
    teacherId: row.teacher_id || '',
    teacherName: row.teacher_name || '',
    legacyPathname: row.legacy_pathname || '',
    legacyUrl: row.legacy_url || '',
    submittedAt: row.submitted_at || row.created_at || '',
    sourceUrl,
    studentKey: [
      safeString(row.school_name).toLowerCase(),
      safeString(row.class_name).toLowerCase(),
      safeString(row.student_name).toLowerCase(),
      safeString(row.student_number).toLowerCase()
    ].join('::'),
    editUrl: `/coloringbook/?mode=teacher&loadFrom=${encodeURIComponent(url)}`
  };
}

export async function findSupabaseTeacherByEmail(email) {
  const row = await selectOne(TABLES.teachers, { email: normalizeEmail(email) });
  return mapTeacherRow(row);
}

export async function findSupabaseTeacherById(teacherId) {
  const row = await selectOne(TABLES.teachers, { teacher_id: safeString(teacherId) });
  return mapTeacherRow(row);
}

export async function saveSupabaseTeacher(teacher, hashText) {
  const row = await upsertOne(TABLES.teachers, {
    teacher_id: teacher.teacherId,
    name: teacher.name,
    email: normalizeEmail(teacher.email),
    email_hash: hashText(normalizeEmail(teacher.email)),
    school_name: teacher.schoolName || '',
    password_hash: teacher.password,
    created_at: teacher.createdAt
  }, 'teacher_id');
  return mapTeacherRow(row);
}

export async function findSupabaseClassByCode(code) {
  const row = await selectOne(TABLES.classes, { code: normalizeClassCode(code) });
  const classInfo = mapClassRow(row);
  return classInfo && classInfo.active !== false ? classInfo : null;
}

export async function listSupabaseClassesByTeacher(teacherId) {
  if (!isSupabaseConfigured()) return [];
  const rows = await supabaseRequest(TABLES.classes, {
    query: {
      select: '*',
      teacher_id: `eq.${safeString(teacherId)}`,
      active: 'eq.true',
      order: 'created_at.desc'
    }
  });
  return (Array.isArray(rows) ? rows : []).map(mapClassRow).filter(Boolean);
}

export async function saveSupabaseClass(classInfo) {
  const row = await upsertOne(TABLES.classes, {
    code: normalizeClassCode(classInfo.code),
    teacher_id: classInfo.teacherId,
    teacher_name: classInfo.teacherName || '',
    teacher_email: classInfo.teacherEmail || '',
    school_name: classInfo.schoolName || '',
    class_name: classInfo.className,
    active: classInfo.active !== false,
    created_at: classInfo.createdAt
  }, 'code');
  return mapClassRow(row);
}

export async function insertSupabaseSubmission(kind, payload, sourceUrl = '', options = {}) {
  if (!isSupabaseConfigured()) return null;
  const legacyPathname = safeString(options.legacyPathname);
  if (legacyPathname) {
    const existing = await selectOne(TABLES.submissions, { legacy_pathname: legacyPathname });
    if (existing) return mapSubmissionRow(existing);
  }

  const book = payload || {};
  const submission = getSubmissionFromBook(book);
  const review = getReviewFromBook(book);
  const savedAt = safeString(review.savedAt);
  const submittedAt = safeString(submission.submittedAt);

  const body = {
    kind,
    teacher_id: safeString(submission.teacherId),
    teacher_name: safeString(submission.teacherName),
    class_code: normalizeClassCode(submission.classCode || submission.submissionCode),
    submission_code: normalizeClassCode(submission.submissionCode || submission.classCode),
    school_name: safeString(submission.schoolName),
    class_name: safeString(submission.className),
    student_name: safeString(submission.studentName),
    student_number: safeString(submission.studentNumber),
    title: safeString(book.title || submission.bookTitle),
    paper: safeString(book.paper || submission.paper || 'A4'),
    spread_count: Array.isArray(book.spreads) ? book.spreads.length : 0,
    source_url: safeString(sourceUrl || review.sourceUrl),
    legacy_pathname: legacyPathname,
    legacy_url: safeString(options.legacyUrl),
    book_json: book,
    submitted_at: submittedAt || null,
    saved_at: savedAt || null
  };

  if (options.createdAt) {
    body.created_at = options.createdAt;
  }

  const row = await supabaseRequest(TABLES.submissions, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body
  });

  return mapSubmissionRow(Array.isArray(row) && row.length ? row[0] : null);
}

export async function getSupabaseSubmissionBook(id) {
  const row = await selectOne(TABLES.submissions, { id: safeString(id) }, 'id,book_json');
  return row ? row.book_json : null;
}

export async function listSupabaseSubmissionsByTeacher(teacherId) {
  if (!isSupabaseConfigured()) return [];
  const rows = await supabaseRequest(TABLES.submissions, {
    query: {
      select: 'id,kind,teacher_id,teacher_name,class_code,submission_code,school_name,class_name,student_name,student_number,title,paper,spread_count,source_url,legacy_pathname,legacy_url,submitted_at,saved_at,created_at',
      teacher_id: `eq.${safeString(teacherId)}`,
      order: 'created_at.desc'
    }
  });
  return (Array.isArray(rows) ? rows : []).map(mapSubmissionRow).filter(Boolean);
}

export async function listSupabaseSubmissionsByCode(code) {
  if (!isSupabaseConfigured()) return [];
  const safeCode = normalizeClassCode(code);
  const rows = await supabaseRequest(TABLES.submissions, {
    query: {
      select: 'id,kind,teacher_id,teacher_name,class_code,submission_code,school_name,class_name,student_name,student_number,title,paper,spread_count,source_url,legacy_pathname,legacy_url,submitted_at,saved_at,created_at',
      class_code: `eq.${safeCode}`,
      order: 'created_at.desc'
    }
  });
  return (Array.isArray(rows) ? rows : []).map(mapSubmissionRow).filter(Boolean);
}

export async function deleteSupabaseSubmission(id, teacherId = '') {
  if (!isSupabaseConfigured()) return false;
  const query = { id: `eq.${safeString(id)}` };
  if (teacherId) query.teacher_id = `eq.${safeString(teacherId)}`;

  const rows = await supabaseRequest(TABLES.submissions, {
    method: 'DELETE',
    query,
    headers: { Prefer: 'return=representation' }
  });
  return Array.isArray(rows) && rows.length > 0;
}
