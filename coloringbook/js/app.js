const BOOK_FORMAT_VERSION = 'kcs-book-v1';
const BOOK_DOWNLOAD_FILE_NAME = 'kcs-book-project.json';
const SUBMISSION_ENDPOINT = '/api/submissions/upload';
const REVIEW_SAVE_ENDPOINT = '/api/submissions/review-save';
const DEFAULT_INNER_GUTTER = 32;
const DEFAULT_TEXT_FONT = 'notoSans';
const DEFAULT_LINE_HEIGHT = 1.55;
const B4_MIN_IMAGE_SCALE = 1.18;
const B4_TEXT_SCALE = 1.12;
const TEXT_FONT_STACKS = {
  notoSans: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
  nanumGothic: "'Nanum Gothic', 'Noto Sans KR', sans-serif",
  gowunDodum: "'Gowun Dodum', 'Noto Sans KR', sans-serif",
  malgun: "'Malgun Gothic', 'Noto Sans KR', sans-serif",
  blackHan: "'Black Han Sans', 'Noto Sans KR', sans-serif"
};

const state = {
  mode: 'student',
  active: { type: 'cover', id: 'cover' },
  book: createInitialBook(),
  loadedFromUrl: '',
  bookFlipIndex: 0
};
const TEACHER_PASSWORD_STORAGE_KEY = 'kcs-teacher-password';

function getStoredTeacherPassword() {
  try {
    return localStorage.getItem(TEACHER_PASSWORD_STORAGE_KEY) || '';
  } catch (error) {
    return '';
  }
}

