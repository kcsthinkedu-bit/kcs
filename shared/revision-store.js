import {
  AUTHOR_ROLES,
  REVISION_KINDS,
  createRevisionSnapshot
} from '/shared/book-model.js';

const DB_NAME = 'kcs-book-editor-local';
const DB_VERSION = 1;
const STORE_NAME = 'book-revisions';

let databasePromise = null;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('저장본을 처리하지 못했어요.'));
  });
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('이 브라우저에서는 저장본 보관 기능을 사용할 수 없어요.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('projectKind', ['projectId', 'kind'], { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('저장본 보관함을 열지 못했어요.'));
  });
  return databasePromise;
}

async function withStore(mode, callback) {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);
  return callback(store, transaction);
}

export async function saveBookRevision(options = {}) {
  const snapshot = createRevisionSnapshot({
    projectId: options.projectId,
    parentRevisionId: options.parentRevisionId,
    kind: options.kind,
    authorRole: options.authorRole,
    document: options.document
  });
  const record = {
    ...snapshot,
    label: String(options.label || ''),
    note: String(options.note || ''),
    immutable: true
  };

  await withStore('readwrite', async (store) => requestResult(store.add(record)));
  return record;
}

export async function getBookRevision(revisionId) {
  return withStore('readonly', async (store) => requestResult(store.get(String(revisionId || ''))));
}

export async function listBookRevisions(projectId) {
  const rows = await withStore('readonly', async (store) => {
    const index = store.index('projectId');
    return requestResult(index.getAll(String(projectId || '')));
  });
  return (Array.isArray(rows) ? rows : []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getRevisionLabel(kind) {
  const labels = {
    [REVISION_KINDS.DRAFT]: '작업 중 보관본',
    [REVISION_KINDS.SUBMISSION]: '학생 제출본',
    [REVISION_KINDS.TEACHER_EDIT]: '선생님 수정본',
    [REVISION_KINDS.RETURNED]: '다시 고칠 책',
    [REVISION_KINDS.FINAL]: '최종본'
  };
  return labels[kind] || '저장본';
}

export function getAuthorRoleForRevision(kind) {
  if (kind === REVISION_KINDS.SUBMISSION || kind === REVISION_KINDS.RETURNED) return AUTHOR_ROLES.STUDENT;
  if (kind === REVISION_KINDS.TEACHER_EDIT || kind === REVISION_KINDS.FINAL) return AUTHOR_ROLES.TEACHER;
  return AUTHOR_ROLES.MEMBER;
}
