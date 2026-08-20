const DATABASE_NAME = "kcs-book-local-library";
const DATABASE_VERSION = 1;
const STORE_NAME = "projects";

function openLibraryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "projectId" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("bookType", "bookType");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runRequest(mode, operation) {
  return openLibraryDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => reject(transaction.error);
      }),
  );
}

function normalizeBookType(value) {
  return value === "coloringbook" ? "coloringbook" : "picturebook";
}

function getProjectId(project) {
  return project?.projectId || project?.id || null;
}

function getProjectTitle(project) {
  return String(project?.title || project?.book?.title || "제목 없는 책").trim() || "제목 없는 책";
}

function isBookProject(project) {
  if (!project || typeof project !== "object") return false;
  if (!Array.isArray(project.pages)) return false;
  return Boolean(getProjectId(project));
}

async function saveLocalProject(project, source = {}) {
  if (!isBookProject(project)) {
    throw new TypeError("책 데이터와 책 고유 번호가 필요합니다.");
  }

  const now = new Date().toISOString();
  const record = {
    projectId: String(getProjectId(project)),
    title: getProjectTitle(project),
    bookType: normalizeBookType(project.bookType || project.type),
    pageCount: project.pages.length,
    updatedAt: now,
    documentUpdatedAt: project.updatedAt ? String(project.updatedAt) : null,
    savedToLibraryAt: now,
    sourceKey: source.sourceKey ? String(source.sourceKey) : null,
    sourcePath: source.sourcePath ? String(source.sourcePath) : null,
    project: structuredClone(project),
  };

  await runRequest("readwrite", (store) => store.put(record));
  window.dispatchEvent(new CustomEvent("kcs-local-library-changed"));
  return record;
}

async function listLocalProjects() {
  const records = await runRequest("readonly", (store) => store.getAll());
  return records.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

function getLocalProject(projectId) {
  return runRequest("readonly", (store) => store.get(String(projectId)));
}

async function removeLocalProjectCopy(projectId) {
  await runRequest("readwrite", (store) => store.delete(String(projectId)));
  window.dispatchEvent(new CustomEvent("kcs-local-library-changed"));
}

export {
  getLocalProject,
  isBookProject,
  listLocalProjects,
  removeLocalProjectCopy,
  saveLocalProject,
};
