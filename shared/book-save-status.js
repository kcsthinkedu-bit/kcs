const SAVE_STATES = Object.freeze({
  LOCAL_UNKNOWN: "local-unknown",
  LOCAL_SAVED: "local-saved",
  SERVER_SAVING: "server-saving",
  SERVER_VERIFYING: "server-verifying",
  SERVER_VERIFIED: "server-verified",
  SERVER_FAILED: "server-failed",
});

const STATE_TEXT = Object.freeze({
  [SAVE_STATES.LOCAL_UNKNOWN]: {
    short: "임시 보관 확인 전",
    title: "아직 임시 보관을 확인하지 못했어요",
    detail: "편집기의 ‘이 기기에 임시 저장’을 사용하거나 JSON 파일로 보관해 주세요.",
  },
  [SAVE_STATES.LOCAL_SAVED]: {
    short: "이 기기에 임시 보관됨",
    title: "현재 기기의 책장에 임시 보관했어요",
    detail: "계정 저장이 아닙니다. 브라우저 자료를 지우거나 다른 기기를 사용하면 보이지 않을 수 있어요.",
  },
  [SAVE_STATES.SERVER_SAVING]: {
    short: "계정에 저장 중",
    title: "계정에 책을 저장하고 있어요",
    detail: "저장 응답을 기다리고 있습니다. 창을 닫지 말아 주세요.",
  },
  [SAVE_STATES.SERVER_VERIFYING]: {
    short: "저장 내용 확인 중",
    title: "서버에서 저장된 내용을 다시 확인하고 있어요",
    detail: "다시 읽은 책의 버전이 맞아야 계정 저장으로 표시합니다.",
  },
  [SAVE_STATES.SERVER_VERIFIED]: {
    short: "계정에 저장됨",
    title: "계정 저장과 다시 읽기를 확인했어요",
    detail: "서버가 돌려준 저장 버전과 다시 읽은 버전이 일치합니다.",
  },
  [SAVE_STATES.SERVER_FAILED]: {
    short: "계정 저장 확인 필요",
    title: "계정 저장을 확인하지 못했어요",
    detail: "이 기기의 임시 작업은 그대로 두고, 네트워크 연결 뒤 다시 저장해 주세요.",
  },
});

function installStylesheet() {
  if (document.querySelector('link[data-kcs-save-status="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/shared/book-save-status.css";
  link.dataset.kcsSaveStatus = "true";
  document.head.append(link);
}

function verifiedServerState(detail) {
  if (!detail || detail.status !== "verified") return false;
  if (!detail.writeVersion || !detail.readbackVersion) return false;
  return String(detail.writeVersion) === String(detail.readbackVersion);
}

function createSaveStatus() {
  installStylesheet();
  let state = SAVE_STATES.LOCAL_UNKNOWN;
  let localSavedAt = null;

  const wrapper = document.createElement("div");
  wrapper.className = "book-save-status";
  wrapper.innerHTML = `
    <button type="button" class="book-save-status-button" aria-haspopup="dialog"></button>
    <dialog class="book-save-status-dialog" aria-labelledby="book-save-status-title">
      <form method="dialog">
        <p class="book-save-status-kicker">저장 상태</p>
        <h2 id="book-save-status-title"></h2>
        <p class="book-save-status-detail"></p>
        <p class="book-save-status-time"></p>
        <div class="book-save-status-rule">
          <strong>안전한 저장 기준</strong>
          <span>서버 저장은 저장 응답 뒤 같은 책을 다시 읽어 확인해야 완료됩니다.</span>
        </div>
        <button type="submit" class="book-save-status-close">확인</button>
      </form>
    </dialog>
    <span class="book-save-status-live" aria-live="polite"></span>
  `;

  const button = wrapper.querySelector(".book-save-status-button");
  const dialog = wrapper.querySelector(".book-save-status-dialog");
  const title = wrapper.querySelector("#book-save-status-title");
  const detail = wrapper.querySelector(".book-save-status-detail");
  const time = wrapper.querySelector(".book-save-status-time");
  const live = wrapper.querySelector(".book-save-status-live");

  function render(announce = false) {
    const copy = STATE_TEXT[state];
    button.textContent = copy.short;
    button.dataset.state = state;
    button.setAttribute("aria-label", `${copy.short}. 자세히 보기`);
    title.textContent = copy.title;
    detail.textContent = copy.detail;
    time.textContent = localSavedAt
      ? `마지막 임시 보관: ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(localSavedAt)}`
      : "아직 확인된 임시 보관 시각이 없습니다.";
    if (announce) live.textContent = copy.short;
  }

  window.addEventListener("kcs-local-library-changed", () => {
    localSavedAt = new Date();
    if (![SAVE_STATES.SERVER_SAVING, SAVE_STATES.SERVER_VERIFYING, SAVE_STATES.SERVER_VERIFIED].includes(state)) {
      state = SAVE_STATES.LOCAL_SAVED;
    }
    render(true);
  });

  window.addEventListener("kcs-book-server-save-state", (event) => {
    const serverState = event.detail?.status;
    if (serverState === "saving") state = SAVE_STATES.SERVER_SAVING;
    else if (serverState === "verifying") state = SAVE_STATES.SERVER_VERIFYING;
    else if (verifiedServerState(event.detail)) state = SAVE_STATES.SERVER_VERIFIED;
    else state = SAVE_STATES.SERVER_FAILED;
    render(true);
  });

  button.addEventListener("click", () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });
  dialog.addEventListener("close", () => button.focus());

  render();
  document.body.append(wrapper);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createSaveStatus, { once: true });
} else {
  createSaveStatus();
}

export { SAVE_STATES, verifiedServerState };
