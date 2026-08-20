import { isBookProject, saveLocalProject } from "/shared/local-project-library.js";

const SCAN_INTERVAL_MS = 5000;
let lastFingerprints = new Map();

function createContentFingerprint(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${value.length}:${(hash >>> 0).toString(16)}`;
}

function findProject(value) {
  if (isBookProject(value)) return value;
  if (isBookProject(value?.project)) return value.project;
  if (isBookProject(value?.book)) return value.book;
  return null;
}

async function scanTemporaryBooks() {
  const nextFingerprints = new Map();

  for (let index = 0; index < localStorage.length; index += 1) {
    const sourceKey = localStorage.key(index);
    if (!sourceKey || sourceKey.startsWith("kcs-print-")) continue;

    const rawValue = localStorage.getItem(sourceKey);
    if (!rawValue || rawValue.length < 20) continue;

    try {
      const project = findProject(JSON.parse(rawValue));
      if (!project) continue;

      const projectId = String(project.projectId || project.id);
      const fingerprint = `${sourceKey}:${createContentFingerprint(rawValue)}`;
      nextFingerprints.set(projectId, fingerprint);

      if (lastFingerprints.get(projectId) !== fingerprint) {
        await saveLocalProject(project, {
          sourceKey,
          sourcePath: window.location.pathname + window.location.search,
        });
      }
    } catch {
      // 다른 기능의 localStorage 값은 책 데이터가 아니므로 건너뛴다.
    }
  }

  lastFingerprints = nextFingerprints;
}

scanTemporaryBooks();
window.setInterval(scanTemporaryBooks, SCAN_INTERVAL_MS);
window.addEventListener("storage", scanTemporaryBooks);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") scanTemporaryBooks();
});