function setStoredTeacherPassword(password) {
  try {
    if (password) {
      localStorage.setItem(TEACHER_PASSWORD_STORAGE_KEY, password);
    } else {
      localStorage.removeItem(TEACHER_PASSWORD_STORAGE_KEY);
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

  if (password && !forcePrompt) {
    return true;
  }

  password = window.prompt('선생님 비밀번호를 입력하세요.');
  password = String(password || '').trim();

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
  bookFlipPreview: document.getElementById('bookFlipPreview'),
  bookReadinessReport: document.getElementById('bookReadinessReport'),
  bookPreviewList: document.getElementById('bookPreviewList'),
  teacherOnlySidebar: document.getElementById('teacherOnlySidebar'),
  teacherSummaryCards: document.getElementById('teacherSummaryCards'),
  teacherReadinessBox: document.getElementById('teacherReadinessBox'),
  teacherIssueList: document.getElementById('teacherIssueList'),
  teacherPrintBookBtn: document.getElementById('teacherPrintBookBtn'),
  jumpFirstIssueBtn: document.getElementById('jumpFirstIssueBtn'),
  centerAllImagesBtn: document.getElementById('centerAllImagesBtn'),
  resetAllImagesBtn: document.getElementById('resetAllImagesBtn'),
  enlargeAllImagesBtn: document.getElementById('enlargeAllImagesBtn'),
  setAllTextNormalBtn: document.getElementById('setAllTextNormalBtn'),
  setAllTextLargeBtn: document.getElementById('setAllTextLargeBtn'),
  moveAllTextLeftBtn: document.getElementById('moveAllTextLeftBtn'),
  moveAllTextRightBtn: document.getElementById('moveAllTextRightBtn'),
  moveAllTextUpBtn: document.getElementById('moveAllTextUpBtn'),
  moveAllTextDownBtn: document.getElementById('moveAllTextDownBtn'),
  resetAllTextPositionBtn: document.getElementById('resetAllTextPositionBtn'),
  decreaseAllIndentBtn: document.getElementById('decreaseAllIndentBtn'),
  increaseAllIndentBtn: document.getElementById('increaseAllIndentBtn'),
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
      imageSrc: '',
      imageX: 0,
      imageY: 0,
      imageScale: 1
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
    leftFontFamily: DEFAULT_TEXT_FONT,
    leftLineHeight: DEFAULT_LINE_HEIGHT,
    leftTitleAlign: 'left',
    leftTextAlign: 'left',
    leftVerticalAlign: 'top',
    leftTitleOffsetY: 0,
    leftTextOffsetX: 0,
    leftTextOffsetY: 0,
    leftBodyIndent: 0,
    leftLeadScale: 1,
    leftInnerGutter: DEFAULT_INNER_GUTTER,
    rightImage: '',
    rightImageScale: 1,
    rightImageX: 0,
    rightImageY: 0,
    rightImageRotation: 0,
    rightGuideVisible: true,
    rightFrameInset: 0
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
    const centerCoverImageBtn = document.getElementById('centerCoverImageBtn');

    coverTitleInput.value = state.book.cover.title;
    coverSubtitleInput.value = state.book.cover.subtitle;

    const syncCoverMeta = () => {
      const subtitleStats = getTextStats(state.book.cover.subtitle);
      coverSubtitleMeta.textContent = `부제 ${subtitleStats.chars}자 · ${Math.max(subtitleStats.lines, state.book.cover.subtitle ? 1 : 0)}줄`;
      coverImageMeta.textContent = state.book.cover.imageSrc
        ? '표지 이미지가 들어가 있습니다. 새 파일을 넣으면 교체됩니다.'
        : '표지 이미지는 선택 사항입니다. 없으면 텍스트 중심 표지로 출력됩니다.';
      removeCoverImageBtn.disabled = !state.book.cover.imageSrc;
      if (centerCoverImageBtn) centerCoverImageBtn.disabled = !state.book.cover.imageSrc;
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
      centerCoverImage();
      renderAll();
      event.target.value = '';
    });

    coverPasteZone.addEventListener('paste', async (event) => {
      const pasted = await getImageFromPaste(event);
      if (!pasted) return;
      state.book.cover.imageSrc = pasted;
      centerCoverImage();
      renderAll();
    });

    removeCoverImageBtn.addEventListener('click', () => {
      state.book.cover.imageSrc = '';
      renderAll();
    });

    if (centerCoverImageBtn) {
      centerCoverImageBtn.addEventListener('click', () => {
        centerCoverImage();
        renderAll();
      });
    }

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
  const fontFamilyInput = document.getElementById('fontFamilyInput');
  const lineHeightInput = document.getElementById('lineHeightInput');
  const titleAlignInput = document.getElementById('titleAlignInput');
  const textAlignInput = document.getElementById('textAlignInput');
  const verticalAlignInput = document.getElementById('verticalAlignInput');
  const titleOffsetInput = document.getElementById('titleOffsetInput');
  const textOffsetXInput = document.getElementById('textOffsetXInput');
  const textOffsetYInput = document.getElementById('textOffsetYInput');
  const bodyIndentInput = document.getElementById('bodyIndentInput');
  const leadScaleInput = document.getElementById('leadScaleInput');
  const innerGutterInput = document.getElementById('innerGutterInput');
  const spreadImageInput = document.getElementById('spreadImageInput');
  const spreadPasteZone = document.getElementById('spreadPasteZone');
  const removeSpreadImageBtn = document.getElementById('removeSpreadImageBtn');
  const spreadImageMeta = document.getElementById('spreadImageMeta');
  const imageRotationInput = document.getElementById('imageRotationInput');
  const rotateImageLeftBtn = document.getElementById('rotateImageLeftBtn');
  const rotateImageRightBtn = document.getElementById('rotateImageRightBtn');
  const imageScaleInput = document.getElementById('imageScaleInput');
  const imageXInput = document.getElementById('imageXInput');
  const imageYInput = document.getElementById('imageYInput');
  const guideVisibleInput = document.getElementById('guideVisibleInput');
  const frameInsetInput = document.getElementById('frameInsetInput');
  const centerImageBtn = document.getElementById('centerImageBtn');
  const resetImageBtn = document.getElementById('resetImageBtn');

  spreadTitleInput.value = spread.leftTitle;
  spreadBodyInput.value = spread.leftBody;
  fontSizeInput.value = spread.leftFontSize;
  fontWeightInput.value = spread.leftFontWeight;
  if (fontFamilyInput) fontFamilyInput.value = normalizeTextFont(spread.leftFontFamily);
  if (lineHeightInput) lineHeightInput.value = String(normalizeLineHeight(spread.leftLineHeight));
  if (titleAlignInput) titleAlignInput.value = spread.leftTitleAlign || spread.leftTextAlign || 'left';
  if (textAlignInput) textAlignInput.value = spread.leftTextAlign || 'left';
  if (verticalAlignInput) verticalAlignInput.value = spread.leftVerticalAlign || 'top';
  if (titleOffsetInput) titleOffsetInput.value = spread.leftTitleOffsetY || 0;
  if (textOffsetXInput) textOffsetXInput.value = spread.leftTextOffsetX || 0;
  if (textOffsetYInput) textOffsetYInput.value = spread.leftTextOffsetY || 0;
  if (bodyIndentInput) bodyIndentInput.value = spread.leftBodyIndent || 0;
  if (leadScaleInput) leadScaleInput.value = String(normalizeLeadScale(spread.leftLeadScale));
  if (innerGutterInput) innerGutterInput.value = spread.leftInnerGutter ?? DEFAULT_INNER_GUTTER;
  if (imageRotationInput) imageRotationInput.value = String(normalizeImageRotation(spread.rightImageRotation));
  imageScaleInput.value = spread.rightImageScale;
  imageXInput.value = spread.rightImageX;
  imageYInput.value = spread.rightImageY;
  if (guideVisibleInput) guideVisibleInput.value = spread.rightGuideVisible === false ? 'hide' : 'show';
  if (frameInsetInput) frameInsetInput.value = normalizeFrameInset(spread.rightFrameInset);

  const syncSpreadMeta = () => {
    const bodyStats = getTextStats(spread.leftBody);
    const rotation = normalizeImageRotation(spread.rightImageRotation);
    spreadBodyMeta.textContent = `본문 ${bodyStats.chars}자 · ${Math.max(bodyStats.lines, spread.leftBody ? 1 : 0)}줄`;
    spreadImageMeta.textContent = buildImageStatusText(spread.rightImage, spread.rightImageScale, spread.rightImageX, spread.rightImageY, rotation);
    prevSpreadBtn.disabled = spreadIndex <= 0;
    nextSpreadBtn.disabled = spreadIndex >= state.book.spreads.length - 1;
    moveSpreadUpBtn.disabled = spreadIndex <= 0;
    moveSpreadDownBtn.disabled = spreadIndex >= state.book.spreads.length - 1;
    removeSpreadImageBtn.disabled = !spread.rightImage;
    if (imageRotationInput) imageRotationInput.disabled = !spread.rightImage;
    if (rotateImageLeftBtn) rotateImageLeftBtn.disabled = !spread.rightImage;
    if (rotateImageRightBtn) rotateImageRightBtn.disabled = !spread.rightImage;
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
    renderTeacherPanels();
  });

  if (fontFamilyInput) {
    fontFamilyInput.addEventListener('change', () => {
      spread.leftFontFamily = normalizeTextFont(fontFamilyInput.value);
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (lineHeightInput) {
    lineHeightInput.addEventListener('change', () => {
      spread.leftLineHeight = normalizeLineHeight(lineHeightInput.value);
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (titleAlignInput) {
    titleAlignInput.addEventListener('change', () => {
      spread.leftTitleAlign = titleAlignInput.value;
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (textAlignInput) {
    textAlignInput.addEventListener('change', () => {
      spread.leftTextAlign = textAlignInput.value;
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (verticalAlignInput) {
    verticalAlignInput.addEventListener('change', () => {
      spread.leftVerticalAlign = verticalAlignInput.value;
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (titleOffsetInput) {
    titleOffsetInput.addEventListener('input', () => {
      spread.leftTitleOffsetY = toNumber(titleOffsetInput.value, 0);
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (textOffsetXInput) {
    textOffsetXInput.addEventListener('input', () => {
      spread.leftTextOffsetX = toNumber(textOffsetXInput.value, 0);
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (textOffsetYInput) {
    textOffsetYInput.addEventListener('input', () => {
      spread.leftTextOffsetY = toNumber(textOffsetYInput.value, 0);
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (bodyIndentInput) {
    bodyIndentInput.addEventListener('input', () => {
      spread.leftBodyIndent = Math.max(0, toNumber(bodyIndentInput.value, 0));
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (leadScaleInput) {
    leadScaleInput.addEventListener('change', () => {
      spread.leftLeadScale = normalizeLeadScale(leadScaleInput.value);
      renderPreview();
      renderTeacherPanels();
    });
  }

  if (innerGutterInput) {
    innerGutterInput.addEventListener('input', () => {
      spread.leftInnerGutter = toNumber(innerGutterInput.value, DEFAULT_INNER_GUTTER);
      renderPreview();
      renderTeacherPanels();
    });
  }

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

  if (imageRotationInput) {
    imageRotationInput.addEventListener('change', () => {
      spread.rightImageRotation = normalizeImageRotation(imageRotationInput.value);
      renderPreview();
      renderTeacherPanels();
      syncSpreadMeta();
    });
  }

  if (rotateImageLeftBtn) {
    rotateImageLeftBtn.addEventListener('click', () => {
      spread.rightImageRotation = rotateImage(spread.rightImageRotation, -90);
      if (imageRotationInput) imageRotationInput.value = String(spread.rightImageRotation);
      renderPreview();
      renderTeacherPanels();
      syncSpreadMeta();
    });
  }

  if (rotateImageRightBtn) {
    rotateImageRightBtn.addEventListener('click', () => {
      spread.rightImageRotation = rotateImage(spread.rightImageRotation, 90);
      if (imageRotationInput) imageRotationInput.value = String(spread.rightImageRotation);
      renderPreview();
      renderTeacherPanels();
      syncSpreadMeta();
    });
  }

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

  if (guideVisibleInput) {
    guideVisibleInput.addEventListener('change', () => {
      spread.rightGuideVisible = guideVisibleInput.value !== 'hide';
      renderPreview();
      renderTeacherPanels();
      syncSpreadMeta();
    });
  }

  if (frameInsetInput) {
    frameInsetInput.addEventListener('input', () => {
      spread.rightFrameInset = normalizeFrameInset(frameInsetInput.value);
      renderPreview();
      renderTeacherPanels();
      syncSpreadMeta();
    });
  }

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
    spread.rightImageRotation = 0;
    imageScaleInput.value = 1;
    imageXInput.value = 0;
    imageYInput.value = 0;
    if (imageRotationInput) imageRotationInput.value = '0';
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
    const coverTransform = buildCoverImageTransform(state.book.cover);
    wrap.innerHTML = `
      <div class="preview-caption">표지 · ${state.book.cover.imageSrc ? '이미지 있음' : '텍스트 중심 표지'}</div>
      <div class="preview-cover-page">
        <div class="preview-cover-image">
          ${
            state.book.cover.imageSrc
              ? `<img src="${escapeAttr(state.book.cover.imageSrc)}" style="transform:${coverTransform};" alt="표지 이미지" />`
              : '<div class="preview-empty">표지 이미지 없음</div>'
          }
        </div>
        <div class="preview-cover-text" style="text-align:center;">
        <h3 style="text-align:center;">${escapeHtml(state.book.cover.title || '제목 없음')}</h3>
        <p style="text-align:center;">${escapeHtml(state.book.cover.subtitle || '')}</p>
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

  const titleAlign = spread.leftTitleAlign || spread.leftTextAlign || 'left';
  const bodyAlign = spread.leftTextAlign || 'left';
  const previewGutterPx = Math.max(0, Number(spread.leftInnerGutter || DEFAULT_INNER_GUTTER));
  const fontStack = getTextFontStack(spread.leftFontFamily);
  const lineHeight = normalizeLineHeight(spread.leftLineHeight);
  const textOffsetX = toNumber(spread.leftTextOffsetX, 0);
  const textOffsetY = toNumber(spread.leftTextOffsetY, 0);
  const bodyIndent = Math.max(0, toNumber(spread.leftBodyIndent, 0));
  const leadScale = normalizeLeadScale(spread.leftLeadScale);
  const frameInset = normalizeFrameInset(spread.rightFrameInset);
  const imageStageLeft = previewGutterPx + frameInset;
  const guideClass = spread.rightGuideVisible === false ? ' no-guide' : '';
  const imageTransform = buildImageTransform(spread);

  wrap.innerHTML = `
    <div class="preview-caption">펼침 ${spreadIndex + 1} · 본문 ${bodyStats.chars}자 · ${spread.rightImage ? '이미지 있음' : '이미지 없음'}</div>
    <div class="preview-spread-pages">
      <div class="preview-page">
        <div
          class="preview-left-inner"
          style="
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: ${
              spread.leftVerticalAlign === 'center'
                ? 'center'
                : spread.leftVerticalAlign === 'bottom'
                  ? 'flex-end'
                  : 'flex-start'
            };
            padding-left: 12px;
            padding-right: ${previewGutterPx}px;
            box-sizing: border-box;
            font-family: ${fontStack};
            transform: translate(${textOffsetX}px, ${textOffsetY}px);
          "
        >
          <h3
            style="
              font-size:${Number(spread.leftFontSize || 24)}px;
              font-weight:${escapeAttr(spread.leftFontWeight || '400')};
              text-align:${escapeAttr(titleAlign)};
              margin-top:${Number(spread.leftTitleOffsetY || 0)}px;
              margin-bottom:10px;
            "
          >
            ${escapeHtml(spread.leftTitle || '제목 없음')}
          </h3>
          <p
            style="
              font-size:${Math.max(16, Number(spread.leftFontSize || 24) - 4)}px;
              font-weight:${escapeAttr(spread.leftFontWeight || '400')};
              text-align:${escapeAttr(bodyAlign)};
              text-indent:${bodyIndent}px;
              line-height:${lineHeight};
              margin:0;
            "
          >
            ${renderBodyContentHtml(spread.leftBody || '', leadScale)}
          </p>
        </div>
      </div>

      <div class="preview-page">
        <div
          class="preview-image-stage interactive-image-stage${guideClass}"
          data-preview-image-stage="true"
          style="
            top:${frameInset}px;
            right:${frameInset}px;
            bottom:${frameInset}px;
            left:${imageStageLeft}px;
          "
        >
          ${
            spread.rightImage
              ? `<img data-preview-image="true" src="${escapeAttr(spread.rightImage)}" style="transform: ${imageTransform};" draggable="false" alt="펼침 이미지" /><button class="preview-resize-handle" type="button" data-preview-resize-handle="true" aria-label="그림 크기 조절"></button>`
              : `<div class="preview-empty">오른쪽 페이지 이미지가 아직 없습니다.<br />파일 넣기 또는 Ctrl+V 붙여넣기를 사용하세요.</div>`
          }
        </div>
      </div>
    </div>
  `;
  dom.currentPreview.appendChild(wrap);
  bindPreviewImageInteraction(wrap, spread);
}

function bindPreviewImageInteraction(root, spread) {
  if (!root || !spread || !spread.rightImage) return;

  const stage = root.querySelector('[data-preview-image-stage="true"]');
  const image = root.querySelector('[data-preview-image="true"]');
  const handle = root.querySelector('[data-preview-resize-handle="true"]');
  if (!stage || !image || !handle) return;

  const updateImageOnly = () => {
    image.style.transform = buildImageTransform(spread);
    syncImageControlInputs(spread);
  };

  image.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    image.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    const startImageX = toNumber(spread.rightImageX, 0);
    const startImageY = toNumber(spread.rightImageY, 0);

    const move = (moveEvent) => {
      spread.rightImageX = Math.round(startImageX + moveEvent.clientX - startX);
      spread.rightImageY = Math.round(startImageY + moveEvent.clientY - startY);
      updateImageOnly();
    };

    const stop = () => {
      image.releasePointerCapture(event.pointerId);
      image.removeEventListener('pointermove', move);
      image.removeEventListener('pointerup', stop);
      image.removeEventListener('pointercancel', stop);
      renderTeacherPanels();
    };

    image.addEventListener('pointermove', move);
    image.addEventListener('pointerup', stop);
    image.addEventListener('pointercancel', stop);
  });

  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startY = event.clientY;
    const startScale = toNumber(spread.rightImageScale, 1);

    const move = (moveEvent) => {
      const delta = ((moveEvent.clientX - startX) + (moveEvent.clientY - startY)) / 180;
      spread.rightImageScale = Math.round(clampNumber(startScale + delta, 0.2, 5) * 100) / 100;
      updateImageOnly();
    };

    const stop = () => {
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
      renderTeacherPanels();
    };

    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  });
}

function syncImageControlInputs(spread) {
  const imageScaleInput = document.getElementById('imageScaleInput');
  const imageXInput = document.getElementById('imageXInput');
  const imageYInput = document.getElementById('imageYInput');
  const spreadImageMeta = document.getElementById('spreadImageMeta');

  if (imageScaleInput) imageScaleInput.value = String(Math.round(toNumber(spread.rightImageScale, 1) * 100) / 100);
  if (imageXInput) imageXInput.value = String(Math.round(toNumber(spread.rightImageX, 0)));
  if (imageYInput) imageYInput.value = String(Math.round(toNumber(spread.rightImageY, 0)));
  if (spreadImageMeta) {
    spreadImageMeta.textContent = buildImageStatusText(
      spread.rightImage,
      spread.rightImageScale,
      spread.rightImageX,
      spread.rightImageY,
      spread.rightImageRotation
    );
  }
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

function renderBookFlipPreview() {
  if (!dom.bookFlipPreview || !dom.bookReadinessReport) return;

  const pages = buildLogicalPages();
  const openings = buildReadingOpenings(pages);
  if (!openings.length) {
    dom.bookFlipPreview.innerHTML = '<div class="preview-empty">미리볼 페이지가 없습니다.</div>';
    dom.bookReadinessReport.innerHTML = '';
    return;
  }

  state.bookFlipIndex = clampBookFlipIndex(state.bookFlipIndex, openings.length);
  const opening = openings[state.bookFlipIndex];
  const report = buildBookReadinessReport(pages, openings);

  dom.bookFlipPreview.innerHTML = `
    <div class="book-flip-toolbar">
      <button class="toolbar-btn" type="button" data-book-flip="prev" ${state.bookFlipIndex <= 0 ? 'disabled' : ''}>이전 장</button>
      <div class="book-flip-counter">${state.bookFlipIndex + 1} / ${openings.length}</div>
      <button class="toolbar-btn" type="button" data-book-flip="next" ${state.bookFlipIndex >= openings.length - 1 ? 'disabled' : ''}>다음 장</button>
    </div>
    <div class="book-flip-title">${escapeHtml(opening.label)}</div>
    <div class="book-flip-pages ${opening.pages.length === 1 ? 'single' : ''}">
      ${opening.pages.map((page) => renderReadingPage(page)).join('')}
    </div>
  `;

  const prevBtn = dom.bookFlipPreview.querySelector('[data-book-flip="prev"]');
  const nextBtn = dom.bookFlipPreview.querySelector('[data-book-flip="next"]');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      state.bookFlipIndex = clampBookFlipIndex(state.bookFlipIndex - 1, openings.length);
      renderBookFlipPreview();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      state.bookFlipIndex = clampBookFlipIndex(state.bookFlipIndex + 1, openings.length);
      renderBookFlipPreview();
    });
  }

  dom.bookReadinessReport.className = 'teacher-preview-report book-readiness-report ' + (report.highPriorityCount ? 'warn' : 'good');
  dom.bookReadinessReport.innerHTML = `
    <h3>책자 점검</h3>
    <ul>
      <li>총 페이지: ${report.totalPages}쪽 · 책장 미리보기 ${openings.length}장면</li>
      <li>인쇄 시트: ${report.sheetCount}장 · 자동 채움 페이지 ${report.autoFillCount}쪽</li>
      <li>내용 없는 글 페이지 ${report.emptyTextCount}쪽 · 그림 없는 도안 페이지 ${report.emptyImageCount}쪽</li>
    </ul>
    ${report.issues.length
      ? `<div class="book-issue-list">${report.issues.map((issue) => `
          <div class="book-issue-item ${issue.level}">
            <strong>${escapeHtml(issue.title)}</strong>
            <span>${escapeHtml(issue.description)}</span>
          </div>
        `).join('')}</div>`
      : '<div class="issue-empty">현재 책 순서에서는 통째로 빈 펼침이나 누락된 핵심 페이지가 보이지 않습니다.</div>'}
  `;
}

function buildReadingOpenings(pages) {
  if (!Array.isArray(pages) || !pages.length) return [];

  const openings = [
    {
      label: '앞표지',
      pages: [pages[0]]
    }
  ];

  for (let index = 1; index < pages.length; index += 2) {
    const leftPage = pages[index];
    const rightPage = pages[index + 1];
    const label =
      index === 1
        ? '첫 장을 넘겼을 때'
        : rightPage
          ? `${leftPage.pageNo}-${rightPage.pageNo}쪽`
          : `${leftPage.pageNo}쪽`;

    openings.push({
      label,
      pages: [leftPage, rightPage].filter(Boolean)
    });
  }

  return openings;
}

function clampBookFlipIndex(index, count) {
  if (!count) return 0;
  return Math.min(count - 1, Math.max(0, Number.isFinite(Number(index)) ? Number(index) : 0));
}

function renderReadingPage(page) {
  const status = getPageStatus(page);
  const classes = ['book-reading-page', page.kind || 'unknown', status.empty ? 'empty-page' : ''].filter(Boolean).join(' ');

  return `
    <article class="${classes}">
      <div class="book-reading-meta">${escapeHtml(formatReadingPageLabel(page))}</div>
      ${renderReadingPageContent(page)}
      ${status.message ? `<div class="book-reading-status ${status.level}">${escapeHtml(status.message)}</div>` : ''}
    </article>
  `;
}

function renderReadingPageContent(page) {
  if (!page) return '<div class="preview-empty">페이지 없음</div>';

  if (page.kind === 'cover') {
    const coverTransform = buildCoverImageTransform(page);
    return `
      <div class="book-reading-cover">
        <div class="book-reading-image-area">
          ${page.imageSrc ? `<img src="${escapeAttr(page.imageSrc)}" style="width:100%; height:100%; object-fit:cover; transform:${coverTransform};" alt="표지 이미지" />` : '<div class="preview-empty">표지 이미지 없음</div>'}
        </div>
        <h4>${escapeHtml(page.title || '표지')}</h4>
        <p>${escapeHtml(page.subtitle || '')}</p>
      </div>
    `;
  }

  if (page.kind === 'text') {
    const fontStack = getTextFontStack(page.fontFamily);
    const lineHeight = normalizeLineHeight(page.lineHeight);
    const titleFontSize = Math.max(15, Number(page.fontSize || 24) * 0.72);
    const bodyFontSize = Math.max(12, titleFontSize - 3);
    return `
      <div class="book-reading-text" style="font-family:${fontStack};">
        <h4 style="font-size:${titleFontSize}px; text-align:${escapeAttr(page.titleAlign || 'left')};">${escapeHtml(page.title || '')}</h4>
        <p style="font-size:${bodyFontSize}px; line-height:${lineHeight}; text-align:${escapeAttr(page.textAlign || 'left')};">${renderBodyContentHtml(page.body || '', page.leadScale || 1)}</p>
      </div>
    `;
  }

  if (page.kind === 'image') {
    const imageScale = Math.max(Number(page.scale || 1), state.book.paper === 'B4' ? B4_MIN_IMAGE_SCALE : 1);
    const imageRotation = normalizeImageRotation(page.rotation);
    const frameInset = normalizeFrameInset(page.frameInset);
    const guideClass = page.guideVisible === false ? ' no-guide' : '';
    return `
      <div class="book-reading-image-stage${guideClass}" style="margin:${frameInset * 0.18}px;">
        ${
          page.imageSrc
            ? `<img src="${escapeAttr(page.imageSrc)}" style="transform:translate(calc(-50% + ${Number(page.x || 0) * 0.45}px), calc(-50% + ${Number(page.y || 0) * 0.45}px)) rotate(${imageRotation}deg) scale(${imageScale});" alt="도안 이미지" />`
            : '<div class="preview-empty">도안 이미지 없음</div>'
        }
      </div>
    `;
  }

  if (page.kind === 'story-summary') {
    return `
      <div class="book-reading-summary">
        <h4>${escapeHtml(page.title || '이야기 전체 보기')}</h4>
        ${page.entries && page.entries.length
          ? page.entries.map((entry) => `
              <section>
                <strong>${escapeHtml(entry.index + '. ' + (entry.title || '제목 없음'))}</strong>
                <p>${escapeHtml(entry.body || '').replace(/\n/g, '<br />')}</p>
              </section>
            `).join('')
          : '<div class="preview-empty">아직 모아 볼 이야기가 없습니다.</div>'}
      </div>
    `;
  }

  if (page.kind === 'image-gallery') {
    return `
      <div class="book-reading-gallery">
        <h4>${escapeHtml(page.title || '도안 모아보기')}</h4>
        <div>
          ${page.entries && page.entries.length
            ? page.entries.map((entry) => `
                <figure>
                  <img src="${escapeAttr(entry.imageSrc)}" alt="도안 ${entry.index}" />
                  <figcaption>${escapeHtml(entry.index + '. ' + (entry.title || '도안'))}</figcaption>
                </figure>
              `).join('')
            : '<div class="preview-empty">아직 모아 볼 도안이 없습니다.</div>'}
        </div>
      </div>
    `;
  }

  if (page.kind === 'back-cover') {
    return `
      <div class="book-reading-back-cover">
        <strong>${escapeHtml(page.bookTitle || state.book.title || '나의 책')}</strong>
        <span>글/그림: ${escapeHtml(page.authorName || '________')}</span>
        ${page.schoolName || page.className || page.studentNumber
          ? `<small>${escapeHtml([page.schoolName, page.className, page.studentNumber ? page.studentNumber + '번' : ''].filter(Boolean).join(' · '))}</small>`
          : ''}
      </div>
    `;
  }

  return `<div class="preview-empty">${escapeHtml(page.title || '빈 페이지')}</div>`;
}

function formatReadingPageLabel(page) {
  if (!page) return '페이지 없음';
  if (page.pageNo === 1) return '1쪽 · 앞표지';
  if (page.kind === 'back-cover') return `${page.pageNo}쪽 · 뒷표지`;
  if (page.pageNo === 2) return '2쪽 · 표지 뒷면';
  return `${page.pageNo || '-'}쪽 · ${getPageKindLabel(page)}`;
}

function getPageKindLabel(page) {
  if (!page) return '없음';
  if (page.kind === 'cover') return '표지';
  if (page.kind === 'text') return '글';
  if (page.kind === 'image') return '도안';
  if (page.kind === 'story-summary') return '이야기 전체';
  if (page.kind === 'image-gallery') return '도안 모음';
  if (page.kind === 'back-cover') return '뒷표지';
  return '빈 페이지';
}

function getPageStatus(page) {
  if (!page) {
    return { empty: true, level: 'warn', message: '페이지가 없습니다.' };
  }

  if (page.kind === 'text') {
    const hasTitle = !!normalizeString(page.title, '').trim();
    const hasBody = !!normalizeString(page.body, '').trim();
    return {
      empty: !hasTitle && !hasBody,
      level: hasBody ? 'good' : 'warn',
      message: hasBody ? '' : '본문 글이 비어 있습니다.'
    };
  }

  if (page.kind === 'image') {
    return {
      empty: !page.imageSrc,
      level: page.imageSrc ? 'good' : 'warn',
      message: page.imageSrc ? '' : '도안 이미지가 없습니다.'
    };
  }

  if (page.kind === 'cover') {
    const hasTitle = !!normalizeString(page.title, '').trim();
    return {
      empty: !hasTitle && !page.imageSrc,
      level: hasTitle ? 'good' : 'warn',
      message: hasTitle ? '' : '표지 제목이 비어 있습니다.'
    };
  }

  if (page.kind === 'story-summary') {
    return {
      empty: false,
      level: 'info',
      message: '남는 페이지에 이야기 전체를 자동으로 넣었습니다.'
    };
  }

  if (page.kind === 'image-gallery') {
    return {
      empty: false,
      level: 'info',
      message: '남는 페이지에 도안을 목차처럼 자동으로 모았습니다.'
    };
  }

  if (page.kind === 'back-cover') {
    return {
      empty: false,
      level: page.authorName ? 'good' : 'info',
      message: page.authorName ? '' : '학생 이름을 찾지 못해 이름 칸을 비워 두었습니다.'
    };
  }

  return { empty: true, level: 'info', message: '자동으로 추가된 빈 페이지입니다.' };
}

function buildBookReadinessReport(pages, openings) {
  const issues = [];
  let emptyTextCount = 0;
  let emptyImageCount = 0;

  pages.forEach((page) => {
    const status = getPageStatus(page);
    if (page.kind === 'text' && status.empty) emptyTextCount += 1;
    if (page.kind === 'image' && status.empty) emptyImageCount += 1;
  });

  const autoFillCount = pages.filter((page) => page.kind === 'story-summary' || page.kind === 'image-gallery').length;

  openings.forEach((opening, index) => {
    if (index === 0) return;

    if (opening.pages.length === 1) {
      const onlyPage = opening.pages[0];
      const onlyStatus = getPageStatus(onlyPage);
      if (onlyStatus.empty) {
        issues.push({
          level: onlyPage.kind === 'blank' && onlyPage.title === '빈 페이지' ? 'warn' : 'info',
          title: `${opening.label}이 비어 있습니다`,
          description: '책장 넘기기 미리보기에서 마지막에 단독 빈 페이지처럼 보입니다.'
        });
      }
      return;
    }

    const [leftPage, rightPage] = opening.pages;
    const leftStatus = getPageStatus(leftPage);
    const rightStatus = getPageStatus(rightPage);
    if (leftStatus.empty && rightStatus.empty) {
      issues.push({
        level: 'warn',
        title: `${opening.label} 양쪽이 비어 보입니다`,
        description: '뒷표지, 자동 채움 페이지, 내용 없는 페이지가 만나 통째로 빈 펼침처럼 보일 수 있습니다.'
      });
    }
  });

  if (autoFillCount) {
    issues.push({
      level: 'info',
      title: `자동 채움 페이지 ${autoFillCount}쪽`,
      description: '페이지 수를 4의 배수로 맞추기 위해 이야기 전체 보기와 도안 모아보기 페이지를 넣었습니다.'
    });
  }

  if (emptyImageCount) {
    issues.push({
      level: 'warn',
      title: `도안 이미지 없음 ${emptyImageCount}쪽`,
      description: '이미지 없는 도안 페이지가 있습니다. 일부러 비운 것이 아니라면 해당 펼침을 확인하세요.'
    });
  }

  if (emptyTextCount) {
    issues.push({
      level: 'info',
      title: `본문 글 없음 ${emptyTextCount}쪽`,
      description: '글이 없는 페이지는 비워 둔 채 출력됩니다.'
    });
  }

  return {
    totalPages: pages.length,
    sheetCount: buildBookletSheets(pages).length,
    autoFillCount,
    emptyTextCount,
    emptyImageCount,
    highPriorityCount: issues.filter((issue) => issue.level === 'warn').length,
    issues
  };
}

function renderTeacherPanels() {
  if (!dom.teacherSummaryCards || !dom.teacherIssueList || !dom.teacherReadinessBox || !dom.teacherPreviewReport) return;
  renderBookFlipPreview();

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
  if (dom.teacherPrintBookBtn) dom.teacherPrintBookBtn.disabled = !state.book.spreads.length;
  dom.centerAllImagesBtn.disabled = report.imageReadyCount === 0;
  dom.resetAllImagesBtn.disabled = report.imageReadyCount === 0;
  if (dom.enlargeAllImagesBtn) dom.enlargeAllImagesBtn.disabled = report.imageReadyCount === 0;
  dom.setAllTextNormalBtn.disabled = !state.book.spreads.length;
  dom.setAllTextLargeBtn.disabled = !state.book.spreads.length;
  if (dom.moveAllTextLeftBtn) dom.moveAllTextLeftBtn.disabled = !state.book.spreads.length;
  if (dom.moveAllTextRightBtn) dom.moveAllTextRightBtn.disabled = !state.book.spreads.length;
  if (dom.moveAllTextUpBtn) dom.moveAllTextUpBtn.disabled = !state.book.spreads.length;
  if (dom.moveAllTextDownBtn) dom.moveAllTextDownBtn.disabled = !state.book.spreads.length;
  if (dom.resetAllTextPositionBtn) dom.resetAllTextPositionBtn.disabled = !state.book.spreads.length;
  if (dom.decreaseAllIndentBtn) dom.decreaseAllIndentBtn.disabled = !state.book.spreads.length;
  if (dom.increaseAllIndentBtn) dom.increaseAllIndentBtn.disabled = !state.book.spreads.length;

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
  renderBookFlipPreview();
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
  renderBookFlipPreview();
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

  if (dom.teacherPrintBookBtn) {
    dom.teacherPrintBookBtn.addEventListener('click', () => {
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
        alert(`${count}개의 이미지 배율, 위치, 회전을 초기화했습니다.`);
      }
    });
  }

  if (dom.enlargeAllImagesBtn) {
    dom.enlargeAllImagesBtn.addEventListener('click', () => {
      const count = enlargeAllImages();
      if (count) {
        renderAll();
        alert(`${count}개의 이미지 페이지를 크게 맞췄습니다. 인쇄 배열에서 잘리는 부분이 없는지 한 번 확인해 주세요.`);
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

  if (dom.moveAllTextLeftBtn) {
    dom.moveAllTextLeftBtn.addEventListener('click', () => {
      shiftAllTextPosition(-8, 0);
      renderAll();
    });
  }

  if (dom.moveAllTextRightBtn) {
    dom.moveAllTextRightBtn.addEventListener('click', () => {
      shiftAllTextPosition(8, 0);
      renderAll();
    });
  }

  if (dom.moveAllTextUpBtn) {
    dom.moveAllTextUpBtn.addEventListener('click', () => {
      shiftAllTextPosition(0, -8);
      renderAll();
    });
  }

  if (dom.moveAllTextDownBtn) {
    dom.moveAllTextDownBtn.addEventListener('click', () => {
      shiftAllTextPosition(0, 8);
      renderAll();
    });
  }

  if (dom.resetAllTextPositionBtn) {
    dom.resetAllTextPositionBtn.addEventListener('click', () => {
      resetAllTextPosition();
      renderAll();
      alert('모든 글 페이지의 좌우/상하 위치를 초기화했습니다.');
    });
  }

  if (dom.decreaseAllIndentBtn) {
    dom.decreaseAllIndentBtn.addEventListener('click', () => {
      adjustAllBodyIndent(-4);
      renderAll();
    });
  }

  if (dom.increaseAllIndentBtn) {
    dom.increaseAllIndentBtn.addEventListener('click', () => {
      adjustAllBodyIndent(4);
      renderAll();
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

function normalizeTextFont(value) {
  const key = normalizeString(value, DEFAULT_TEXT_FONT);
  return Object.prototype.hasOwnProperty.call(TEXT_FONT_STACKS, key) ? key : DEFAULT_TEXT_FONT;
}

function getTextFontStack(value) {
  return TEXT_FONT_STACKS[normalizeTextFont(value)] || TEXT_FONT_STACKS[DEFAULT_TEXT_FONT];
}

function normalizeLineHeight(value) {
  const lineHeight = toNumber(value, DEFAULT_LINE_HEIGHT);
  if (lineHeight < 1.2) return 1.2;
  if (lineHeight > 2.2) return 2.2;
  return Math.round(lineHeight * 100) / 100;
}

function normalizeLeadScale(value) {
  const scale = toNumber(value, 1);
  if (scale < 1) return 1;
  if (scale > 1.8) return 1.8;
  return Math.round(scale * 100) / 100;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function normalizeImageRotation(value) {
  const rotation = ((Math.round(toNumber(value, 0) / 90) * 90) % 360 + 360) % 360;
  return [0, 90, 180, 270].includes(rotation) ? rotation : 0;
}

function rotateImage(value, delta) {
  return normalizeImageRotation(normalizeImageRotation(value) + delta);
}

function normalizeFrameInset(value) {
  return Math.round(clampNumber(toNumber(value, 0), -60, 120));
}

function buildImageTransform(spread) {
  return `translate(calc(-50% + ${Number(spread.rightImageX || 0)}px), calc(-50% + ${Number(spread.rightImageY || 0)}px)) rotate(${normalizeImageRotation(spread.rightImageRotation)}deg) scale(${Number(spread.rightImageScale || 1)})`;
}

function buildCoverImageTransform(cover) {
  const imageX = clampNumber(toNumber(cover && cover.imageX, 0), -400, 400);
  const imageY = clampNumber(toNumber(cover && cover.imageY, 0), -400, 400);
  const imageScale = clampNumber(toNumber(cover && cover.imageScale, 1), 0.2, 3);
  return `translate(calc(-50% + ${imageX}px), calc(-50% + ${imageY}px)) scale(${imageScale})`;
}

function centerCoverImage() {
  state.book.cover.imageX = 0;
  state.book.cover.imageY = 0;
  state.book.cover.imageScale = 1;
}

function normalizeCover(cover) {
  const safeCover = isPlainObject(cover) ? cover : {};
  return {
    title: normalizeString(safeCover.title, '제목 없음'),
    subtitle: normalizeString(safeCover.subtitle, ''),
    imageSrc: typeof safeCover.imageSrc === 'string' ? safeCover.imageSrc : '',
    imageX: clampNumber(toNumber(safeCover.imageX, 0), -400, 400),
    imageY: clampNumber(toNumber(safeCover.imageY, 0), -400, 400),
    imageScale: clampNumber(toNumber(safeCover.imageScale, 1), 0.2, 3)
  };
}

function normalizeSpread(item, index) {
  const safeItem = isPlainObject(item) ? item : {};

  const textAlign = normalizeString(safeItem.leftTextAlign, 'left');
  const titleAlign = normalizeString(safeItem.leftTitleAlign, textAlign);
  const verticalAlign = normalizeString(safeItem.leftVerticalAlign, 'top');

  return {
    id: normalizeString(safeItem.id, 'spread_' + (index + 1)),
    leftTitle: normalizeString(safeItem.leftTitle, `${index + 1}번째 펼침`),
    leftBody: normalizeString(safeItem.leftBody, ''),
    leftFontSize: toNumber(safeItem.leftFontSize, 24),
    leftFontWeight: normalizeString(safeItem.leftFontWeight, '400'),
    leftFontFamily: normalizeTextFont(safeItem.leftFontFamily),
    leftLineHeight: normalizeLineHeight(safeItem.leftLineHeight),
    leftTitleAlign: ['left', 'center', 'right'].includes(titleAlign) ? titleAlign : 'left',
    leftTextAlign: ['left', 'center', 'right'].includes(textAlign) ? textAlign : 'left',
    leftVerticalAlign: ['top', 'center', 'bottom'].includes(verticalAlign) ? verticalAlign : 'top',
    leftTitleOffsetY: toNumber(safeItem.leftTitleOffsetY, 0),
    leftTextOffsetX: toNumber(safeItem.leftTextOffsetX, 0),
    leftTextOffsetY: toNumber(safeItem.leftTextOffsetY, 0),
    leftBodyIndent: Math.max(0, toNumber(safeItem.leftBodyIndent, 0)),
    leftLeadScale: normalizeLeadScale(safeItem.leftLeadScale),
    leftInnerGutter: toNumber(safeItem.leftInnerGutter, DEFAULT_INNER_GUTTER),
    rightImage: typeof safeItem.rightImage === 'string' ? safeItem.rightImage : '',
    rightImageScale: toNumber(safeItem.rightImageScale, 1),
    rightImageX: toNumber(safeItem.rightImageX, 0),
    rightImageY: toNumber(safeItem.rightImageY, 0),
    rightImageRotation: normalizeImageRotation(safeItem.rightImageRotation),
    rightGuideVisible: safeItem.rightGuideVisible !== false,
    rightFrameInset: normalizeFrameInset(safeItem.rightFrameInset)
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
    kind: 'cover',
    title: state.book.cover.title,
    subtitle: state.book.cover.subtitle,
    imageSrc: state.book.cover.imageSrc,
    imageX: state.book.cover.imageX,
    imageY: state.book.cover.imageY,
    imageScale: state.book.cover.imageScale
  });

  state.book.spreads.forEach((spread) => {
    const printGutterMm = Math.round(Math.max(0, Number(spread.leftInnerGutter || DEFAULT_INNER_GUTTER)) * 0.75 * 10) / 10;

    pages.push({
      kind: 'text',
      title: spread.leftTitle,
      body: spread.leftBody,
      fontSize: spread.leftFontSize,
      fontWeight: spread.leftFontWeight,
      fontFamily: spread.leftFontFamily,
      lineHeight: spread.leftLineHeight,
      titleAlign: spread.leftTitleAlign || spread.leftTextAlign || 'left',
      textAlign: spread.leftTextAlign || 'left',
      verticalAlign: spread.leftVerticalAlign || 'top',
      titleOffsetY: spread.leftTitleOffsetY || 0,
      textOffsetX: spread.leftTextOffsetX || 0,
      textOffsetY: spread.leftTextOffsetY || 0,
      bodyIndent: spread.leftBodyIndent || 0,
      leadScale: spread.leftLeadScale || 1,
      innerGutterMm: printGutterMm
    });

    pages.push({
      kind: 'image',
      imageSrc: spread.rightImage,
      scale: spread.rightImageScale,
      x: spread.rightImageX,
      y: spread.rightImageY,
      rotation: spread.rightImageRotation,
      guideVisible: spread.rightGuideVisible,
      frameInset: spread.rightFrameInset,
      title: spread.leftTitle + ' 이미지',
      innerGutterMm: printGutterMm
    });
  });

  const backCoverPage = buildBackCoverPage();
  const fillerCount = (4 - ((pages.length + 1) % 4)) % 4;
  pages.push(...buildAutoFillPages(fillerCount));
  pages.push(backCoverPage);

  return renumberLogicalPages(pages);
}

function renumberLogicalPages(pages) {
  pages.forEach((page, index) => {
    page.pageNo = index + 1;
  });
  return pages;
}

function buildAutoFillPages(count) {
  const pages = [];
  const builders = [buildStorySummaryPage, buildImageGalleryPage];

  for (let index = 0; index < count; index += 1) {
    pages.push(builders[index % builders.length]());
  }

  return pages;
}

function buildStorySummaryPage() {
  const entries = state.book.spreads.map((spread, index) => ({
    index: index + 1,
    title: normalizeString(spread.leftTitle, `${index + 1}번째 펼침`).trim(),
    body: normalizeString(spread.leftBody, '').trim()
  })).filter((entry) => entry.title || entry.body);

  return {
    kind: 'story-summary',
    title: '이야기 전체 보기',
    entries
  };
}

function buildImageGalleryPage() {
  const entries = state.book.spreads.map((spread, index) => ({
    index: index + 1,
    title: normalizeString(spread.leftTitle, `${index + 1}번째 펼침`).trim(),
    imageSrc: spread.rightImage
  })).filter((entry) => entry.imageSrc);

  return {
    kind: 'image-gallery',
    title: '도안 모아보기',
    entries
  };
}

function buildBackCoverPage() {
  return {
    kind: 'back-cover',
    title: '뒷표지',
    ...buildBackCoverInfo()
  };
}

function buildBackCoverInfo() {
  const source = state.book && state.book.submission ? state.book.submission : {};
  const studentName = normalizeString(
    source.studentName || (dom.submitStudentNameInput && dom.submitStudentNameInput.value) || '',
    ''
  ).trim();
  const studentNumber = normalizeString(
    source.studentNumber || (dom.submitStudentNumberInput && dom.submitStudentNumberInput.value) || '',
    ''
  ).trim();
  const className = normalizeString(
    source.className || (dom.submitClassInput && dom.submitClassInput.value) || '',
    ''
  ).trim();
  const schoolName = normalizeString(
    source.schoolName || (dom.submitSchoolInput && dom.submitSchoolInput.value) || '',
    ''
  ).trim();

  return {
    bookTitle: normalizeString(state.book.cover.title || state.book.title || source.bookTitle, '새 책').trim(),
    authorName: studentName,
    studentNumber,
    className,
    schoolName,
    printedDate: formatKoreanDate(source.submittedAt || '')
  };
}

function formatKoreanDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
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

  const contentWidthMm = paper === 'B4' ? 353 : 297;
  const contentHeightMm = paper === 'B4' ? 250 : 210;
  const gapMm = 0;
  const pagePaddingMm = paper === 'B4' ? 7 : 6;
  const slotWidthMm = (contentWidthMm - gapMm) / 2;

  const html = `<!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>책 인쇄 배열</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Dodum&family=Nanum+Gothic:wght@400;700;800&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <style>
      @page {
        size: ${pageSizeCss};
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #f3f4f6;
        color: #111827;
        font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
      }

      body {
        padding: 10px;
      }

      .screen-toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        padding: 10px 12px;
        margin-bottom: 10px;
        background: rgba(255,255,255,0.96);
        border: 1px solid #dbe5f0;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
      }

      .screen-toolbar button {
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #111827;
        min-height: 38px;
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
        margin-left: auto;
        color: #64748b;
        font-size: 13px;
        line-height: 1.5;
      }

      .print-stack {
        display: grid;
        gap: 10px;
        justify-content: center;
      }

      .print-sheet-page {
        width: ${contentWidthMm}mm;
        min-width: ${contentWidthMm}mm;
        max-width: ${contentWidthMm}mm;
        background: #fff;
        margin: 0 auto;
        padding: 0;
        border: 0;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        break-after: page;
        page-break-after: always;
      }

      .print-sheet-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .sheet-face {
        width: ${contentWidthMm}mm;
        height: ${contentHeightMm}mm;
        display: grid;
        grid-template-columns: ${slotWidthMm}mm ${slotWidthMm}mm;
        column-gap: ${gapMm}mm;
        margin: 0;
      }

      .sheet-slot {
        width: ${slotWidthMm}mm;
        height: ${contentHeightMm}mm;
        min-width: 0;
        min-height: 0;
      }

      .print-page {
        width: ${slotWidthMm}mm;
        height: ${contentHeightMm}mm;
        border: 0.3mm solid #cbd5e1;
        background: #fff;
        padding: ${pagePaddingMm}mm;
        overflow: hidden;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      /* 디버그용 상단 메타는 레이아웃을 깨므로 숨김 */
      .slot-label,
      .page-meta {
        display: none !important;
      }

      .print-page h3 {
        margin: 0 0 3mm;
        font-size: 18px;
        line-height: 1.25;
      }

      .print-page p {
        margin: 0;
        line-height: 1.45;
        white-space: pre-wrap;
        font-size: 12px;
      }

      .empty {
        color: #64748b;
        display: grid;
        place-items: center;
        text-align: center;
        height: 100%;
      }

      .cover-page {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        gap: 5mm;
      }

      .cover-image-box {
        min-height: 0;
        position: relative;
        border: 0.3mm dashed #cbd5e1;
        border-radius: 2mm;
        background: #f8fafc;
        overflow: hidden;
      }

      .cover-text-box {
        text-align: center;
        padding: 0 2mm 1mm;
      }

      .cover-text-box h3 {
        margin: 0 0 2mm;
        font-size: 26px;
        line-height: 1.18;
      }

      .cover-text-box p {
        text-align: center;
        font-size: 15px;
        line-height: 1.45;
      }

      .image-page .image-stage {
        flex: 1 1 auto;
        min-height: 0;
        position: relative;
        border: 0.3mm dashed #cbd5e1;
        border-radius: 2mm;
        background: #f8fafc;
        overflow: hidden;
      }

      .image-page {
        padding: 0;
      }

      .image-page .image-stage.no-guide {
        border-color: transparent;
        background: #fff;
      }

      .print-page img {
        position: absolute;
        top: 50%;
        left: 50%;
        max-width: 100%;
        max-height: 100%;
        transform-origin: center center;
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
    width: ${contentWidthMm}mm !important;
    min-width: ${contentWidthMm}mm !important;
    max-width: ${contentWidthMm}mm !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    box-shadow: none !important;
    break-after: page !important;
    page-break-after: always !important;
  }

  .print-sheet-page:last-child {
    break-after: auto !important;
    page-break-after: auto !important;
  }

  .sheet-face {
    width: ${contentWidthMm}mm !important;
    height: ${contentHeightMm}mm !important;
    grid-template-columns: ${slotWidthMm}mm ${slotWidthMm}mm !important;
    column-gap: ${gapMm}mm !important;
    margin: 0 !important;
  }

  .sheet-slot {
    width: ${slotWidthMm}mm !important;
    height: ${contentHeightMm}mm !important;
  }

  .print-page {
    width: ${slotWidthMm}mm !important;
    height: ${contentHeightMm}mm !important;
    padding: ${pagePaddingMm}mm !important;
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
  }

  .image-page {
    padding: 0 !important;
  }

  .cover-image-box {
    margin-top: 0 !important;
  }

  .cover-image-box,
  .image-page .image-stage {
    border: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
  }
}

    </style>
  </head>
  <body>
    <div class="screen-toolbar">
      <button class="primary" onclick="window.print()">인쇄하기</button>
      <button onclick="window.close()">닫기</button>
      <div class="print-note">${paper} 가로 · 배율 100% · 여백 없음으로 인쇄하세요. B4는 그림과 글을 자동 확대하지만, 프린터 용지도 B4로 맞춰야 크게 나옵니다.</div>
    </div>

    <div class="print-stack">
      ${sheets.map((sheet) => `
        <section class="print-sheet-page">
          ${renderPrintFace(sheet.front, '앞면')}
        </section>
        <section class="print-sheet-page">
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
        <div class="empty">페이지 없음</div>
      </div>
    `;
  }

  const pageMeta = page.pageNo ? `책 페이지 ${page.pageNo}` : '보조 페이지';

  if (page.kind === 'cover') {
  const coverTransform = buildCoverImageTransform(page);
  return `
    <div class="print-page cover-page">
      <div class="page-meta">${pageMeta} · 표지</div>
      <div class="cover-image-box">
        ${page.imageSrc ? `<img src="${escapeAttr(page.imageSrc)}" style="width:100%; height:100%; object-fit:cover; transform:${coverTransform};" alt="표지 이미지" />` : `<div class="empty">표지 이미지 없음</div>`}
      </div>
      <div class="cover-text-box">
        <h3>${escapeHtml(page.title || '표지')}</h3>
        <p>${escapeHtml(page.subtitle || '')}</p>
      </div>
    </div>
  `;
}


  if (page.kind === 'text') {
    const justifyContent =
      page.verticalAlign === 'center'
        ? 'center'
        : page.verticalAlign === 'bottom'
          ? 'flex-end'
          : 'flex-start';

    const textAlign = ['left', 'center', 'right'].includes(page.textAlign) ? page.textAlign : 'left';
    const titleAlign = ['left', 'center', 'right'].includes(page.titleAlign) ? page.titleAlign : textAlign;
    const gutterMm = Math.max(0, Number(page.innerGutterMm || 0));
    const fontStack = getTextFontStack(page.fontFamily);
    const lineHeight = normalizeLineHeight(page.lineHeight);
    const textOffsetX = toNumber(page.textOffsetX, 0);
    const textOffsetY = toNumber(page.textOffsetY, 0);
    const bodyIndent = Math.max(0, toNumber(page.bodyIndent, 0));
    const leadScale = normalizeLeadScale(page.leadScale);
    const printTextScale = state.book.paper === 'B4' ? B4_TEXT_SCALE : 1;
    const titleFontSize = Number(page.fontSize || 24) * printTextScale;
    const bodyFontSize = Math.max(16, titleFontSize - 4);
    const gutterStyle = String(slotLabel || '').includes('왼쪽')
      ? `padding-right:${gutterMm}mm;`
      : String(slotLabel || '').includes('오른쪽')
        ? `padding-left:${gutterMm}mm;`
        : '';

    return `
      <div class="print-page text-page">
        <div
          style="
            height:100%;
            display:flex;
            flex-direction:column;
            justify-content:${justifyContent};
            box-sizing:border-box;
            font-family:${fontStack};
            transform:translate(${textOffsetX}px, ${textOffsetY}px);
            ${gutterStyle}
          "
        >
          <div class="page-meta">${pageMeta} · 텍스트 페이지</div>
          <h3
            style="
              font-size:${titleFontSize}px;
              font-weight:${escapeAttr(page.fontWeight || '400')};
              text-align:${escapeAttr(titleAlign)};
              margin-top:${Number(page.titleOffsetY || 0)}px;
              margin-bottom:10px;
            "
          >
            ${escapeHtml(page.title || '')}
          </h3>
          <p
            style="
              font-size:${bodyFontSize}px;
              font-weight:${escapeAttr(page.fontWeight || '400')};
              text-align:${escapeAttr(textAlign)};
              text-indent:${bodyIndent}px;
              line-height:${lineHeight};
              margin:0;
            "
          >
            ${renderBodyContentHtml(page.body || '', leadScale)}
          </p>
        </div>
      </div>
    `;
  }

  if (page.kind === 'image') {
    const imageScale = Math.max(Number(page.scale || 1), state.book.paper === 'B4' ? B4_MIN_IMAGE_SCALE : 1);
    const imageRotation = normalizeImageRotation(page.rotation);
    const guideClass = page.guideVisible === false ? ' no-guide' : '';
    const frameInsetMm = Math.round(normalizeFrameInset(page.frameInset) * 0.25 * 10) / 10;

    return `
      <div class="print-page image-page">
        <div
          style="
            height:100%;
            display:flex;
            flex-direction:column;
            box-sizing:border-box;
          "
        >
          <div class="page-meta">${pageMeta} · 이미지 페이지</div>
          <div
            class="image-stage${guideClass}"
            style="
              flex:1 1 auto;
              min-height:0;
              position:relative;
              overflow:hidden;
              margin:${frameInsetMm}mm;
            "
          >
            ${
              page.imageSrc
                ? `<img src="${escapeAttr(page.imageSrc)}" style="transform: translate(calc(-50% + ${Number(page.x || 0)}px), calc(-50% + ${Number(page.y || 0)}px)) rotate(${imageRotation}deg) scale(${imageScale});" alt="이미지 페이지" />`
                : `<div class="empty">이미지 없음</div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  if (page.kind === 'story-summary') {
    return `
      <div class="print-page story-summary-page" style="padding:7mm; display:flex; flex-direction:column;">
        <div class="page-meta">${pageMeta} · 이야기 전체</div>
        <h3 style="font-size:16px; margin-bottom:4mm;">${escapeHtml(page.title || '이야기 전체 보기')}</h3>
        <div style="font-size:8.5px; line-height:1.45; columns:2; column-gap:6mm; overflow:hidden;">
          ${page.entries && page.entries.length
            ? page.entries.map((entry) => `
                <section style="break-inside:avoid; margin:0 0 3mm;">
                  <strong style="display:block; font-size:9.5px; margin-bottom:1mm;">${escapeHtml(entry.index + '. ' + (entry.title || '제목 없음'))}</strong>
                  <p style="font-size:8.5px; line-height:1.45; margin:0; white-space:pre-wrap;">${escapeHtml(entry.body || '')}</p>
                </section>
              `).join('')
            : '<div class="empty">아직 모아 볼 이야기가 없습니다.</div>'}
        </div>
      </div>
    `;
  }

  if (page.kind === 'image-gallery') {
    return `
      <div class="print-page image-gallery-page" style="padding:7mm; display:flex; flex-direction:column;">
        <div class="page-meta">${pageMeta} · 도안 모음</div>
        <h3 style="font-size:16px; margin-bottom:4mm;">${escapeHtml(page.title || '도안 모아보기')}</h3>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3mm; min-height:0; flex:1 1 auto;">
          ${page.entries && page.entries.length
            ? page.entries.map((entry) => `
                <figure style="margin:0; min-height:0; display:grid; grid-template-rows:minmax(0, 1fr) auto; gap:1mm; border:0.25mm solid #e5e7eb; padding:1.5mm;">
                  <img src="${escapeAttr(entry.imageSrc)}" alt="도안 ${entry.index}" style="position:static; width:100%; height:100%; max-width:100%; max-height:100%; object-fit:contain; transform:none;" />
                  <figcaption style="font-size:7.5px; line-height:1.25; text-align:center; color:#475569;">${escapeHtml(entry.index + '. ' + (entry.title || '도안'))}</figcaption>
                </figure>
              `).join('')
            : '<div class="empty">아직 모아 볼 도안이 없습니다.</div>'}
        </div>
      </div>
    `;
  }

  if (page.kind === 'back-cover') {
    const schoolLine = [page.schoolName, page.className, page.studentNumber ? page.studentNumber + '번' : ''].filter(Boolean).join(' · ');
    return `
      <div class="print-page back-cover-page" style="justify-content:flex-end; align-items:stretch; padding:8mm;">
        <div style="margin-top:auto; border-top:0.35mm solid #111827; padding-top:4mm; display:grid; gap:2mm;">
          <div style="font-size:11px; color:#64748b;">${escapeHtml(page.bookTitle || state.book.title || '나의 책')}</div>
          <div style="font-size:18px; font-weight:800; color:#111827;">글/그림: ${escapeHtml(page.authorName || '________')}</div>
          ${schoolLine ? `<div style="font-size:11px; color:#334155;">${escapeHtml(schoolLine)}</div>` : ''}
          ${page.printedDate ? `<div style="font-size:9px; color:#94a3b8;">${escapeHtml(page.printedDate)}</div>` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div class="print-page blank-page">
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

function splitLeadText(text) {
  const source = normalizeString(text, '');
  if (!source.trim()) return { lead: '', rest: '' };

  const sentenceMatch = source.match(/^(\s*[^.!?\n。！？]{1,90}[.!?。！？])([\s\S]*)$/);
  if (sentenceMatch) {
    return { lead: sentenceMatch[1], rest: sentenceMatch[2] || '' };
  }

  const lineBreakIndex = source.indexOf('\n');
  if (lineBreakIndex > 0 && lineBreakIndex <= 90) {
    return {
      lead: source.slice(0, lineBreakIndex),
      rest: source.slice(lineBreakIndex)
    };
  }

  const fallbackLength = Math.min(28, source.length);
  return {
    lead: source.slice(0, fallbackLength),
    rest: source.slice(fallbackLength)
  };
}

function renderBodyContentHtml(text, leadScale = 1) {
  const source = normalizeString(text, '');
  const scale = normalizeLeadScale(leadScale);

  if (!source || scale <= 1.01) {
    return escapeHtml(source).replace(/\n/g, '<br />');
  }

  const parts = splitLeadText(source);
  if (!parts.lead) {
    return escapeHtml(source).replace(/\n/g, '<br />');
  }

  return `<span class="lead-text" style="font-size:${scale.toFixed(2)}em; font-weight:800; line-height:1.18;">${escapeHtml(parts.lead)}</span>${escapeHtml(parts.rest).replace(/\n/g, '<br />')}`;
}

function buildSpreadSummary(spread) {
  const title = normalizeString(spread.leftTitle, '제목 없음').trim() || '제목 없음';
  const bodyStats = getTextStats(spread.leftBody);
  const imageLabel = spread.rightImage ? '이미지 있음' : '이미지 없음';
  return `${title} · 본문 ${bodyStats.chars}자 · ${imageLabel}`;
}

function buildImageStatusText(imageSrc, scale, x, y, rotation = 0) {
  if (!imageSrc) {
    return '이미지가 아직 없습니다. 파일 넣기 또는 Ctrl+V 붙여넣기를 사용하세요.';
  }
  return `이미지 준비됨 · 배율 ${Number(scale || 1).toFixed(1)} · X ${Number(x || 0)} · Y ${Number(y || 0)} · 회전 ${normalizeImageRotation(rotation)}도`;
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
    spread.rightImageRotation = 0;
    count += 1;
  });
  return count;
}

function enlargeAllImages(targetScale = 1.18) {
  let count = 0;
  state.book.spreads.forEach((spread) => {
    if (!spread.rightImage) return;
    spread.rightImageScale = Math.max(toNumber(spread.rightImageScale, 1), targetScale);
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

function shiftAllTextPosition(deltaX, deltaY) {
  state.book.spreads.forEach((spread) => {
    spread.leftTextOffsetX = clampNumber(toNumber(spread.leftTextOffsetX, 0) + deltaX, -160, 160);
    spread.leftTextOffsetY = clampNumber(toNumber(spread.leftTextOffsetY, 0) + deltaY, -160, 160);
  });
}

function resetAllTextPosition() {
  state.book.spreads.forEach((spread) => {
    spread.leftTextOffsetX = 0;
    spread.leftTextOffsetY = 0;
  });
}

function adjustAllBodyIndent(delta) {
  state.book.spreads.forEach((spread) => {
    spread.leftBodyIndent = clampNumber(toNumber(spread.leftBodyIndent, 0) + delta, 0, 80);
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

function injectInteractiveImageStyles() {
  if (document.getElementById('interactiveImageStyles')) return;

  const style = document.createElement('style');
  style.id = 'interactiveImageStyles';
  style.textContent = `
    .preview-image-stage {
      border: 1px dashed #b9cdea;
      border-radius: 10px;
    }

    .preview-cover-image {
      position: relative;
      overflow: hidden;
      background: #f1f5f9;
    }

    .preview-cover-image img {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform-origin: center center;
    }

    .preview-image-stage.no-guide {
      background: #fff !important;
      border-color: transparent !important;
    }

    .interactive-image-stage {
      cursor: grab;
    }

    .interactive-image-stage:active {
      cursor: grabbing;
    }

    .preview-image-stage img {
      user-select: none;
      touch-action: none;
    }

    .preview-resize-handle {
      position: absolute;
      right: 10px;
      bottom: 10px;
      width: 22px;
      height: 22px;
      border: 2px solid #2563eb;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.22);
      cursor: nwse-resize;
      touch-action: none;
      z-index: 5;
    }

    .preview-resize-handle::before {
      content: "";
      position: absolute;
      right: 4px;
      bottom: 4px;
      width: 8px;
      height: 8px;
      border-right: 2px solid #2563eb;
      border-bottom: 2px solid #2563eb;
    }

    .book-flip-preview {
      display: grid;
      gap: 12px;
    }

    .book-flip-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 8px;
      align-items: center;
    }

    .book-flip-counter,
    .book-flip-title {
      text-align: center;
      font-weight: 800;
      color: #334155;
    }

    .book-flip-title {
      font-size: 13px;
      color: #64748b;
    }

    .book-flip-pages {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      align-items: stretch;
    }

    .book-flip-pages.single {
      grid-template-columns: minmax(0, 0.72fr);
      justify-content: center;
    }

    .book-reading-page {
      min-height: 260px;
      aspect-ratio: 210 / 297;
      border: 1px solid #d8e1f0;
      border-radius: 12px;
      background: #fff;
      padding: 10px;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 8px;
      position: relative;
    }

    .book-reading-page.empty-page {
      background: #f8fafc;
    }

    .book-reading-meta {
      font-size: 11px;
      font-weight: 800;
      color: #64748b;
    }

    .book-reading-cover,
    .book-reading-text,
    .book-reading-summary,
    .book-reading-gallery,
    .book-reading-back-cover {
      min-height: 0;
      overflow: hidden;
    }

    .book-reading-cover {
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto auto;
      gap: 8px;
      text-align: center;
    }

    .book-reading-cover h4,
    .book-reading-text h4,
    .book-reading-summary h4,
    .book-reading-gallery h4 {
      margin: 0 0 6px;
      line-height: 1.25;
    }

    .book-reading-cover p,
    .book-reading-text p,
    .book-reading-summary p {
      margin: 0;
      white-space: pre-wrap;
    }

    .book-reading-summary {
      font-size: 11px;
      line-height: 1.45;
      display: grid;
      gap: 6px;
      align-content: start;
    }

    .book-reading-summary section {
      display: grid;
      gap: 2px;
    }

    .book-reading-gallery {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 6px;
    }

    .book-reading-gallery > div {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
      min-height: 0;
    }

    .book-reading-gallery figure {
      margin: 0;
      min-height: 0;
      display: grid;
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 3px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 4px;
    }

    .book-reading-gallery figure img {
      position: static;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transform: none;
    }

    .book-reading-gallery figcaption {
      font-size: 10px;
      line-height: 1.25;
      text-align: center;
      color: #64748b;
    }

    .book-reading-back-cover {
      display: grid;
      align-content: end;
      gap: 6px;
      border-top: 2px solid #111827;
      padding-top: 10px;
      font-size: 13px;
    }

    .book-reading-back-cover span,
    .book-reading-back-cover small {
      display: block;
    }

    .book-reading-image-area,
    .book-reading-image-stage {
      min-height: 0;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
    }

    .book-reading-image-area img,
    .book-reading-image-stage img {
      position: absolute;
      top: 50%;
      left: 50%;
      max-width: 100%;
      max-height: 100%;
      transform: translate(-50%, -50%);
      transform-origin: center center;
    }

    .book-reading-image-stage.no-guide {
      background: #fff;
      border-color: transparent;
    }

    .book-reading-status {
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 11px;
      line-height: 1.4;
      font-weight: 800;
    }

    .book-reading-status.warn,
    .book-issue-item.warn {
      background: #fff7ed;
      color: #9a3412;
      border: 1px solid #fed7aa;
    }

    .book-reading-status.info,
    .book-issue-item.info {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .book-readiness-report.good {
      border-color: #bbf7d0;
      background: #f0fdf4;
    }

    .book-readiness-report.warn {
      border-color: #fed7aa;
      background: #fffaf5;
    }

    .book-issue-list {
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }

    .book-issue-item {
      display: grid;
      gap: 3px;
      border-radius: 10px;
      padding: 9px 10px;
      font-size: 12px;
      line-height: 1.5;
    }

    .book-issue-item span {
      color: inherit;
      opacity: 0.88;
    }

    body.teacher-mode .preview-root {
      align-content: start;
    }

    body.teacher-mode .teacher-print-focus {
      order: 0;
      border-color: #c4b5fd;
      box-shadow: 0 14px 34px rgba(79, 70, 229, 0.1);
    }

    body.teacher-mode #bookReadinessReport {
      order: 1;
    }

    body.teacher-mode #teacherPreviewReport {
      order: 2;
    }

    body.teacher-mode #currentPreview {
      order: 3;
    }

    body.teacher-mode .preview-root > .booklet-box:not(.teacher-print-focus) {
      order: 4;
    }

    body.student-mode .teacher-print-focus {
      border-color: #dbe7f7;
    }
  `;
  document.head.appendChild(style);
}

async function init() {
  injectInteractiveImageStyles();
  setMode('student');
  bindTopEvents();
  renderAll();
  await handleInitialRemoteLoad();
}

init();
