const state = {
  mode: 'student',
  selectedPageId: null,
  project: {
    title: '새 프로젝트',
    paper: 'A4',
    pages: []
  },
  error: ''
};

const dom = {
  studentModeBtn: document.getElementById('studentModeBtn'),
  teacherModeBtn: document.getElementById('teacherModeBtn'),
  modeStatusBadge: document.getElementById('modeStatusBadge'),
  addPageBtn: document.getElementById('addPageBtn'),
  imageInput: document.getElementById('imageInput'),
  jsonInput: document.getElementById('jsonInput'),
  pageList: document.getElementById('pageList'),
  pageCountBadge: document.getElementById('pageCountBadge'),
  previewImage: document.getElementById('previewImage'),
  previewPlaceholder: document.getElementById('previewPlaceholder'),
  previewCaption: document.getElementById('previewCaption'),
  studentPanel: document.getElementById('studentPanel'),
  teacherPanel: document.getElementById('teacherPanel'),
  teacherPageNameInput: document.getElementById('teacherPageNameInput'),
  teacherScaleInput: document.getElementById('teacherScaleInput'),
  teacherPaperSelect: document.getElementById('teacherPaperSelect'),
  teacherOffsetXInput: document.getElementById('teacherOffsetXInput'),
  teacherOffsetYInput: document.getElementById('teacherOffsetYInput')
};

function makePageId() {
  return 'page_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

function createPage(index) {
  return {
    id: makePageId(),
    name: `${index}페이지`,
    imageSrc: '',
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    paper: 'A4'
  };
}

function getSelectedPage() {
  return state.project.pages.find((page) => page.id === state.selectedPageId) || null;
}

function setError(message) {
  state.error = message || '';
  renderError();
}

function ensureErrorBox() {
  let box = document.getElementById('errorBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'errorBox';
    box.className = 'error-box';
    box.hidden = true;
    dom.studentPanel.appendChild(box);
  }
  return box;
}

function renderError() {
  const box = ensureErrorBox();
  box.hidden = !state.error;
  box.textContent = state.error;
}

function setMode(mode) {
  const isStudent = mode === 'student';
  state.mode = isStudent ? 'student' : 'teacher';

  dom.studentModeBtn.setAttribute('aria-pressed', String(isStudent));
  dom.teacherModeBtn.setAttribute('aria-pressed', String(!isStudent));

  dom.studentModeBtn.classList.toggle('student-active', isStudent);
  dom.teacherModeBtn.classList.toggle('teacher-active', !isStudent);

  dom.studentPanel.hidden = !isStudent;
  dom.teacherPanel.hidden = isStudent;

  dom.modeStatusBadge.textContent = isStudent ? '현재 모드: 학생' : '현재 모드: 선생님';
  dom.modeStatusBadge.className = isStudent ? 'badge student' : 'badge teacher';
}

function renderPageList() {
  dom.pageList.innerHTML = '';

  state.project.pages.forEach((page) => {
    const li = document.createElement('li');
    li.className = 'page-item' + (page.id === state.selectedPageId ? ' active' : '');
    li.dataset.pageId = page.id;

    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `
      <span class="page-name">${escapeHtml(page.name)}</span>
      <span class="page-meta">${page.id === state.selectedPageId ? '선택됨 · ' : ''}${page.imageSrc ? '이미지 있음' : '이미지 없음'}</span>
    `;

    button.addEventListener('click', () => {
      state.selectedPageId = page.id;
      renderAll();
    });

    li.appendChild(button);
    dom.pageList.appendChild(li);
  });

  dom.pageCountBadge.textContent = `${state.project.pages.length} 페이지`;
}

function renderPreview() {
  const page = getSelectedPage();

  if (!page) {
    dom.previewImage.style.display = 'none';
    dom.previewPlaceholder.style.display = 'grid';
    dom.previewPlaceholder.innerHTML = '<div><strong>선택된 페이지가 없습니다.</strong><br />왼쪽 목록에서 페이지를 선택하세요.</div>';
    dom.previewCaption.textContent = '현재 선택 페이지: 없음';
    return;
  }

  dom.previewCaption.textContent = `현재 선택 페이지: ${page.name}`;

  if (page.imageSrc) {
    dom.previewImage.src = page.imageSrc;
    dom.previewImage.style.display = 'block';
    dom.previewPlaceholder.style.display = 'none';
    dom.previewImage.style.transform = `translate(calc(-50% + ${Number(page.imageX || 0)}px), calc(-50% + ${Number(page.imageY || 0)}px)) scale(${Number(page.imageScale || 1)})`;
  } else {
    dom.previewImage.removeAttribute('src');
    dom.previewImage.style.display = 'none';
    dom.previewPlaceholder.style.display = 'grid';
    dom.previewPlaceholder.innerHTML = '<div><strong>아직 이미지가 없습니다.</strong><br />이미지 불러오기를 눌러 현재 페이지에 이미지를 넣어주세요.</div>';
  }
}

function renderTeacherPanel() {
  const page = getSelectedPage();
  if (!page) return;
  dom.teacherPageNameInput.value = page.name || '';
  dom.teacherScaleInput.value = page.imageScale ?? 1;
  dom.teacherPaperSelect.value = page.paper || state.project.paper || 'A4';
  dom.teacherOffsetXInput.value = page.imageX ?? 0;
  dom.teacherOffsetYInput.value = page.imageY ?? 0;
}

function renderAll() {
  renderPageList();
  renderPreview();
  renderTeacherPanel();
  renderError();
}

function addPage() {
  const page = createPage(state.project.pages.length + 1);
  state.project.pages.push(page);
  state.selectedPageId = page.id;
  setError('');
  renderAll();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('이미지 파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('JSON 파일을 읽지 못했습니다.'));
    reader.readAsText(file, 'utf-8');
  });
}

