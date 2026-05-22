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
    button.textContent = `펼침 ${index + 1}`;
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
    const coverImageInput = document.getElementById('coverImageInput');
    const coverPasteZone = document.getElementById('coverPasteZone');
    const removeCoverImageBtn = document.getElementById('removeCoverImageBtn');

    coverTitleInput.value = state.book.cover.title;
    coverSubtitleInput.value = state.book.cover.subtitle;

    coverTitleInput.addEventListener('input', () => {
      state.book.cover.title = coverTitleInput.value;
      renderPreview();
    });

    coverSubtitleInput.addEventListener('input', () => {
      state.book.cover.subtitle = coverSubtitleInput.value;
      renderPreview();
    });

    coverImageInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      state.book.cover.imageSrc = await fileToDataUrl(file);
      renderPreview();
      event.target.value = '';
    });

    coverPasteZone.addEventListener('paste', async (event) => {
      const pasted = await getImageFromPaste(event);
      if (!pasted) return;
      state.book.cover.imageSrc = pasted;
      renderPreview();
    });

    removeCoverImageBtn.addEventListener('click', () => {
      state.book.cover.imageSrc = '';
      renderPreview();
    });

    return;
  }

  const spread = getActiveSpread();
  if (!spread) return;

  dom.editorTitle.textContent = '펼침 편집';
  dom.editorHelp.textContent = '왼쪽에는 글, 오른쪽에는 이미지를 넣는 2페이지 구조입니다.';
  const node = dom.spreadEditorTemplate.content.cloneNode(true);
  dom.editorRoot.appendChild(node);

  const spreadTitleInput = document.getElementById('spreadTitleInput');
  const spreadBodyInput = document.getElementById('spreadBodyInput');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const fontWeightInput = document.getElementById('fontWeightInput');
  const spreadImageInput = document.getElementById('spreadImageInput');
  const spreadPasteZone = document.getElementById('spreadPasteZone');
  const removeSpreadImageBtn = document.getElementById('removeSpreadImageBtn');
  const imageScaleInput = document.getElementById('imageScaleInput');
  const imageXInput = document.getElementById('imageXInput');
  const imageYInput = document.getElementById('imageYInput');

  spreadTitleInput.value = spread.leftTitle;
  spreadBodyInput.value = spread.leftBody;
  fontSizeInput.value = spread.leftFontSize;
  fontWeightInput.value = spread.leftFontWeight;
  imageScaleInput.value = spread.rightImageScale;
  imageXInput.value = spread.rightImageX;
  imageYInput.value = spread.rightImageY;

  spreadTitleInput.addEventListener('input', () => {
    spread.leftTitle = spreadTitleInput.value;
    renderPreview();
    renderBookPreviewList();
  });

  spreadBodyInput.addEventListener('input', () => {
    spread.leftBody = spreadBodyInput.value;
    renderPreview();
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
    event.target.value = '';
  });

  spreadPasteZone.addEventListener('paste', async (event) => {
    const pasted = await getImageFromPaste(event);
    if (!pasted) return;
    spread.rightImage = pasted;
    renderPreview();
  });

  removeSpreadImageBtn.addEventListener('click', () => {
    spread.rightImage = '';
    renderPreview();
  });

  imageScaleInput.addEventListener('input', () => {
    spread.rightImageScale = toNumber(imageScaleInput.value, 1);
    renderPreview();
  });

  imageXInput.addEventListener('input', () => {
    spread.rightImageX = toNumber(imageXInput.value, 0);
    renderPreview();
  });

  imageYInput.addEventListener('input', () => {
    spread.rightImageY = toNumber(imageYInput.value, 0);
    renderPreview();
  });
}

function renderPreview() {
  dom.currentPreview.innerHTML = '';

  if (state.active.type === 'cover') {
    const wrap = document.createElement('div');
    wrap.className = 'preview-cover';
    wrap.innerHTML = `
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
  if (!spread) return;

  const wrap = document.createElement('div');
  wrap.className = 'preview-spread';
  wrap.innerHTML = `
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
  const items = [
    `표지: ${state.book.cover.title || '제목 없음'}`,
    ...state.book.spreads.map((spread, index) => `펼침 ${index + 1}: ${spread.leftTitle || '제목 없음'} / ${spread.rightImage ? '이미지 있음' : '이미지 없음'}`)
  ];

  items.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
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
