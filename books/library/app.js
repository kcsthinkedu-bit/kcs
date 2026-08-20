import {
  getLocalProject,
  isBookProject,
  listLocalProjects,
  removeLocalProjectCopy,
  saveLocalProject,
} from "/shared/local-project-library.js";

const listElement = document.querySelector("#book-list");
const statusElement = document.querySelector("#status");
const template = document.querySelector("#book-card-template");
const refreshButton = document.querySelector("#refresh-button");
const importFileInput = document.querySelector("#import-file");
const MAX_IMPORT_BYTES = 100 * 1024 * 1024;
const HANDOFF_KEY = "kcs-book-project-handoff-v1";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function typeLabel(bookType) {
  return bookType === "coloringbook" ? "컬러링북" : "그림책";
}

function defaultEditorPath(record) {
  return record.bookType === "coloringbook"
    ? "/editor/?type=coloringbook"
    : "/editor/?type=picturebook";
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

function downloadBook(record) {
  const backup = {
    format: "kcs-local-book-backup-v1",
    exportedAt: new Date().toISOString(),
    source: {
      sourceKey: record.sourceKey,
      sourcePath: record.sourcePath,
    },
    project: record.project,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(record.title)}-${record.projectId.slice(0, 8)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  statusElement.textContent = `“${record.title}”을 파일로 보관했어요.`;
}

function safeSourcePath(value) {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  if (!value.startsWith("/editor/") && !value.startsWith("/coloringbook/")) return null;
  return value;
}

function safeSourceKey(value) {
  if (typeof value !== "string" || !value || value.length > 200) return null;
  return value;
}

async function importBookFile(file) {
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    statusElement.textContent = "파일이 100MB보다 커서 가져올 수 없어요. 편집기에서 그림 크기를 확인해 주세요.";
    return;
  }

  statusElement.textContent = "책 파일을 확인하고 있어요.";

  try {
    const parsed = JSON.parse(await file.text());
    const isLibraryBackup = parsed?.format === "kcs-local-book-backup-v1";
    const project = isLibraryBackup ? parsed.project : parsed;

    if (!isBookProject(project)) {
      throw new TypeError("지원하는 책 파일이 아닙니다.");
    }

    const projectId = String(project.projectId || project.id);
    const existing = await getLocalProject(projectId);
    if (existing) {
      const replace = window.confirm(
        `“${existing.title}”과 같은 책 번호예요. 책장 사본을 가져온 파일로 바꿀까요?`,
      );
      if (!replace) {
        statusElement.textContent = "기존 책을 그대로 두었어요.";
        return;
      }
    }

    await saveLocalProject(project, {
      sourceKey: safeSourceKey(parsed?.source?.sourceKey),
      sourcePath: safeSourcePath(parsed?.source?.sourcePath),
    });
    await renderLibrary();
    statusElement.textContent = `“${project.title || "제목 없는 책"}”을 책장에 가져왔어요.`;
  } catch {
    statusElement.textContent = "이 파일은 책 편집기에서 만든 올바른 JSON 파일이 아니에요.";
  } finally {
    importFileInput.value = "";
  }
}

function openBook(record) {
  try {
    if (record.sourceKey) {
      localStorage.setItem(record.sourceKey, JSON.stringify(record.project));
      window.location.href = record.sourcePath || defaultEditorPath(record);
      return;
    }

    sessionStorage.setItem(
      HANDOFF_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        projectId: record.projectId,
        project: record.project,
      }),
    );
    const target = new URL(defaultEditorPath(record), window.location.origin);
    target.searchParams.set("restore", "local");
    window.location.href = target;
  } catch {
    statusElement.textContent = "책을 여는 중 저장 공간이 부족해졌어요. JSON 파일로 보관한 뒤 다시 시도해 주세요.";
  }
}

async function removeBook(record) {
  const confirmed = window.confirm(
    `“${record.title}”을 이 기기의 책 목록에서 뺄까요? 편집기의 원본이나 그림 파일은 자동으로 지우지 않습니다.`,
  );
  if (!confirmed) return;

  await removeLocalProjectCopy(record.projectId);
  await renderLibrary();
}

function createBookCard(record) {
  const fragment = template.content.cloneNode(true);
  fragment.querySelector(".book-type").textContent = typeLabel(record.bookType);
  fragment.querySelector(".book-title").textContent = record.title;
  fragment.querySelector(".book-meta").textContent = `${record.pageCount}쪽 · ${dateFormatter.format(new Date(record.updatedAt))}에 수정`;
  fragment.querySelector(".open-book").addEventListener("click", () => openBook(record));
  fragment.querySelector(".download-book").addEventListener("click", () => downloadBook(record));
  fragment.querySelector(".remove-book").addEventListener("click", () => removeBook(record));
  return fragment;
}

async function renderLibrary() {
  refreshButton.disabled = true;
  statusElement.textContent = "책장을 확인하고 있어요.";

  try {
    const records = await listLocalProjects();
    listElement.replaceChildren(...records.map(createBookCard));
    statusElement.textContent = records.length
      ? `${records.length}권의 책이 이 기기에 저장되어 있어요.`
      : "아직 저장된 책이 없어요. 편집기에서 책을 만들면 여기에 나타납니다.";
  } catch {
    statusElement.textContent = "이 브라우저에서는 책장을 열 수 없어요. 개인정보 보호 설정을 확인해 주세요.";
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener("click", renderLibrary);
importFileInput.addEventListener("change", () => importBookFile(importFileInput.files?.[0]));
window.addEventListener("kcs-local-library-changed", renderLibrary);
renderLibrary();
