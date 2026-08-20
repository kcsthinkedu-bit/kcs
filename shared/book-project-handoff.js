const HANDOFF_KEY = "kcs-book-project-handoff-v1";
const MAX_HANDOFF_AGE_MS = 10 * 60 * 1000;

function readHandoff() {
  try {
    const value = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) || "null");
    if (!value?.project || !Array.isArray(value.project.pages)) return null;
    if (Date.now() - Number(value.createdAt || 0) > MAX_HANDOFF_AGE_MS) {
      sessionStorage.removeItem(HANDOFF_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function findJsonImportInput() {
  return [...document.querySelectorAll('input[type="file"]')].find((input) => {
    const accept = String(input.accept || "").toLowerCase();
    return accept.includes("json") || accept.includes(".json");
  });
}

function cleanHandoffAddress() {
  const url = new URL(window.location.href);
  url.searchParams.delete("restore");
  window.history.replaceState(null, "", url);
}

function safeFileName(value) {
  const safe = String(value || "내-책")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return safe || "내-책";
}

function downloadHandoffFile(handoff) {
  const blob = new Blob([JSON.stringify(handoff.project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(handoff.project.title)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showFallback(handoff) {
  const notice = document.createElement("section");
  notice.className = "book-handoff-notice";
  notice.setAttribute("role", "dialog");
  notice.setAttribute("aria-modal", "true");
  notice.setAttribute("aria-labelledby", "book-handoff-title");
  notice.innerHTML = `
    <div class="book-handoff-card">
      <p>책 파일 가져오기</p>
      <h2 id="book-handoff-title">자동으로 책을 열지 못했어요</h2>
      <p>아래에서 책 파일을 받은 뒤, 편집기의 <strong>파일 불러오기</strong>를 눌러 선택해 주세요.</p>
      <div>
        <button type="button" class="book-handoff-download">책 파일 받기</button>
        <button type="button" class="book-handoff-close">닫기</button>
      </div>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    .book-handoff-notice { position: fixed; inset: 0; z-index: 20000; display: grid; place-items: center; padding: 18px; background: rgba(20,34,29,.62); font-family: "Pretendard", "Noto Sans KR", sans-serif; }
    .book-handoff-card { width: min(480px, 100%); padding: 26px; border-radius: 22px; color: #24352f; background: #fffdf7; box-shadow: 0 28px 80px rgba(20,43,34,.34); }
    .book-handoff-card > p:first-child { margin: 0 0 4px; color: #a85d31; font-size: 13px; font-weight: 900; }
    .book-handoff-card h2 { margin: 0 0 14px; font-size: 24px; }
    .book-handoff-card p { line-height: 1.65; }
    .book-handoff-card > div { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
    .book-handoff-card button { min-height: 46px; padding: 10px 16px; border: 2px solid #2f6f58; border-radius: 13px; font: inherit; font-weight: 800; cursor: pointer; }
    .book-handoff-download { color: white; background: #2f6f58; }
    .book-handoff-close { color: #2f6f58; background: transparent; }
  `;
  notice.append(style);
  notice.querySelector(".book-handoff-download").addEventListener("click", () => downloadHandoffFile(handoff));
  notice.querySelector(".book-handoff-close").addEventListener("click", () => {
    sessionStorage.removeItem(HANDOFF_KEY);
    cleanHandoffAddress();
    notice.remove();
  });
  document.body.append(notice);
  notice.querySelector(".book-handoff-download").focus();
}

function importThroughExistingControl(handoff, input) {
  try {
    const file = new File(
      [JSON.stringify(handoff.project)],
      `${safeFileName(handoff.project.title)}.json`,
      { type: "application/json" },
    );
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    sessionStorage.removeItem(HANDOFF_KEY);
    cleanHandoffAddress();
    return true;
  } catch {
    return false;
  }
}

function receiveBookProject() {
  const handoff = readHandoff();
  if (!handoff) return;

  const input = findJsonImportInput();
  if (input && importThroughExistingControl(handoff, input)) return;
  showFallback(handoff);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", receiveBookProject, { once: true });
} else {
  receiveBookProject();
}
