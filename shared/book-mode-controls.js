const STORAGE_KEY = "kcs-book-screen-mode-v1";

const BOOK_MODES = Object.freeze({
  PERSONAL: "personal",
  STUDENT: "student",
  TEACHER: "teacher",
});

const MODE_DETAILS = Object.freeze({
  [BOOK_MODES.PERSONAL]: {
    label: "혼자 만들기",
    shortLabel: "혼자",
    description: "내 책을 자유롭게 만들고 미리보기와 인쇄를 사용해요.",
  },
  [BOOK_MODES.STUDENT]: {
    label: "학생 화면",
    shortLabel: "학생",
    description: "내 작업과 제출할 책을 구분해서 만들어요.",
  },
  [BOOK_MODES.TEACHER]: {
    label: "선생님 화면",
    shortLabel: "선생님",
    description: "수업용 책과 학생이 제출한 책의 사본을 관리해요.",
  },
});

function normalizeBookMode(value) {
  return Object.values(BOOK_MODES).includes(value) ? value : BOOK_MODES.PERSONAL;
}

function getInitialMode() {
  const queryMode = new URLSearchParams(window.location.search).get("mode");
  if (queryMode) return normalizeBookMode(queryMode);

  try {
    return normalizeBookMode(localStorage.getItem(STORAGE_KEY));
  } catch {
    return BOOK_MODES.PERSONAL;
  }
}

function updateAddress(mode) {
  const url = new URL(window.location.href);
  if (mode === BOOK_MODES.PERSONAL) {
    url.searchParams.delete("mode");
  } else {
    url.searchParams.set("mode", mode);
  }
  window.history.replaceState(null, "", url);
}

function setBookMode(mode, options = {}) {
  const nextMode = normalizeBookMode(mode);
  document.documentElement.dataset.bookMode = nextMode;

  if (options.remember !== false) {
    try {
      localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // 개인정보 보호 설정으로 저장할 수 없어도 현재 화면에서는 계속 사용한다.
    }
  }

  if (options.updateAddress !== false) updateAddress(nextMode);
  window.dispatchEvent(
    new CustomEvent("kcs-book-mode-change", {
      detail: { mode: nextMode },
    }),
  );
  return nextMode;
}

function installStylesheet() {
  if (document.querySelector('link[data-kcs-book-mode="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/shared/book-mode-controls.css";
  link.dataset.kcsBookMode = "true";
  document.head.append(link);
}

function createModeOption(mode, currentMode) {
  const detail = MODE_DETAILS[mode];
  const label = document.createElement("label");
  label.className = "book-mode-option";
  label.innerHTML = `
    <input type="radio" name="book-screen-mode" value="${mode}" ${mode === currentMode ? "checked" : ""} />
    <span>
      <strong>${detail.label}</strong>
      <small>${detail.description}</small>
    </span>
  `;
  return label;
}

function createBookModeControls() {
  installStylesheet();
  let currentMode = setBookMode(getInitialMode(), { updateAddress: false });

  const controls = document.createElement("div");
  controls.className = "book-mode-controls";
  controls.innerHTML = `
    <button type="button" class="book-mode-open" aria-haspopup="dialog"></button>
    <dialog class="book-mode-dialog" aria-labelledby="book-mode-title">
      <form method="dialog">
        <div class="book-mode-heading">
          <div>
            <p>사용할 화면</p>
            <h2 id="book-mode-title">누가 책을 만드나요?</h2>
          </div>
          <button type="submit" class="book-mode-close" aria-label="사용 화면 선택 닫기">닫기</button>
        </div>
        <div class="book-mode-options"></div>
        <div class="book-mode-warning" role="note">
          화면을 선택해도 회원 권한은 바뀌지 않아요. 학생 초대와 온라인 제출은 로그인 연결 후 사용할 수 있습니다.
        </div>
        <button type="submit" class="book-mode-done">이 화면 사용하기</button>
      </form>
    </dialog>
    <div class="book-mode-announcement" aria-live="polite"></div>
  `;

  const dialog = controls.querySelector(".book-mode-dialog");
  const openButton = controls.querySelector(".book-mode-open");
  const options = controls.querySelector(".book-mode-options");
  const announcement = controls.querySelector(".book-mode-announcement");

  Object.values(BOOK_MODES).forEach((mode) => options.append(createModeOption(mode, currentMode)));

  function updateButton() {
    openButton.textContent = `사용 화면: ${MODE_DETAILS[currentMode].shortLabel}`;
    openButton.setAttribute("aria-label", `현재 ${MODE_DETAILS[currentMode].label}. 사용 화면 바꾸기`);
  }

  options.addEventListener("change", (event) => {
    if (event.target.name !== "book-screen-mode") return;
    currentMode = setBookMode(event.target.value);
    updateButton();
    announcement.textContent = `${MODE_DETAILS[currentMode].label}으로 바꿨어요. ${MODE_DETAILS[currentMode].description}`;
  });

  openButton.addEventListener("click", () => {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  });

  dialog.addEventListener("close", () => openButton.focus());
  updateButton();
  document.body.append(controls);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createBookModeControls, { once: true });
} else {
  createBookModeControls();
}

export { BOOK_MODES, MODE_DETAILS, normalizeBookMode, setBookMode };
