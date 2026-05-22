const BOOK_FORMAT_VERSION = 'kcs-book-v1';
const BOOK_DOWNLOAD_FILE_NAME = 'kcs-book-project.json';

const state = {
  mode: 'student',
  active: { type: 'cover', id: 'cover' },
  book: createInitialBook()
};

const dom = {
  studentModeBtn: document.getElementById('studentModeBtn'),
  teacherModeBtn: document.getElementById('teacherModeBtn'),
  modeBadge: document.getElementById('modeBadge'),
  addSpreadBtn: document.getElementById('addSpreadBtn'),
  saveJsonBtn: document.getElementById('saveJsonBtn'),
  jsonFileInput: document.getElementById('jsonFileInput'),
  printBookBtn: document.getElementById('printBookBtn'),
  bookTitleInput: document.getElementById('bookTitleInput'),
  paperSelect: document.getElementById('paperSelect'),
  coverNavBtn: document.getElementById('coverNavBtn'),
  spreadList: document.getElementById('spreadList'),
  editorTitle: document.getElementById('editorTitle'),
  editorHelp: document.getElementById('editorHelp'),
  editorRoot: document.getElementById('editorRoot'),
  currentPreview: document.getElementById('currentPreview'),
  bookPreviewList: document.getElementById('bookPreviewList'),
  teacherOnlySidebar: document.getElementById('teacherOnlySidebar'),
  coverEditorTemplate: document.getElementById('coverEditorTemplate'),
  spreadEditorTemplate: document.getElementById('spreadEditorTemplate')
};

function createInitialBook() {
  return {
    title: '새 책',
    paper: 'A4',
    cover: {
      title: '새 책 제목',
      subtitle: '여기에 부제를 적으세요.',
      imageSrc: ''
    },
    spreads: [createSpread(1)]
  };
}

function createSpread(index) {
  return {
    id: 'spread_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    leftTitle: index + '번째 펼침',
    leftBody: '여기에 본문 내용을 적거나 붙여넣으세요.',
    leftFontSize: 24,
    leftFontWeight: '400',
    rightImage: '',
    rightImageScale: 1,
    rightImageX: 0,
    rightImageY: 0
  };
}

function getActiveSpread() {
  if (state.active.type !== 'spread') return null;
  return state.book.spreads.find((item) => item.id === state.active.id) || null;
}

function getActiveSpreadIndex() {
  if (state.active.type !== 'spread') return -1;
  return state.book.spreads.findIndex((item) => item.id === state.active.id);
}

function setActiveSpreadByIndex(index) {
  const spread = state.book.spreads[index];
  if (!spread) return;
  state.active = { type: 'spread', id: spread.id };
  renderAll();
}

function setMode(mode) {
  state.mode = mode === 'teacher' ? 'teacher' : 'student';
  document.body.classList.toggle('teacher-mode', state.mode === 'teacher');
  document.body.classList.toggle('student-mode', state.mode === 'student');
  dom.studentModeBtn.classList.toggle('active', state.mode === 'student');
  dom.teacherModeBtn.classList.toggle('active', state.mode === 'teacher');
  dom.modeBadge.textContent = state.mode === 'student' ? '현재 모드: 학생' : '현재 모드: 선생님';
  dom.modeBadge.className = state.mode === 'student' ? 'badge student' : 'badge teacher';
  dom.teacherOnlySidebar.hidden = state.mode !== 'teacher';
}

function renderNavigation() {
  dom.coverNavBtn.classList.toggle('active', state.active.type === 'cover');
  dom.spreadList.innerHTML = '';

  state.book.spreads.forEach((spread, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-btn' + (state.active.id === spread.id ? ' active' : '');
    button.innerHTML = `
      <span class="nav-main">펼침 ${index + 1}</span>
      <span class="nav-sub">${escapeHtml(buildSpreadSummary(spread))}</span>
    `;
    button.addEventListener('click', () => {
      state.active = { type: 'spread', id: spread.id };
      renderAll();
    });
    dom.spreadList.appendChild(button);
  });
}

