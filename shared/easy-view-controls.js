const STORAGE_KEY = "kcs-book-easy-view-v1";
const DEFAULT_PREFERENCES = Object.freeze({
  largeControls: false,
  highContrast: false,
  reduceMotion: false,
});

function readPreferences() {
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function applyPreferences(preferences) {
  const root = document.documentElement;
  root.dataset.easyLarge = String(preferences.largeControls);
  root.dataset.easyContrast = String(preferences.highContrast);
  root.dataset.easyReduceMotion = String(preferences.reduceMotion);
}

function savePreferences(preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);
}

function createOption(name, label, helpText, checked) {
  const option = document.createElement("label");
  option.className = "easy-view-option";
  option.innerHTML = `
    <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
    <span>
      <strong>${label}</strong>
      <small>${helpText}</small>
    </span>
  `;
  return option;
}

function installStylesheet() {
  if (document.querySelector('link[data-kcs-easy-view="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/shared/easy-view-controls.css";
  link.dataset.kcsEasyView = "true";
  document.head.append(link);
}

function createEasyViewControls() {
  const preferences = readPreferences();
  applyPreferences(preferences);
  installStylesheet();

  const container = document.createElement("div");
  container.className = "easy-view-controls";
  container.innerHTML = `
    <button type="button" class="easy-view-open" aria-haspopup="dialog">
      보기 편한 화면
    </button>
    <dialog class="easy-view-dialog" aria-labelledby="easy-view-title">
      <form method="dialog">
        <div class="easy-view-heading">
          <div>
            <p>화면 설정</p>
            <h2 id="easy-view-title">내가 보기 편하게</h2>
          </div>
          <button type="submit" class="easy-view-close" aria-label="화면 설정 닫기">닫기</button>
        </div>
        <div class="easy-view-options"></div>
        <p class="easy-view-note">이 설정은 지금 사용하는 기기에 기억됩니다.</p>
        <div class="easy-view-footer">
          <button type="button" class="easy-view-reset">처음 설정으로</button>
          <button type="submit" class="easy-view-done">설정 마치기</button>
        </div>
      </form>
    </dialog>
    <span class="easy-view-status" aria-live="polite"></span>
  `;

  const dialog = container.querySelector(".easy-view-dialog");
  const options = container.querySelector(".easy-view-options");
  const status = container.querySelector(".easy-view-status");
  const openButton = container.querySelector(".easy-view-open");

  options.append(
    createOption("largeControls", "글자와 버튼 크게", "설명과 누르는 곳을 더 크게 보여요.", preferences.largeControls),
    createOption("highContrast", "화면 선명하게", "글자와 버튼의 차이를 더 뚜렷하게 보여요.", preferences.highContrast),
    createOption("reduceMotion", "움직임 줄이기", "화면이 움직이는 효과를 줄여요.", preferences.reduceMotion),
  );

  function updateFromForm() {
    const next = Object.fromEntries(
      Object.keys(DEFAULT_PREFERENCES).map((name) => [
        name,
        options.querySelector(`[name="${name}"]`).checked,
      ]),
    );
    savePreferences(next);
    status.textContent = "화면 설정을 바꿨어요.";
  }

  options.addEventListener("change", updateFromForm);
  openButton.addEventListener("click", () => {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  });

  container.querySelector(".easy-view-reset").addEventListener("click", () => {
    Object.entries(DEFAULT_PREFERENCES).forEach(([name, checked]) => {
      options.querySelector(`[name="${name}"]`).checked = checked;
    });
    savePreferences(DEFAULT_PREFERENCES);
    status.textContent = "처음 화면 설정으로 돌아왔어요.";
  });

  dialog.addEventListener("close", () => openButton.focus());
  document.body.append(container);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createEasyViewControls, { once: true });
} else {
  createEasyViewControls();
}
