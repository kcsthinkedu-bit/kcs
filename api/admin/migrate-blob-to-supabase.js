import { list } from '@vercel/blob';
import {
  hashText,
  readBody,
  safeString
} from '../_lib/school-store.js';
import {
  insertSupabaseSubmission,
  isSupabaseConfigured,
  saveSupabaseClass,
  saveSupabaseTeacher,
  usesLegacyBookAuthTables
} from '../_lib/supabase-store.js';

const PREFIXES = {
  teachers: 'teachers/id/',
  classes: 'classes/code/',
  submissions: 'submissions/',
  reviews: 'reviews/'
};

function getAdminSecret(req, body) {
  return safeString(
    req.headers['x-migration-secret'] ||
    req.headers['x-admin-secret'] ||
    (req.query && req.query.secret) ||
    (body && body.secret)
  );
}

function getExpectedSecret() {
  return safeString(
    process.env.BOOK_HELPER_MIGRATION_SECRET ||
    process.env.BOOK_HELPER_AUTH_SECRET ||
    process.env.TEACHER_ACCESS_PASSWORD
  );
}

function shouldRun(req, body) {
  return String((req.query && req.query.run) || (body && body.run) || '').toLowerCase() === 'true';
}

function makeStats() {
  return {
    found: 0,
    ready: 0,
    migrated: 0,
    skipped: 0,
    failed: 0
  };
}

function recordError(report, scope, item, error) {
  report[scope].failed += 1;
  if (report.errors.length >= 25) return;
  report.errors.push({
    scope,
    pathname: item && item.blob ? item.blob.pathname : '',
    message: error && error.message ? error.message : String(error || 'unknown error')
  });
}

async function readBlobJson(blob) {
  try {
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('migration blob read failed:', blob.pathname, error);
    return null;
  }
}

async function listAllJsonByPrefix(prefix) {
  const items = [];
  let cursor = undefined;

  do {
    const result = await list({ prefix, cursor });
    const blobs = Array.isArray(result.blobs) ? result.blobs : [];
    const pageItems = await Promise.all(blobs.map(async (blob) => ({
      blob,
      data: await readBlobJson(blob)
    })));

    items.push(...pageItems.filter((item) => item.data));
    cursor = result.cursor || undefined;
    if (!result.hasMore) break;
  } while (cursor);

  return items;
}

function isValidTeacher(data) {
  return !!(data && data.teacherId && data.email && data.password);
}

function isValidClass(data) {
  return !!(data && data.code && data.teacherId && data.className);
}

function isValidBook(data) {
  return !!(data && data.cover && Array.isArray(data.spreads) && data.submission);
}

async function migrateTeachers(items, report, run) {
  for (const item of items) {
    report.teachers.found += 1;
    if (!isValidTeacher(item.data)) {
      report.teachers.skipped += 1;
      continue;
    }

    report.teachers.ready += 1;
    if (!run) continue;

    try {
      await saveSupabaseTeacher(item.data, hashText);
      report.teachers.migrated += 1;
    } catch (error) {
      recordError(report, 'teachers', item, error);
    }
  }
}

async function migrateClasses(items, report, run) {
  for (const item of items) {
    report.classes.found += 1;
    if (!isValidClass(item.data)) {
      report.classes.skipped += 1;
      continue;
    }

    report.classes.ready += 1;
    if (!run) continue;

    try {
      await saveSupabaseClass(item.data);
      report.classes.migrated += 1;
    } catch (error) {
      recordError(report, 'classes', item, error);
    }
  }
}

async function migrateBooks(items, report, scope, kind, run) {
  for (const item of items) {
    report[scope].found += 1;
    if (!isValidBook(item.data)) {
      report[scope].skipped += 1;
      continue;
    }

    report[scope].ready += 1;
    if (!run) continue;

    try {
      const review = item.data.review && typeof item.data.review === 'object' ? item.data.review : {};
      await insertSupabaseSubmission(kind, item.data, safeString(review.sourceUrl), {
        legacyPathname: item.blob.pathname,
        legacyUrl: item.blob.url,
        createdAt: item.blob.uploadedAt
      });
      report[scope].migrated += 1;
    } catch (error) {
      recordError(report, scope, item, error);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 또는 POST 요청만 사용할 수 있습니다.' });
  }

  const body = req.method === 'POST' ? readBody(req.body) : {};
  const expectedSecret = getExpectedSecret();
  const providedSecret = getAdminSecret(req, body);

  if (!expectedSecret) {
    return res.status(500).json({ error: 'BOOK_HELPER_MIGRATION_SECRET 또는 BOOK_HELPER_AUTH_SECRET 설정이 필요합니다.' });
  }

  if (providedSecret !== expectedSecret) {
    return res.status(401).json({ error: '마이그레이션 비밀키가 맞지 않습니다.' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase 환경변수 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.' });
  }

  const run = shouldRun(req, body);
  const migrateLegacyAuthTables = usesLegacyBookAuthTables();
  const report = {
    ok: true,
    dryRun: !run,
    run,
    authMode: migrateLegacyAuthTables ? 'legacy-book-auth-tables' : 'common-account-references',
    teachers: makeStats(),
    classes: makeStats(),
    submissions: makeStats(),
    reviews: makeStats(),
    notes: [],
    errors: []
  };

  if (!migrateLegacyAuthTables) {
    report.notes.push(
      'Teacher and class-group migration is paused. Map Blob teachers/classes to the KCSedutech common auth.users, academies, academy_members, class_groups, and students tables before importing those records.'
    );
  }

  try {
    const [teachers, classes, submissions, reviews] = await Promise.all([
      listAllJsonByPrefix(PREFIXES.teachers),
      listAllJsonByPrefix(PREFIXES.classes),
      listAllJsonByPrefix(PREFIXES.submissions),
      listAllJsonByPrefix(PREFIXES.reviews)
    ]);

    if (migrateLegacyAuthTables) {
      await migrateTeachers(teachers, report, run);
      await migrateClasses(classes, report, run);
    } else {
      report.teachers.found = teachers.length;
      report.teachers.skipped = teachers.length;
      report.classes.found = classes.length;
      report.classes.skipped = classes.length;
    }
    await migrateBooks(submissions, report, 'submissions', 'submission', run);
    await migrateBooks(reviews, report, 'reviews', 'review', run);

    return res.status(200).json(report);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ...report,
      ok: false,
      error: error && error.message ? error.message : '마이그레이션에 실패했습니다.'
    });
  }
}