function renderEditor() {
  dom.editorRoot.innerHTML = '';

  if (state.active.type === 'cover') {
    dom.editorTitle.textContent = '표지 편집';
    dom.editorHelp.textContent = '표지 제목, 부제, 이미지를 넣습니다.';
    const node = dom.coverEditorTemplate.content.cloneNode(true);
    dom.editorRoot.appendChild(node);

    const coverTitleInput = document.getElementById('coverTitleInput');
    const coverSubtitleInput = document.getElementById('coverSubtitleInput');
    const coverSubtitleMeta = document.getElementById('coverSubtitleMeta');
    const coverImageInput = document.getElementById('coverImageInput');
    const coverImageMeta = document.getElementById('coverImageMeta');
    const coverPasteZone = document.getElementById('coverPasteZone');
    const removeCoverImageBtn = document.getElementById('removeCoverImageBtn');

    coverTitleInput.value = state.book.cover.title;
    coverSubtitleInput.value = state.book.cover.subtitle;

    const syncCoverMeta = () => {
      const subtitleStats = getTextStats(state.book.cover.subtitle);
      coverSubtitleMeta.textContent = `부제 ${subtitleStats.chars}자 · ${Math.max(subtitleStats.lines, state.book.cover.subtitle ? 1 : 0)}줄`;
      coverImageMeta.textContent = state.book.cover.imageSrc
        ? '표지 이미지가 들어가 있습니다. 새 파일을 넣으면 교체됩니다.'
        : '표지 이미지는 선택 사항입니다. 없으면 텍스트 중심 표지로 출력됩니다.';
      removeCoverImageBtn.disabled = !state.book.cover.imageSrc;
    };

    coverTitleInput.addEventListener('input', () => {
      state.book.cover.title = coverTitleInput.value;
      renderPreview();
      renderBookPreviewList();
      renderNavigation();
    });

    coverSubtitleInput.addEventListener('input', () => {
      state.book.cover.subtitle = coverSubtitleInput.value;
      renderPreview();
      syncCoverMeta();
    });

    coverImageInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      state.book.cover.imageSrc = await fileToDataUrl(file);
      renderPreview();
      syncCoverMeta();
      event.target.value = '';
    });

    coverPasteZone.addEventListener('paste', async (event) => {
      const pasted = await getImageFromPaste(event);
      if (!pasted) return;
      state.book.cover.imageSrc = pasted;
      renderPreview();
      syncCoverMeta();
    });

    removeCoverImageBtn.addEventListener('click', () => {
      state.book.cover.imageSrc = '';
      renderPreview();
      syncCoverMeta();
    });

    syncCoverMeta();
    return;
  }

  const spread = getActiveSpread();
  const spreadIndex = getActiveSpreadIndex();
  if (!spread || spreadIndex < 0) return;

  dom.editorTitle.textContent = `펼침 ${spreadIndex + 1} 편집`;
  dom.editorHelp.textContent = '왼쪽에는 글, 오른쪽에는 이미지를 넣는 2페이지 구조입니다.';
  const node = dom.spreadEditorTemplate.content.cloneNode(true);
  dom.editorRoot.appendChild(node);

  const prevSpreadBtn = document.getElementById('prevSpreadBtn');
  const nextSpreadBtn = document.getElementById('nextSpreadBtn');
  const moveSpreadUpBtn = document.getElementById('moveSpreadUpBtn');
  const moveSpreadDownBtn = document.getElementById('moveSpreadDownBtn');
  const duplicateSpreadBtn = document.getElementById('duplicateSpreadBtn');
  const deleteSpreadBtn = document.getElementById('deleteSpreadBtn');
  const spreadTitleInput = document.getElementById('spreadTitleInput');
  const spreadBodyInput = document.getElementById('spreadBodyInput');
  const spreadBodyMeta = document.getElementById('spreadBodyMeta');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const fontWeightInput = document.getElementById('fontWeightInput');
  const spreadImageInput = document.getElementById('spreadImageInput');
  const spreadPasteZone = document.getElementById('spreadPasteZone');
  const removeSpreadImageBtn = document.getElementById('removeSpreadImageBtn');
  const spreadImageMeta = document.getElementById('spreadImageMeta');
  const imageScaleInput = document.getElementById('imageScaleInput');
  const imageXInput = document.getElementById('imageXInput');
  const imageYInput = document.getElementById('imageYInput');
  const centerImageBtn = document.getElementById('centerImageBtn');
  const resetImageBtn = document.getElementById('resetImageBtn');

  spreadTitleInput.value = spread.leftTitle;
  spreadBodyInput.value = spread.leftBody;
  fontSizeInput.value = spread.leftFontSize;
  fontWeightInput.value = spread.leftFontWeight;
  imageScaleInput.value = spread.rightImageScale;
  imageXInput.value = spread.rightImageX;
  imageYInput.value = spread.rightImageY;

  const syncSpreadMeta = () => {
    const bodyStats = getTextStats(spread.leftBody);
    spreadBodyMeta.textContent = `본문 ${bodyStats.chars}자 · ${Math.max(bodyStats.lines, spread.leftBody ? 1 : 0)}줄`;
    spreadImageMeta.textContent = buildImageStatusText(spread.rightImage, spread.rightImageScale, spread.rightImageX, spread.rightImageY);
    prevSpreadBtn.disabled = spreadIndex <= 0;
    nextSpreadBtn.disabled = spreadIndex >= state.book.spreads.length - 1;
    moveSpreadUpBtn.disabled = spreadIndex <= 0;
    moveSpreadDownBtn.disabled = spreadIndex >= state.book.spreads.length - 1;
    removeSpreadImageBtn.disabled = !spread.rightImage;
    centerImageBtn.disabled = !spread.rightImage;
    resetImageBtn.disabled = !spread.rightImage;
    deleteSpreadBtn.disabled = state.book.spreads.length <= 1;
  };

  spreadTitleInput.addEventListener('input', () => {
    spread.leftTitle = spreadTitleInput.value;
    renderPreview();
    renderBookPreviewList();
    renderNavigation();
  });

  spreadBodyInput.addEventListener('input', () => {
    spread.leftBody = spreadBodyInput.value;
    renderPreview();
    renderBookPreviewList();
    renderNavigation();
    syncSpreadMeta();
  });

  fontSizeInput.addEventListener('input', () => {
    spread.leftFontSize = toNumber(fontSizeInput.value, 24);
    renderPreview();
  });

  fontWeightInput.addEventListener('change', () => {
    spread.leftFontWeight = fontWeightInput.value;
    renderPreview();
  });

  spreadImageInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    spread.rightImage = await fileToDataUrl(file);
    renderPreview();
    renderBookPreviewList();
    renderNavigation();
    syncSpreadMeta();
    event.target.value = '';
  });

  spreadPasteZone.addEventListener('paste', async (event) => {
    const pasted = await getImageFromPaste(event);
    if (!pasted) return;
    spread.rightImage = pasted;
    renderPreview();
    renderBookPreviewList();
    renderNavigation();
    syncSpreadMeta();
  });

  removeSpreadImageBtn.addEventListener('click', () => {
    spread.rightImage = '';
    renderPreview();
    renderBookPreviewList();
    renderNavigation();
    syncSpreadMeta();
  });

  imageScaleInput.addEventListener('input', () => {
    spread.rightImageScale = toNumber(imageScaleInput.value, 1);
    renderPreview();
    syncSpreadMeta();
  });

  imageXInput.addEventListener('input', () => {
    spread.rightImageX = toNumber(imageXInput.value, 0);
    renderPreview();
    syncSpreadMeta();
  });

  imageYInput.addEventListener('input', () => {
    spread.rightImageY = toNumber(imageYInput.value, 0);
    renderPreview();
    syncSpreadMeta();
  });

  centerImageBtn.addEventListener('click', () => {
    spread.rightImageX = 0;
    spread.rightImageY = 0;
    imageXInput.value = 0;
    imageYInput.value = 0;
    renderPreview();
    syncSpreadMeta();
  });

  resetImageBtn.addEventListener('click', () => {
    spread.rightImageScale = 1;
    spread.rightImageX = 0;
    spread.rightImageY = 0;
    imageScaleInput.value = 1;
    imageXInput.value = 0;
    imageYInput.value = 0;
    renderPreview();
    syncSpreadMeta();
  });

  prevSpreadBtn.addEventListener('click', () => setActiveSpreadByIndex(spreadIndex - 1));
  nextSpreadBtn.addEventListener('click', () => setActiveSpreadByIndex(spreadIndex + 1));
  moveSpreadUpBtn.addEventListener('click', () => moveActiveSpread(-1));
  moveSpreadDownBtn.addEventListener('click', () => moveActiveSpread(1));
  duplicateSpreadBtn.addEventListener('click', () => duplicateActiveSpread());
  deleteSpreadBtn.addEventListener('click', () => deleteActiveSpread());

  syncSpreadMeta();
}

