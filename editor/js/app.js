import {
  BOOK_TYPES,
  PAGE_ROLES,
  createBookProject,
  getFacingSpreads,
  normalizeBookProject
} from '/shared/book-model.js';
import {
  createCalibrationProfile,
  findMatchingCalibrationProfile,
  openBookPrintPreview,
  openCalibrationPrint,
  saveCalibrationProfile
} from '/shared/print-engine.js';
import {
  getAuthorRoleForRevision,
  getBookRevision,
  getRevisionLabel,
  listBookRevisions,
  saveBookRevision
} from '/shared/revision-store.js';

const params = new URLSearchParams(location.search);
const requestedType = params.get('type');
const bookType = requestedType === BOOK_TYPES.COLORING_BOOK
  ? BOOK_TYPES.COLORING_BOOK
  : BOOK_TYPES.PICTURE_BOOK;
const storageKey = `kcs-book-v2-draft-${bookType}`;
const bookName = bookType === BOOK_TYPES.COLORING_BOOK ? '컬러링북' : '그림책';
let pendingDeleteSpreadIds = [];
let pendingDeleteSpreadIndex = -1;
let spreadDragState = null;
let readingDialogReturnFocus = null;

const dom = {
  shell: document.getElementById('commonEditorShell'),
  bookTitleInput: document.getElementById('bookTitleInput'),
  saveStateText: document.getElementById('saveStateText'),
  saveState: document.querySelector('.save-state'),
  downloadBookBtn: document.getElementById('downloadBookBtn'),
  loadBookInput: document.getElementById('loadBookInput'),
  revisionCount: document.getElementById('revisionCount'),
  revisionKindInput: document.getElementById('revisionKindInput'),
  createRevisionBtn: document.getElementById('createRevisionBtn'),
  revisionStatus: document.getElementById('revisionStatus'),
  revisionList: document.getElementById('revisionList'),
  pageList: document.getElementById('pageList'),
  addPageBtn: document.getElementById('addPageBtn'),
  duplicatePageBtn: document.getElementById('duplicatePageBtn'),
  deletePageBtn: document.getElementById('deletePageBtn'),
  pageActionHint: document.getElementById('pageActionHint'),
  deleteSpreadDialog: document.getElementById('deleteSpreadDialog'),
  deleteSpreadPages: document.getElementById('deleteSpreadPages'),
  cancelDeleteSpreadBtn: document.getElementById('cancelDeleteSpreadBtn'),
  confirmDeleteSpreadBtn: document.getElementById('confirmDeleteSpreadBtn'),
  addTextBtn: document.getElementById('addTextBtn'),
  addImageInput: document.getElementById('addImageInput'),
  swapSpreadBtn: document.getElementById('swapSpreadBtn'),
  undoBtn: document.getElementById('undoBtn'),
  redoBtn: document.getElementById('redoBtn'),
  spreadCanvas: document.getElementById('spreadCanvas'),
  leftPageSlot: document.getElementById('leftPageSlot'),
  rightPageSlot: document.getElementById('rightPageSlot'),
  leftPageSelectBtn: document.getElementById('leftPageSelectBtn'),
  rightPageSelectBtn: document.getElementById('rightPageSelectBtn'),
  leftPagePurpose: document.getElementById('leftPagePurpose'),
  rightPagePurpose: document.getElementById('rightPagePurpose'),
  leftPageCanvas: document.getElementById('leftPageCanvas'),
  rightPageCanvas: document.getElementById('rightPageCanvas'),
  textToolbar: document.getElementById('textToolbar'),
  fontFamilyInput: document.getElementById('fontFamilyInput'),
  fontSizeInput: document.getElementById('fontSizeInput'),
  fontSizeDownBtn: document.getElementById('fontSizeDownBtn'),
  fontSizeUpBtn: document.getElementById('fontSizeUpBtn'),
  boldBtn: document.getElementById('boldBtn'),
  italicBtn: document.getElementById('italicBtn'),
  underlineBtn: document.getElementById('underlineBtn'),
  fontColorInput: document.getElementById('fontColorInput'),
  alignButtons: Array.from(document.querySelectorAll('[data-align]')),
  nothingSelected: document.getElementById('nothingSelected'),
  elementDetails: document.getElementById('elementDetails'),
  textContentField: document.getElementById('textContentField'),
  textContentInput: document.getElementById('textContentInput'),
  imageAltField: document.getElementById('imageAltField'),
  imageAltInput: document.getElementById('imageAltInput'),
  elementXInput: document.getElementById('elementXInput'),
  elementYInput: document.getElementById('elementYInput'),
  elementWidthInput: document.getElementById('elementWidthInput'),
  elementHeightInput: document.getElementById('elementHeightInput'),
  deleteElementBtn: document.getElementById('deleteElementBtn'),
  pageColorInput: document.getElementById('pageColorInput'),
  printPaperSizeInput: document.getElementById('printPaperSizeInput'),
  printPaperStandardInput: document.getElementById('printPaperStandardInput'),
  b4StandardField: document.getElementById('b4StandardField'),
  printModeInput: document.getElementById('printModeInput'),
  paperThicknessInput: document.getElementById('paperThicknessInput'),
  printProfileNameInput: document.getElementById('printProfileNameInput'),
  frontOffsetXInput: document.getElementById('frontOffsetXInput'),
  frontOffsetYInput: document.getElementById('frontOffsetYInput'),
  backOffsetXInput: document.getElementById('backOffsetXInput'),
  backOffsetYInput: document.getElementById('backOffsetYInput'),
  savePrintProfileBtn: document.getElementById('savePrintProfileBtn'),
  resetPrintProfileBtn: document.getElementById('resetPrintProfileBtn'),
  calibrationPrintBtn: document.getElementById('calibrationPrintBtn'),
  openPrintPreviewBtn: document.getElementById('openPrintPreviewBtn'),
  printStatus: document.getElementById('printStatus'),
  readingView: document.getElementById('readingView'),
  closeReadingDialogBtn: document.getElementById('closeReadingDialogBtn'),
  readingPages: document.getElementById('readingPages'),
  readingLayoutHint: document.getElementById('readingLayoutHint'),
  previousOpeningBtn: document.getElementById('previousOpeningBtn'),
  nextOpeningBtn: document.getElementById('nextOpeningBtn'),
  openingCounter: document.getElementById('openingCounter')
};

const state = {
  project: loadDraft(),
  activePageId: '',
  selectedElementId: '',
  openingIndex: 0,
  readerTurning: false,
  saveTimer: null,
  printProfile: null,
  workingParentRevisionId: '',
  revisionRows: [],
  historyPast: [],
  historyFuture: [],
  historyCurrent: '',
  historyGroupOpen: false,
  historyGroupTimer: null
};

state.activePageId = state.project.pages[0]?.id || '';
state.printProfile = loadPrintProfileForProject();
state.historyCurrent = JSON.stringify(state.project);

