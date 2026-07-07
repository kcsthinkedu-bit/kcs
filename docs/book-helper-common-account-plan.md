# 책편집도우미 공통계정 연동 기준

## 결론

책편집도우미는 KCSedutech 공통 포털 안의 독립 서비스로 둡니다.

회원, 조직, 학급, 학생, 권한은 서비스별로 새로 만들지 않고 공통 테이블을 사용합니다. 책편집도우미가 직접 소유하는 원본 데이터만 `book_*` 테이블로 분리합니다.

## 공통 테이블

공통 영역에서 관리할 데이터:

- 로그인 계정: `auth.users`
- 사용자 설정/프로필: `profiles` 또는 `user_settings`
- 기관/학교/학원: `organizations` / `academies` / `schools`
- 소속 권한: `organization_members` 또는 `academy_members`
- 학급: `class_groups`
- 학생: `students`
- 서비스 이용권한: `service_entitlements`

## 책편집도우미 전용 테이블

책편집도우미 영역에서 관리할 데이터:

- `book_projects`: 책 한 권의 원본
- `book_pages`: 페이지별 텍스트/그림/배치 정보
- `book_assets`: 업로드 이미지와 첨부 자료
- `book_templates`: 컬러링북, 그림책 등 템플릿
- `book_exports`: 인쇄/PDF/JSON 내보내기 기록
- `book_submissions`: 제출/검토용 스냅샷과 레거시 Blob 이관 자료

## 연결 방식

`book_projects`는 공통 테이블을 직접 복제하지 않고 ID만 참조합니다.

```text
book_projects.owner_user_id    -> auth.users.id
book_projects.organization_id  -> 공통 조직/학교/학원 테이블
book_projects.class_group_id   -> class_groups.id
book_projects.student_id       -> students.id
```

서비스 권한은 `service_entitlements`에서 `book_editor` 같은 서비스 키로 관리합니다.

## 현재 구현 상태

현재 서버는 기존 수업 자료를 안전하게 유지하기 위해 선생님 로그인/학급 코드는 기본적으로 Vercel Blob 저장 방식을 유지합니다.

Supabase 환경변수를 켜면 제출물 JSON은 `book_submissions`로 저장할 수 있습니다. 단, 공통 Auth 연결 전에는 `book_teachers`, `book_classes`를 사용하지 않습니다.

레거시 실험 테이블을 꼭 써야 할 때만 아래 환경변수를 켭니다.

```text
BOOK_HELPER_USE_LEGACY_SUPABASE_AUTH=true
```

KCSedutech 공통계정으로 갈 경우에는 이 값을 켜지 않는 것이 맞습니다.