function renderPreview() {
  dom.currentPreview.innerHTML = '';

  if (state.active.type === 'cover') {
    const wrap = document.createElement('div');
    wrap.className = 'preview-cover';
    wrap.innerHTML = `
      <div class="preview-caption">표지 · ${state.book.cover.imageSrc ? '이미지 있음' : '텍스트 중심 표지'}</div>
      <div class="preview-cover-page">
        <div class="preview-cover-image" style="background-image:url('${escapeAttr(state.book.cover.imageSrc)}')"></div>
        <div class="preview-cover-text">
          <h3>${escapeHtml(state.book.cover.title || '제목 없음')}</h3>
          <p>${escapeHtml(state.book.cover.subtitle || '')}</p>
        </div>
      </div>
    `;
    dom.currentPreview.appendChild(wrap);
    return;
  }

  const spread = getActiveSpread();
  const spreadIndex = getActiveSpreadIndex();
  if (!spread) return;

  const bodyStats = getTextStats(spread.leftBody);
  const wrap = document.createElement('div');
  wrap.className = 'preview-spread';
  wrap.innerHTML = `
    <div class="preview-caption">펼침 ${spreadIndex + 1} · 본문 ${bodyStats.chars}자 · ${spread.rightImage ? '이미지 있음' : '이미지 없음'}</div>
    <div class="preview-spread-pages">
      <div class="preview-page">
        <div class="preview-left-inner">
          <h3 style="font-size:${Number(spread.leftFontSize || 24)}px; font-weight:${escapeAttr(spread.leftFontWeight || '400')};">${escapeHtml(spread.leftTitle || '제목 없음')}</h3>
          <p style="font-size:${Math.max(16, Number(spread.leftFontSize || 24) - 4)}px; font-weight:${escapeAttr(spread.leftFontWeight || '400')};">${escapeHtml(spread.leftBody || '').replace(/\n/g, '<br />')}</p>
        </div>
      </div>
      <div class="preview-page">
        <div class="preview-image-stage">
          ${spread.rightImage ? `<img src="${escapeAttr(spread.rightImage)}" style="transform: translate(calc(-50% + ${Number(spread.rightImageX || 0)}px), calc(-50% + ${Number(spread.rightImageY || 0)}px)) scale(${Number(spread.rightImageScale || 1)});" alt="펼침 이미지" />` : `<div class="preview-empty">오른쪽 페이지 이미지가 아직 없습니다.<br />파일 넣기 또는 Ctrl+V 붙여넣기를 사용하세요.</div>`}
        </div>
      </div>
    </div>
  `;
  dom.currentPreview.appendChild(wrap);
}