function makeId(prefix) {
  const suffix = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${suffix}`;
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function safeColor(value, fallback = '#1f2937') {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function loadDraft() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return ensureFacingPagePairs(normalizeBookProject(JSON.parse(saved)));
  } catch (error) {
    console.error(error);
  }

  const project = createBookProject({
    bookType,
    title: bookType === BOOK_TYPES.COLORING_BOOK ? '나의 컬러링북' : '나의 그림책'
  });

  const [leftPage, rightPage] = createSpreadPages();
  project.pages.splice(1, project.pages.length - 2, leftPage, rightPage);
  resetPageOrders(project.pages);

  return project;
}

function loadPrintProfileForProject() {
  const setup = state?.project?.printSetup || {};
  return findMatchingCalibrationProfile(setup.sheetSize || 'A4', setup.sheetStandard || 'ISO')
    || createCalibrationProfile({
      name: '기본 프린터',
      paperSize: setup.sheetSize || 'A4',
      paperStandard: setup.sheetStandard || 'ISO'
    });
}

function createPage(title = '새 페이지') {
  return {
    id: makeId('page'),
    order: 0,
    role: PAGE_ROLES.CONTENT,
    title,
    background: '#ffffff',
    locked: false,
    elements: []
  };
}

function createSpreadPages(options = {}) {
  const leftKind = bookType === BOOK_TYPES.COLORING_BOOK ? 'text' : 'image';
  const rightKind = leftKind === 'text' ? 'image' : 'text';
  const leftPage = createPage(`왼쪽 ${leftKind === 'text' ? '글' : '그림'}`);
  const rightPage = createPage(`오른쪽 ${rightKind === 'text' ? '글' : '그림'}`);
  if (options.addStarterText !== false) {
    const textPage = leftKind === 'text' ? leftPage : rightPage;
    textPage.elements.push(createTextElement());
  }
  return [leftPage, rightPage];
}

function ensureFacingPagePairs(project) {
  const frontCover = project.pages.find((page) => page.role === PAGE_ROLES.FRONT_COVER) || null;
  const backCover = project.pages.find((page) => page.role === PAGE_ROLES.BACK_COVER) || null;
  const bodyPages = project.pages.filter((page) => ![PAGE_ROLES.FRONT_COVER, PAGE_ROLES.BACK_COVER].includes(page.role));

  if (!bodyPages.length) {
    bodyPages.push(...createSpreadPages());
  } else if (bodyPages.length % 2 === 1) {
    const leftPage = bodyPages[bodyPages.length - 1];
    const leftKind = getPageContentKind(leftPage, 'left');
    bodyPages.push(createPage(`오른쪽 ${leftKind === 'text' ? '그림' : '글'}`));
  }

  project.pages = [frontCover, ...bodyPages, backCover].filter(Boolean);
  resetPageOrders(project.pages);
  return project;
}

function createTextElement() {
  return {
    id: makeId('element'),
    type: 'text',
    name: '글',
    locked: false,
    hidden: false,
    frame: { x: 12, y: 14, width: 76, height: 22, rotation: 0 },
    text: '여기에 글을 써 보세요.',
    style: {
      fontFamily: 'Noto Sans KR',
      fontSize: 22,
      fontWeight: '400',
      italic: false,
      underline: false,
      color: '#1f2937',
      align: 'left',
      lineHeight: 1.5,
      letterSpacing: 0
    }
  };
}

function createImageElement(source, name, assetId = '') {
  return {
    id: makeId('element'),
    type: 'image',
    name: name || '그림',
    locked: false,
    hidden: false,
    frame: { x: 10, y: 18, width: 80, height: 58, rotation: 0 },
    assetId,
    source,
    alt: name || '책에 넣은 그림',
    fit: 'contain',
    crop: { x: 0, y: 0, scale: 1 }
  };
}

function getActivePage() {
  return state.project.pages.find((page) => page.id === state.activePageId) || state.project.pages[0] || null;
}

function getSelectedElement() {
  const page = getActivePage();
  return page?.elements.find((element) => element.id === state.selectedElementId) || null;
}

function resetPageOrders(pages) {
  pages.forEach((page, index) => { page.order = index; });
}

function describePage(page, index) {
  if (page.role === PAGE_ROLES.FRONT_COVER) return { title: '앞표지', note: '책의 첫 얼굴' };
  if (page.role === PAGE_ROLES.BACK_COVER) return { title: '뒤표지', note: '책의 마지막' };
  const bodyPages = state.project.pages.filter((item) => ![
    PAGE_ROLES.FRONT_COVER,
    PAGE_ROLES.BACK_COVER
  ].includes(item.role));
  const bodyIndex = bodyPages.findIndex((item) => item.id === page.id);
  const side = bodyIndex % 2 === 0 ? 'left' : 'right';
  const kind = getPageContentKind(page, side);
  return {
    title: `${side === 'left' ? '왼쪽' : '오른쪽'} ${kind === 'text' ? '글' : '그림'}`,
    note: `본문 ${index}쪽`
  };
}

function markChanged() {
  recordHistoryChange();
  dom.saveState.className = 'save-state saving';
  dom.saveStateText.textContent = '임시 저장 중...';
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveDraft, 350);
}

function recordHistoryChange() {
  const next = JSON.stringify(state.project);
  if (next === state.historyCurrent) return;

  if (!state.historyGroupOpen) {
    state.historyPast.push(state.historyCurrent);
    if (state.historyPast.length > 80) state.historyPast.shift();
    state.historyFuture = [];
    state.historyGroupOpen = true;
  }

  state.historyCurrent = next;
  clearTimeout(state.historyGroupTimer);
  state.historyGroupTimer = setTimeout(() => {
    state.historyGroupOpen = false;
  }, 650);
  syncHistoryButtons();
}

function resetHistory() {
  clearTimeout(state.historyGroupTimer);
  state.historyPast = [];
  state.historyFuture = [];
  state.historyCurrent = JSON.stringify(state.project);
  state.historyGroupOpen = false;
  syncHistoryButtons();
}

function syncHistoryButtons() {
  dom.undoBtn.disabled = state.historyPast.length === 0;
  dom.redoBtn.disabled = state.historyFuture.length === 0;
}

function applyHistory(direction) {
  const source = direction === 'undo' ? state.historyPast : state.historyFuture;
  const target = source.pop();
  if (!target) return;

  const current = JSON.stringify(state.project);
  if (direction === 'undo') state.historyFuture.push(current);
  else state.historyPast.push(current);

  state.project = ensureFacingPagePairs(normalizeBookProject(JSON.parse(target)));
  state.historyCurrent = target;
  state.historyGroupOpen = false;
  if (!state.project.pages.some((page) => page.id === state.activePageId)) {
    state.activePageId = state.project.pages[0]?.id || '';
  }
  state.selectedElementId = '';
  renderAll();
  saveDraft();
  syncHistoryButtons();
  dom.saveStateText.textContent = direction === 'undo' ? '이전 작업으로 되돌렸어요' : '다시 실행했어요';
}

function saveDraft() {
  try {
    state.project.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(state.project));
    dom.saveState.className = 'save-state';
    dom.saveStateText.textContent = '이 기기에 임시 저장됨';
  } catch (error) {
    console.error(error);
    dom.saveState.className = 'save-state error';
    dom.saveStateText.textContent = '임시 저장하지 못했어요';
  }
}

function renderAll() {
  dom.bookTitleInput.value = state.project.title;
  renderPageList();
  renderCanvas();
  renderDetails();
  renderReader();
  renderPrintSettings();
  void renderRevisionList();
  syncHistoryButtons();
}

async function renderRevisionList() {
  try {
    state.revisionRows = await listBookRevisions(state.project.id);
    dom.revisionCount.textContent = `${state.revisionRows.length}개`;
    dom.revisionList.innerHTML = '';

    if (!state.revisionRows.length) {
      dom.revisionList.innerHTML = '<div class="revision-empty">아직 따로 보관한 저장본이 없어요.</div>';
      return;
    }

    state.revisionRows.forEach((revision) => {
      const card = document.createElement('article');
      card.className = 'revision-card';
      const head = document.createElement('div');
      head.className = 'revision-card-head';
      const badge = document.createElement('span');
      badge.className = `revision-badge ${revision.kind}`;
      badge.textContent = getRevisionLabel(revision.kind);
      const time = document.createElement('time');
      time.dateTime = revision.createdAt;
      time.textContent = new Date(revision.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      head.append(badge, time);

      const description = document.createElement('p');
      description.textContent = revision.parentRevisionId
        ? '이전 저장본을 그대로 보존하고 새로 만든 사본이에요.'
        : '현재 책에서 새로 보관한 저장본이에요.';

      const actions = document.createElement('div');
      actions.className = 'revision-card-actions';
      const continueButton = document.createElement('button');
      continueButton.type = 'button';
      continueButton.textContent = '이어서 만들기';
      continueButton.addEventListener('click', () => continueFromRevision(revision.id, revision.kind));
      actions.appendChild(continueButton);

      if (revision.kind === 'submission') {
        const teacherButton = document.createElement('button');
        teacherButton.type = 'button';
        teacherButton.className = 'teacher-start-button';
        teacherButton.textContent = '선생님 수정 시작';
        teacherButton.addEventListener('click', () => startTeacherEdit(revision.id));
        actions.appendChild(teacherButton);
      }

      card.append(head, description, actions);
      dom.revisionList.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    dom.revisionStatus.textContent = error.message || '저장본 목록을 불러오지 못했어요.';
  }
}

async function continueFromRevision(revisionId, kind) {
  if (!confirm(`${getRevisionLabel(kind)}에서 이어서 만들까요? 현재 작업은 임시 저장된 뒤 선택한 저장본으로 바뀝니다.`)) return;
  saveDraft();
  const revision = await getBookRevision(revisionId);
  if (!revision) return;
  state.project = ensureFacingPagePairs(normalizeBookProject(revision.document));
  state.activePageId = state.project.pages[0]?.id || '';
  state.selectedElementId = '';
  state.workingParentRevisionId = revision.id;
  state.openingIndex = 0;
  resetHistory();
  renderAll();
  saveDraft();
  dom.revisionStatus.textContent = `${getRevisionLabel(revision.kind)}에서 새 작업을 시작했어요. 원래 저장본은 그대로 남아 있어요.`;
}

async function startTeacherEdit(revisionId) {
  const revision = await getBookRevision(revisionId);
  if (!revision || revision.kind !== 'submission') return;
  saveDraft();
  state.project = ensureFacingPagePairs(normalizeBookProject(revision.document));
  state.activePageId = state.project.pages[0]?.id || '';
  state.selectedElementId = '';
  state.workingParentRevisionId = revision.id;
  state.openingIndex = 0;
  resetHistory();
  dom.revisionKindInput.value = 'teacher-edit';
  renderAll();
  saveDraft();
  dom.revisionStatus.textContent = '학생 제출본은 그대로 두고 선생님 수정 작업을 시작했어요.';
}

function renderPrintSettings() {
  const setup = state.project.printSetup || {};
  const profile = state.printProfile || createCalibrationProfile();
  dom.printPaperSizeInput.value = setup.sheetSize || 'A4';
  dom.printPaperStandardInput.value = setup.sheetStandard || (setup.sheetSize === 'B4' ? 'JIS' : 'ISO');
  dom.b4StandardField.hidden = dom.printPaperSizeInput.value !== 'B4';
  dom.printModeInput.value = setup.mode || 'single-sided';
  dom.paperThicknessInput.value = String(profile.paperThicknessMm || 0.1);
  dom.printProfileNameInput.value = profile.name || '기본 프린터';
  dom.frontOffsetXInput.value = String(profile.front?.xMm || 0);
  dom.frontOffsetYInput.value = String(profile.front?.yMm || 0);
  dom.backOffsetXInput.value = String(profile.back?.xMm || 0);
  dom.backOffsetYInput.value = String(profile.back?.yMm || 0);
}

function getPrintOptionsFromScreen() {
  return {
    paperSize: dom.printPaperSizeInput.value,
    paperStandard: dom.printPaperSizeInput.value === 'B4' ? dom.printPaperStandardInput.value : 'ISO',
    mode: dom.printModeInput.value
  };
}

function getPrintProfileFromScreen() {
  const options = getPrintOptionsFromScreen();
  return createCalibrationProfile({
    id: state.printProfile?.id,
    name: dom.printProfileNameInput.value.trim() || '기본 프린터',
    paperSize: options.paperSize,
    paperStandard: options.paperStandard,
    duplexFlip: state.project.printSetup?.duplexFlip || 'long-edge',
    paperThicknessMm: Number(dom.paperThicknessInput.value) || 0.1,
    front: { xMm: Number(dom.frontOffsetXInput.value) || 0, yMm: Number(dom.frontOffsetYInput.value) || 0 },
    back: { xMm: Number(dom.backOffsetXInput.value) || 0, yMm: Number(dom.backOffsetYInput.value) || 0 }
  });
}

function updateProjectPrintSetup() {
  const options = getPrintOptionsFromScreen();
  state.project.printSetup = {
    ...state.project.printSetup,
    sheetSize: options.paperSize,
    sheetStandard: options.paperStandard,
    mode: options.mode
  };
  markChanged();
}

function renderPageList() {
  dom.pageList.innerHTML = '';

  const createPageButton = (page) => {
    const index = state.project.pages.findIndex((item) => item.id === page.id);
    const description = describePage(page, index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `page-list-button${page.id === state.activePageId ? ' active' : ''}`;
    button.innerHTML = `
      <span class="page-thumb" style="background:${safeColor(page.background, '#ffffff')}">${index + 1}</span>
      <span class="page-name"><strong></strong><small></small></span>
    `;
    button.querySelector('strong').textContent = description.title;
    button.querySelector('small').textContent = description.note;
    button.addEventListener('click', () => {
      state.activePageId = page.id;
      state.selectedElementId = '';
      renderAll();
    });
    return button;
  };

  const frontCover = state.project.pages.find((page) => page.role === PAGE_ROLES.FRONT_COVER);
  if (frontCover) {
    const item = document.createElement('li');
    item.className = 'cover-list-item';
    item.appendChild(createPageButton(frontCover));
    dom.pageList.appendChild(item);
  }

  const contentOpenings = getContentOpenings();
  contentOpenings.forEach((opening, spreadIndex) => {
    const item = document.createElement('li');
    item.className = 'spread-list-item';
    item.dataset.spreadIndex = String(spreadIndex);

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'spread-drag-handle';
    handle.innerHTML = '<span aria-hidden="true">⠿</span>';
    const pageNumbers = [opening.leftPage, opening.rightPage]
      .filter(Boolean)
      .map((page) => state.project.pages.findIndex((itemPage) => itemPage.id === page.id));
    handle.setAttribute('aria-label', `본문 ${pageNumbers.join('쪽과 ')}쪽 순서 옮기기. 위아래로 끌거나 방향키를 사용하세요.`);
    handle.title = '위아래로 끌어 펼침 순서 바꾸기';
    handle.addEventListener('pointerdown', (event) => startSpreadDrag(event, spreadIndex));
    handle.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      moveSpreadToIndex(spreadIndex, spreadIndex + (event.key === 'ArrowUp' ? -1 : 1));
    });

    const pages = document.createElement('div');
    pages.className = 'spread-list-pages';
    [opening.leftPage, opening.rightPage].filter(Boolean).forEach((page) => pages.appendChild(createPageButton(page)));
    item.append(handle, pages);
    dom.pageList.appendChild(item);
  });

  const backCover = state.project.pages.find((page) => page.role === PAGE_ROLES.BACK_COVER);
  if (backCover) {
    const item = document.createElement('li');
    item.className = 'cover-list-item';
    item.appendChild(createPageButton(backCover));
    dom.pageList.appendChild(item);
  }

  const opening = getEditingOpening();
  const spreadIndex = contentOpenings.findIndex((item) => item.pages.some((page) => page.id === state.activePageId));
  const isContentSpread = opening?.kind === 'content';
  dom.duplicatePageBtn.disabled = !isContentSpread;
  dom.deletePageBtn.disabled = !isContentSpread || contentOpenings.length <= 1;
  dom.pageActionHint.textContent = !isContentSpread
    ? '앞표지와 뒤표지는 삭제하거나 복제할 수 없어요.'
    : contentOpenings.length <= 1
      ? '본문 펼침은 한 개 이상 남겨야 해요. 손잡이를 위아래로 끌어 순서를 바꿀 수 있어요.'
      : '손잡이를 위아래로 끌어 펼침 순서를 바꿔요.';
}

function hydrateOpening(opening) {
  if (!opening) return null;
  const findSourcePage = (page) => page
    ? state.project.pages.find((sourcePage) => sourcePage.id === page.id) || null
    : null;
  return {
    ...opening,
    leftPage: findSourcePage(opening.leftPage),
    rightPage: findSourcePage(opening.rightPage)
  };
}

function getContentOpenings() {
  return getFacingSpreads(state.project)
    .filter((opening) => opening.kind === 'content')
    .map(hydrateOpening);
}

function getEditingOpening() {
  const opening = getFacingSpreads(state.project).find((item) => item.pages.some((page) => page.id === state.activePageId))
    || getFacingSpreads(state.project)[0];
  return hydrateOpening(opening);
}

function selectEditingPage(page) {
  if (!page || page.id === state.activePageId) return;
  state.activePageId = page.id;
  state.selectedElementId = '';
  renderAll();
}

function renderPageCanvas(page, side) {
  const canvas = side === 'left' ? dom.leftPageCanvas : dom.rightPageCanvas;
  const slot = side === 'left' ? dom.leftPageSlot : dom.rightPageSlot;
  const selectButton = side === 'left' ? dom.leftPageSelectBtn : dom.rightPageSelectBtn;
  const purpose = side === 'left' ? dom.leftPagePurpose : dom.rightPagePurpose;
  const isActive = page?.id === state.activePageId;

  canvas.innerHTML = '';
  slot.classList.toggle('active', !!isActive);
  slot.classList.toggle('empty', !page);
  canvas.classList.toggle('inactive-canvas', !!page && !isActive);
  selectButton.disabled = !page;
  selectButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  purpose.textContent = page ? getReaderPurpose(page, side) : '페이지 없음';

  if (!page) {
    canvas.style.background = '#ffffff';
    canvas.onclick = null;
    selectButton.onclick = null;
    return;
  }

  canvas.style.background = safeColor(page.background, '#ffffff');
  selectButton.onclick = () => selectEditingPage(page);

  page.elements.filter((element) => !element.hidden).forEach((element) => {
    const object = document.createElement('div');
    object.className = `canvas-object ${element.type}-object${isActive && element.id === state.selectedElementId ? ' selected' : ''}${element.locked ? ' locked' : ''}${isActive ? '' : ' companion-object'}`;
    object.dataset.elementId = element.id;
    applyFrame(object, element.frame);

    if (element.type === 'text') {
      object.textContent = element.text || '';
      applyTextStyle(object, element.style);
    } else if (element.type === 'image') {
      const image = document.createElement('img');
      image.src = element.source || '';
      image.alt = element.alt || '';
      image.style.objectFit = element.fit || 'contain';
      object.appendChild(image);
    }

    if (isActive) {
      object.addEventListener('pointerdown', (event) => beginDrag(event, element, object));
      object.addEventListener('click', (event) => {
        event.stopPropagation();
        state.selectedElementId = element.id;
        renderCanvas();
        renderDetails();
      });
    }
    canvas.appendChild(object);
  });

  canvas.onclick = (event) => {
    if (!isActive) {
      selectEditingPage(page);
      return;
    }
    if (event.target !== canvas) return;
    state.selectedElementId = '';
    renderCanvas();
    renderDetails();
  };
}

function renderCanvas() {
  const opening = getEditingOpening();
  dom.spreadCanvas.dataset.openingKind = opening?.kind || 'empty';
  renderPageCanvas(opening?.leftPage || null, 'left');
  renderPageCanvas(opening?.rightPage || null, 'right');
  const activePage = getActivePage();
  if (activePage) dom.pageColorInput.value = safeColor(activePage.background, '#ffffff');
  dom.swapSpreadBtn.disabled = !opening
    || opening.kind !== 'content'
    || !opening.leftPage
    || !opening.rightPage;
}

function applyFrame(node, frame) {
  node.style.left = `${frame.x}%`;
  node.style.top = `${frame.y}%`;
  node.style.width = `${frame.width}%`;
  node.style.height = `${frame.height}%`;
  node.style.transform = `rotate(${frame.rotation || 0}deg)`;
}

function applyTextStyle(node, style = {}) {
  node.style.fontFamily = `'${style.fontFamily || 'Noto Sans KR'}', 'Malgun Gothic', sans-serif`;
  node.style.fontSize = `${clamp(style.fontSize || 18, 8, 96)}px`;
  node.style.fontWeight = style.fontWeight || '400';
  node.style.fontStyle = style.italic ? 'italic' : 'normal';
  node.style.textDecoration = style.underline ? 'underline' : 'none';
  node.style.color = safeColor(style.color);
  node.style.textAlign = ['left', 'center', 'right'].includes(style.align) ? style.align : 'left';
  node.style.lineHeight = clamp(style.lineHeight || 1.5, 0.8, 3);
  node.style.letterSpacing = `${Number(style.letterSpacing) || 0}px`;
}

function beginDrag(event, element, node) {
  event.preventDefault();
  event.stopPropagation();
  state.selectedElementId = element.id;
  renderDetails();
  node.classList.add('selected');
  if (element.locked) return;

  node.setPointerCapture(event.pointerId);
  const canvas = node.closest('.page-canvas');
  if (!canvas) return;
  const canvasRect = canvas.getBoundingClientRect();
  const start = { clientX: event.clientX, clientY: event.clientY, x: element.frame.x, y: element.frame.y };

  const move = (moveEvent) => {
    const x = start.x + ((moveEvent.clientX - start.clientX) / canvasRect.width) * 100;
    const y = start.y + ((moveEvent.clientY - start.clientY) / canvasRect.height) * 100;
    element.frame.x = clamp(x, 0, 100 - element.frame.width);
    element.frame.y = clamp(y, 0, 100 - element.frame.height);
    applyFrame(node, element.frame);
    syncFrameInputs(element);
  };

  const stop = () => {
    node.releasePointerCapture(event.pointerId);
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerup', stop);
    node.removeEventListener('pointercancel', stop);
    markChanged();
    renderReader();
  };

  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', stop);
  node.addEventListener('pointercancel', stop);
}

function renderDetails() {
  const element = getSelectedElement();
  const isText = element?.type === 'text';
  const isImage = element?.type === 'image';
  dom.nothingSelected.hidden = !!element;
  dom.elementDetails.hidden = !element;
  dom.textToolbar.hidden = !isText;
  if (!element) return;

  dom.textContentField.hidden = !isText;
  dom.imageAltField.hidden = !isImage;
  if (isText) dom.textContentInput.value = element.text || '';
  if (isImage) dom.imageAltInput.value = element.alt || '';
  syncFrameInputs(element);

  if (isText) {
    const style = element.style || {};
    dom.fontFamilyInput.value = style.fontFamily || 'Noto Sans KR';
    dom.fontSizeInput.value = String(style.fontSize || 18);
    setPressed(dom.boldBtn, style.fontWeight !== '400');
    setPressed(dom.italicBtn, !!style.italic);
    setPressed(dom.underlineBtn, !!style.underline);
    dom.fontColorInput.value = safeColor(style.color);
    dom.alignButtons.forEach((button) => setPressed(button, button.dataset.align === (style.align || 'left')));
  }
}

function syncFrameInputs(element) {
  if (!element) return;
  dom.elementXInput.value = String(Math.round(element.frame.x));
  dom.elementYInput.value = String(Math.round(element.frame.y));
  dom.elementWidthInput.value = String(Math.round(element.frame.width));
  dom.elementHeightInput.value = String(Math.round(element.frame.height));
}

function setPressed(button, pressed) {
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

function updateSelected(mutator, options = {}) {
  const element = getSelectedElement();
  if (!element) return;
  mutator(element);
  renderCanvas();
  if (options.details !== false) renderDetails();
  renderReader();
  markChanged();
}

function addElement(element) {
  const page = getActivePage();
  if (!page) return;
  page.elements.push(element);
  state.selectedElementId = element.id;
  renderAll();
  markChanged();
}

function moveSpreadToIndex(sourceIndex, destinationIndex) {
  const contentOpenings = getContentOpenings();
  const nextIndex = Math.max(0, Math.min(contentOpenings.length - 1, destinationIndex));
  if (sourceIndex < 0 || sourceIndex >= contentOpenings.length || sourceIndex === nextIndex) return;
  const [movedOpening] = contentOpenings.splice(sourceIndex, 1);
  contentOpenings.splice(nextIndex, 0, movedOpening);
  const frontCover = state.project.pages.find((page) => page.role === PAGE_ROLES.FRONT_COVER) || null;
  const backCover = state.project.pages.find((page) => page.role === PAGE_ROLES.BACK_COVER) || null;
  state.project.pages = [
    frontCover,
    ...contentOpenings.flatMap((opening) => [opening.leftPage, opening.rightPage]),
    backCover
  ].filter(Boolean);
  resetPageOrders(state.project.pages);
  state.activePageId = movedOpening.leftPage?.id || movedOpening.rightPage?.id || state.activePageId;
  state.selectedElementId = '';
  renderAll();
  markChanged();
  dom.pageActionHint.textContent = '펼침 순서를 바꿨어요. 위쪽 되돌리기로 원래 순서로 돌아갈 수 있어요.';
}

function clearSpreadDragIndicators() {
  dom.pageList.querySelectorAll('.spread-list-item').forEach((item) => {
    item.classList.remove('dragging', 'drag-pending', 'drop-before', 'drop-after');
  });
}

function startSpreadDrag(event, spreadIndex) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const handle = event.currentTarget;
  const item = handle.closest('.spread-list-item');
  if (!item) return;
  const controller = new AbortController();
  spreadDragState = {
    pointerId: event.pointerId,
    sourceIndex: spreadIndex,
    targetIndex: spreadIndex,
    placeAfter: false,
    startY: event.clientY,
    moved: false,
    handle,
    item,
    controller
  };
  item.classList.add('drag-pending');
  handle.setPointerCapture?.(event.pointerId);
  document.addEventListener('pointermove', updateSpreadDrag, { passive: false, signal: controller.signal });
  document.addEventListener('pointerup', finishSpreadDrag, { signal: controller.signal });
  document.addEventListener('pointercancel', cancelSpreadDrag, { signal: controller.signal });
  window.addEventListener('pointerup', finishSpreadDrag, { signal: controller.signal });
  window.addEventListener('pointercancel', cancelSpreadDrag, { signal: controller.signal });
  handle.addEventListener('lostpointercapture', finishSpreadDrag, { signal: controller.signal });
}

function updateSpreadDrag(event) {
  if (!spreadDragState || event.pointerId !== spreadDragState.pointerId) return;
  if (!spreadDragState.moved && Math.abs(event.clientY - spreadDragState.startY) < 6) return;
  event.preventDefault();
  spreadDragState.moved = true;
  spreadDragState.item.classList.remove('drag-pending');
  spreadDragState.item.classList.add('dragging');

  dom.pageList.querySelectorAll('.spread-list-item').forEach((item) => item.classList.remove('drop-before', 'drop-after'));
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.spread-list-item[data-spread-index]');
  if (target) {
    const rect = target.getBoundingClientRect();
    spreadDragState.targetIndex = Number(target.dataset.spreadIndex);
    spreadDragState.placeAfter = event.clientY > rect.top + rect.height / 2;
    target.classList.add(spreadDragState.placeAfter ? 'drop-after' : 'drop-before');
  }

  const listRect = dom.pageList.getBoundingClientRect();
  if (event.clientY < listRect.top + 36) dom.pageList.scrollTop -= 12;
  if (event.clientY > listRect.bottom - 36) dom.pageList.scrollTop += 12;
}

function releaseSpreadDrag(event) {
  if (!spreadDragState || event.pointerId !== spreadDragState.pointerId) return;
  const drag = spreadDragState;
  spreadDragState = null;
  drag.controller.abort();
  if (drag.handle.hasPointerCapture?.(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
  clearSpreadDragIndicators();
  return drag;
}

function finishSpreadDrag(event) {
  const drag = releaseSpreadDrag(event);
  if (!drag) return;
  if (!drag.moved) return;
  event.preventDefault();
  let destinationIndex = drag.targetIndex + (drag.placeAfter ? 1 : 0);
  if (drag.sourceIndex < destinationIndex) destinationIndex -= 1;
  moveSpreadToIndex(drag.sourceIndex, destinationIndex);
}

function cancelSpreadDrag(event) {
  releaseSpreadDrag(event);
}

function duplicateActiveSpread() {
  const opening = getEditingOpening();
  if (!opening || opening.kind !== 'content' || !opening.leftPage || !opening.rightPage) return;
  const copies = [opening.leftPage, opening.rightPage].map((page, index) => {
    const copy = clone(page);
    copy.id = makeId('page');
    copy.title = `${index === 0 ? '왼쪽' : '오른쪽'} ${getPageContentKind(page, index === 0 ? 'left' : 'right') === 'text' ? '글' : '그림'}`;
    copy.elements.forEach((element) => { element.id = makeId('element'); });
    return copy;
  });
  const rightIndex = state.project.pages.findIndex((page) => page.id === opening.rightPage.id);
  state.project.pages.splice(rightIndex + 1, 0, ...copies);
  resetPageOrders(state.project.pages);
  state.activePageId = copies[0].id;
  state.selectedElementId = '';
  renderAll();
  markChanged();
}

function requestDeleteActiveSpread() {
  const openings = getContentOpenings();
  const index = openings.findIndex((opening) => opening.pages.some((page) => page.id === state.activePageId));
  if (index < 0 || openings.length <= 1) return;
  const opening = openings[index];
  pendingDeleteSpreadIds = [opening.leftPage?.id, opening.rightPage?.id].filter(Boolean);
  pendingDeleteSpreadIndex = index;
  const pageNumbers = pendingDeleteSpreadIds.map((pageId) => state.project.pages.findIndex((page) => page.id === pageId) + 1);
  dom.deleteSpreadPages.textContent = `${pageNumbers.join('쪽과 ')}쪽`;
  if (!dom.deleteSpreadDialog.open) dom.deleteSpreadDialog.showModal();
  dom.cancelDeleteSpreadBtn.focus();
}

function closeDeleteSpreadDialog() {
  pendingDeleteSpreadIds = [];
  pendingDeleteSpreadIndex = -1;
  if (dom.deleteSpreadDialog.open) dom.deleteSpreadDialog.close();
}

function confirmDeleteActiveSpread() {
  if (pendingDeleteSpreadIds.length !== 2 || pendingDeleteSpreadIndex < 0) {
    closeDeleteSpreadDialog();
    return;
  }
  const index = pendingDeleteSpreadIndex;
  const deleteIds = new Set(pendingDeleteSpreadIds);
  closeDeleteSpreadDialog();
  state.project.pages = state.project.pages.filter((page) => !deleteIds.has(page.id));
  resetPageOrders(state.project.pages);
  const remaining = getContentOpenings();
  const nextOpening = remaining[Math.min(index, remaining.length - 1)];
  state.activePageId = nextOpening?.leftPage?.id || state.project.pages[0]?.id || '';
  state.selectedElementId = '';
  renderAll();
  markChanged();
}

function swapActiveSpread() {
  const opening = getEditingOpening();
  if (!opening || opening.kind !== 'content' || !opening.leftPage || !opening.rightPage) return;
  const pages = state.project.pages;
  const leftIndex = pages.findIndex((page) => page.id === opening.leftPage.id);
  const rightIndex = pages.findIndex((page) => page.id === opening.rightPage.id);
  if (leftIndex < 0 || rightIndex < 0) return;
  const leftKind = getPageContentKind(opening.leftPage, 'left');
  const rightKind = getPageContentKind(opening.rightPage, 'right');
  [pages[leftIndex], pages[rightIndex]] = [pages[rightIndex], pages[leftIndex]];
  pages[leftIndex].title = `왼쪽 ${rightKind === 'text' ? '글' : '그림'}`;
  pages[rightIndex].title = `오른쪽 ${leftKind === 'text' ? '글' : '그림'}`;
  resetPageOrders(pages);
  state.selectedElementId = '';
  renderAll();
  markChanged();
}

function getPageContentKind(page, side) {
  const title = String(page?.title || '');
  if (title.includes('글')) return 'text';
  if (title.includes('그림')) return 'image';
  if (bookType === BOOK_TYPES.COLORING_BOOK) return side === 'left' ? 'text' : 'image';
  return side === 'left' ? 'image' : 'text';
}

function getReaderPurpose(page, side) {
  if (!page) return '';
  if (page.role === PAGE_ROLES.FRONT_COVER) return '앞표지';
  if (page.role === PAGE_ROLES.BACK_COVER) return '뒤표지';
  return getPageContentKind(page, side) === 'text' ? '글 페이지' : '그림 페이지';
}

function createReaderPage(page, side, openingKind) {
  const pageNode = document.createElement('article');
  pageNode.className = `reading-page ${side}-page${page ? '' : ' blank-page'}`;
  pageNode.setAttribute('aria-label', page ? `${getReaderPurpose(page, side)}: ${page.title || '제목 없음'}` : '빈 페이지');

  if (!page) {
    pageNode.setAttribute('aria-hidden', 'true');
    return pageNode;
  }

  pageNode.style.background = safeColor(page.background, '#ffffff');
  page.elements.filter((element) => !element.hidden).forEach((element) => {
    const node = document.createElement('div');
    node.className = `reading-object ${element.type}`;
    applyFrame(node, element.frame);
    if (element.type === 'text') {
      node.textContent = element.text || '';
      applyTextStyle(node, { ...element.style, fontSize: Math.max(8, (element.style?.fontSize || 18) * 0.72) });
    } else if (element.type === 'image') {
      const image = document.createElement('img');
      image.src = element.source || '';
      image.alt = element.alt || '';
      image.style.objectFit = element.fit || 'contain';
      node.appendChild(image);
    }
    pageNode.appendChild(node);
  });

  const purpose = document.createElement('span');
  purpose.className = 'page-purpose';
  purpose.textContent = getReaderPurpose(page, side);
  pageNode.appendChild(purpose);

  if (openingKind === 'content') {
    const pageNumber = document.createElement('span');
    pageNumber.className = 'reader-page-number';
    pageNumber.textContent = String(page.order || 0);
    pageNode.appendChild(pageNumber);
  }
  return pageNode;
}

function getReaderOpenings() {
  return getFacingSpreads(state.project);
}

function syncReaderControls(allOpenings) {
  dom.openingCounter.textContent = allOpenings.length ? `${state.openingIndex + 1} / ${allOpenings.length}` : '0 / 0';
  dom.previousOpeningBtn.disabled = state.readerTurning || state.openingIndex <= 0;
  dom.nextOpeningBtn.disabled = state.readerTurning || state.openingIndex >= allOpenings.length - 1;
}

function renderReader() {
  const allOpenings = getReaderOpenings();
  state.openingIndex = clamp(state.openingIndex, 0, Math.max(0, allOpenings.length - 1));
  const opening = allOpenings[state.openingIndex];
  dom.readingPages.innerHTML = '';
  dom.readingPages.classList.remove('is-turning-next', 'is-turning-previous', 'is-arriving-next', 'is-arriving-previous');
  dom.readingLayoutHint.textContent = bookType === BOOK_TYPES.COLORING_BOOK
    ? '컬러링북은 왼쪽에 글, 오른쪽에 그림이 보이도록 펼쳐져요.'
    : '그림책은 왼쪽에 그림, 오른쪽에 글이 보이도록 펼쳐져요.';

  if (opening) {
    const book = document.createElement('div');
    book.className = `book-opening ${opening.kind}`;
    book.append(
      createReaderPage(opening.leftPage, 'left', opening.kind),
      createReaderPage(opening.rightPage, 'right', opening.kind)
    );
    const spine = document.createElement('div');
    spine.className = 'book-spine';
    spine.setAttribute('aria-hidden', 'true');
    book.appendChild(spine);
    dom.readingPages.appendChild(book);
  }

  if (!opening) {
    dom.readingPages.innerHTML = '<div class="reading-empty">아직 볼 수 있는 페이지가 없어요.</div>';
  }
  syncReaderControls(allOpenings);
}

function turnReader(delta) {
  if (state.readerTurning) return;
  const allOpenings = getReaderOpenings();
  const nextIndex = clamp(state.openingIndex + delta, 0, Math.max(0, allOpenings.length - 1));
  if (nextIndex === state.openingIndex) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    state.openingIndex = nextIndex;
    renderReader();
    return;
  }

  state.readerTurning = true;
  syncReaderControls(allOpenings);
  const direction = delta > 0 ? 'next' : 'previous';
  dom.readingPages.classList.add(`is-turning-${direction}`);

  window.setTimeout(() => {
    state.openingIndex = nextIndex;
    renderReader();
    dom.readingPages.classList.add(`is-arriving-${direction}`);
    window.setTimeout(() => {
      dom.readingPages.classList.remove(`is-arriving-${direction}`);
      state.readerTurning = false;
      syncReaderControls(getReaderOpenings());
    }, 360);
  }, 340);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readImageDimensions(source) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = source;
  });
}

dom.bookTitleInput.addEventListener('input', () => {
  state.project.title = dom.bookTitleInput.value;
  markChanged();
});

dom.createRevisionBtn.addEventListener('click', async () => {
  const kind = dom.revisionKindInput.value;
  let parentRevisionId = state.workingParentRevisionId;

  if (kind === 'teacher-edit' && !parentRevisionId) {
    const latestSubmission = state.revisionRows.find((revision) => revision.kind === 'submission');
    if (!latestSubmission) {
      dom.revisionStatus.textContent = '먼저 학생 제출본을 만들어야 선생님 수정본을 저장할 수 있어요.';
      return;
    }
    parentRevisionId = latestSubmission.id;
  }

  try {
    dom.createRevisionBtn.disabled = true;
    const revision = await saveBookRevision({
      projectId: state.project.id,
      parentRevisionId,
      kind,
      authorRole: getAuthorRoleForRevision(kind),
      label: getRevisionLabel(kind),
      document: state.project
    });
    state.workingParentRevisionId = revision.id;
    dom.revisionStatus.textContent = `${getRevisionLabel(kind)}을 새로 보관했어요. 이전 저장본은 바뀌지 않았어요.`;
    await renderRevisionList();
  } catch (error) {
    console.error(error);
    dom.revisionStatus.textContent = error.message || '새 저장본을 만들지 못했어요.';
  } finally {
    dom.createRevisionBtn.disabled = false;
  }
});

dom.addPageBtn.addEventListener('click', () => {
  const pages = createSpreadPages();
  state.project.pages.splice(state.project.pages.length - 1, 0, ...pages);
  resetPageOrders(state.project.pages);
  state.activePageId = pages[0].id;
  state.selectedElementId = '';
  renderAll();
  markChanged();
});

dom.swapSpreadBtn.addEventListener('click', swapActiveSpread);
dom.duplicatePageBtn.addEventListener('click', duplicateActiveSpread);
dom.deletePageBtn.addEventListener('click', requestDeleteActiveSpread);
dom.cancelDeleteSpreadBtn.addEventListener('click', closeDeleteSpreadDialog);
dom.confirmDeleteSpreadBtn.addEventListener('click', confirmDeleteActiveSpread);
dom.deleteSpreadDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDeleteSpreadDialog();
});
dom.deleteSpreadDialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  closeDeleteSpreadDialog();
});
dom.deleteSpreadDialog.addEventListener('click', (event) => {
  if (event.target === dom.deleteSpreadDialog) closeDeleteSpreadDialog();
});

dom.addTextBtn.addEventListener('click', () => addElement(createTextElement()));
dom.undoBtn.addEventListener('click', () => applyHistory('undo'));
dom.redoBtn.addEventListener('click', () => applyHistory('redo'));

dom.addImageInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const source = await fileToDataUrl(file);
    const dimensions = await readImageDimensions(source);
    const assetId = makeId('asset');
    state.project.assets.push({
      id: assetId,
      type: 'image',
      name: file.name,
      mimeType: file.type || '',
      originalAssetId: '',
      storagePath: '',
      source,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size || 0
    });
    addElement(createImageElement(source, file.name, assetId));
  } finally {
    event.target.value = '';
  }
});

dom.textContentInput.addEventListener('input', () => updateSelected((element) => {
  element.text = dom.textContentInput.value;
}, { details: false }));

dom.imageAltInput.addEventListener('input', () => updateSelected((element) => {
  element.alt = dom.imageAltInput.value;
}, { details: false }));

[
  [dom.elementXInput, 'x', 0, 95],
  [dom.elementYInput, 'y', 0, 95],
  [dom.elementWidthInput, 'width', 5, 100],
  [dom.elementHeightInput, 'height', 5, 100]
].forEach(([input, key, min, max]) => {
  input.addEventListener('input', () => updateSelected((element) => {
    element.frame[key] = clamp(input.value, min, max);
    if (key === 'x') element.frame.x = Math.min(element.frame.x, 100 - element.frame.width);
    if (key === 'y') element.frame.y = Math.min(element.frame.y, 100 - element.frame.height);
  }, { details: false }));
});

dom.deleteElementBtn.addEventListener('click', () => {
  const page = getActivePage();
  const element = getSelectedElement();
  if (!page || !element) return;
  if (!confirm('선택한 내용을 삭제할까요?')) return;
  page.elements = page.elements.filter((item) => item.id !== element.id);
  state.selectedElementId = '';
  renderAll();
  markChanged();
});

dom.pageColorInput.addEventListener('input', () => {
  const page = getActivePage();
  if (!page) return;
  page.background = safeColor(dom.pageColorInput.value, '#ffffff');
  renderCanvas();
  renderPageList();
  renderReader();
  markChanged();
});

[dom.printPaperSizeInput, dom.printPaperStandardInput, dom.printModeInput].forEach((input) => {
  input.addEventListener('change', () => {
    updateProjectPrintSetup();
    dom.b4StandardField.hidden = dom.printPaperSizeInput.value !== 'B4';
    const options = getPrintOptionsFromScreen();
    state.printProfile = findMatchingCalibrationProfile(options.paperSize, options.paperStandard)
      || createCalibrationProfile({ paperSize: options.paperSize, paperStandard: options.paperStandard });
    renderPrintSettings();
  });
});

dom.paperThicknessInput.addEventListener('change', () => {
  state.printProfile = getPrintProfileFromScreen();
  dom.printStatus.textContent = '종이 두께는 소책자의 안쪽 페이지 밀림 보정에 사용됩니다.';
});

dom.savePrintProfileBtn.addEventListener('click', () => {
  try {
    state.printProfile = saveCalibrationProfile(getPrintProfileFromScreen());
    state.project.printSetup.calibrationProfileId = state.printProfile.id;
    markChanged();
    dom.printStatus.textContent = '이 프린터 설정을 이 기기에 저장했어요.';
  } catch (error) {
    console.error(error);
    dom.printStatus.textContent = '프린터 설정을 저장하지 못했어요.';
  }
});

dom.resetPrintProfileBtn.addEventListener('click', () => {
  dom.frontOffsetXInput.value = '0';
  dom.frontOffsetYInput.value = '0';
  dom.backOffsetXInput.value = '0';
  dom.backOffsetYInput.value = '0';
  state.printProfile = getPrintProfileFromScreen();
  dom.printStatus.textContent = '앞면과 뒷면 보정값을 0으로 바꿨어요. 저장 버튼을 누르면 기억합니다.';
});

dom.calibrationPrintBtn.addEventListener('click', () => {
  const opened = openCalibrationPrint(getPrintOptionsFromScreen(), getPrintProfileFromScreen());
  if (!opened) alert('새 창이 차단되었어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.');
});

dom.openPrintPreviewBtn.addEventListener('click', () => {
  updateProjectPrintSetup();
  const opened = openBookPrintPreview(state.project, getPrintOptionsFromScreen(), getPrintProfileFromScreen());
  if (!opened) alert('새 창이 차단되었어요. 이 사이트의 팝업을 허용한 뒤 다시 눌러 주세요.');
});

dom.fontFamilyInput.addEventListener('change', () => updateSelected((element) => {
  element.style.fontFamily = dom.fontFamilyInput.value;
}));

function changeFontSize(deltaOrValue, absolute = false) {
  updateSelected((element) => {
    const current = Number(element.style.fontSize) || 18;
    element.style.fontSize = clamp(absolute ? deltaOrValue : current + deltaOrValue, 8, 96);
  });
}

dom.fontSizeInput.addEventListener('input', () => changeFontSize(dom.fontSizeInput.value, true));
dom.fontSizeDownBtn.addEventListener('click', () => changeFontSize(-1));
dom.fontSizeUpBtn.addEventListener('click', () => changeFontSize(1));

dom.boldBtn.addEventListener('click', () => updateSelected((element) => {
  element.style.fontWeight = element.style.fontWeight === '700' ? '400' : '700';
}));
dom.italicBtn.addEventListener('click', () => updateSelected((element) => {
  element.style.italic = !element.style.italic;
}));
dom.underlineBtn.addEventListener('click', () => updateSelected((element) => {
  element.style.underline = !element.style.underline;
}));
dom.fontColorInput.addEventListener('input', () => updateSelected((element) => {
  element.style.color = safeColor(dom.fontColorInput.value);
}));
dom.alignButtons.forEach((button) => button.addEventListener('click', () => updateSelected((element) => {
  element.style.align = button.dataset.align;
})));

function openReadingDialog() {
  readingDialogReturnFocus = dom.shell.shadowRoot?.querySelector('[data-view="preview"]') || document.activeElement;
  state.openingIndex = 0;
  renderReader();
  dom.readingView.hidden = false;
  document.body.classList.add('reading-dialog-open');
  dom.closeReadingDialogBtn.focus();
}

function closeReadingDialog() {
  if (dom.readingView.hidden) return;
  dom.readingView.hidden = true;
  document.body.classList.remove('reading-dialog-open');
  dom.shell.selectView?.('edit');
  const returnTarget = readingDialogReturnFocus instanceof HTMLElement ? readingDialogReturnFocus : null;
  readingDialogReturnFocus = null;
  returnTarget?.focus();
}

const readingPreviewLink = dom.shell.shadowRoot?.querySelector('[data-view="preview"]');
readingPreviewLink?.addEventListener('click', (event) => {
  event.preventDefault();
  openReadingDialog();
});
dom.closeReadingDialogBtn.addEventListener('click', closeReadingDialog);
dom.readingView.addEventListener('click', (event) => {
  if (event.target === dom.readingView) closeReadingDialog();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || dom.readingView.hidden) return;
  event.preventDefault();
  closeReadingDialog();
});

dom.previousOpeningBtn.addEventListener('click', () => {
  turnReader(-1);
});
dom.nextOpeningBtn.addEventListener('click', () => {
  turnReader(1);
});
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const target = event.target;
    if (
      target instanceof Element
      && target.closest('input, textarea, select, [contenteditable="true"]')
    ) return;
    if (!dom.readingPages.getClientRects().length) return;

    event.preventDefault();
    turnReader(event.key === 'ArrowLeft' ? -1 : 1);
  });

dom.downloadBookBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.project.title || '내-책'}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

dom.loadBookInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const loaded = ensureFacingPagePairs(normalizeBookProject(JSON.parse(await file.text())));
    state.project = loaded;
    state.activePageId = loaded.pages[0]?.id || '';
    state.selectedElementId = '';
    state.openingIndex = 0;
    resetHistory();
    renderAll();
    saveDraft();
  } catch (error) {
    alert(error.message || '책 파일을 불러오지 못했어요.');
  } finally {
    event.target.value = '';
  }
});

if (dom.shell) {
  dom.shell.setAttribute('book-kind', bookName);
  dom.shell.setAttribute('editor-title', `${bookName} 만들기`);
  dom.shell.setAttribute(
    'editor-description',
    bookType === BOOK_TYPES.COLORING_BOOK
      ? '그림과 글을 자유롭게 넣고, 한 페이지씩 확인하며 나만의 컬러링북을 만들 수 있어요.'
      : '그림과 글을 자유롭게 넣고, 양쪽 페이지와 완성된 책을 확인할 수 있어요.'
  );
}

renderAll();
saveDraft();
