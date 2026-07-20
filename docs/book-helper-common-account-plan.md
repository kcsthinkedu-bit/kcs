# 책편집도우미 공통계정 연동 기준

## 결론

책편집도우미는 KCSedutech 공통 포털 안의 독립 서비스로 둡니다.

회원, 기관, 학급, 학생, 권한은 서비스별로 새로 만들지 않고 KCSedutech 공통 구조를 사용합니다. 책편집도우미가 직접 소유하는 원본 데이터만 `book_*` 테이블로 분리합니다.

## 공통 테이블

현재 KCSedutech에서 기준으로 삼을 공통 데이터:

- 로그인 계정: `auth.users`
- 기관/학교/학원: `academies`
- 기관 멤버십: `academy_members`
- 학급: `class_groups`
- 학생: `students`
- 기능/권한: `features`, `plans`, `subscriptions`, `entitlement_grants`

`organizations`, `classes`, `service_entitlements`를 책편집도우미 때문에 새로 만들지 않습니다.

## 책편집도우미 전용 테이블

책편집도우미 영역에서 관리할 데이터:

- `book_projects`: 책 한 권의 원본
- `book_pages`: 페이지별 텍스트/그림/배치 정보
- `book_assets`: 업로드 이미지와 첨부 자료
- `book_templates`: 컬러링북, 그림책 등 템플릿
- `book_exports`: 인쇄/PDF/JSON 내보내기 기록
- `book_submissions`: 제출/검토용 스냅샷과 레거시 Blob 이관 자료

## 연결 방식

`book_projects`와 `book_submissions`는 공통 테이블을 직접 복제하지 않고 ID만 참조합니다.

```text
book_projects.owner_user_id   -> auth.users.id
book_projects.academy_id      -> academies.id
book_projects.class_group_id  -> class_groups.id
book_projects.student_id      -> students.id
book_submissions.project_id   -> book_projects.id
book_submissions.student_id   -> students.id
```

책편집도우미의 기능 표시는 `feature_key = 'book_editor'`를 기본값으로 둡니다. 실제 접근 제어는 KCSedutech의 `features / entitlement_grants` 구조에 맞춰 붙입니다.

## 현재 구현 상태

현재 서버는 기존 수업 자료를 안전하게 유지하기 위해 선생님 로그인/학급 코드는 기본적으로 Vercel Blob 저장 방식을 유지합니다.

Supabase 환경변수를 켜면 제출물 JSON은 `book_submissions`로 저장할 수 있습니다. 단, 공통 Auth 연결 전에는 `book_teachers`, `book_classes`를 사용하지 않습니다.

저장/제출 경로, 권한 판정, Blob -> Supabase 전환 기준은 `docs/coloringbook-storage-transition-spec.md`를 기준으로 검토합니다.

레거시 실험 테이블을 꼭 써야 할 때만 아래 환경변수를 켭니다.

```text
BOOK_HELPER_USE_LEGACY_SUPABASE_AUTH=true
```

KCSedutech 공통계정으로 갈 경우에는 이 값을 켜지 않는 것이 맞습니다.