function renderBookPreviewList() {
  dom.bookPreviewList.innerHTML = '';

  const coverItem = document.createElement('li');
  coverItem.className = 'book-preview-item';
  const coverButton = document.createElement('button');
  coverButton.type = 'button';
  coverButton.className = 'book-preview-btn' + (state.active.type === 'cover' ? ' active' : '');
  coverButton.innerHTML = `
    <span class="nav-main">표지</span>
    <span class="nav-sub">${escapeHtml(state.book.cover.title || '제목 없음')}</span>
  `;
  coverButton.addEventListener('click', () => {
    state.active = { type: 'cover', id: 'cover' };
    renderAll();
  });
  coverItem.appendChild(coverButton);
  dom.bookPreviewList.appendChild(coverItem);

  state.book.spreads.forEach((spread, index) => {
    const li = document.createElement('li');
    li.className = 'book-preview-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'book-preview-btn' + (state.active.id === spread.id ? ' active' : '');
    button.innerHTML = `
      <span class="nav-main">펼침 ${index + 1}</span>
      <span class="nav-sub">${escapeHtml(buildSpreadSummary(spread))}</span>
    `;
    button.addEventListener('click', () => {
      state.active = { type: 'spread', id: spread.id };
      renderAll();
    });

    li.appendChild(button);
    dom.bookPreviewList.appendChild(li);
  });
}

