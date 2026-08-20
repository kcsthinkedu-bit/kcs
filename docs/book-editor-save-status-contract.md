# 책 편집기 저장 상태 계약

## 화면 문구

| 상태 | 화면 문구 | 완료로 취급 |
| --- | --- | --- |
| 로컬 확인 전 | 임시 보관 확인 전 | 아니요 |
| IndexedDB 기록 성공 | 이 기기에 임시 보관됨 | 서버 저장 아님 |
| 서버 쓰기 요청 중 | 계정에 저장 중 | 아니요 |
| 서버 쓰기 응답 수신 | 저장 내용 확인 중 | 아니요 |
| 서버 readback 버전 일치 | 계정에 저장됨 | 예 |
| 오류 또는 버전 불일치 | 계정 저장 확인 필요 | 아니요 |

## 서버 이벤트 계약

인증·서버 저장 어댑터는 브라우저에 `kcs-book-server-save-state` 이벤트를 보낸다.

```js
window.dispatchEvent(new CustomEvent("kcs-book-server-save-state", {
  detail: {
    status: "verified",
    writeVersion: "server-version-12",
    readbackVersion: "server-version-12"
  }
}));
```

`status`가 `verified`여도 두 버전이 모두 존재하고 정확히 일치하지 않으면 `계정에 저장됨`으로 표시하지 않는다.

## 금지 사항

1. localStorage 또는 IndexedDB 기록을 계정 저장 완료로 표시하지 않는다.
2. HTTP 성공 응답만으로 완료 표시를 하지 않는다.
3. write 응답의 데이터를 readback 데이터로 간주하지 않는다.
4. 실패 시 로컬 임시 작업을 자동 삭제하지 않는다.
5. 저장 상태 이벤트에 사용자 이름, 토큰, 비공개 자산 URL을 넣지 않는다.
