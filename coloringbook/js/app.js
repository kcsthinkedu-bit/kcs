const BOOK_FORMAT_VERSION = 'kcs-book-v1';
const BOOK_DOWNLOAD_FILE_NAME = 'kcs-book-project.json';
const SUBMISSION_ENDPOINT = '/api/submissions/upload';
const REVIEW_SAVE_ENDPOINT = '/api/submissions/review-save';

const state = {
  mode: 'student',
  active: { type: 'cover', id: 'cover' },
  book: createInitialBook(),
  loadedFromUrl: ''
};
const TEACHER_PASSWORD_STORAGE_KEY = 'kcs-teacher-password';

function getStoredTeacherPassword() {
  try {
    return sessionStorage.getItem(TEACHER_PASSWORD_STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

function setStoredTeacherPassword(password) {
  try {
    if (password) {
      sessionStorage.setItem(TEACHER_PASSWORD_STORAGE_KEY, password);
    } else {
      sessionStorage.removeItem(TEACHER_PASSWORD_STORAGE_KEY);
    }
  } catch (error) {
    console.error(error);
  }
}

async function verifyTeacherPassword(password) {
  if (!password) return false;

  try {
    const response = await fetch('/api/submissions/list', {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-teacher-password': password
      }
    });
    return response.ok;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function ensureTeacherAccess(forcePrompt = false) {
  let password = forcePrompt ? '' : getStoredTeacherPassword();

  if (!password) {
    password = window.prompt('선생님 비밀번호를 입력하세요.');
    password = String(password || '').trim();
  }

  if (!password) return false;

  const ok = await verifyTeacherPassword(password);
  if (!ok) {
    setStoredTeacherPassword('');
    alert('선생님 비밀번호가 맞지 않습니다.');
    return false;
  }

  setStoredTeacherPassword(password);
  return true;
}

function buildTeacherAuthHeaders(extraHeaders = {}) {
  const password = getStoredTeacherPassword();
  if (!password) return { ...extraHeaders };
  return {
    ...extraHeaders,
    'x-teacher-password': password
  };
}


const dom = {
  studentModeBtn: document.getElementById('studentModeBtn'),
  teacherModeBtn: document.getElementById('teacherModeBtn'),
  modeBadge: document.getElementById('modeBadge'),
  addSpreadBtn: document.getElementById('addSpreadBtn'),
  saveJsonBtn: document.getElementById('saveJsonBtn'),
  saveReviewBtn: document.getElementById('saveReviewBtn'),
  jsonFileInput: document.getElementById('jsonFileInput'),
  printBookBtn: document.getElementById('printBookBtn'),
  submitWorkBtn: document.getElementById('submitWorkBtn'),
  submitModal: document.getElementById('submitModal'),
  closeSubmitModalBtn: document.getElementById('closeSubmitModalBtn'),
  cancelSubmitBtn: document.getElementById('cancelSubmitBtn'),
  confirmSubmitBtn: document.getElementById('confirmSubmitBtn'),
  submitSchoolInput: document.getElementById('submitSchoolInput'),
  submitClassInput: document.getElementById('submitClassInput'),
  submitStudentNameInput: document.getElementById('submitStudentNameInput'),
  submitStudentNumberInput: document.getElementById('submitStudentNumberInput'),
  submitCodeInput: document.getElementById('submitCodeInput'),
  submitStatusBox: document.getElementById('submitStatusBox'),
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
  teacherSummaryCards: document.getElementById('teacherSummaryCards'),
  teacherReadinessBox: document.getElementById('teacherReadinessBox'),
  teacherIssueList: document.getElementById('teacherIssueList'),
  jumpFirstIssueBtn: document.getElementById('jumpFirstIssueBtn'),
  centerAllImagesBtn: document.getElementById('centerAllImagesBtn'),
  resetAllImagesBtn: document.getElementById('resetAllImagesBtn'),
  setAllTextNormalBtn: document.getElementById('setAllTextNormalBtn'),
  setAllTextLargeBtn: document.getElementById('setAllTextLargeBtn'),
  teacherPreviewReport: document.getElementById('teacherPreviewReport'),
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
  dom.teacherPreviewReport.hidden = state.mode !== 'teacher';
  renderTeacherPanels();
  updateReviewSaveButton();
}
function updateReviewSaveButton() {
  if (!dom.saveReviewBtn) return;
  const canShow = state.mode === 'teacher' && !!state.loadedFromUrl;
  dom.saveReviewBtn.hidden = !canShow;
}

function buildReviewSubmissionInfo() {
  const source = state.book && state.book.submission ? state.book.submission : {};
  return {
    schoolName: normalizeString(source.schoolName, '').trim(),
    className: normalizeString(source.className, '').trim(),
    studentName: normalizeString(source.studentName, '').trim(),
    studentNumber: normalizeString(source.studentNumber, '').trim(),
    bookTitle: normalizeString(state.book.title || source.bookTitle, '').trim(),
    paper: normalizePaper(state.book.paper || source.paper),
    submittedAt: source.submittedAt || ''
  };
}

async function saveTeacherReview() {
  if (state.mode !== 'teacher') {
    alert('선생님 모드에서만 수정본을 저장할 수 있습니다.');
    return;
  }

  if (!state.loadedFromUrl) {
    alert('학생 제출본을 먼저 불러온 뒤 저장해 주세요.');
    return;
  }

  const submission = buildReviewSubmissionInfo();

  if (!submission.className || !submission.studentName) {
    alert('이 제출본의 학생 정보가 부족하여 저장할 수 없습니다.');
    return;
  }

  if (dom.saveReviewBtn) {
    dom.saveReviewBtn.disabled = true;
  }

  try {
    const payload = {
      sourceUrl: state.loadedFromUrl,
      submission,
      book: {
        ...createExportPayload(state.book),
        submission
      }
    };

    const response = await fetch(REVIEW_SAVE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result = {};
    try {
      result = JSON.parse(text);
    } catch (error) {
      result = { error: text };
    }

    if (!response.ok) {
      throw new Error(result && result.error ? result.error : '선생님 수정본 저장에 실패했습니다.');
    }

    alert('선생님 수정본이 저장되었습니다.\n\n새 탭에서 저장된 수정본을 엽니다.');
    window.open(result.editUrl || result.url, '_blank', 'noopener');
  } catch (error) {
    console.error(error);
    alert(error && error.message ? error.message : '선생님 수정본 저장에 실패했습니다.');
  } finally {
    if (dom.saveReviewBtn) {
      dom.saveReviewBtn.disabled = false;
    }
  }
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

    bindImeSafeTextField(
  coverTitleInput,
  () => {
    state.book.cover.title = coverTitleInput.value;
  },
  () => {
    refreshViewsForTyping();
  }
);


    bindImeSafeTextField(
  coverSubtitleInput,
  () => {
    state.book.cover.subtitle = coverSubtitleInput.value;
  },
  () => {
    renderPreview();
    renderTeacherPanels();
    syncCoverMeta();
  }
);


    coverImageInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      state.book.cover.imageSrc = await fileToDataUrl(file);
      renderAll();
      event.target.value = '';
    });

    coverPasteZone.addEventListener('paste', async (event) => {
      const pasted = await getImageFromPaste(event);
      if (!pasted) return;
      state.book.cover.imageSrc = pasted;
      renderAll();
    });

    removeCoverImageBtn.addEventListener('click', () => {
      state.book.cover.imageSrc = '';
      renderAll();
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

 bindImeSafeTextField(
  spreadTitleInput,
  () => {
    spread.leftTitle = spreadTitleInput.value;
  },
  () => {
    refreshViewsForTyping();
  }
);


  bindImeSafeTextField(
  spreadBodyInput,
  () => {
    spread.leftBody = spreadBodyInput.value;
  },
  () => {
    renderPreview();
    renderNavigation();
    renderBookPreviewList();
    renderTeacherPanels();
    syncSpreadMeta();
  }
);


  fontSizeInput.addEventListener('input', () => {
    spread.leftFontSize = toNumber(fontSizeInput.value, 24);
    renderPreview();
    renderTeacherPanels();
    syncSpreadMeta();
  });

  fontWeightInput.addEventListener('change', () => {
    spread.leftFontWeight = fontWeightInput.value;
    renderPreview();
  });

  spreadImageInput.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    spread.rightImage = await fileToDataUrl(file);
    renderAll();
    event.target.value = '';
  });

  spreadPasteZone.addEventListener('paste', async (event) => {
    const pasted = await getImageFromPaste(event);
    if (!pasted) return;
    spread.rightImage = pasted;
    renderAll();
  });

  removeSpreadImageBtn.addEventListener('click', () => {
    spread.rightImage = '';
    renderAll();
  });

  imageScaleInput.addEventListener('input', () => {
    spread.rightImageScale = toNumber(imageScaleInput.value, 1);
    renderPreview();
    renderTeacherPanels();
    syncSpreadMeta();
  });

  imageXInput.addEventListener('input', () => {
    spread.rightImageX = toNumber(imageXInput.value, 0);
    renderPreview();
    renderTeacherPanels();
    syncSpreadMeta();
  });

  imageYInput.addEventListener('input', () => {
    spread.rightImageY = toNumber(imageYInput.value, 0);
    renderPreview();
    renderTeacherPanels();
    syncSpreadMeta();
  });

  centerImageBtn.addEventListener('click', () => {
    spread.rightImageX = 0;
    spread.rightImageY = 0;
    imageXInput.value = 0;
    imageYInput.value = 0;
    renderPreview();
    renderTeacherPanels();
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
    renderTeacherPanels();
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

function renderTeacherPanels() {
  if (!dom.teacherSummaryCards || !dom.teacherIssueList || !dom.teacherReadinessBox || !dom.teacherPreviewReport) return;

  const report = buildTeacherReport();

  dom.teacherSummaryCards.innerHTML = `
    <div class="teacher-stat-card">
      <div class="teacher-card-title">전체 펼침</div>
      <div class="teacher-card-value">${report.totalSpreads}</div>
      <div class="teacher-card-sub">표지를 제외한 내부 펼침 수</div>
    </div>
    <div class="teacher-stat-card">
      <div class="teacher-card-title">이미지 준비</div>
      <div class="teacher-card-value">${report.imageReadyCount}</div>
      <div class="teacher-card-sub">이미지가 들어간 펼침 수</div>
    </div>
    <div class="teacher-stat-card">
      <div class="teacher-card-title">문제 페이지</div>
      <div class="teacher-card-value">${report.issues.length}</div>
      <div class="teacher-card-sub">보완이 필요한 항목 수</div>
    </div>
    <div class="teacher-stat-card">
      <div class="teacher-card-title">인쇄 시트</div>
      <div class="teacher-card-value">${report.sheetCount}</div>
      <div class="teacher-card-sub">현재 배열 기준 예상 시트 수</div>
    </div>
  `;

  dom.teacherReadinessBox.className = 'tip-box teacher-readiness-box ' + (report.ready ? 'good' : 'warn');
  dom.teacherReadinessBox.innerHTML = report.ready
    ? `인쇄 전 점검 완료 상태입니다. 표지와 모든 펼침의 핵심 요소가 들어가 있습니다. 총 ${report.sheetCount}시트로 인쇄됩니다.`
    : `아직 ${report.issues.length}개의 보완 항목이 있습니다. 아래 목록에서 바로 이동해 수정한 뒤 인쇄 배열을 다시 확인하세요.`;

  dom.jumpFirstIssueBtn.disabled = !report.issues.length;
  dom.centerAllImagesBtn.disabled = report.imageReadyCount === 0;
  dom.resetAllImagesBtn.disabled = report.imageReadyCount === 0;
  dom.setAllTextNormalBtn.disabled = !state.book.spreads.length;
  dom.setAllTextLargeBtn.disabled = !state.book.spreads.length;

  dom.teacherIssueList.innerHTML = '';
  if (!report.issues.length) {
    const empty = document.createElement('div');
    empty.className = 'issue-empty';
    empty.textContent = '현재 기준으로는 바로 인쇄 점검을 진행해도 좋습니다. 그래도 인쇄 배열 화면에서 마지막으로 여백을 확인해 주세요.';
    dom.teacherIssueList.appendChild(empty);
  } else {
    report.issues.forEach((issue) => {
      const item = document.createElement('div');
      item.className = 'issue-item';
      item.innerHTML = `
        <div class="issue-title">${escapeHtml(issue.title)}</div>
        <div class="issue-sub">${escapeHtml(issue.description)}</div>
      `;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'issue-jump-btn';
      button.textContent = '이 페이지로 이동';
      button.addEventListener('click', () => goToIssue(issue));
      item.appendChild(button);
      dom.teacherIssueList.appendChild(item);
    });
  }

  dom.teacherPreviewReport.innerHTML = `
    <h3>선생님 인쇄 리포트</h3>
    <ul>
      <li>현재 책 제목: ${escapeHtml(state.book.title || '제목 없음')}</li>
      <li>용지: ${escapeHtml(state.book.paper || 'A4')} · 예상 인쇄 시트 ${report.sheetCount}장</li>
      <li>표지 이미지: ${report.coverHasImage ? '있음' : '없음'}</li>
      <li>본문 준비 완료 펼침: ${report.completeSpreadCount} / ${report.totalSpreads}</li>
      <li>바로 수정할 문제 항목: ${report.issues.length}개</li>
    </ul>
  `;
}

function buildTeacherReport() {
  const issues = [];
  const totalSpreads = state.book.spreads.length;
  let imageReadyCount = 0;
  let completeSpreadCount = 0;

  const coverTitle = normalizeString(state.book.cover.title, '').trim();
  const coverSubtitle = normalizeString(state.book.cover.subtitle, '').trim();
  const coverHasImage = !!state.book.cover.imageSrc;

  if (!coverTitle) {
    issues.push({
      targetType: 'cover',
      targetId: 'cover',
      title: '표지 제목이 비어 있습니다',
      description: '표지에서 제목을 입력해야 책 미리보기와 인쇄 구성이 더 명확해집니다.'
    });
  }

  if (!coverSubtitle) {
    issues.push({
      targetType: 'cover',
      targetId: 'cover',
      title: '표지 부제가 비어 있습니다',
      description: '부제나 간단한 설명을 넣으면 표지가 훨씬 완성도 있게 보입니다.'
    });
  }

  state.book.spreads.forEach((spread, index) => {
    const title = normalizeString(spread.leftTitle, '').trim();
    const body = normalizeString(spread.leftBody, '').trim();
    const hasImage = !!spread.rightImage;
    if (hasImage) imageReadyCount += 1;

    const bodyStats = getTextStats(body);
    if (!title) {
      issues.push({
        targetType: 'spread',
        targetId: spread.id,
        title: `펼침 ${index + 1} 제목이 비어 있습니다`,
        description: '왼쪽 페이지 제목을 넣어야 책 순서 목록과 인쇄 페이지 구분이 쉬워집니다.'
      });
    }

    if (bodyStats.chars < 10) {
      issues.push({
        targetType: 'spread',
        targetId: spread.id,
        title: `펼침 ${index + 1} 본문이 짧습니다`,
        description: '본문 글이 10자 미만입니다. 인쇄 전 문장을 더 채워 주세요.'
      });
    }

    if (!hasImage) {
      issues.push({
        targetType: 'spread',
        targetId: spread.id,
        title: `펼침 ${index + 1} 이미지가 비어 있습니다`,
        description: '오른쪽 페이지에 그림이 없으면 책 흐름이 끊겨 보일 수 있습니다.'
      });
    }

    if (title && bodyStats.chars >= 10 && hasImage) {
      completeSpreadCount += 1;
    }
  });

  const sheetCount = buildBookletSheets(buildLogicalPages()).length;

  return {
    totalSpreads,
    imageReadyCount,
    completeSpreadCount,
    coverHasImage,
    sheetCount,
    issues,
    ready: issues.length === 0
  };
}

function goToIssue(issue) {
  if (!issue) return;
  if (issue.targetType === 'cover') {
    state.active = { type: 'cover', id: 'cover' };
    renderAll();
    return;
  }

  const spread = state.book.spreads.find((item) => item.id === issue.targetId);
  if (!spread) return;
  state.active = { type: 'spread', id: spread.id };
  renderAll();
}

function renderTopFields() {
  dom.bookTitleInput.value = state.book.title;
  dom.paperSelect.value = state.book.paper;
}
function refreshViewsForTyping() {
  renderNavigation();
  renderPreview();
  renderBookPreviewList();
  renderTeacherPanels();
}

function bindImeSafeTextField(element, updateState, refresh) {
  let isComposing = false;

  element.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  element.addEventListener('compositionend', () => {
    isComposing = false;
    updateState();
    refresh();
  });

  element.addEventListener('input', () => {
    updateState();
    if (!isComposing) {
      refresh();
    }
  });
}

function renderAll() {
  renderTopFields();
  renderNavigation();
  renderEditor();
  renderPreview();
  renderBookPreviewList();
  renderTeacherPanels();
}

function setSubmitStatus(message = '', tone = '') {
  if (!dom.submitStatusBox) return;
  dom.submitStatusBox.textContent = message || '학급명과 학생 이름을 입력한 뒤 제출하면 선생님 제출함에서 바로 확인할 수 있습니다.';
  dom.submitStatusBox.className = 'submit-status-box' + (tone ? ` ${tone}` : '');
}

function openSubmitModal() {
  if (!dom.submitModal) return;
  setSubmitStatus();
  dom.submitModal.hidden = false;
  dom.submitSchoolInput.value = dom.submitSchoolInput.value || '';
  dom.submitClassInput.focus();
}

function closeSubmitModal() {
  if (!dom.submitModal) return;
  dom.submitModal.hidden = true;
  setSubmitStatus();
}

function getSubmissionFormValue(input) {
  return normalizeString(input && input.value, '').trim();
}

function buildSubmissionInfo() {
  return {
    schoolName: getSubmissionFormValue(dom.submitSchoolInput),
    className: getSubmissionFormValue(dom.submitClassInput),
    studentName: getSubmissionFormValue(dom.submitStudentNameInput),
    studentNumber: getSubmissionFormValue(dom.submitStudentNumberInput),
    submissionCode: getSubmissionFormValue(dom.submitCodeInput),
    bookTitle: normalizeString(state.book.title, '').trim(),
    paper: normalizePaper(state.book.paper),
    submittedAt: new Date().toISOString()
  };
}

function validateSubmissionInfo(info) {
  if (!info.className) {
    throw new Error('학급명을 입력해 주세요.');
  }
  if (!info.studentName) {
    throw new Error('학생 이름을 입력해 주세요.');
  }
  if (!info.submissionCode) {
    throw new Error('제출코드를 입력해 주세요.');
  }
}


function buildReviewSubmissionInfo() {
  const source = state.book && state.book.submission ? state.book.submission : {};
  return {
    schoolName: normalizeString(source.schoolName, '').trim(),
    className: normalizeString(source.className, '').trim(),
    studentName: normalizeString(source.studentName, '').trim(),
    studentNumber: normalizeString(source.studentNumber, '').trim(),
    submissionCode: normalizeString(source.submissionCode, '').trim(),
    bookTitle: normalizeString(state.book.title || source.bookTitle, '').trim(),
    paper: normalizePaper(state.book.paper || source.paper),
    submittedAt: source.submittedAt || ''
  };
}

async function saveTeacherReview() {
  if (state.mode !== 'teacher') {
    alert('선생님 모드에서만 수정본을 저장할 수 있습니다.');
    return;
  }

  const accessOk = await ensureTeacherAccess();
  if (!accessOk) return;

  if (!state.loadedFromUrl) {
    alert('학생 제출본을 먼저 불러온 뒤 저장해 주세요.');
    return;
  }

  const submission = buildReviewSubmissionInfo();

  if (!submission.className || !submission.studentName) {
    alert('이 제출본의 학생 정보가 부족하여 저장할 수 없습니다.');
    return;
  }

  if (dom.saveReviewBtn) {
    dom.saveReviewBtn.disabled = true;
  }

  try {
    const payload = {
      sourceUrl: state.loadedFromUrl,
      submission,
      book: {
        ...createExportPayload(state.book),
        submission
      }
    };

    const response = await fetch(REVIEW_SAVE_ENDPOINT, {
      method: 'POST',
      headers: buildTeacherAuthHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result = {};
    try {
      result = JSON.parse(text);
    } catch (error) {
      result = { error: text };
    }

    if (!response.ok) {
      throw new Error(result && result.error ? result.error : '선생님 수정본 저장에 실패했습니다.');
    }

    alert('선생님 수정본이 저장되었습니다.\n\n새 탭에서 저장된 수정본을 엽니다.');
    window.open(result.editUrl || result.url, '_blank', 'noopener');
  } catch (error) {
    console.error(error);
    alert(error && error.message ? error.message : '선생님 수정본 저장에 실패했습니다.');
  } finally {
    if (dom.saveReviewBtn) {
      dom.saveReviewBtn.disabled = false;
    }
  }
}

async function submitCurrentBook() {
  const submission = buildSubmissionInfo();
  validateSubmissionInfo(submission);

  const payload = {
    submission,
    book: {
      ...createExportPayload(state.book),
      submission
    }
  };

  setSubmitStatus('제출 중입니다. 잠시만 기다려 주세요.', 'pending');
  dom.confirmSubmitBtn.disabled = true;

  try {
    const response = await fetch(SUBMISSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result && result.error ? result.error : '작품 제출에 실패했습니다.');
    }

    setSubmitStatus('제출이 완료되었습니다. 선생님 제출함에서 바로 확인할 수 있습니다.', 'success');
    alert('학생 작품 제출이 완료되었습니다.\n\n선생님 확인 페이지: /teacher/');
    closeSubmitModal();
  } catch (error) {
    console.error(error);
    setSubmitStatus(error && error.message ? error.message : '작품 제출에 실패했습니다.', 'error');
  } finally {
    dom.confirmSubmitBtn.disabled = false;
  }
}

async function loadBookFromRemoteUrl(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('제출된 JSON을 불러오지 못했습니다. 링크가 올바른지 확인해 주세요.');
  }

  const data = await response.json();
  state.book = normalizeBook(data);
  state.loadedFromUrl = url;
  state.active = { type: 'cover', id: 'cover' };
  renderAll();
  updateReviewSaveButton();
}

async function handleInitialRemoteLoad() {
  const params = new URLSearchParams(window.location.search);
  const loadFrom = params.get('loadFrom');
  const mode = params.get('mode');

  if (!loadFrom) {
    state.loadedFromUrl = '';

    if (mode === 'teacher') {
      const ok = await ensureTeacherAccess();
      if (ok) setMode('teacher');
    }

    updateReviewSaveButton();
    return;
  }

  try {
    await loadBookFromRemoteUrl(loadFrom);

    if (mode === 'teacher') {
      const ok = await ensureTeacherAccess();
      if (ok) setMode('teacher');
    }

    updateReviewSaveButton();
    alert('제출된 작품을 불러왔습니다. 선생님 모드에서 바로 검토할 수 있습니다.');
  } catch (error) {
    console.error(error);
    alert(error && error.message ? error.message : '제출 작품 불러오기에 실패했습니다.');
  }
}

function bindTopEvents() {
  if (dom.studentModeBtn) {
    dom.studentModeBtn.addEventListener('click', () => {
      setMode('student');
    });
  }

  if (dom.teacherModeBtn) {
    dom.teacherModeBtn.addEventListener('click', async () => {
      const ok = await ensureTeacherAccess();
      if (!ok) return;
      setMode('teacher');
    });
  }

  if (dom.coverNavBtn) {
    dom.coverNavBtn.addEventListener('click', () => {
      state.active = { type: 'cover', id: 'cover' };
      renderAll();
    });
  }

  if (dom.bookTitleInput) {
    bindImeSafeTextField(
      dom.bookTitleInput,
      () => {
        state.book.title = dom.bookTitleInput.value;
      },
      () => {
        renderBookPreviewList();
        renderTeacherPanels();
      }
    );
  }

  if (dom.paperSelect) {
    dom.paperSelect.addEventListener('change', () => {
      state.book.paper = dom.paperSelect.value === 'B4' ? 'B4' : 'A4';
      renderTeacherPanels();
    });
  }

  if (dom.addSpreadBtn) {
    dom.addSpreadBtn.addEventListener('click', () => {
      const spread = createSpread(state.book.spreads.length + 1);
      state.book.spreads.push(spread);
      state.active = { type: 'spread', id: spread.id };
      renderAll();
    });
  }

  if (dom.saveJsonBtn) {
    dom.saveJsonBtn.addEventListener('click', () => {
      downloadJson();
    });
  }

  if (dom.saveReviewBtn) {
    dom.saveReviewBtn.addEventListener('click', async () => {
      await saveTeacherReview();
    });
  }

  if (dom.submitWorkBtn) {
    dom.submitWorkBtn.addEventListener('click', () => {
      openSubmitModal();
    });
  }

  if (dom.closeSubmitModalBtn) {
    dom.closeSubmitModalBtn.addEventListener('click', () => {
      closeSubmitModal();
    });
  }

  if (dom.cancelSubmitBtn) {
    dom.cancelSubmitBtn.addEventListener('click', () => {
      closeSubmitModal();
    });
  }

  if (dom.submitModal) {
    dom.submitModal.addEventListener('click', (event) => {
      const shouldClose =
        event.target &&
        event.target.dataset &&
        event.target.dataset.submitClose === 'true';

      if (shouldClose) closeSubmitModal();
    });
  }

  if (dom.confirmSubmitBtn) {
    dom.confirmSubmitBtn.addEventListener('click', async () => {
      await submitCurrentBook();
    });
  }

  if (dom.jsonFileInput) {
    dom.jsonFileInput.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        state.book = normalizeBook(data);
        state.loadedFromUrl = '';
        state.active = { type: 'cover', id: 'cover' };
        renderAll();
        updateReviewSaveButton();
        alert('현재 KCS JSON 형식 파일을 정상적으로 불러왔습니다.');
      } catch (error) {
        console.error(error);
        alert(error && error.message ? error.message : 'JSON 불러오기에 실패했습니다. 현재 KCS 형식 파일인지 확인해 주세요.');
      } finally {
        event.target.value = '';
      }
    });
  }

  if (dom.printBookBtn) {
    dom.printBookBtn.addEventListener('click', () => {
      openPrintWindow();
    });
  }

  if (dom.jumpFirstIssueBtn) {
    dom.jumpFirstIssueBtn.addEventListener('click', () => {
      const report = buildTeacherReport();
      if (!report.issues.length) return;
      goToIssue(report.issues[0]);
    });
  }

  if (dom.centerAllImagesBtn) {
    dom.centerAllImagesBtn.addEventListener('click', () => {
      const count = centerAllImages();
      if (count) {
        renderAll();
        alert(`${count}개의 이미지 페이지를 중앙 정렬했습니다.`);
      }
    });
  }

  if (dom.resetAllImagesBtn) {
    dom.resetAllImagesBtn.addEventListener('click', () => {
      const count = resetAllImages();
      if (count) {
        renderAll();
        alert(`${count}개의 이미지 배율과 위치를 초기화했습니다.`);
      }
    });
  }

  if (dom.setAllTextNormalBtn) {
    dom.setAllTextNormalBtn.addEventListener('click', () => {
      applyTextSizeToAllSpreads(24);
      renderAll();
      alert('모든 펼침의 기본 글자 크기를 24로 맞췄습니다.');
    });
  }

  if (dom.setAllTextLargeBtn) {
    dom.setAllTextLargeBtn.addEventListener('click', () => {
      applyTextSizeToAllSpreads(28);
      renderAll();
      alert('모든 펼침의 글자 크기를 28로 키웠습니다.');
    });
  }

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
    spreads: raw.spreads.map((item, index) => normalizeSpread(item, index)),
    submission: isPlainObject(raw.submission) ? { ...raw.submission } : null,
    review: isPlainObject(raw.review) ? { ...raw.review } : null
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
      @page { size: ${pageSizeCss}; margin: 5mm; }

      * { box-sizing: border-box; }

      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        color: #111827;
        font-family: Arial, sans-serif;
      }

      body {
        padding: 0;
      }

      .screen-toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        padding: 12px 14px;
        margin-bottom: 10px;
        background: rgba(255,255,255,0.96);
        border: 1px solid #dbe5f0;
        border-radius: 14px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
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
        line-height: 1.5;
        color: #475569;
        margin-left: auto;
        font-size: 13px;
      }

      .print-stack {
        display: grid;
        gap: 8px;
      }

      .print-sheet-page {
        background: #fff;
        border: 0;
        border-radius: 0;
        padding: 0;
        margin: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }

      .print-sheet-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .sheet-screen-title {
        margin: 0 0 6px;
        font-size: 14px;
        color: #64748b;
        font-weight: 700;
      }

      .sheet-face {
        width: 100%;
        aspect-ratio: 1.414 / 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3mm;
        margin: 0;
      }

      .sheet-slot {
        min-width: 0;
        min-height: 0;
      }

      .print-page {
        height: 100%;
        border: 1px solid #cbd5e1;
        background: #fff;
        padding: 4mm;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .print-page img {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: calc(100% - 12mm);
        max-height: calc(100% - 12mm);
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
        margin: 0 0 8px;
        font-size: 20px;
        line-height: 1.25;
      }

      .print-page p {
        margin: 0;
        line-height: 1.55;
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
        margin-top: 6px;
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
        border: 1px dashed #cbd5e1;
        border-radius: 12px;
        background: #f8fafc;
        overflow: hidden;
      }

      .image-page .image-stage {
        flex: 1 1 auto;
        min-height: 0;
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
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
        }

        body {
          padding: 0 !important;
        }

        .screen-toolbar,
        .print-note,
        .sheet-screen-title,
        .slot-label,
        .page-meta {
          display: none !important;
        }

        .print-stack {
          display: block !important;
        }

        .print-sheet-page {
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          break-after: page !important;
          page-break-after: always !important;
        }

        .print-sheet-page:last-child {
          break-after: auto !important;
          page-break-after: auto !important;
        }

        .sheet-face {
          gap: 3mm !important;
          margin: 0 !important;
        }

        .print-page {
          padding: 4mm !important;
        }

        .cover-image-box,
        .image-page .image-stage {
          margin-top: 0 !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="screen-toolbar">
      <button class="primary" onclick="window.print()">인쇄하기</button>
      <button onclick="window.close()">닫기</button>
      <div class="print-note">한 페이지에는 한 면(앞면 또는 뒷면)만 배치됩니다.</div>
    </div>

    <div class="print-stack">
      ${sheets.map((sheet, index) => `
        <section class="print-sheet-page">
          <div class="sheet-screen-title">인쇄 시트 ${index + 1} · 앞면</div>
          ${renderPrintFace(sheet.front, '앞면')}
        </section>
        <section class="print-sheet-page">
          <div class="sheet-screen-title">인쇄 시트 ${index + 1} · 뒷면</div>
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

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const maxSide = 1400;
        let { width, height } = img;

        if (width > height && width > maxSide) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else if (height >= width && height > maxSide) {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지 캔버스를 만들지 못했습니다.'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };

      img.onerror = () => reject(new Error('이미지를 처리하지 못했습니다.'));
      img.src = reader.result;
    };

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

function centerAllImages() {
  let count = 0;
  state.book.spreads.forEach((spread) => {
    if (!spread.rightImage) return;
    spread.rightImageX = 0;
    spread.rightImageY = 0;
    count += 1;
  });
  return count;
}

function resetAllImages() {
  let count = 0;
  state.book.spreads.forEach((spread) => {
    if (!spread.rightImage) return;
    spread.rightImageScale = 1;
    spread.rightImageX = 0;
    spread.rightImageY = 0;
    count += 1;
  });
  return count;
}

function applyTextSizeToAllSpreads(size) {
  state.book.spreads.forEach((spread) => {
    spread.leftFontSize = size;
  });
}

function bindGlobalShortcuts() {
  document.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();

    if (key === 'escape' && dom.submitModal && !dom.submitModal.hidden) {
      closeSubmitModal();
      return;
    }

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

async function init() {
  setMode('student');
  bindTopEvents();
  renderAll();
  await handleInitialRemoteLoad();
}

init();