function renderTopFields() {
  dom.bookTitleInput.value = state.book.title;
  dom.paperSelect.value = state.book.paper;
}

function renderAll() {
  renderTopFields();
  renderNavigation();
  renderEditor();
  renderPreview();
  renderBookPreviewList();
}

function bindTopEvents() {
  dom.studentModeBtn.addEventListener('click', () => {
    setMode('student');
  });

  dom.teacherModeBtn.addEventListener('click', () => {
    setMode('teacher');
  });

  dom.coverNavBtn.addEventListener('click', () => {
    state.active = { type: 'cover', id: 'cover' };
    renderAll();
  });

  dom.bookTitleInput.addEventListener('input', () => {
    state.book.title = dom.bookTitleInput.value;
  });

  dom.paperSelect.addEventListener('change', () => {
    state.book.paper = dom.paperSelect.value === 'B4' ? 'B4' : 'A4';
  });

  dom.addSpreadBtn.addEventListener('click', () => {
    const spread = createSpread(state.book.spreads.length + 1);
    state.book.spreads.push(spread);
    state.active = { type: 'spread', id: spread.id };
    renderAll();
  });

  dom.saveJsonBtn.addEventListener('click', () => {
    downloadJson();
  });

  dom.jsonFileInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      state.book = normalizeBook(data);
      state.active = { type: 'cover', id: 'cover' };
      renderAll();
      alert('현재 KCS JSON 형식 파일을 정상적으로 불러왔습니다.');
    } catch (error) {
      console.error(error);
      alert(error && error.message ? error.message : 'JSON 불러오기에 실패했습니다. 현재 KCS 형식 파일인지 확인해 주세요.');
    } finally {
      event.target.value = '';
    }
  });

  dom.printBookBtn.addEventListener('click', () => {
    openPrintWindow();
  });

  bindGlobalShortcuts();
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePaper(value) {
  return String(value || 'A4').toUpperCase() === 'B4' ? 'B4' : 'A4';
}

