# 책편집도우미 Supabase 전환 메모

이 문서는 책편집도우미 데이터를 KCSedutech 공통 Supabase 구조로 옮기기 위한 기준입니다.

## 방향

책편집도우미는 별도의 `book_teachers`, `book_classes` 회원/학급 테이블을 만들지 않습니다.

공통 데이터는 KCSedutech 공통 테이블을 참조합니다.

- `auth.users`
- `profiles` 또는 `user_settings`
- `organizations` / `academies` / `schools` 계열
- `organization_members` 또는 `academy_members`
- `class_groups`
- `students`
- `service_entitlements`

책편집도우미가 직접 소유하는 원본 데이터만 `book_*` 테이블로 분리합니다.

- `book_projects`
- `book_pages`
- `book_assets`
- `book_templates`
- `book_exports`
- `book_submissions`

`book_projects`에는 `owner_user_id`, `organization_id`, `class_group_id`, `student_id`를 둡니다. `owner_user_id`는 `auth.users(id)`를 참조하고, 조직/학급/학생 FK는 KCSedutech 공통 테이블명을 최종 확인한 뒤 추가합니다.

## 1. Supabase SQL 적용

Supabase SQL Editor에서 아래 파일 전체를 실행합니다.

```text
docs/supabase-book-helper-schema.sql
```

주의: 예전에 만든 `book_teachers`, `book_classes` SQL은 더 이상 권장 구조가 아닙니다. 이미 적용했다면 당장 삭제하지 말고, 공통 Auth 마이그레이션이 끝난 뒤 정리합니다.

## 2. Vercel 환경변수

책편집도우미 제출물 저장을 Supabase로 보내려면 Vercel 프로젝트에 아래 값을 추가합니다.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
BOOK_HELPER_AUTH_SECRET
BOOK_HELPER_MIGRATION_SECRET
```

`BOOK_HELPER_USE_LEGACY_SUPABASE_AUTH`는 기본적으로 설정하지 않습니다.

이 값을 `true`로 켜면 예전 실험 구조인 `book_teachers`, `book_classes` 테이블을 사용하려고 합니다. KCSedutech 공통계정 구조로 갈 경우에는 켜지 않는 것이 맞습니다.

## 3. Blob 마이그레이션

현재 마이그레이션 API는 Vercel Blob에 있던 책 JSON을 `book_submissions`로 옮기는 용도입니다.

먼저 dry-run으로 개수를 확인합니다.

```bash
curl -H "x-migration-secret: YOUR_SECRET" \
  "https://YOUR_VERCEL_DOMAIN/api/admin/migrate-blob-to-supabase"
```

실제 실행은 `run=true`를 붙입니다.

```bash
curl -X POST \
  -H "x-migration-secret: YOUR_SECRET" \
  -H "content-type: application/json" \
  -d "{\"run\":true}" \
  "https://YOUR_VERCEL_DOMAIN/api/admin/migrate-blob-to-supabase"
```

응답의 `authMode`가 `common-account-references`이면 선생님/학급 Blob 자료는 Supabase로 옮기지 않고 건너뜁니다. 이 자료는 `profiles`, `organization_members`, `class_groups`, `students`와 매핑 규칙을 정한 뒤 별도 마이그레이션하는 것이 안전합니다.

## 4. 다음 단계

공통계정 연결 단계에서 확인할 것:

- 현재 법인 Supabase의 실제 조직 테이블명이 `organizations`, `academies`, `schools` 중 무엇인지
- 학급 테이블의 실제 이름과 PK가 `class_groups(id)`인지
- 학생 테이블의 실제 이름과 PK가 `students(id)`인지
- 책편집도우미 권한을 `service_entitlements`에 어떤 `service_key`로 넣을지
- 기존 Blob 학급 코드와 새 `class_group_id`를 어떻게 연결할지

이 확인이 끝나면 `book_projects.organization_id`, `book_projects.class_group_id`, `book_projects.student_id`에 실제 FK를 추가하고, 학생 제출 시 `book_projects`와 `book_submissions`를 함께 생성하도록 서버 API를 바꾸면 됩니다.
