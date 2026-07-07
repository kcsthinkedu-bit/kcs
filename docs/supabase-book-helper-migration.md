# 책편집도우미 Blob -> Supabase 마이그레이션

이 문서는 기존 Vercel Blob에 저장된 선생님 계정, 학급 코드, 학생 제출물 JSON을 Supabase로 옮기는 절차입니다.

## 1. Supabase SQL 적용

Supabase SQL Editor에서 먼저 아래 파일 전체를 실행합니다.

```text
docs/supabase-book-helper-schema.sql
```

생성되는 테이블:

- `book_teachers`
- `book_classes`
- `book_submissions`

`book_submissions.legacy_pathname`은 기존 Blob 경로를 기록합니다. 같은 Blob 자료를 두 번 마이그레이션하지 않기 위한 중복 방지 키입니다.

## 2. Vercel 환경변수

Vercel 프로젝트에 아래 환경변수를 추가합니다.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BOOK_HELPER_AUTH_SECRET
BOOK_HELPER_MIGRATION_SECRET
```

`BOOK_HELPER_MIGRATION_SECRET`은 마이그레이션 API를 호출할 때만 쓰는 비밀키입니다.

## 3. Dry-run으로 개수 확인

실제 저장 없이 Blob에서 읽을 수 있는 자료 수를 확인합니다.

```bash
curl -H "x-migration-secret: YOUR_SECRET" \
  "https://YOUR_VERCEL_DOMAIN/api/admin/migrate-blob-to-supabase"
```

응답의 `dryRun`이 `true`이고, `ready` 숫자가 Supabase로 옮길 수 있는 자료 수입니다.

## 4. 실제 마이그레이션 실행

dry-run 결과가 맞으면 `run=true`를 붙여 실행합니다.

```bash
curl -X POST \
  -H "x-migration-secret: YOUR_SECRET" \
  -H "content-type: application/json" \
  -d "{\"run\":true}" \
  "https://YOUR_VERCEL_DOMAIN/api/admin/migrate-blob-to-supabase"
```

마이그레이션 API는 같은 `legacy_pathname`이 이미 Supabase에 있으면 새로 넣지 않습니다. 따라서 같은 요청을 다시 실행해도 중복 제출물이 생기지 않도록 설계되어 있습니다.

## 5. 확인

마이그레이션 후 선생님 페이지에서 제출함을 열어 확인합니다.

```text
/teacher/
```

Supabase 환경변수가 설정되어 있으면 새 제출물은 Supabase에 저장됩니다. 환경변수가 없으면 기존 Vercel Blob 방식으로 동작합니다.
