# 컬러링북 편집기 저장/제출 전환 명세

이 문서는 컬러링북 편집기를 KCSedutech 공통계정/Supabase 구조로 연결하기 전에 확인해야 할 저장, 제출, 권한, 전환 기준을 정리합니다.

여기서 말하는 API는 GPT/Gemini 같은 외부 생성형 AI API가 아니라, 컬러링북 편집기 내부의 서버 저장/제출 경로입니다. 현재 컬러링북 편집기는 외부 AI 생성 API를 사용하지 않습니다.

## 현재 고정 상태

- 운영 DB 적용: 보류
- `book_*` 테이블 생성: 미실행
- `book_editor` 기능 등록: 미실행
- 운영 데이터 전환: 미실행
- UI/API 개발: 컬러링북창에서 계속 진행
- DB 검토 순서: 수정 SQL 확인 -> 운영 스키마 사전조회 -> FK/권한 검증 -> 백업 확인 -> 적용 여부 결정

## 현재 내부 서버 경로

| 경로 | 용도 | 현재 인증/조건 | 현재 저장소 |
| --- | --- | --- | --- |
| `POST /api/auth/register` | 선생님 계정 생성 | 자체 이메일/비밀번호 | 기본 Vercel Blob |
| `POST /api/auth/login` | 선생님 로그인 | 자체 토큰 발급 | 기본 Vercel Blob |
| `POST /api/classes/create` | 학급 코드 생성 | 자체 선생님 토큰 | 기본 Vercel Blob |
| `GET /api/classes/list` | 선생님 학급 목록 | 자체 선생님 토큰 | 기본 Vercel Blob |
| `POST /api/submissions/upload` | 학생 책 JSON 제출 | 학급 코드 확인 | Blob 또는 Supabase |
| `GET /api/submissions/list` | 선생님 제출함 목록 | 자체 토큰 또는 레거시 비밀번호 | Blob 또는 Supabase |
| `GET /api/submissions/get` | 제출 책 JSON 불러오기 | 제출물 ID/URL | Blob 또는 Supabase |
| `POST /api/submissions/review-save` | 선생님 수정본 저장 | 선생님 검토 흐름 | Blob 또는 Supabase |
| `POST /api/submissions/delete` | 제출물 삭제 | 자체 선생님 토큰 | Blob 또는 Supabase |
| `GET/POST /api/admin/migrate-blob-to-supabase` | Blob 자료 이관 | 마이그레이션 비밀키 | Supabase 후보 |

## 현재 저장 방식

기본값은 Vercel Blob입니다.

- 선생님 계정: `teachers/id/*.json`, `teachers/email/*.json`
- 학급 코드: `classes/code/*.json`, `classes/teacher/*/*.json`
- 학생 제출물: `submissions/.../*.json`
- 선생님 수정본: `reviews/.../*.json`

`SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`가 있으면 제출물 JSON은 `book_submissions`로 저장할 수 있습니다.

단, 공통계정 연결 전에는 `book_teachers`, `book_classes`를 쓰지 않습니다. 레거시 실험 테이블을 강제로 쓸 때만 `BOOK_HELPER_USE_LEGACY_SUPABASE_AUTH=true`를 설정합니다.

## 목표 저장 구조

컬러링북 편집기 원본 데이터만 `book_*` 테이블로 분리합니다.

- `book_projects`: 책 한 권의 원본 프로젝트
- `book_pages`: 페이지별 텍스트/그림/배치 정보
- `book_assets`: 업로드 이미지/첨부 자료
- `book_templates`: 컬러링북/그림책 템플릿
- `book_exports`: 인쇄/PDF/JSON 내보내기 기록
- `book_submissions`: 제출/검토 스냅샷과 레거시 Blob 이관 자료

공통 계정/기관/학생/학급은 새로 만들지 않고 기존 KCSedutech 테이블을 참조합니다.

```text
book_projects.owner_user_id   -> auth.users.id
book_projects.academy_id      -> academies.id
book_projects.class_group_id  -> class_groups.id
book_projects.student_id      -> students.id
book_submissions.project_id   -> book_projects.id
book_submissions.student_id   -> students.id
```

## 권한 판정 기준

권한은 `service_entitlements`를 새로 만들지 않고, 현재 KCSedutech의 `features / plans / subscriptions / entitlement_grants` 구조와 맞춥니다.

권장 판정 흐름:

1. 요청의 공통 Auth 토큰에서 `auth.users.id`를 확인한다.
2. `academy_members`에서 사용자가 소속된 `academy_id`와 역할을 확인한다.
3. `features`에서 `book_editor` 또는 확정된 feature key를 확인한다.
4. `entitlement_grants`에서 해당 사용자/기관/플랜에 컬러링북 편집기 사용 권한이 있는지 확인한다.
5. 권한이 있으면 `book_projects.owner_user_id`, `academy_id`를 채운다.

아직 미확정인 것:

- feature key를 정확히 `book_editor`로 쓸지
- 권한이 사용자 단위인지, 기관 단위인지, 플랜 단위인지
- 학생 직접 편집 권한을 별도 feature로 나눌지

## 학생/학급 매핑 기준

현재 학생 제출은 학급 코드, 학생 이름, 학생 번호를 기준으로 받습니다.

공통 구조 전환 후에는 다음 순서로 매핑합니다.

1. 학급 코드 또는 선생님이 선택한 반을 `class_groups.id`로 연결한다.
2. `class_groups.academy_id` 또는 관련 컬럼으로 `academy_id`를 확인한다.
3. 학생 이름/번호가 이미 `students`에 있으면 `students.id`를 사용한다.
4. 학생이 없으면 자동 생성할지, 선생님 확인 후 생성할지 DB 적용창/통합배포창에서 정책을 확정한다.
5. 제출 저장 시 `book_submissions.student_id`, `class_group_id`, `academy_id`를 함께 저장한다.

보류해야 할 것:

- 운영 학생 데이터를 이름만으로 자동 병합
- 같은 이름 학생을 자동으로 하나로 합치기
- 기존 Blob 자료의 학생 이름/번호를 운영 `students`에 바로 쓰기

## Blob -> Supabase 전환 기준

마이그레이션은 두 단계로 나눕니다.

1단계: 제출물 JSON 보존

- 기존 `submissions/`, `reviews/` 자료를 `book_submissions`에 보존한다.
- `legacy_pathname`, `legacy_url`을 저장해 중복 이관을 막는다.
- 공통 ID가 없으면 `academy_id`, `class_group_id`, `student_id`는 비워 둔다.

2단계: 공통 ID 연결

- Blob의 `classCode`, `schoolName`, `className`을 `class_groups`와 매핑한다.
- Blob의 `studentName`, `studentNumber`를 `students`와 매핑한다.
- 검증된 자료만 `book_projects`, `book_pages`, `book_assets`로 분해한다.

## 제출 저장 목표 흐름

공통 연결이 끝난 뒤의 목표 흐름:

1. 학생 또는 선생님이 컬러링북 JSON을 제출한다.
2. 서버가 공통 Auth 또는 학급 초대 정보를 확인한다.
3. `class_group_id`, `academy_id`, `student_id`를 결정한다.
4. `book_projects`를 생성하거나 기존 프로젝트를 찾는다.
5. 페이지 정보는 `book_pages`, 이미지 정보는 `book_assets`에 저장한다.
6. 제출 당시 전체 JSON 스냅샷은 `book_submissions.book_json`에 보관한다.
7. 선생님 제출함은 `academy_id`, `class_group_id`, `student_id` 기준으로 조회한다.

## DB 적용창 확인 요청

DB 적용창에서 확인할 것:

- `auth.users`, `academies`, `academy_members`, `class_groups`, `students` 실제 컬럼 구조
- `features`, `plans`, `subscriptions`, `entitlement_grants` 실제 권한 판정 방식
- `class_groups`와 `students`의 `academy_id` 연결 방식
- `book_editor` feature key 사용 가능 여부
- 운영 DB 백업 가능 여부
- `docs/supabase-book-helper-schema.sql` 적용 가능 여부

DB 적용창에서 하지 말아야 할 것:

- UI 수정
- 배포
- `main` 병합
- 최종 RLS 전환
- 기존 운영 학생 데이터 자동 병합
- `book_teachers`, `book_classes` 신규 생성

## 통합배포창 전달 기준

컬러링북창에서 다음 중 하나가 준비되면 1번 통합배포창에 전달합니다.

- UI 기능 변경 커밋
- 내부 저장/제출 경로 변경 커밋
- 공통 Auth 연결 커밋
- Supabase 전환 관련 서버 코드 변경 커밋

통합배포창은 각 창의 변경을 모아 충돌을 검토하고 배포 여부를 결정합니다.
