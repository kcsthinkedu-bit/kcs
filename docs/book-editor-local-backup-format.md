# 로컬 책 파일 보관 형식

## 목적

브라우저 책장은 임시 보관이다. 사용자가 직접 내려받은 JSON 파일로 책 내용의 별도 사본을 만들고, 같은 책 편집기에서 다시 가져올 수 있도록 한다.

## 현재 형식

```json
{
  "format": "kcs-local-book-backup-v1",
  "exportedAt": "ISO-8601 date",
  "source": {
    "sourceKey": "local editor storage key",
    "sourcePath": "/editor/?type=picturebook"
  },
  "project": {
    "schemaVersion": "kcs-book-v2"
  }
}
```

## 안전 규칙

1. 사용자 이름, 이메일, 전화번호, 로그인 토큰을 추가하지 않는다.
2. 가져오기 파일은 100MB 이하의 JSON만 허용한다.
3. `projectId` 또는 `id`와 `pages`가 없는 파일은 책으로 처리하지 않는다.
4. 같은 책 번호가 이미 있으면 사용자 확인 없이 덮어쓰지 않는다.
5. 복원 경로는 `/editor/` 또는 `/coloringbook/`으로 시작하는 같은 사이트 경로만 허용한다.
6. 파일을 가져와도 서버 저장 성공으로 표시하지 않는다.
7. 책장 사본을 제거해도 원본 이미지와 편집기의 임시 저장을 자동 삭제하지 않는다.

## 일반 JSON 복원

저장 위치 정보가 없는 일반 책 JSON은 `sessionStorage`의 `kcs-book-project-handoff-v1`에 최대 10분 동안만 임시 전달한다. 대상 편집기가 열리면 기존 JSON 가져오기 입력을 통해 같은 검증·변환 과정을 사용한다.

- 전달값은 현재 탭에만 남고 다른 탭이나 서버로 전송하지 않는다.
- 자동 전달을 지원하지 않는 브라우저에서는 책 파일을 다시 내려받아 사용자가 직접 `파일 불러오기`를 선택하도록 안내한다.
- 전달 성공 또는 안내 창 닫기 뒤 임시 전달값을 제거한다.