function normalizeString(value, fallback = '') {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeCover(cover) {
  const safeCover = isPlainObject(cover) ? cover : {};
  return {
    title: normalizeString(safeCover.title, '제목 없음'),
    subtitle: normalizeString(safeCover.subtitle, ''),
    imageSrc: typeof safeCover.imageSrc === 'string' ? safeCover.imageSrc : ''
  };
}

function normalizeSpread(item, index) {
  const safeItem = isPlainObject(item) ? item : {};
  return {
    id: normalizeString(safeItem.id, 'spread_' + (index + 1)),
    leftTitle: normalizeString(safeItem.leftTitle, `${index + 1}번째 펼침`),
    leftBody: normalizeString(safeItem.leftBody, ''),
    leftFontSize: toNumber(safeItem.leftFontSize, 24),
    leftFontWeight: normalizeString(safeItem.leftFontWeight, '400'),
    rightImage: typeof safeItem.rightImage === 'string' ? safeItem.rightImage : '',
    rightImageScale: toNumber(safeItem.rightImageScale, 1),
    rightImageX: toNumber(safeItem.rightImageX, 0),
    rightImageY: toNumber(safeItem.rightImageY, 0)
  };
}

function validateCurrentBookFormat(raw) {
  if (!isPlainObject(raw)) {
    throw new Error('JSON 루트는 객체여야 합니다.');
  }

  if (raw.formatVersion && raw.formatVersion !== BOOK_FORMAT_VERSION) {
    throw new Error(`이 JSON은 현재 편집기 형식(${BOOK_FORMAT_VERSION})이 아닙니다.`);
  }

  if (!isPlainObject(raw.cover)) {
    throw new Error('현재 KCS JSON에는 cover 객체가 필요합니다.');
  }

  if (!Array.isArray(raw.spreads)) {
    throw new Error('현재 KCS JSON에는 spreads 배열이 필요합니다.');
  }

  if (!raw.spreads.length) {
    throw new Error('현재 KCS JSON에는 최소 1개 이상의 spread가 필요합니다.');
  }
}

function createExportPayload(book) {
  return {
    formatVersion: BOOK_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    title: normalizeString(book.title, '새 책'),
    paper: normalizePaper(book.paper),
    cover: normalizeCover(book.cover),
    spreads: Array.isArray(book.spreads) && book.spreads.length
      ? book.spreads.map((item, index) => normalizeSpread(item, index))
      : [createSpread(1)]
  };
}

function normalizeBook(raw) {
  validateCurrentBookFormat(raw);

  return {
    title: normalizeString(raw.title, '불러온 책'),
    paper: normalizePaper(raw.paper),
    cover: normalizeCover(raw.cover),
    spreads: raw.spreads.map((item, index) => normalizeSpread(item, index))
  };
}

function downloadJson() {
  const payload = createExportPayload(state.book);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BOOK_DOWNLOAD_FILE_NAME;
  a.click();
  URL.revokeObjectURL(url);
  alert(`현재 형식(${BOOK_FORMAT_VERSION})으로 JSON이 저장되었습니다.`);
}

function buildLogicalPages() {
  const pages = [];

  pages.push({
    pageNo: 1,
    kind: 'cover',
    title: state.book.cover.title,
    subtitle: state.book.cover.subtitle,
    imageSrc: state.book.cover.imageSrc
  });

  state.book.spreads.forEach((spread) => {
    pages.push({
      pageNo: pages.length + 1,
      kind: 'text',
      title: spread.leftTitle,
      body: spread.leftBody,
      fontSize: spread.leftFontSize,
      fontWeight: spread.leftFontWeight
    });

    pages.push({
      pageNo: pages.length + 1,
      kind: 'image',
      imageSrc: spread.rightImage,
      scale: spread.rightImageScale,
      x: spread.rightImageX,
      y: spread.rightImageY,
      title: spread.leftTitle + ' 이미지'
    });
  });

  pages.push({
    pageNo: pages.length + 1,
    kind: 'blank',
    title: '뒷표지'
  });

  while (pages.length % 4 !== 0) {
    pages.push({
      pageNo: pages.length + 1,
      kind: 'blank',
      title: '빈 페이지'
    });
  }

  return pages;
}

function buildBookletSheets(pages) {
  let left = 0;
  let right = pages.length - 1;
  const sheets = [];

  while (left < right) {
    sheets.push({
      front: [pages[right], pages[left]],
      back: [pages[left + 1], pages[right - 1]]
    });
    left += 2;
    right -= 2;
  }

  return sheets;
}

function openPrintWindow() {
  const logicalPages = buildLogicalPages();
  const sheets = buildBookletSheets(logicalPages);
  const paper = state.book.paper === 'B4' ? 'B4' : 'A4';
  const pageSizeCss = `${paper} landscape`;

  const html = `<!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>책 인쇄 배열</title>
    <style>
      @page { size: ${pageSizeCss}; margin: 10mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #eef2f7; color: #111827; font-family: Arial, sans-serif; }
      body { padding: 24px; }
      h1 { margin: 0 0 10px; font-size: 28px; }
      .screen-toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        padding: 14px 16px;
        margin-bottom: 20px;
        background: rgba(255,255,255,0.95);
        border: 1px solid #dbe5f0;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(8px);
      }
      .screen-toolbar button {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #111827;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
      }
      .screen-toolbar .primary {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }
      .print-note {
        line-height: 1.7;
        color: #475569;
        margin-left: auto;
      }
      .sheet-stack {
        display: grid;
        gap: 28px;
      }
      .sheet-card {
        background: #fff;
        border: 1px solid #dbe5f0;
        border-radius: 22px;
        padding: 20px;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        break-after: page;
        page-break-after: always;
      }
      .sheet-card:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      .sheet-title {
        margin: 0 0 14px;
        font-size: 22px;
      }
      .sheet-face {
        width: 100%;
        aspect-ratio: 1.414 / 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 14px;
      }
      .sheet-face:last-child {
        margin-bottom: 0;
      }
      .sheet-slot {
        min-width: 0;
        min-height: 0;
      }
      .print-page {
        height: 100%;
        border: 1px solid #cbd5e1;
        background: #fff;
        padding: 16px;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .print-page img {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: calc(100% - 24px);
        max-height: calc(100% - 48px);
        transform-origin: center center;
      }
      .slot-label {
        font-size: 12px;
        color: #475569;
        margin-bottom: 10px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }
      .page-meta {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 8px;
        font-weight: 700;
      }
      .print-page h3 {
        margin: 0 0 10px;
        font-size: 22px;
        line-height: 1.3;
      }
      .print-page p {
        margin: 0;
        line-height: 1.7;
        white-space: pre-wrap;
      }
      .empty {
        color: #64748b;
        display: grid;
        place-items: center;
        text-align: center;
        height: 100%;
      }
      .cover-page {
        justify-content: flex-start;
      }
      .cover-image-box {
        margin-top: 10px;
        flex: 1;
        position: relative;
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        background: #f8fafc;
        overflow: hidden;
      }
      .image-page .image-stage {
        flex: 1;
        position: relative;
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        background: #f8fafc;
        overflow: hidden;
      }
      .blank-page {
        align-items: center;
        justify-content: center;
      }
      @media print {
        html, body { background: #fff; }
        body { padding: 0; }
        .screen-toolbar { display: none !important; }
        .sheet-card {
          box-shadow: none;
          border: 0;
          border-radius: 0;
          padding: 0;
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="screen-toolbar">
      <button class="primary" onclick="window.print()">인쇄하기</button>
      <button onclick="window.close()">닫기</button>
      <div class="print-note">이 화면은 스크롤 문서형 초안 대신 시트 카드형 미리보기입니다. 화면에서 확인 후 인쇄 버튼을 누르세요.</div>
    </div>
    <h1>${escapeHtml(state.book.title || '책 인쇄 배열')}</h1>
    <div class="sheet-stack">
      ${sheets.map((sheet, index) => `
        <section class="sheet-card">
          <h2 class="sheet-title">인쇄 시트 ${index + 1}</h2>
          ${renderPrintFace(sheet.front, '앞면')}
          ${renderPrintFace(sheet.back, '뒷면')}
        </section>
      `).join('')}
    </div>
  </body>
  </html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function renderPrintFace(facePages, faceLabel) {
  return `
    <div class="sheet-face">
      ${facePages.map((page, pageIndex) => {
        const slotLabel = `${faceLabel} ${pageIndex === 0 ? '왼쪽' : '오른쪽'}`;
        return `<div class="sheet-slot">${renderPrintPage(page, slotLabel)}</div>`;
      }).join('')}
    </div>
  `;
}

function renderPrintPage(page, slotLabel) {
  if (!page) {
    return `
      <div class="print-page blank-page">
        <div class="slot-label">${slotLabel}</div>
        <div class="empty">페이지 없음</div>
      </div>
    `;
  }

  const pageMeta = page.pageNo ? `책 페이지 ${page.pageNo}` : '보조 페이지';

  if (page.kind === 'cover') {
    return `
      <div class="print-page cover-page">
        <div class="slot-label">${slotLabel}</div>
        <div class="page-meta">${pageMeta} · 표지</div>
        <h3>${escapeHtml(page.title || '표지')}</h3>
        <p>${escapeHtml(page.subtitle || '')}</p>
        <div class="cover-image-box">
          ${page.imageSrc ? `<img src="${escapeAttr(page.imageSrc)}" style="transform: translate(-50%, -50%) scale(1);" alt="표지 이미지" />` : `<div class="empty">표지 이미지 없음</div>`}
        </div>
      </div>
    `;
  }

  if (page.kind === 'text') {
    return `
      <div class="print-page">
        <div class="slot-label">${slotLabel}</div>
        <div class="page-meta">${pageMeta} · 텍스트 페이지</div>
        <h3 style="font-size:${Number(page.fontSize || 24)}px; font-weight:${escapeAttr(page.fontWeight || '400')};">${escapeHtml(page.title || '')}</h3>
        <p style="font-size:${Math.max(16, Number(page.fontSize || 24) - 4)}px; font-weight:${escapeAttr(page.fontWeight || '400')};">${escapeHtml(page.body || '')}</p>
      </div>
    `;
  }

  if (page.kind === 'image') {
    return `
      <div class="print-page image-page">
        <div class="slot-label">${slotLabel}</div>
        <div class="page-meta">${pageMeta} · 이미지 페이지</div>
        <div class="image-stage">
          ${page.imageSrc ? `<img src="${escapeAttr(page.imageSrc)}" style="transform: translate(calc(-50% + ${Number(page.x || 0)}px), calc(-50% + ${Number(page.y || 0)}px)) scale(${Number(page.scale || 1)});" alt="이미지 페이지" />` : `<div class="empty">이미지 없음</div>`}
        </div>
      </div>
    `;
  }

  return `
    <div class="print-page blank-page">
      <div class="slot-label">${slotLabel}</div>
      <div class="page-meta">${pageMeta}</div>
      <div class="empty">${escapeHtml(page.title || '빈 페이지')}</div>
    </div>
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

async function getImageFromPaste(event) {
  const items = Array.from((event.clipboardData || {}).items || []);
  const imageItem = items.find((item) => item.type && item.type.startsWith('image/'));
  if (!imageItem) {
    alert('클립보드에 이미지가 없습니다. 그림을 복사한 뒤 다시 Ctrl+V 하세요.');
    return '';
  }
  event.preventDefault();
  const file = imageItem.getAsFile();
  if (!file) return '';
  return await fileToDataUrl(file);
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getTextStats(text) {
  const safeText = normalizeString(text, '');
  const chars = safeText.length;
  const lines = safeText ? safeText.split(/\n/).length : 0;
  return { chars, lines };
}

function buildSpreadSummary(spread) {
  const title = normalizeString(spread.leftTitle, '제목 없음').trim() || '제목 없음';
  const bodyStats = getTextStats(spread.leftBody);
  const imageLabel = spread.rightImage ? '이미지 있음' : '이미지 없음';
  return `${title} · 본문 ${bodyStats.chars}자 · ${imageLabel}`;
}

function buildImageStatusText(imageSrc, scale, x, y) {
  if (!imageSrc) {
    return '이미지가 아직 없습니다. 파일 넣기 또는 Ctrl+V 붙여넣기를 사용하세요.';
  }
  return `이미지 준비됨 · 배율 ${Number(scale || 1).toFixed(1)} · X ${Number(x || 0)} · Y ${Number(y || 0)}`;
}

function moveActiveSpread(delta) {
  const currentIndex = getActiveSpreadIndex();
  const nextIndex = currentIndex + delta;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.book.spreads.length) return;

  const [item] = state.book.spreads.splice(currentIndex, 1);
  state.book.spreads.splice(nextIndex, 0, item);
  state.active = { type: 'spread', id: item.id };
  renderAll();
}

function duplicateActiveSpread() {
  const spread = getActiveSpread();
  const currentIndex = getActiveSpreadIndex();
  if (!spread || currentIndex < 0) return;

  const clone = {
    ...normalizeSpread(spread, currentIndex),
    id: 'spread_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    leftTitle: normalizeString(spread.leftTitle, `펼침 ${currentIndex + 1}`) + ' 복사본'
  };

  state.book.spreads.splice(currentIndex + 1, 0, clone);
  state.active = { type: 'spread', id: clone.id };
  renderAll();
}

function deleteActiveSpread() {
  const currentIndex = getActiveSpreadIndex();
  if (currentIndex < 0) return;
  if (state.book.spreads.length <= 1) {
    alert('최소 1개의 펼침은 남아 있어야 합니다.');
    return;
  }

  state.book.spreads.splice(currentIndex, 1);
  const fallbackIndex = Math.max(0, currentIndex - 1);
  state.active = { type: 'spread', id: state.book.spreads[fallbackIndex].id };
  renderAll();
}

function bindGlobalShortcuts() {
  document.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();

    if ((event.ctrlKey || event.metaKey) && key === 's') {
      event.preventDefault();
      downloadJson();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'n') {
      event.preventDefault();
      const spread = createSpread(state.book.spreads.length + 1);
      state.book.spreads.push(spread);
      state.active = { type: 'spread', id: spread.id };
      renderAll();
    }
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('\n', ' ');
}

function init() {
  setMode('student');
  bindTopEvents();
  renderAll();
}

init();