function normalizePage(rawPage, index) {
  return {
    id: String(rawPage.id || makePageId()),
    name: String(rawPage.name || `${index + 1}페이지`),
    imageSrc: typeof rawPage.imageSrc === 'string' ? rawPage.imageSrc : '',
    imageScale: isFinite(Number(rawPage.imageScale)) ? Number(rawPage.imageScale) : 1,
    imageX: isFinite(Number(rawPage.imageX)) ? Number(rawPage.imageX) : 0,
    imageY: isFinite(Number(rawPage.imageY)) ? Number(rawPage.imageY) : 0,
    paper: rawPage.paper === 'B4' ? 'B4' : 'A4'
  };
}

function validateProject(data) {
  if (!data || typeof data !== 'object') throw new Error('JSON 루트는 객체여야 합니다.');
  if (!Array.isArray(data.pages)) throw new Error('JSON 안에 pages 배열이 필요합니다.');

  const pages = data.pages.map((page, index) => normalizePage(page, index));
  if (!pages.length) throw new Error('pages 배열은 최소 1개 이상의 페이지가 필요합니다.');

  return {
    title: typeof data.title === 'string' ? data.title : '불러온 프로젝트',
    paper: data.paper === 'B4' ? 'B4' : 'A4',
    pages
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function handleImageChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const page = getSelectedPage();
  if (!page) {
    setError('먼저 페이지를 선택하거나 화면을 추가하세요.');
    event.target.value = '';
    return;
  }

  try {
    const imageSrc = await readFileAsDataURL(file);
    page.imageSrc = imageSrc;
    setError('');
    renderAll();
  } catch (error) {
    setError(error.message || '이미지 불러오기에 실패했습니다.');
  } finally {
    event.target.value = '';
  }
}

async function handleJsonChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const text = await readFileAsText(file);
    const data = JSON.parse(text);
    state.project = validateProject(data);
    state.selectedPageId = state.project.pages[0].id;
    setError('');
    renderAll();
  } catch (error) {
    setError(error.message || 'JSON 불러오기에 실패했습니다.');
  } finally {
    event.target.value = '';
  }
}

function bindTeacherInputs() {
  dom.teacherPageNameInput.addEventListener('input', () => {
    const page = getSelectedPage();
    if (!page) return;
    page.name = dom.teacherPageNameInput.value.trim() || '이름 없는 페이지';
    renderAll();
  });

  dom.teacherScaleInput.addEventListener('input', () => {
    const page = getSelectedPage();
    if (!page) return;
    const value = Number(dom.teacherScaleInput.value);
    page.imageScale = value > 0 ? value : 1;
    renderPreview();
  });

  dom.teacherPaperSelect.addEventListener('change', () => {
    const page = getSelectedPage();
    if (!page) return;
    page.paper = dom.teacherPaperSelect.value === 'B4' ? 'B4' : 'A4';
  });

  dom.teacherOffsetXInput.addEventListener('input', () => {
    const page = getSelectedPage();
    if (!page) return;
    page.imageX = Number(dom.teacherOffsetXInput.value) || 0;
    renderPreview();
  });

  dom.teacherOffsetYInput.addEventListener('input', () => {
    const page = getSelectedPage();
    if (!page) return;
    page.imageY = Number(dom.teacherOffsetYInput.value) || 0;
    renderPreview();
  });
}

function bindEvents() {
  dom.studentModeBtn.addEventListener('click', () => setMode('student'));
  dom.teacherModeBtn.addEventListener('click', () => setMode('teacher'));
  dom.addPageBtn.addEventListener('click', addPage);
  dom.imageInput.addEventListener('change', handleImageChange);
  dom.jsonInput.addEventListener('change', handleJsonChange);
  bindTeacherInputs();
}

function init() {
  addPage();
  bindEvents();
  setMode('student');
  renderAll();
}

init();
