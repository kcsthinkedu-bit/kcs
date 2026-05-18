
    const STORAGE_KEY = 'coloringbook_ppt_slide_studio_v20_14';
    const LEGACY_KEYS = [
      'coloringbook_ppt_slide_studio_v20_12',
      'coloringbook_ppt_slide_studio_v20_9',
      'coloringbook_ppt_slide_studio_v20_8',
      'coloringbook_ppt_slide_studio_v20_7',
      'coloringbook_ppt_slide_studio_v20_6',
      'coloringbook_ppt_slide_studio_v20_5',
      'coloringbook_ppt_slide_studio_v20_4',
      'coloringbook_ppt_slide_studio_v20_3',
      'coloringbook_ppt_slide_studio_v20_2',
      'coloringbook_ppt_slide_studio_v20_1',
      'coloringbook_ppt_slide_studio_v20',
      'coloringbook_ppt_slide_studio_v19',
      'coloringbook_ppt_slide_studio_v18',
      'coloringbook_ppt_slide_studio_v17',
      'coloringbook_ppt_slide_studio_v16',
      'coloringbook_ppt_multi_frame_v10',
      'coloringbook_vertical_book_flow_v9',
      'coloringbook_simple_editor_v8_book_studio',
      'coloringbook_simple_editor_v7'
    ];
    const PREVIOUS_EDITOR_URL = 'computer:///mnt/user-data/outputs/coloringbook-editor/index-v20-13-grade-filler-cover-balance.html';
    const SIDEBAR_STORAGE_KEY = 'coloringbook_ppt_slide_studio_v20_14_sidebar';
    const GROUP_STORAGE_KEY = 'coloringbook_ppt_slide_studio_v20_14_groups';
    const TOPBAR_STORAGE_KEY = 'coloringbook_ppt_slide_studio_v20_14_topbar_compact';
    const FONT_FAMILY_MAP = {
      'noto-sans-kr': "'Noto Sans KR', sans-serif",
      'nanum-gothic': "'Nanum Gothic', sans-serif",
      'gowun-dodum': "'Gowun Dodum', sans-serif",
      'black-han-sans': "'Black Han Sans', sans-serif"
    };
    const IMAGE_FRAME_MAP = {
      none: { border: '0px solid transparent', radius: '0px', shadow: 'none' },
      line: { border: '1.5px solid #d7e0ea', radius: '0px', shadow: 'none' },
      rounded: { border: '1.5px solid #d7e0ea', radius: '18px', shadow: '0 8px 18px rgba(35, 49, 65, .06)' },
      dashed: { border: '2px dashed #bfd0e4', radius: '18px', shadow: 'none' },
      dark: { border: '2px solid #314055', radius: '14px', shadow: '0 12px 22px rgba(27, 37, 51, .10)' }
    };
    const FILLER_PROFILE_LABELS = { kindergarten: '유치', elementary: '초', middle: '중', high: '고' };
    const FILLER_PROFILE_PAGES = {
      kindergarten: [
        { title: '이야기 끝!', body: '와, 이야기 여행이 끝났어요!\n가장 재미있었던 장면에 동그라미를 해 보세요.\n주인공에게 “고마워!” 한마디를 적어 보세요.' },
        { title: '내 색칠책 기록', body: '이름: __________\n오늘 기분: 😊 😐 😍\n마음에 드는 색: __________\n아래 빈 곳에 작은 그림을 하나 더 그려 보세요.' }
      ],
      elementary: [
        { title: '이야기 마무리', body: '이야기를 다 읽었어요.\n가장 기억에 남는 장면은 무엇인가요?\n주인공에게 해주고 싶은 말을 적어 보세요.' },
        { title: '내 컬러링북 기록', body: '이름: __________\n완성한 날: __________\n가장 재미있었던 장면: __________\n한 줄 소감: ____________________' }
      ],
      middle: [
        { title: '생각 정리 노트', body: '이야기에서 가장 인상 깊었던 장면은?\n그 장면이 기억에 남는 이유는?\n주인공의 선택 중 공감한 부분을 적어 보세요.' },
        { title: '독자 기록', body: '이름: __________\n완독 날짜: __________\n책의 주제를 한 문장으로 정리하면?\n다시 그리고 싶은 장면: __________' }
      ],
      high: [
        { title: '읽고 난 뒤', body: '가장 핵심적인 장면은 무엇이었나요?\n이 작품이 전하는 메시지를 한 문장으로 정리해 보세요.\n표지 색과 본문 분위기가 어떻게 연결되는지도 적어 보세요.' },
        { title: '독자 메모', body: '이름: __________\n날짜: __________\n기억에 남는 문장 또는 장면: __________\n자유 메모: ____________________' }
      ]
    };
    const TEMPLATE_LABELS = {
      cover: {
        'title-top': '제목 상단형',
        'centered-title': '중앙 타이틀형',
        'author-band': '저자 강조형'
      },
      inner: {
        classic: '기본 읽기형',
        boxed: '카드 박스형',
        airy: '여백 강조형'
      },
      back: {
        'closing-note': '중앙 마무리형',
        'author-signoff': '저자 서명형',
        minimal: '하단 문장형'
      }
    };

    function uid() {
      return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'id-' + Math.random().toString(36).slice(2, 11);
    }

    function createBlankSpread(order) {
      return { id: uid(), title: `새 장면 ${order}`, story: '', image: '', note: '' };
    }

    function defaultTypography() {
      return {
        fontFamily: 'noto-sans-kr',
        textEffect: 'none',
        imageFrameStyle: 'none',
        bindingMargin: 8,
        coverImageOffsetY: 0,
        fillerProfile: 'elementary',
        titleSize: 28,
        bodySize: 18,
        noteSize: 14,
        titleWeight: 900,
        bodyWeight: 400
      };
    }

    function defaultTemplates() {
      return {
        cover: 'title-top',
        inner: 'classic',
        back: 'closing-note'
      };
    }

    function defaultState() {
      return {
        project: {
          title: '달빛 숲 컬러링북',
          subtitle: '숲 친구들과 떠나는 반짝이는 밤 여행',
          authorName: '김하늘',
          backCoverText: '마지막 장까지 색칠하며 나만의 이야기책을 완성해 보세요.',
          coverImage: '',
          templates: defaultTemplates(),
          typography: defaultTypography()
        },
        spreads: [createBlankSpread(1)],
        lastSavedAt: null
      };
    }

    function hydrateState(raw) {
      const base = defaultState();
      const spreads = Array.isArray(raw && raw.spreads) && raw.spreads.length
        ? raw.spreads.map((s, i) => ({
            id: s.id || uid(),
            title: s.title || `새 장면 ${i + 1}`,
            story: s.story || '',
            image: s.image || '',
            note: s.note || ''
          }))
        : base.spreads;
      const rawProject = (raw && raw.project) || {};
      const legacyAuthor = rawProject.authorName
        || [rawProject.studentName, rawProject.className].filter(Boolean).join(' · ')
        || base.project.authorName;
      return {
        project: {
          ...base.project,
          ...rawProject,
          authorName: legacyAuthor,
          templates: { ...base.project.templates, ...((rawProject && rawProject.templates) || {}) },
          typography: { ...base.project.typography, ...((rawProject && rawProject.typography) || {}) }
        },
        spreads,
        lastSavedAt: raw && raw.lastSavedAt ? raw.lastSavedAt : null
      };
    }

    function loadState() {
      try {
        const latest = localStorage.getItem(STORAGE_KEY);
        if (latest) return hydrateState(JSON.parse(latest));
        for (const key of LEGACY_KEYS) {
          const found = localStorage.getItem(key);
          if (found) return hydrateState(JSON.parse(found));
        }
      } catch (e) {}
      return defaultState();
    }

    const AUTOSAVE_DELAY = 900;
    let state = loadState();
    let selected = { kind: 'cover', index: null };
    let imageClipboard = null;
    let draggedSpreadIndex = null;
    let viewerIndex = 0;
    let viewerMode = 'single';
    let railCollapsed = false;
    let topbarCompact = true;
    let groupCollapsed = { cover: false, scenes: false, back: false };
    let autosaveTimer = null;
    let autosavePendingMessage = '';
    let autosaveStorageWarned = false;

    try {
      railCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch (e) {
      railCollapsed = false;
    }

    try {
      const storedTopbar = localStorage.getItem(TOPBAR_STORAGE_KEY);
      topbarCompact = storedTopbar === null ? true : storedTopbar === '1';
    } catch (e) {
      topbarCompact = true;
    }

    try {
      const rawGroups = JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY) || '{}');
      groupCollapsed = {
        cover: !!rawGroups.cover,
        scenes: !!rawGroups.scenes,
        back: !!rawGroups.back
      };
    } catch (e) {
      groupCollapsed = { cover: false, scenes: false, back: false };
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function syncLayoutMetrics() {
      const root = document.documentElement;
      const topbar = document.querySelector('.topbar');
      const topbarHeight = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
      root.style.setProperty('--topbar-height', `${topbarHeight}px`);
    }

    function persistTopbarState() {
      try {
        localStorage.setItem(TOPBAR_STORAGE_KEY, topbarCompact ? '1' : '0');
      } catch (e) {}
    }

    function applyTopbarState() {
      const topbar = document.getElementById('topbar');
      const toggleBtn = document.getElementById('topbarToggleBtn');
      if (topbar) topbar.classList.toggle('compact', topbarCompact);
      if (toggleBtn) {
        toggleBtn.textContent = topbarCompact ? '설정 열기' : '설정 닫기';
        toggleBtn.setAttribute('aria-expanded', String(!topbarCompact));
      }
      syncLayoutMetrics();
    }

    function toggleTopbarCompact(forceValue = null) {
      topbarCompact = forceValue === null ? !topbarCompact : !!forceValue;
      persistTopbarState();
      applyTopbarState();
    }

    function buildAutosaveState() {
      return {
        ...state,
        project: {
          ...state.project,
          coverImage: ''
        },
        spreads: state.spreads.map(spread => ({ ...spread, image: '' }))
      };
    }

    function clearLegacyAutosaveKeys() {
      try {
        LEGACY_KEYS.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) {}
        });
      } catch (e) {}
    }

    function writeAutosaveNow(message = '자동 저장됨') {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
      }
      autosavePendingMessage = '';
      state.lastSavedAt = new Date().toLocaleString('ko-KR');
      const autosaveSnapshot = JSON.stringify(buildAutosaveState());
      let persisted = true;
      try {
        localStorage.setItem(STORAGE_KEY, autosaveSnapshot);
      } catch (e) {
        persisted = false;
      }
      if (!persisted) {
        clearLegacyAutosaveKeys();
        try {
          localStorage.setItem(STORAGE_KEY, autosaveSnapshot);
          persisted = true;
        } catch (e) {
          persisted = false;
        }
      }
      const el = document.getElementById('autosaveStatus');
      if (el) {
        el.textContent = persisted
          ? `${message} · ${state.lastSavedAt}`
          : `브라우저 자동 저장 공간 부족 · 그림은 자동 저장 제외 · ${state.lastSavedAt}`;
      }
      if (!persisted && typeof showPasteToast === 'function' && !autosaveStorageWarned) {
        autosaveStorageWarned = true;
        showPasteToast('브라우저 저장 공간이 부족합니다. 이 경고는 한 번만 표시됩니다. 그림은 자동 저장에서 제외되며, 작업 보관은 JSON 저장을 눌러 주세요.', 'warn', 5200);
      }
      if (persisted) autosaveStorageWarned = false;
      renderStatusOnly();
      return persisted;
    }

    function saveState(message = '자동 저장됨', options = {}) {
      const { immediate = false } = options;
      state.lastSavedAt = new Date().toLocaleString('ko-KR');
      autosavePendingMessage = message;
      const el = document.getElementById('autosaveStatus');
      if (el) el.textContent = `${message} · 저장 대기 중`;
      renderStatusOnly();
      if (immediate) {
        return writeAutosaveNow(message);
      }
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => {
        writeAutosaveNow(autosavePendingMessage || message);
      }, AUTOSAVE_DELAY);
      return true;
    }

    function getTypography() {
      return { ...defaultTypography(), ...(((state || {}).project || {}).typography || {}) };
    }

    function fontFamilyCssValue() {
      const typography = getTypography();
      return FONT_FAMILY_MAP[typography.fontFamily] || FONT_FAMILY_MAP['noto-sans-kr'];
    }

    function frameStyleConfig() {
      const typography = getTypography();
      return IMAGE_FRAME_MAP[typography.imageFrameStyle] || IMAGE_FRAME_MAP.none;
    }

    function applyTypographyState() {
      const typography = getTypography();
      const frame = frameStyleConfig();
      document.documentElement.style.setProperty('--project-font-family', fontFamilyCssValue());
      document.documentElement.style.setProperty('--project-title-size', `${typography.titleSize}px`);
      document.documentElement.style.setProperty('--project-body-size', `${typography.bodySize}px`);
      document.documentElement.style.setProperty('--project-note-size', `${typography.noteSize}px`);
      document.documentElement.style.setProperty('--project-title-weight', String(typography.titleWeight));
      document.documentElement.style.setProperty('--project-body-weight', String(typography.bodyWeight));
      document.documentElement.style.setProperty('--image-frame-border', frame.border);
      document.documentElement.style.setProperty('--image-frame-radius', frame.radius);
      document.documentElement.style.setProperty('--image-frame-shadow', frame.shadow);
      document.documentElement.style.setProperty('--binding-gutter', `${typography.bindingMargin}px`);
      document.documentElement.style.setProperty('--cover-image-offset-y', `${typography.coverImageOffsetY || 0}px`);
    }

    function updateTypographyControls() {
      const typography = getTypography();
      const templates = getTemplates();
      const map = {
        fontFamilySelect: typography.fontFamily,
        textEffectSelect: typography.textEffect,
        imageFrameSelect: typography.imageFrameStyle,
        coverTemplateSelect: templates.cover,
        innerTemplateSelect: templates.inner,
        backTemplateSelect: templates.back,
        bindingMarginRange: String(typography.bindingMargin),
        fillerProfileSelect: typography.fillerProfile || 'elementary',
        coverImageOffsetMmInput: String(pxToMm(typography.coverImageOffsetY || 0)),
        titleSizeRange: String(typography.titleSize),
        bodySizeRange: String(typography.bodySize),
        titleWeightSelect: String(typography.titleWeight),
        bodyWeightSelect: String(typography.bodyWeight)
      };
      Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
      });
      const titleSizeValue = document.getElementById('titleSizeValue');
      const bodySizeValue = document.getElementById('bodySizeValue');
      const bindingMarginValue = document.getElementById('bindingMarginValue');
      const coverImageOffsetValue = document.getElementById('coverImageOffsetValue');
      if (titleSizeValue) titleSizeValue.textContent = `${typography.titleSize}px`;
      if (bodySizeValue) bodySizeValue.textContent = `${typography.bodySize}px`;
      if (bindingMarginValue) bindingMarginValue.textContent = `${typography.bindingMargin}mm`;
      if (coverImageOffsetValue) {
        const v = Number(typography.coverImageOffsetY || 0);
        const mm = pxToMm(v);
        coverImageOffsetValue.textContent = mm === 0 ? '가운데' : `${mm > 0 ? '+' : ''}${mm}mm`;
      }
    }

    function getTemplates() {
      return { ...defaultTemplates(), ...(((state || {}).project || {}).templates || {}) };
    }

    function templateLabel(kind, value = null) {
      const currentValue = value || getTemplates()[kind];
      return (((TEMPLATE_LABELS || {})[kind] || {})[currentValue]) || currentValue || '';
    }

    function fillerProfileLabel(value = null) {
      const currentValue = value || (getTypography().fillerProfile || 'elementary');
      return FILLER_PROFILE_LABELS[currentValue] || '초';
    }

    function bookletAutoExtraPages(count) {
      const safeCount = Math.max(0, Number(count) || 0);
      if (!safeCount) return [];
      const profile = getTypography().fillerProfile || 'elementary';
      const preset = FILLER_PROFILE_PAGES[profile] || FILLER_PROFILE_PAGES.elementary;
      return Array.from({ length: safeCount }, (_, index) => ({
        pageType: 'story',
        title: preset[index]?.title || `자동 마무리 ${index + 1}` ,
        body: preset[index]?.body || '',
        logicalNumber: null,
        autoInserted: true,
        fillerProfile: profile
      }));
    }

    function setTypographyField(field, value) {
      if (!state.project.typography) state.project.typography = defaultTypography();
      const numberFields = new Set(['bindingMargin', 'coverImageOffsetY', 'titleSize', 'bodySize', 'noteSize', 'titleWeight', 'bodyWeight']);
      state.project.typography[field] = numberFields.has(field) ? Number(value) : value;
      state.project.typography.noteSize = Math.max(12, Math.round(state.project.typography.bodySize * 0.78));
      applyTypographyState();
      updateTypographyControls();
      saveState('서체 설정 저장됨');
      renderAll();
    }

    function setTemplateField(field, value) {
      if (!state.project.templates) state.project.templates = defaultTemplates();
      state.project.templates[field] = value;
      updateTypographyControls();
      saveState('템플릿 설정 저장됨');
      renderAll();
    }

    function currentEffectClass() {
      return `effect-${getTypography().textEffect || 'none'}`;
    }

    function normalizeAutoTitles() {
      state.spreads.forEach((spread, index) => {
        if (!spread.title || /^새 장면 \d+$/.test(spread.title)) {
          spread.title = `새 장면 ${index + 1}`;
        }
      });
    }

    function getSpread(index) {
      return state.spreads[index] || null;
    }

    function getSelectedSpread() {
      return selected.kind === 'spread' && Number.isInteger(selected.index)
        ? getSpread(selected.index)
        : null;
    }

    function selectionLabel() {
      if (selected.kind === 'cover') return '앞표지';
      if (selected.kind === 'back') return '뒷표지';
      return `장면 ${selected.index + 1}`;
    }

    function logicalPageNumbers(index) {
      return { left: index * 2 + 2, right: index * 2 + 3 };
    }

    function renderStatusOnly() {
      const focus = document.getElementById('focusStatus');
      const count = document.getElementById('pageCountStatus');
      const clipboard = document.getElementById('clipboardStatus');
      if (focus) focus.textContent = `현재 선택: ${selectionLabel()}`;
      if (count) count.textContent = `내지 ${state.spreads.length}장`;
      if (clipboard) clipboard.textContent = imageClipboard ? `그림 클립보드 준비됨 · ${imageClipboard.label}` : '그림 클립보드 비어 있음';
    }

    function persistRailState() {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, railCollapsed ? '1' : '0');
      } catch (e) {}
    }

    function persistGroupState() {
      try {
        localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groupCollapsed));
      } catch (e) {}
    }

    function selectedGroupKey() {
      if (selected.kind === 'cover') return 'cover';
      if (selected.kind === 'back') return 'back';
      return 'scenes';
    }

    function ensureSelectedGroupVisible() {
      const key = selectedGroupKey();
      if (groupCollapsed[key]) {
        groupCollapsed[key] = false;
        persistGroupState();
      }
    }

    function ensureSelectedPageVisible(behavior = 'smooth') {
      ensureSelectedGroupVisible();
      const activeItem = document.querySelector('.page-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior });
      }
      const collapsedName = document.getElementById('collapsedCurrentPage');
      if (collapsedName) collapsedName.textContent = selectionLabel();
    }

    function applyRailState() {
      const workspace = document.getElementById('workspace');
      const toggleBtn = document.getElementById('toggleRailBtn');
      const toggleIcon = document.getElementById('toggleRailIcon');
      const toggleLabel = document.getElementById('toggleRailLabel');
      if (workspace) workspace.classList.toggle('rail-collapsed', railCollapsed);
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!railCollapsed));
      if (toggleIcon) toggleIcon.textContent = railCollapsed ? '▶' : '◀';
      if (toggleLabel) toggleLabel.textContent = railCollapsed ? '목록 펼치기' : '목록 접기';
      ensureSelectedPageVisible('auto');
    }

    function toggleRailCollapse(forceValue = null) {
      railCollapsed = forceValue === null ? !railCollapsed : !!forceValue;
      persistRailState();
      applyRailState();
    }

    function toggleGroupCollapse(groupKey) {
      if (!Object.prototype.hasOwnProperty.call(groupCollapsed, groupKey)) return;
      const selectedKey = selectedGroupKey();
      if (groupKey === selectedKey && !groupCollapsed[groupKey]) {
        return;
      }
      groupCollapsed[groupKey] = !groupCollapsed[groupKey];
      persistGroupState();
      renderSidebar();
    }

    function setSelected(kind, index = null) {
      if (kind === 'spread') {
        index = Math.max(0, Math.min(index ?? 0, state.spreads.length - 1));
      } else {
        index = null;
      }
      selected = { kind, index };
      renderSidebar();
      renderStage();
      renderStatusOnly();
      requestAnimationFrame(() => ensureSelectedPageVisible('smooth'));
      if (!document.getElementById('bookViewerModal')?.classList.contains('hidden')) {
        syncViewerToSelection();
      }
    }

    function pageItems() {
      return [
        {
          kind: 'cover',
          index: null,
          name: '앞표지',
          desc: state.project.subtitle || '책 제목과 부제를 입력하세요.',
          image: state.project.coverImage || '',
          badge: '표지'
        },
        ...state.spreads.map((spread, index) => ({
          kind: 'spread',
          index,
          name: spread.title || `새 장면 ${index + 1}`,
          desc: spread.story || '글과 그림을 넣을 페이지입니다.',
          image: spread.image || '',
          badge: `${index + 1}`
        })),
        {
          kind: 'back',
          index: null,
          name: '뒷표지',
          desc: state.project.backCoverText || '마무리 문구를 입력하세요.',
          image: '',
          badge: '끝'
        }
      ];
    }

    function pageGroups() {
      const items = pageItems();
      return [
        {
          key: 'cover',
          title: '표지',
          meta: '앞표지 편집',
          items: items.filter(item => item.kind === 'cover')
        },
        {
          key: 'scenes',
          title: '장면',
          meta: `내지 ${state.spreads.length}장`,
          items: items.filter(item => item.kind === 'spread')
        },
        {
          key: 'back',
          title: '뒷표지',
          meta: '마무리 문구',
          items: items.filter(item => item.kind === 'back')
        }
      ];
    }

    function renderPageItem(item) {
      const active = item.kind === selected.kind && item.index === selected.index;
      const miniClass = item.kind === 'cover' ? 'cover' : item.kind === 'back' ? 'back' : 'story-spread';
      const kindLabel = item.kind === 'cover' ? '표지' : item.kind === 'back' ? '뒷표지' : `장면 ${item.index + 1}`;
      const dragText = item.kind === 'spread' ? '<div class="drag-badge">순서 바꾸기</div>' : '';
      const actionButtons = item.kind === 'spread'
        ? `
          <div class="page-item-actions">
            <button class="ghost inline-mini" data-add-after-index="${item.index}" type="button">+ 추가</button>
            <button class="light inline-mini" data-duplicate-index="${item.index}" type="button">복제</button>
            <button class="warn inline-mini" data-delete-index="${item.index}" type="button" ${state.spreads.length <= 1 ? 'disabled' : ''}>삭제</button>
          </div>
        `
        : '';
      return `
        <article class="page-item ${active ? 'active' : ''}" data-select-kind="${item.kind}" ${item.index !== null ? `data-select-index="${item.index}"` : ''} ${item.kind === 'spread' ? `draggable="true" data-drag-index="${item.index}"` : ''}>
          <div class="page-item-top">
            <div class="page-mini ${miniClass}">
              ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" />` : `<span style="font-size:12px;color:#718399;font-weight:900;">${item.kind === 'spread' ? '글·그림' : item.kind === 'cover' ? '표지' : '마무리'}</span>`}
              <span class="page-mini-label">${escapeHtml(item.badge)}</span>
            </div>
            <div class="page-item-text">
              <div class="page-kind">${kindLabel}</div>
              <div class="page-name">${escapeHtml(item.name)}</div>
              <div class="page-desc">${escapeHtml(item.desc)}</div>
              ${dragText}
            </div>
          </div>
          ${actionButtons}
        </article>
      `;
    }

    function renderInsertSlot(insertAt, label) {
      return `
        <div class="insert-slot">
          <button class="insert-slot-btn" type="button" data-insert-at="${insertAt}">
            <span class="insert-slot-plus">+</span>
            <span class="insert-slot-label">${escapeHtml(label)}</span>
          </button>
        </div>
      `;
    }

    function renderSceneGroupBody(items) {
      const chunks = [];
      chunks.push(renderInsertSlot(0, '표지 다음에 새 장면 삽입'));
      items.forEach((item, idx) => {
        chunks.push(renderPageItem(item));
        const nextInsertAt = idx + 1;
        const label = idx === items.length - 1
          ? '뒷표지 앞에 새 장면 삽입'
          : `장면 ${item.index + 1} 다음에 새 장면 삽입`;
        chunks.push(renderInsertSlot(nextInsertAt, label));
      });
      return chunks.join('');
    }

    function renderSidebar() {
      normalizeAutoTitles();
      const list = document.getElementById('pageList');
      if (!list) return;
      const items = pageItems();
      const chunks = [];
      items.forEach(item => {
        if (item.kind === 'cover') {
          chunks.push('<div class="page-flat-divider">표지</div>');
          chunks.push(renderPageItem(item));
          chunks.push(renderInsertSlot(0, '표지 다음에 페이지 추가'));
          return;
        }
        if (item.kind === 'spread') {
          if (item.index === 0) chunks.push('<div class="page-flat-divider">본문 페이지</div>');
          chunks.push(renderPageItem(item));
          const nextInsertAt = item.index + 1;
          const label = item.index === state.spreads.length - 1
            ? '뒷표지 앞에 페이지 추가'
            : `장면 ${item.index + 1} 다음에 페이지 추가`;
          chunks.push(renderInsertSlot(nextInsertAt, label));
          return;
        }
        chunks.push('<div class="page-flat-divider">뒷표지</div>');
        chunks.push(renderPageItem(item));
      });
      list.innerHTML = chunks.join('');
      applyRailState();
      requestAnimationFrame(() => ensureSelectedPageVisible('auto'));
    }

    function renderStageMeta() {
      const kicker = document.getElementById('stageKicker');
      const title = document.getElementById('stageTitle');
      const sub = document.getElementById('stageSub');
      const actions = document.getElementById('stageActions');
      if (!kicker || !title || !sub || !actions) return;

      if (selected.kind === 'cover') {
        kicker.textContent = 'Cover';
        title.textContent = '앞표지 편집';
        sub.textContent = `표지 템플릿: ${templateLabel('cover')} · 제목, 부제, 저자, 표지 그림을 입력하세요.`;
        actions.innerHTML = `
          <button class="primary" type="button" data-add-after-selection="true">+ 첫 페이지 추가</button>
          <button class="light" type="button" data-copy-image="cover">표지 그림 복사</button>
          <button class="light" type="button" data-paste-image="cover">표지 그림 붙여넣기</button>
        `;
        return;
      }

      if (selected.kind === 'back') {
        kicker.textContent = 'Back Cover';
        title.textContent = '뒷표지 편집';
        sub.textContent = `뒷표지 템플릿: ${templateLabel('back')} · 마무리 문구를 적고, 필요하면 바로 위에 새 페이지를 추가하세요.`;
        actions.innerHTML = `
          <button class="primary" type="button" data-add-after-selection="true">+ 마지막 페이지 추가</button>
          <button class="ghost" type="button" data-select-kind="cover">앞표지로 이동</button>
        `;
        return;
      }

      const spread = getSelectedSpread();
      const nums = logicalPageNumbers(selected.index);
      kicker.textContent = `Scene ${selected.index + 1}`;
      title.textContent = `장면 ${selected.index + 1} 편집`;
      sub.textContent = `내지 템플릿: ${templateLabel('inner')} · ${nums.left}p / ${nums.right}p · 선택된 장면 아래에 새 페이지를 넣거나 순서를 조정할 수 있어요.`;
      actions.innerHTML = `
        <button class="primary" type="button" data-add-after-selection="true">+ 현재 아래에 페이지 추가</button>
        <button class="ghost" type="button" data-move-up-index="${selected.index}" ${selected.index === 0 ? 'disabled' : ''}>위로</button>
        <button class="ghost" type="button" data-move-down-index="${selected.index}" ${selected.index === state.spreads.length - 1 ? 'disabled' : ''}>아래로</button>
        <button class="light" type="button" data-duplicate-index="${selected.index}">복제</button>
        <button class="warn" type="button" data-delete-index="${selected.index}" ${state.spreads.length <= 1 ? 'disabled' : ''}>삭제</button>
      `;
    }

    function renderCoverStage() {
      return `
        <div class="frame-layout">
          <section class="panel story">
            <div class="template-note"><span class="template-chip">표지 템플릿</span>${escapeHtml(templateLabel('cover'))}</div>
            <div class="field-label">책 제목</div>
            <input class="story-title-input" data-project-field="title" placeholder="책 제목" value="${escapeHtml(state.project.title)}" />
            <div class="field-label">표지 부제</div>
            <textarea class="story-body-input" data-project-field="subtitle" placeholder="표지 부제를 입력하세요">${escapeHtml(state.project.subtitle || '')}</textarea>
            <div class="field-label">저자</div>
            <input class="meta-input" data-project-field="authorName" placeholder="저자 이름" value="${escapeHtml(state.project.authorName || '')}" />
            <div class="cover-preview"><strong>${escapeHtml(state.project.title || '컬러링북')}</strong>${escapeHtml(state.project.subtitle || '')}${state.project.authorName ? `<span class="preview-author">${escapeHtml(state.project.authorName)}</span>` : ''}</div>
          </section>
          <section class="panel image">
            <div class="image-dropzone ${state.project.coverImage ? 'is-filled' : ''}" data-image-kind="cover">
              ${state.project.coverImage ? `<img src="${state.project.coverImage}" alt="cover image" />` : `<div class="image-placeholder">아래의 <strong>📁 업로드</strong> 또는 <strong>📋 붙여넣기</strong><br>버튼을 눌러 그림을 넣어주세요</div>`}
            </div>
            <div class="image-helper">📁 업로드는 폴더에서 파일을 가져옵니다. 📋 붙여넣기는 캡처한 클립보드 그림을 가져옵니다. 🗑 그림 삭제는 이 페이지의 그림만 지웁니다. (Ctrl+V도 됩니다)</div>
            <div class="image-actions" style="margin-top:12px;">
              <button class="primary" type="button" data-upload-kind="cover">📁 업로드</button>
              <button class="light" type="button" data-system-paste="cover">📋 붙여넣기</button>
              <button class="warn" type="button" data-clear-kind="cover">🗑 그림 삭제</button>
              <input type="file" accept="image/*" class="hidden" data-file-input-kind="cover" />
            </div>
            <div class="image-actions image-actions-secondary" style="margin-top:8px;">
              <button class="ghost" type="button" data-copy-image="cover">그림 복사</button>
              <button class="ghost" type="button" data-paste-image="cover">복사한 그림 붙여넣기</button>
            </div>
          </section>
        </div>
      `;
    }

    function renderSpreadStage(spread, index) {
      return `
        <div class="frame-layout">
          <section class="panel story">
            <div class="template-note"><span class="template-chip">내지 템플릿</span>${escapeHtml(templateLabel('inner'))}</div>
            <div class="field-label">글 쓰는 곳 제목</div>
            <input class="story-title-input" data-spread-field="title" data-index="${index}" placeholder="글 쓰는 곳 제목" value="${escapeHtml(spread.title || '')}" />
            <div class="field-label">글 쓰는 곳</div>
            <textarea class="story-body-input" data-spread-field="story" data-index="${index}" placeholder="이 장면의 글을 입력하세요">${escapeHtml(spread.story || '')}</textarea>
          </section>
          <section class="panel image">
            <div class="image-dropzone ${spread.image ? 'is-filled' : ''}" data-image-kind="spread" data-index="${index}">
              ${spread.image ? `<img src="${spread.image}" alt="spread image" />` : `<div class="image-placeholder">아래의 <strong>📁 업로드</strong> 또는 <strong>📋 붙여넣기</strong><br>버튼을 눌러 그림을 넣어주세요</div>`}
            </div>
            <div class="image-helper">📁 업로드는 폴더 / 📋 붙여넣기는 클립보드 그림 / 🗑 그림 삭제는 이 페이지의 그림만 지웁니다. (Ctrl+V도 가능)</div>
            <div class="image-actions" style="margin-top:12px;">
              <button class="primary" type="button" data-upload-kind="spread" data-index="${index}">📁 업로드</button>
              <button class="light" type="button" data-system-paste="spread" data-index="${index}">📋 붙여넣기</button>
              <button class="warn" type="button" data-clear-kind="spread" data-index="${index}">🗑 그림 삭제</button>
              <input type="file" accept="image/*" class="hidden" data-file-input-kind="spread" data-index="${index}" />
            </div>
            <div class="image-actions image-actions-secondary" style="margin-top:8px;">
              <button class="ghost" type="button" data-copy-image="spread" data-index="${index}">그림 복사</button>
              <button class="ghost" type="button" data-paste-image="spread" data-index="${index}">복사한 그림 붙여넣기</button>
            </div>
            <div class="field-label" style="margin-top:16px;">그림 메모</div>
            <textarea class="note-input" data-spread-field="note" data-index="${index}" placeholder="예: 숲길, 별, 고양이, 나무가 보이는 흑백 컬러링 그림">${escapeHtml(spread.note || '')}</textarea>
          </section>
        </div>
      `;
    }

    function renderBackStage() {
      return `
        <div class="frame-layout">
          <section class="panel story centered">
            <div style="width:100%;max-width:540px;text-align:left;">
              <div class="template-note"><span class="template-chip">뒷표지 템플릿</span>${escapeHtml(templateLabel('back'))}</div>
              <div class="field-label">뒷표지 문구</div>
              <textarea class="back-input" data-project-field="backCoverText" placeholder="뒷표지 문구를 입력하세요">${escapeHtml(state.project.backCoverText || '')}</textarea>
              <div class="back-preview"><strong>마무리 문구</strong>${escapeHtml(state.project.backCoverText || '')}${state.project.authorName ? `<span class="preview-author">${escapeHtml(state.project.authorName)}</span>` : ''}</div>
            </div>
          </section>
          <section class="panel image centered">
            <div>
              <div class="image-placeholder">뒷표지 템플릿 미리보기</div>
              <div class="image-helper" style="max-width:320px;margin-top:14px;">뒷표지는 문구 중심으로 배치되고, 선택한 템플릿에 따라 저자 표기 위치와 정렬 방식이 달라집니다.</div>
            </div>
          </section>
        </div>
      `;
    }

    function refreshProjectPreviews() {
      const coverPreview = document.querySelector('.cover-preview');
      if (coverPreview) {
        coverPreview.innerHTML = `<strong>${escapeHtml(state.project.title || '컬러링북')}</strong>${escapeHtml(state.project.subtitle || '')}${state.project.authorName ? `<span class="preview-author">${escapeHtml(state.project.authorName)}</span>` : ''}`;
      }
      const backPreview = document.querySelector('.back-preview');
      if (backPreview) {
        backPreview.innerHTML = `<strong>마무리 문구</strong>${escapeHtml(state.project.backCoverText || '')}${state.project.authorName ? `<span class="preview-author">${escapeHtml(state.project.authorName)}</span>` : ''}`;
      }
      if (!document.getElementById('bookViewerModal')?.classList.contains('hidden')) {
        renderBookViewer();
      }
    }

    function renderStage() {
      renderStageMeta();
      const stage = document.getElementById('stageArea');
      if (!stage) return;
      stage.className = `frame-stage ${currentEffectClass()}`;
      if (selected.kind === 'cover') {
        stage.innerHTML = renderCoverStage();
        return;
      }
      if (selected.kind === 'back') {
        stage.innerHTML = renderBackStage();
        return;
      }
      const spread = getSelectedSpread();
      if (!spread) {
        stage.innerHTML = '<div class="empty-stage">선택된 페이지를 찾지 못했어요.</div>';
        return;
      }
      stage.innerHTML = renderSpreadStage(spread, selected.index);
    }

    function renderAll() {
      applyTypographyState();
      updateTypographyControls();
      renderSidebar();
      renderStage();
      renderStatusOnly();
      if (!document.getElementById('bookViewerModal')?.classList.contains('hidden')) {
        renderBookViewer();
      }
    }

    function resolveInsertIndexFromSelection() {
      if (selected.kind === 'cover') return 0;
      if (selected.kind === 'spread' && Number.isInteger(selected.index)) return selected.index + 1;
      return state.spreads.length;
    }

    function addSpreadAt(insertAt) {
      const safeIndex = Math.max(0, Math.min(insertAt, state.spreads.length));
      state.spreads.splice(safeIndex, 0, createBlankSpread(safeIndex + 1));
      normalizeAutoTitles();
      saveState('페이지 추가됨');
      setSelected('spread', safeIndex);
      requestAnimationFrame(() => {
        document.querySelector('[data-spread-field="title"]')?.focus();
      });
    }

    function addSpreadAfterSelection() {
      addSpreadAt(resolveInsertIndexFromSelection());
    }

    function duplicateSpread(index) {
      const current = getSpread(index);
      if (!current) return;
      state.spreads.splice(index + 1, 0, {
        ...current,
        id: uid(),
        title: (current.title || `장면 ${index + 1}`) + ' 복사본'
      });
      normalizeAutoTitles();
      saveState('페이지 복제됨');
      setSelected('spread', index + 1);
    }

    function duplicateCurrentSelection() {
      if (selected.kind === 'spread' && Number.isInteger(selected.index)) {
        duplicateSpread(selected.index);
        return;
      }
      addSpreadAfterSelection();
    }

    function deleteSpread(index) {
      if (state.spreads.length <= 1) {
        alert('최소 1개의 내지 페이지는 남겨 두는 편이 좋아요.');
        return;
      }
      state.spreads.splice(index, 1);
      normalizeAutoTitles();
      saveState('페이지 삭제됨');
      const nextIndex = Math.max(0, Math.min(index, state.spreads.length - 1));
      setSelected('spread', nextIndex);
    }

    function moveSpread(index, direction) {
      const next = index + direction;
      if (next < 0 || next >= state.spreads.length) return;
      const [moved] = state.spreads.splice(index, 1);
      state.spreads.splice(next, 0, moved);
      normalizeAutoTitles();
      saveState('페이지 순서 변경됨');
      setSelected('spread', next);
    }

    function reorderSpread(fromIndex, toIndex) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.spreads.length || toIndex >= state.spreads.length) return;
      const [moved] = state.spreads.splice(fromIndex, 1);
      state.spreads.splice(toIndex, 0, moved);
      normalizeAutoTitles();
      saveState('페이지 드래그 정렬됨');
      setSelected('spread', toIndex);
    }

    function moveSpreadToInsertAt(fromIndex, insertAt) {
      if (fromIndex < 0 || fromIndex >= state.spreads.length) return;
      const boundedInsertAt = Math.max(0, Math.min(insertAt, state.spreads.length));
      const [moved] = state.spreads.splice(fromIndex, 1);
      const targetIndex = boundedInsertAt > fromIndex ? boundedInsertAt - 1 : boundedInsertAt;
      state.spreads.splice(targetIndex, 0, moved);
      normalizeAutoTitles();
      saveState('페이지 드래그 위치 이동됨');
      setSelected('spread', targetIndex);
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = evt => resolve(evt.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function getImageValue(kind, index = null) {
      if (kind === 'cover') return state.project.coverImage || '';
      const spread = getSpread(index);
      return spread ? (spread.image || '') : '';
    }

    function setImageValue(kind, index, dataUrl) {
      if (kind === 'cover') {
        state.project.coverImage = dataUrl || '';
        return true;
      }
      const spread = getSpread(index);
      if (!spread) return false;
      spread.image = dataUrl || '';
      return true;
    }

    async function applyImageFile(kind, index, file) {
      if (!file || !file.type.startsWith('image/')) {
        showPasteToast('이미지 파일만 올릴 수 있어요.', 'warn');
        return false;
      }
      let dataUrl;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch (err) {
        showPasteToast('이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.', 'warn');
        return false;
      }
      if (!dataUrl) {
        showPasteToast('이미지 데이터가 비어 있어요.', 'warn');
        return false;
      }
      if (!setImageValue(kind, index, dataUrl)) {
        showPasteToast('해당 페이지를 찾지 못했어요.', 'warn');
        return false;
      }
      // Adjust selection BEFORE saving/rendering to avoid double-render.
      const wantSpread = kind === 'spread' && Number.isInteger(index);
      if (kind === 'cover' && selected.kind !== 'cover') {
        selected = { kind: 'cover', index: null };
      } else if (wantSpread && (selected.kind !== 'spread' || selected.index !== index)) {
        selected = { kind: 'spread', index };
      }
      try {
        saveState(kind === 'cover' ? '표지 그림 저장됨' : `장면 ${index + 1} 그림 저장됨`);
      } catch (err) {
        showPasteToast('자동 저장 공간이 부족할 수 있어요. 큰 그림은 줄여 주세요.', 'warn', 3600);
      }
      renderAll();
      requestAnimationFrame(() => ensureSelectedPageVisible('smooth'));
      return true;
    }

    function clearImage(kind, index = null) {
      // v20.8: forbid ANY paste from happening for the next moment, so a ghost paste
      // cannot refill the image we just removed.
      window.__userPasteIntent = false;
      window.__pasteHandled = true;
      window.__suppressPasteUntil = Date.now() + 800;

      // Normalize index for spreads
      if (kind === 'spread') {
        if (!Number.isInteger(index)) {
          if (selected.kind === 'spread' && Number.isInteger(selected.index)) {
            index = selected.index;
          } else {
            showPasteToast('삭제할 장면을 찾지 못했어요.', 'warn');
            return;
          }
        }
      }
      const had = !!getImageValue(kind, index);
      const ok = (kind === 'cover')
        ? (() => { state.project.coverImage = ''; return true; })()
        : (() => { const sp = getSpread(index); if (!sp) return false; sp.image = ''; return true; })();
      if (!ok) {
        showPasteToast('해당 페이지를 찾지 못했어요.', 'warn');
        return;
      }
      if (kind === 'cover' && selected.kind !== 'cover') {
        selected = { kind: 'cover', index: null };
      } else if (kind === 'spread' && (selected.kind !== 'spread' || selected.index !== index)) {
        selected = { kind: 'spread', index };
      }
      saveState(kind === 'cover' ? '표지 그림 삭제됨' : `장면 ${index + 1} 그림 삭제됨`);
      renderAll();
      if (had) {
        showPasteToast(kind === 'cover' ? '표지 그림이 삭제되었어요.' : `장면 ${index + 1} 그림이 삭제되었어요.`, 'ok');
      } else {
        showPasteToast('이미 비어 있는 그림 자리예요.', 'info');
      }
      // Release the suppression after the brief window has passed.
      setTimeout(() => { window.__suppressPasteUntil = 0; }, 850);
    }

    function copyImageToInternalClipboard(kind, index = null) {
      const dataUrl = getImageValue(kind, index);
      if (!dataUrl) {
        alert(kind === 'cover' ? '앞표지에 복사할 그림이 없어요.' : '이 페이지에 복사할 그림이 없어요.');
        return;
      }
      imageClipboard = {
        dataUrl,
        label: kind === 'cover' ? '앞표지 그림' : `장면 ${index + 1} 그림`
      };
      renderStatusOnly();
      saveState(kind === 'cover' ? '표지 그림 복사됨' : `장면 ${index + 1} 그림 복사됨`);
    }

    let lastImageDropzoneHover = null;

    function flashPasteFeedback() {
      const targets = document.querySelectorAll('.image-dropzone');
      targets.forEach(el => {
        el.classList.add('paste-flash');
        setTimeout(() => el.classList.remove('paste-flash'), 700);
      });
    }

    function focusCaptureTrap() {
      const trap = document.getElementById('captureFocusTrap');
      const active = document.activeElement;
      const tag = (active && active.tagName || '').toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || (active && active.isContentEditable);
      if (isEditing) return;
      if (trap && document.activeElement !== trap) {
        try { trap.focus({ preventScroll: true }); } catch (e) {}
      }
    }

    function bindAutoPasteFocus() {
      // v20.8: deliberately minimal. We only track which image dropzone the mouse is over,
      // so that Ctrl+V in an empty area routes to that page if the user wants. We DO NOT auto-focus
      // anymore, and we DO NOT call paste from focus events.
      document.body.addEventListener('mouseover', e => {
        const dz = e.target.closest('[data-image-kind]');
        if (dz) {
          lastImageDropzoneHover = {
            kind: dz.dataset.imageKind,
            index: dz.dataset.index !== undefined && dz.dataset.index !== '' ? Number(dz.dataset.index) : null
          };
        }
      });
    }

    async function handleExternalImageFile(file) {
      // v20.8 guard: if we just deleted, refuse to inject a new image for a brief window.
      if (window.__suppressPasteUntil && Date.now() < window.__suppressPasteUntil) {
        return false;
      }
      if (!file || !file.type || !file.type.startsWith('image/')) return false;
      let targetKind = null;
      let targetIndex = null;
      if (lastImageDropzoneHover) {
        targetKind = lastImageDropzoneHover.kind;
        targetIndex = lastImageDropzoneHover.index;
      }
      if (!targetKind) {
        targetKind = selected.kind;
        targetIndex = selected.index;
      }
      if (targetKind === 'back') {
        if (state.spreads.length === 0) {
          showPasteToast('붙여넣을 페이지가 없어요.', 'warn');
          return false;
        }
        targetKind = 'spread';
        targetIndex = 0;
      }
      if (targetKind !== 'cover' && !(targetKind === 'spread' && Number.isInteger(targetIndex))) {
        if (state.spreads.length === 0) {
          showPasteToast('붙여넣을 페이지가 없어요.', 'warn');
          return false;
        }
        targetKind = 'spread';
        targetIndex = 0;
      }
      // applyImageFile now handles selection internally to avoid double-render.
      const ok = await applyImageFile(targetKind, targetKind === 'cover' ? null : targetIndex, file);
      return ok === true;
    }

    function showPasteToast(message, kind = 'ok', duration = 2200) {
      const host = document.getElementById('pasteToastHost');
      if (!host) return;
      const toast = document.createElement('div');
      toast.className = `paste-toast paste-toast-${kind}`;
      toast.textContent = message;
      host.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('is-on'));
      setTimeout(() => {
        toast.classList.remove('is-on');
        setTimeout(() => toast.remove(), 280);
      }, duration);
    }

    async function clipboardHasImage() {
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) return false;
        const items = await navigator.clipboard.read();
        return items.some(item => (item.types || []).some(t => t.startsWith('image/')));
      } catch (err) {
        return false;
      }
    }

    async function requestClipboardImage(options = {}) {
      const { silentIfEmpty = false, fromButton = false } = options;
      // v20.8: respect the post-delete cooldown unless this is a deliberate button press.
      if (!fromButton && window.__suppressPasteUntil && Date.now() < window.__suppressPasteUntil) {
        return false;
      }
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
          showPasteToast('이 브라우저는 직접 붙여넣기를 지원하지 않아요. 페이지를 한 번 클릭한 뒤 Ctrl+V를 눌러 주세요.', 'warn', 3200);
          return false;
        }
        // Try to ensure permission once
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const status = await navigator.permissions.query({ name: 'clipboard-read' });
            if (status.state === 'denied') {
              showPasteToast('브라우저에서 클립보드 읽기 권한이 차단되어 있어요. 주소창 옆 자물쇠 아이콘에서 허용해 주세요.', 'warn', 3800);
              return false;
            }
          }
        } catch (permErr) {}

        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (!imageType) continue;
          const blob = await item.getType(imageType);
          const file = new File([blob], 'pasted-capture.png', { type: imageType });
          const ok = await handleExternalImageFile(file);
          if (ok) {
            flashPasteFeedback();
            showPasteToast('그림이 붙여넣어졌어요.', 'ok');
            return true;
          }
        }
        if (!silentIfEmpty) {
          showPasteToast('클립보드에 그림이 없어요. 캡처를 먼저 한 뒤 다시 시도해 주세요.', 'warn');
        }
        return false;
      } catch (err) {
        if (fromButton) {
          showPasteToast('클립보드 접근이 거부되었어요. 페이지를 한 번 클릭한 뒤 Ctrl+V를 다시 눌러 주세요.', 'warn', 3600);
        } else if (!silentIfEmpty) {
          showPasteToast('클립보드를 읽지 못했어요. 캡처 붙여넣기 버튼을 눌러 주세요.', 'warn');
        }
        return false;
      }
    }

    async function tryPasteIntoDropzoneClick(kind, index) {
      lastImageDropzoneHover = { kind, index };
      const ok = await requestClipboardImage({ silentIfEmpty: true });
      if (!ok) {
        showPasteToast('붙일 그림이 없어요. 캡처를 먼저 하시고, 안 되면 옆의 업로드 버튼을 눌러 주세요.', 'info', 2800);
      }
    }

    function pasteImageFromInternalClipboard(kind, index = null) {
      if (!imageClipboard || !imageClipboard.dataUrl) {
        showPasteToast('먼저 복사한 그림이 있어야 붙여넣을 수 있어요.', 'warn');
        return;
      }
      if (!setImageValue(kind, index, imageClipboard.dataUrl)) return;
      if (kind === 'cover' && selected.kind !== 'cover') selected = { kind: 'cover', index: null };
      else if (kind === 'spread' && Number.isInteger(index) && (selected.kind !== 'spread' || selected.index !== index)) selected = { kind: 'spread', index };
      saveState(kind === 'cover' ? '표지 그림 붙여넣기 완료' : `장면 ${index + 1} 그림 붙여넣기 완료`);
      renderAll();
      flashPasteFeedback();
    }

    function slugifyFileName(text) {
      return (text || 'coloringbook-v11')
        .toString()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-가-힣]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'coloringbook-v11';
    }

    function drawImageContain(doc, src, x, y, w, h) {
      if (!src) {
        doc.setDrawColor(180, 191, 206);
        doc.rect(x, y, w, h);
        doc.setFontSize(11);
        doc.setTextColor(120, 132, 148);
        doc.text('그림 없음', x + w / 2, y + h / 2, { align: 'center' });
        return;
      }
      try {
        doc.addImage(src, 'PNG', x, y, w, h, undefined, 'FAST');
      } catch (e) {
        try {
          doc.addImage(src, 'JPEG', x, y, w, h, undefined, 'FAST');
        } catch (e2) {
          doc.text('이미지 삽입 실패', x + 6, y + 10);
        }
      }
    }

    function buildBookPages() {
      const pages = [];
      pages.push({
        pageType: 'cover',
        title: state.project.title || '컬러링북',
        subtitle: state.project.subtitle || '',
        meta: state.project.authorName || '',
        image: state.project.coverImage || '',
        logicalNumber: 1
      });
      state.spreads.forEach((spread, index) => {
        pages.push({
          pageType: 'story',
          title: spread.title || `장면 ${index + 1}`,
          body: spread.story || '',
          logicalNumber: pages.length + 1,
          spreadIndex: index
        });
        pages.push({
          pageType: 'art',
          title: spread.title || `장면 ${index + 1}`,
          image: spread.image || '',
          logicalNumber: pages.length + 1,
          spreadIndex: index
        });
      });
      pages.push({
        pageType: 'back',
        title: '',
        body: state.project.backCoverText || '',
        meta: state.project.authorName || '',
        logicalNumber: pages.length + 1
      });
      return pages;
    }

    function viewerAnchors() {
      const pages = buildBookPages();
      if (viewerMode === 'single') return pages.map((_, index) => index);
      const anchors = [0];
      for (let i = 1; i < pages.length - 1; i += 2) anchors.push(i);
      if (!anchors.includes(pages.length - 1)) anchors.push(pages.length - 1);
      return anchors;
    }

    function normalizeViewerIndex() {
      const anchors = viewerAnchors();
      if (!anchors.length) return 0;
      let best = anchors[0];
      let distance = Math.abs(viewerIndex - best);
      anchors.forEach(anchor => {
        const nextDistance = Math.abs(viewerIndex - anchor);
        if (nextDistance < distance) {
          best = anchor;
          distance = nextDistance;
        }
      });
      return best;
    }

    function selectedViewerIndex() {
      if (selected.kind === 'cover') return 0;
      if (selected.kind === 'back') return buildBookPages().length - 1;
      return 1 + ((selected.index || 0) * 2);
    }

    function syncViewerToSelection() {
      viewerIndex = selectedViewerIndex();
      renderBookViewer();
    }

    function pageEffectClass(page) {
      return page && page.pageType !== 'art' && page.pageType !== 'blank' ? currentEffectClass() : '';
    }

    function pageTemplateClass(page) {
      const templates = getTemplates();
      if (!page || page.pageType === 'blank') return '';
      if (page.pageType === 'cover') return `template-cover-${templates.cover}`;
      if (page.pageType === 'back') return `template-back-${templates.back}`;
      return `template-inner-${templates.inner}`;
    }

    function renderBookPageSection(page, sideClass = '') {
      if (!page || page.pageType === 'blank') {
        return `<section class="book-preview-page ${sideClass} back-page"><div class="book-preview-empty">비어 있는 페이지</div></section>`;
      }
      if (page.pageType === 'cover') {
        return `
          <section class="book-preview-page ${sideClass} cover-page ${pageEffectClass(page)} ${pageTemplateClass(page)}">
            <div class="book-page-kicker">표지</div>
            <h2>${escapeHtml(page.title || '')}</h2>
            ${page.subtitle ? `<div class="book-subtitle">${escapeHtml(page.subtitle)}</div>` : ''}
            ${page.meta ? `<div class="book-meta book-author-sign">${escapeHtml(page.meta)}</div>` : ''}
            <div class="book-cover-image">
              ${page.image ? `<img src="${page.image}" alt="표지 이미지">` : '<div class="book-preview-empty">표지 그림 없음</div>'}
            </div>
          </section>
        `;
      }
      if (page.pageType === 'story') {
        return `
          <section class="book-preview-page ${sideClass} text-page ${pageEffectClass(page)} ${pageTemplateClass(page)}">
            <h2>${escapeHtml(page.title || '')}</h2>
            <p>${escapeHtml(page.body || '')}</p>
          </section>
        `;
      }
      if (page.pageType === 'art') {
        return `
          <section class="book-preview-page ${sideClass} art-page ${pageTemplateClass(page)}">
            <div class="book-preview-image">
              ${page.image ? `<img src="${page.image}" alt="삽화 페이지">` : '<div class="book-preview-empty">삽화 이미지 없음</div>'}
            </div>
          </section>
        `;
      }
      return `
        <section class="book-preview-page ${sideClass} back-page ${pageEffectClass(page)} ${pageTemplateClass(page)}">
          ${page.body ? `<p>${escapeHtml(page.body || '')}</p>` : '<div class="book-preview-empty">뒷표지 문구 없음</div>'}
          ${page.meta ? `<div class="book-meta book-author-sign">${escapeHtml(page.meta)}</div>` : ''}
        </section>
      `;
    }

    function renderBookPreviewMarkup(pageOrSpread, animateClass = '') {
      if (Array.isArray(pageOrSpread)) {
        return `
          <div class="book-preview-sheet spread-sheet ${animateClass}">
            <div class="book-preview-spread">
              ${renderBookPageSection(pageOrSpread[0], 'left-page')}
              ${renderBookPageSection(pageOrSpread[1], 'right-page')}
            </div>
          </div>
        `;
      }
      return `
        <div class="book-preview-sheet ${animateClass}">
          ${renderBookPageSection(pageOrSpread, 'single-page')}
        </div>
      `;
    }

    function setViewerMode(mode) {
      viewerMode = mode === 'spread' ? 'spread' : 'single';
      viewerIndex = normalizeViewerIndex();
      renderBookViewer();
    }

    function stepViewer(direction) {
      const anchors = viewerAnchors();
      const currentAnchor = normalizeViewerIndex();
      const currentPos = Math.max(0, anchors.indexOf(currentAnchor));
      const nextPos = direction === 'next'
        ? Math.min(anchors.length - 1, currentPos + 1)
        : Math.max(0, currentPos - 1);
      viewerIndex = anchors[nextPos] ?? 0;
      renderBookViewer(direction === 'next' ? 'next' : 'prev');
    }

    function updateViewerModeButtons() {
      document.getElementById('viewerSingleBtn')?.classList.toggle('active', viewerMode === 'single');
      document.getElementById('viewerSpreadBtn')?.classList.toggle('active', viewerMode === 'spread');
    }

    function renderBookViewer(direction = 'none') {
      const pages = buildBookPages();
      viewerIndex = normalizeViewerIndex();
      const page = pages[viewerIndex];
      const stage = document.getElementById('bookViewerStage');
      const counter = document.getElementById('bookViewerCounter');
      const prevBtn = document.getElementById('viewerPrevBtn');
      const nextBtn = document.getElementById('viewerNextBtn');
      const anchors = viewerAnchors();
      const currentPos = Math.max(0, anchors.indexOf(viewerIndex));
      const animateClass = direction === 'next' ? 'flip-next' : direction === 'prev' ? 'flip-prev' : direction === 'intro' ? 'flip-intro' : '';
      let payload = page;
      let label = `${viewerIndex + 1} / ${pages.length}`;

      if (viewerMode === 'spread' && viewerIndex !== 0 && viewerIndex !== pages.length - 1) {
        payload = [pages[viewerIndex], pages[viewerIndex + 1] || { pageType: 'blank' }];
        label = `${pages[viewerIndex].logicalNumber}-${(pages[viewerIndex + 1] || { logicalNumber: pages[viewerIndex].logicalNumber }).logicalNumber} / 펼침`;
      }

      if (stage) stage.innerHTML = renderBookPreviewMarkup(payload, animateClass);
      if (counter) counter.textContent = label;
      if (prevBtn) prevBtn.disabled = currentPos === 0;
      if (nextBtn) nextBtn.disabled = currentPos === anchors.length - 1;
      updateViewerModeButtons();
    }

    function openBookletOrderModal() {
      const modal = document.getElementById('bookletOrderModal');
      const stage = document.getElementById('bookletOrderStage');
      if (!modal || !stage) return;
      const pagesForPrint = bookletPagesForPrint();
      const sheets = buildBookletSheets();
      const totalPages = pagesForPrint.length;
      const autoAddedCount = pagesForPrint.filter(page => page && page.autoInserted).length;
      const sheetCount = sheets.length;
      const sheetsHtml = sheets.map((sheet, idx) => {
        const renderSide = (pages, label, labelText) => `
          <div class="booklet-side-card">
            <span class="booklet-side-label">${label}</span>
            <div class="booklet-side-pages">
              ${pages.map(page => renderBookletMini(page)).join('')}
            </div>
            <div class="hidden-print-note" style="margin-top:6px;">${escapeHtml(labelText)}</div>
          </div>
        `;
        return `
          <section class="booklet-sheet-card">
            <div class="booklet-sheet-title">종이 ${idx + 1}장 / 총 ${sheetCount}장</div>
            <div class="booklet-sheet-grid">
              ${renderSide(sheet.front, '앞면', '바깥쪽 면입니다.')}
              ${renderSide(sheet.back, '뒷면', '안쪽 면입니다. 양면 인쇄 시 자동으로 짝지어 들어갑니다.')}
            </div>
          </section>
        `;
      }).join('');
      stage.className = 'book-viewer-stage booklet-order-stage';
      stage.innerHTML = `
        <div class="booklet-order-help">
          <strong>총 ${sheetCount}장의 A4 종이</strong>로 인쇄되며, 한 장에 4페이지(앞2 · 뒤2)가 들어갑니다.
          총 페이지 수는 자동 마무리 페이지를 포함해 <strong>${totalPages}쪽</strong>으로 정렬되었습니다.
          <strong>앞표지는 항상 바깥쪽 오른쪽</strong>, <strong>뒷표지는 항상 바깥쪽 왼쪽</strong>에 오도록 다시 정렬했습니다.
          ${autoAddedCount ? `쪽수가 4의 배수에 맞지 않아 <strong>${fillerProfileLabel()}용 자동 마무리 ${autoAddedCount}쪽</strong>이 <strong>뒷표지 앞</strong>에 추가되었습니다.` : '현재는 쪽수가 정확히 맞아 자동 마무리 페이지가 추가되지 않았습니다.'}
          인쇄 후 가운데를 접으면 책자가 되도록 순서를 잡았습니다. <strong>짧은쪽 넘기기</strong>를 선택하면 상하가 뒤집혀 나올 수 있어요.
        </div>
        ${sheetsHtml}
      `;
      modal.classList.remove('hidden');
    }

    function renderBookletMini(page) {
      if (!page || page.pageType === 'blank') {
        return `<div class="booklet-mini blank"><div class="booklet-mini-kicker">빈 페이지</div><div class="booklet-mini-title">백지</div></div>`;
      }
      const kicker = page.autoInserted ? `자동 마무리 · ${fillerProfileLabel(page.fillerProfile)}`
        : page.pageType === 'cover' ? '앞표지'
        : page.pageType === 'back' ? '뒷표지'
        : page.pageType === 'art' ? '그림 페이지'
        : '글 페이지';
      const title = page.pageType === 'cover'
        ? (page.title || '컬러링북')
        : page.pageType === 'back'
        ? (page.body || '마무리 문구')
        : (page.title || `장면 ${page.logicalNumber || ''}`);
      return `
        <div class="booklet-mini">
          <div class="booklet-mini-kicker">${escapeHtml(kicker)}</div>
          <div class="booklet-mini-title">${escapeHtml(title)}</div>
          <div class="booklet-mini-num">인쇄 ${page.printNumber}쪽${page.autoInserted ? ' · 자동 추가' : (page.sourcePrintNumber ? ` · 원본 ${page.sourcePrintNumber}쪽` : ' · 빈 페이지')}</div>
        </div>
      `;
    }

    function closeBookletOrderModal() {
      document.getElementById('bookletOrderModal')?.classList.add('hidden');
    }

    function openBookViewer(startIndex = null) {
      if (startIndex === null) viewerIndex = selectedViewerIndex();
      else viewerIndex = startIndex;
      document.getElementById('bookViewerModal')?.classList.remove('hidden');
      renderBookViewer('intro');
    }

    function closeBookViewer() {
      document.getElementById('bookViewerModal')?.classList.add('hidden');
    }

    function bookletPagesForPrint() {
      const sourcePages = buildBookPages().map((page, index) => ({
        ...page,
        sourcePrintNumber: index + 1
      }));
      if (sourcePages.length <= 2) {
        return sourcePages.map((page, index) => ({ ...page, printNumber: index + 1 }));
      }
      const cover = sourcePages[0];
      const back = sourcePages[sourcePages.length - 1];
      const inner = sourcePages.slice(1, -1);
      const blanksNeeded = (4 - (sourcePages.length % 4)) % 4;
      const padded = [
        cover,
        ...inner,
        ...bookletAutoExtraPages(blanksNeeded).map(page => ({ ...page, sourcePrintNumber: null })),
        back
      ];
      return padded.map((page, index) => ({
        ...page,
        printNumber: index + 1
      }));
    }

    function buildBookletSheets() {
      const pages = bookletPagesForPrint();
      const sheets = [];
      let left = 0;
      let right = pages.length - 1;
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

    function renderPrintableBookletPage(page, sideClass = 'left-page') {
      if (!page || page.pageType === 'blank') {
        return `<section class="booklet-page blank-page"><div class="booklet-page-inner ${sideClass}"></div></section>`;
      }
      if (page.pageType === 'cover') {
        return `
          <section class="booklet-page ${currentEffectClass()}">
            <div class="booklet-page-inner cover-page ${sideClass} ${pageTemplateClass(page)}">
              <h2>${escapeHtml(page.title || '')}</h2>
              ${page.subtitle ? `<div class="book-subtitle">${escapeHtml(page.subtitle)}</div>` : ''}
              ${page.meta ? `<div class="book-meta book-author-sign">${escapeHtml(page.meta)}</div>` : ''}
              <div class="book-cover-image">
                ${page.image ? `<img src="${page.image}" alt="표지 이미지">` : '<div class="book-preview-empty">표지 그림 없음</div>'}
              </div>
            </div>
          </section>
        `;
      }
      if (page.pageType === 'story') {
        return `
          <section class="booklet-page ${currentEffectClass()}">
            <div class="booklet-page-inner text-page ${sideClass} ${pageTemplateClass(page)}">
              <h2>${escapeHtml(page.title || '')}</h2>
              <p>${escapeHtml(page.body || '')}</p>
            </div>
          </section>
        `;
      }
      if (page.pageType === 'art') {
        return `
          <section class="booklet-page">
            <div class="booklet-page-inner art-page ${sideClass} ${pageTemplateClass(page)}">
              <div class="book-preview-image">
                ${page.image ? `<img src="${page.image}" alt="삽화 이미지">` : '<div class="book-preview-empty">삽화 이미지 없음</div>'}
              </div>
            </div>
          </section>
        `;
      }
      return `
        <section class="booklet-page ${currentEffectClass()}">
          <div class="booklet-page-inner back-page ${sideClass} ${pageTemplateClass(page)}">
            ${page.body ? `<p>${escapeHtml(page.body || '')}</p>` : '<div class="book-preview-empty">뒷표지 문구 없음</div>'}
            ${page.meta ? `<div class="book-meta book-author-sign">${escapeHtml(page.meta)}</div>` : ''}
          </div>
        </section>
      `;
    }

    function buildPrintableDocument(autoPrint = false) {
      const typography = getTypography();
      const fontCss = fontFamilyCssValue();
      const frame = frameStyleConfig();
      const sheetsHtml = buildBookletSheets().map((sheet, index) => `
        <section class="print-sheet">
          <div class="sheet-side">
            ${renderPrintableBookletPage(sheet.front[0], 'left-page')}
            ${renderPrintableBookletPage(sheet.front[1], 'right-page')}
          </div>
        </section>
        <section class="print-sheet">
          <div class="sheet-side">
            ${renderPrintableBookletPage(sheet.back[0], 'left-page')}
            ${renderPrintableBookletPage(sheet.back[1], 'right-page')}
          </div>
        </section>
      `).join('');
      return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(state.project.title || '컬러링북')} 책자 인쇄</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Dodum&family=Nanum+Gothic:wght@400;700;800&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
<style>
@page { size: A4 landscape; margin: 0; }
:root {
  --project-font-family: ${fontCss};
  --project-title-size: ${typography.titleSize}px;
  --project-body-size: ${typography.bodySize}px;
  --project-note-size: ${typography.noteSize}px;
  --project-title-weight: ${typography.titleWeight};
  --project-body-weight: ${typography.bodyWeight};
  --image-frame-border: ${frame.border};
  --image-frame-radius: ${frame.radius};
  --image-frame-shadow: ${frame.shadow};
  --binding-gutter-print: ${typography.bindingMargin}mm;
  --cover-image-offset-y: ${(typography.coverImageOffsetY || 0)}px;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: var(--project-font-family); background: #eef3f8; color: #172132; }
.print-wrap { max-width: 100vw; padding: 12px; }
.print-help { padding: 12px 14px; margin-bottom: 12px; background: #fff; border: 1px solid #dfe7f1; border-radius: 14px; font-size: 13px; line-height: 1.7; }
.print-sheet { width: 100%; height: 210mm; padding: 8mm; page-break-after: always; overflow: hidden; }
.sheet-side { width: 100%; height: calc(210mm - 16mm); background: #fff; display: grid; grid-template-columns: 1fr 1fr; gap: 0; overflow: hidden; }
.booklet-page { height: 100%; border: 0; background: #fff; overflow: hidden; }
.booklet-page.blank-page { background: #fff; }
.booklet-page-inner { height: 100%; padding: 14mm 12mm; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
.booklet-page-inner.left-page { padding-right: calc(12mm + var(--binding-gutter-print)); }
.booklet-page-inner.right-page { padding-left: calc(12mm + var(--binding-gutter-print)); }
.cover-page { align-items: flex-start; justify-content: center; gap: 8px; }
.text-page { align-items: flex-start; }
.art-page { justify-content: center; align-items: center; }
.back-page { justify-content: center; align-items: center; text-align: center; }
.booklet-page-inner.template-cover-centered-title { justify-content: center; align-items: center; text-align: center; }
.booklet-page-inner.template-cover-centered-title .book-cover-image { max-width: 72%; max-height: 62%; min-height: 0; }
.booklet-page-inner.cover-page .book-cover-image { flex: 0 1 auto; max-height: 62%; min-height: 0; margin-top: 4px; }
.booklet-page-inner.template-cover-author-band .book-author-sign { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 999px; background: #f7f4ff; }
.booklet-page-inner.template-inner-boxed { background: #fff; }
.booklet-page-inner.template-inner-boxed p { padding: 16px 18px; border: 1px solid #eef2f6; border-radius: 16px; background: #fff; }
.booklet-page-inner.template-inner-airy { gap: 20px; }
.booklet-page-inner.template-inner-airy p { max-width: 32em; }
.booklet-page-inner.template-back-author-signoff { justify-content: space-between; align-items: flex-start; text-align: left; }
.booklet-page-inner.template-back-author-signoff .book-author-sign { margin-top: auto; align-self: flex-end; }
.booklet-page-inner.template-back-minimal { justify-content: flex-end; align-items: flex-start; text-align: left; }
.booklet-page-inner.template-back-minimal p { max-width: 26em; }
.booklet-page h2 { margin: 0; font-size: calc(var(--project-title-size) * .88); line-height: 1.18; font-weight: var(--project-title-weight); }
.booklet-page p, .book-subtitle, .book-meta { margin: 0; font-size: calc(var(--project-body-size) * .9); line-height: 1.65; font-weight: var(--project-body-weight); white-space: pre-wrap; word-break: keep-all; }
.book-subtitle, .book-meta { font-size: calc(var(--project-note-size) * .92); color: #57677b; }
.book-cover-image, .book-preview-image { width: 100%; flex: 1 1 auto; min-height: 0; border: var(--image-frame-border); border-radius: var(--image-frame-radius); box-shadow: var(--image-frame-shadow); background: #fff; display: grid; place-items: center; overflow: hidden; }
.book-cover-image { max-height: 100%; }
.booklet-page-inner.cover-page .book-cover-image { flex: 1 1 auto; max-height: 62%; min-height: 0; }
.book-cover-image img, .book-preview-image img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; background: #fff; }
.booklet-page-inner.cover-page .book-cover-image img { transform: translateY(var(--cover-image-offset-y)); }
.book-preview-empty { color: #95a3b5; font-size: 15px; font-weight: 800; text-align: center; padding: 20px; }
.effect-pencil h2, .effect-pencil p, .effect-pencil .book-subtitle, .effect-pencil .book-meta { text-shadow: .5px .5px 0 rgba(92,103,117,.22); letter-spacing: .01em; }
.effect-marker h2, .effect-marker p, .effect-marker .book-subtitle, .effect-marker .book-meta { text-shadow: 0 .7px 0 rgba(48,64,83,.18); letter-spacing: .02em; }
.effect-storybook h2, .effect-storybook p, .effect-storybook .book-subtitle, .effect-storybook .book-meta { text-shadow: .6px .6px 0 rgba(95,99,242,.10); letter-spacing: .015em; }
@media print {
  body { background: #fff; }
  .print-wrap { padding: 0; }
  .print-help { display: none; }
  .print-sheet { padding: 0; height: 210mm; break-after: page; overflow: hidden; }
  .sheet-side { height: 210mm; }
}
</style>

<style id="v20_14_upgrade_styles">
  :root {
    --cover-image-scale: 1;
    --print-paper-height: 210mm;
  }

  .book-preview-page.cover-page,
  .booklet-page-inner.cover-page {
    justify-content: center !important;
  }

  .book-preview-page.cover-page .book-cover-image,
  .booklet-page-inner.cover-page .book-cover-image {
    width: 100%;
    max-width: 82%;
    max-height: 66%;
    min-height: 0 !important;
  }

  .book-preview-page.cover-page .book-cover-image img,
  .booklet-page-inner.cover-page .book-cover-image img {
    transform: translateY(var(--cover-image-offset-y)) scale(var(--cover-image-scale)) !important;
    transform-origin: center center !important;
  }

  .book-preview-image img.kcs-art-adjustable {
    transform-origin: center center;
  }

  .type-control .type-help-note {
    font-size: 11px;
    color: #6c7b8c;
    line-height: 1.45;
  }

  .kcs-stepper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
  }
  .kcs-step-btn {
    min-width: 42px;
    min-height: 42px;
    border-radius: 14px;
    border: 1px solid #d6dfeb;
    background: #fff;
    color: #243447;
    font-size: 22px;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(36,52,71,.08);
  }
  .kcs-step-btn:hover { transform: translateY(-1px); }
  .kcs-step-btn:disabled { opacity: .45; cursor: not-allowed; }
  .kcs-step-input {
    width: 88px;
    min-height: 42px;
    border-radius: 14px;
    border: 1px solid #d6dfeb;
    padding: 0 12px;
    font-size: 16px;
    font-weight: 800;
    text-align: center;
    background: #fff;
  }
  .kcs-step-unit {
    font-size: 13px;
    font-weight: 800;
    color: #667487;
    min-width: 24px;
  }
  .book-preview-page.cover-page .book-cover-image,
  .booklet-page-inner.cover-page .book-cover-image {
    max-width: 92%;
    max-height: 76%;
  }
  .book-preview-page.template-cover-centered-title .book-cover-image,
  .booklet-page-inner.template-cover-centered-title .book-cover-image {
    max-width: 88%;
    max-height: 72%;
  }
  .book-preview-page.art-page {
    padding: 16px;
  }
  .booklet-page-inner.art-page {
    padding: 10mm;
  }
  .booklet-page-inner.art-page.left-page {
    padding: 10mm 12mm 10mm 10mm;
  }
  .booklet-page-inner.art-page.right-page {
    padding: 10mm 10mm 10mm 12mm;
  }
  .kcs-stage-live-card.compact {
    position: sticky;
    bottom: 10px;
    width: min(100%, 320px);
    margin-left: auto;
    padding: 14px 16px;
    border-radius: 18px;
  }
  .kcs-stage-live-head.compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .kcs-stage-toggle-btn {
    min-width: 72px;
  }
  .kcs-stage-live-actions {
    display: flex;
    justify-content: flex-end;
    margin-left: auto;
  }
</style>


<style id="kcseduplay-site-integration-styles">
  .kcs-entry-overlay {
    position: fixed; inset: 0; z-index: 3000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(16,24,40,.48); backdrop-filter: blur(8px);
    padding: 18px;
  }
  .kcs-entry-card {
    width: min(560px, 100%); background: rgba(255,255,255,.98);
    border-radius: 28px; box-shadow: 0 28px 64px rgba(19,30,52,.22);
    border: 1px solid #d9e3ef; padding: 28px;
    display: grid; gap: 18px;
  }
  .kcs-entry-badge {
    display: inline-flex; width: fit-content; padding: 8px 12px; border-radius: 999px;
    background: #eef1ff; color: #4c45d6; font-weight: 900; font-size: 12px;
  }
  .kcs-entry-card h2 { margin: 0; font-size: 30px; line-height: 1.15; letter-spacing: -.03em; }
  .kcs-entry-card p { margin: 0; color: #5f7084; line-height: 1.7; }
  .kcs-entry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .kcs-entry-field { display: grid; gap: 6px; }
  .kcs-entry-field span { font-size: 12px; font-weight: 900; color: #667487; text-transform: uppercase; letter-spacing: .04em; }
  .kcs-entry-field input { min-height: 48px; border-radius: 14px; border: 1px solid #d8e1eb; padding: 12px 14px; font-size: 16px; }
  .kcs-entry-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .kcs-entry-note { padding: 14px 16px; background: #f8fbff; border: 1px solid #e1e8f0; border-radius: 18px; font-size: 13px; color: #607083; }
  .kcs-class-pill { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:#eef3ff; color:#4252d7; font-size:12px; font-weight:900; }
  .kcs-toolbar-group { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .kcs-submit-btn { background:#1f7a4d; color:#fff; box-shadow:0 10px 18px rgba(31,122,77,.18); }
  .kcs-submit-btn:hover { transform: translateY(-1px); }
  .kcs-helper-btn { background:#fff; color:#324154; border:1px solid #d6dfeb; }
  @media (max-width: 780px) {
    .kcs-entry-grid { grid-template-columns: 1fr; }
  }
</style>

<style id="v20_15_drag_preview_styles">
  .kcs-viewer-edit-panel {
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px solid #dbe6f2;
    border-radius: 16px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    display: grid;
    gap: 10px;
  }
  .kcs-viewer-edit-panel.hidden { display: none; }
  .kcs-viewer-edit-top {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .kcs-viewer-edit-title {
    font-size: 13px;
    font-weight: 900;
    color: #223246;
  }
  .kcs-viewer-edit-help {
    font-size: 12px;
    color: #5b6c81;
    line-height: 1.65;
  }
  .kcs-viewer-edit-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .kcs-meta-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4655dd;
    font-size: 12px;
    font-weight: 900;
  }
  .kcs-meta-pill.b4 {
    background: #ecfff1;
    color: #1f7a4d;
  }
  #kcsViewerDragToggle.active {
    background: #eef2ff;
    color: #4452da;
    border-color: #ccd6ff;
  }
  .kcs-preview-editable {
    position: relative;
    touch-action: none;
    cursor: grab;
    outline: 2px dashed rgba(81, 98, 255, .35);
    outline-offset: -8px;
  }
  .kcs-preview-editable.kcs-dragging {
    cursor: grabbing;
  }
  .kcs-preview-editable::before {
    content: '드래그 이동 · 모서리 핸들로 크기';
    position: absolute;
    left: 12px;
    top: 12px;
    z-index: 3;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(20, 30, 45, .72);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .01em;
    pointer-events: none;
  }
  .kcs-preview-resize-handle {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    background: linear-gradient(135deg, #5162ff 0%, #7f8cff 100%);
    box-shadow: 0 8px 16px rgba(81, 98, 255, .28);
    z-index: 4;
    cursor: nwse-resize;
  }
  .kcs-preview-resize-handle::before,
  .kcs-preview-resize-handle::after {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    background: rgba(255,255,255,.9);
    border-radius: 999px;
  }
  .kcs-preview-resize-handle::before { width: 10px; height: 2px; transform: rotate(-45deg); transform-origin: center; }
  .kcs-preview-resize-handle::after { width: 6px; height: 2px; transform: rotate(-45deg) translate(2px, -4px); transform-origin: center; }
  .kcs-edit-target-note {
    font-size: 12px;
    color: #607286;
  }
  .kcs-viewer-inline-note {
    font-size: 11px;
    color: #607286;
    margin-left: 4px;
  }
</style>

<style id="v20_16_stage_drag_styles">
  .kcs-safe-host,
  .kcs-stage-live-canvas {
    position: relative;
    overflow: hidden;
  }
  .kcs-safe-area {
    position: absolute;
    inset: 7%;
    border: 2px dashed rgba(81, 98, 255, .34);
    border-radius: 18px;
    pointer-events: none;
    z-index: 2;
  }
  .kcs-safe-area::before,
  .kcs-safe-area::after {
    content: '';
    position: absolute;
    background: rgba(81, 98, 255, .16);
    pointer-events: none;
  }
  .kcs-safe-area::before {
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    transform: translateX(-50%);
  }
  .kcs-safe-area::after {
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    transform: translateY(-50%);
  }
  .kcs-safe-badge {
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.92);
    border: 1px solid rgba(81, 98, 255, .18);
    color: #4655dd;
    font-size: 11px;
    font-weight: 900;
    box-shadow: 0 8px 18px rgba(28, 41, 58, .08);
    pointer-events: none;
  }
  .kcs-safe-host.kcs-safe-outside .kcs-safe-area,
  .kcs-stage-live-canvas.kcs-safe-outside .kcs-safe-area {
    border-color: rgba(194, 58, 47, .56);
    background: rgba(255, 243, 241, .08);
  }
  .kcs-safe-host.kcs-safe-outside .kcs-safe-badge,
  .kcs-stage-live-canvas.kcs-safe-outside .kcs-safe-badge {
    color: #b43d34;
    border-color: rgba(194, 58, 47, .2);
    background: rgba(255, 247, 238, .96);
  }
  .kcs-stage-live-card {
    margin-top: 16px;
    padding: 14px;
    border-radius: 18px;
    border: 1px solid #dbe6f2;
    background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
    display: grid;
    gap: 12px;
  }
  .kcs-stage-live-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .kcs-stage-live-title {
    font-size: 13px;
    font-weight: 900;
    color: #223246;
  }
  .kcs-stage-live-help {
    font-size: 12px;
    color: #607286;
    line-height: 1.65;
  }
  .kcs-stage-live-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .kcs-stage-live-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eef2ff;
    color: #4655dd;
    font-size: 11px;
    font-weight: 900;
  }
  .kcs-stage-live-pill.warn {
    background: #fff3f1;
    color: #b43d34;
  }
  .kcs-stage-live-frame {
    display: grid;
    gap: 10px;
  }
  .kcs-stage-live-page {
    width: min(100%, 340px);
    margin: 0 auto;
    aspect-ratio: 1 / 1.414;
    border-radius: 20px;
    background: #fff;
    border: 1px solid #d6e0ec;
    box-shadow: 0 16px 28px rgba(20, 30, 45, .10);
    overflow: hidden;
    padding: 16px;
    display: grid;
    gap: 12px;
  }
  .kcs-stage-live-page.cover {
    grid-template-rows: auto auto auto minmax(0, 1fr);
    align-content: start;
  }
  .kcs-stage-live-page.inner {
    grid-template-rows: minmax(0, 1fr);
  }
  .kcs-stage-live-cover-title {
    font-size: 18px;
    line-height: 1.18;
    font-weight: 950;
    color: #1f2d3f;
    word-break: keep-all;
  }
  .kcs-stage-live-cover-sub,
  .kcs-stage-live-cover-author {
    font-size: 11px;
    line-height: 1.5;
    color: #5c6d81;
    word-break: keep-all;
    white-space: pre-wrap;
  }
  .kcs-stage-live-cover-author {
    font-weight: 800;
  }
  .kcs-stage-live-canvas {
    min-height: 0;
    border-radius: 16px;
    border: 1px solid #dce5f0;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    display: grid;
    place-items: center;
    isolation: isolate;
    touch-action: none;
    cursor: grab;
  }
  .kcs-stage-live-canvas.kcs-dragging {
    cursor: grabbing;
  }
  .kcs-stage-live-canvas img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    display: block;
    background: #fff;
    z-index: 1;
  }
  .kcs-stage-live-handle {
    position: absolute;
    right: 12px;
    bottom: 12px;
    width: 20px;
    height: 20px;
    border-radius: 7px;
    background: linear-gradient(135deg, #5162ff 0%, #7f8cff 100%);
    box-shadow: 0 10px 18px rgba(81, 98, 255, .28);
    z-index: 4;
    cursor: nwse-resize;
  }
  .kcs-stage-live-handle::before,
  .kcs-stage-live-handle::after {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 5px;
    height: 2px;
    background: rgba(255,255,255,.92);
    border-radius: 999px;
    transform: rotate(-45deg);
    transform-origin: center;
  }
  .kcs-stage-live-handle::before { width: 11px; }
  .kcs-stage-live-handle::after { width: 7px; transform: rotate(-45deg) translate(3px, -4px); }
  .kcs-stage-live-note {
    font-size: 12px;
    color: #607286;
    line-height: 1.65;
    text-align: center;
  }
  .kcs-stage-live-empty {
    padding: 18px;
    border-radius: 16px;
    background: #f8fbff;
    border: 1px dashed #d2ddeb;
    color: #718296;
    font-size: 12px;
    text-align: center;
  }
  .kcs-b4-preset-help {
    font-size: 11px;
    color: #607286;
    line-height: 1.55;
  }
  .kcs-safe-host .kcs-safe-area,
  .kcs-safe-host .kcs-safe-badge {
    display: block;
  }
  @media (max-width: 860px) {
    .kcs-stage-live-page { width: min(100%, 280px); }
  }
</style>

</head>
<body>
  <div class="print-wrap">
    <div class="print-help"><strong>인쇄 방법</strong><br>이미 책자 순서로 정리되어 있습니다. 프린터에서도 <strong>양면 인쇄 + 긴쪽 넘기기</strong>만 선택해 주세요.</div>
    ${sheetsHtml}
  </div>
  ${autoPrint ? '<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));<\/script>' : ''}

<style id="v20_28_easy_mode_styles">
  .kcs-mode-strip {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    margin-top: 10px;
    border-radius: 16px;
    border: 1px solid #dfe7f1;
    background: linear-gradient(180deg,#ffffff 0%,#f7fbff 100%);
  }
  .kcs-mode-strip-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .kcs-mode-pill {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eef1ff;
    color: #4c45d6;
    font-size: 12px;
    font-weight: 900;
  }
  .kcs-mode-sub {
    font-size: 12px;
    color: #607083;
    line-height: 1.6;
  }
  .kcs-advanced-toggle {
    padding: 9px 12px;
    border-radius: 12px;
    border: 1px solid #d6dfeb;
    background: #fff;
    color: #27384b;
    font-weight: 800;
    cursor: pointer;
  }
  .kcs-advanced-panel {
    display: none;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
    padding-top: 4px;
  }
  .kcs-advanced-panel.open {
    display: grid;
  }
  .kcs-advanced-panel .type-control,
  .kcs-advanced-panel .print-guide {
    padding: 10px;
    border-radius: 14px;
    border: 1px solid #e3eaf2;
    background: #f8fbff;
  }
  .kcs-advanced-panel .print-guide {
    margin: 0;
    grid-column: 1 / -1;
  }
  @media (max-width: 780px) {
    .kcs-mode-strip-head {
      align-items: stretch;
    }
    .kcs-advanced-toggle {
      width: 100%;
    }
    .kcs-advanced-panel {
      grid-template-columns: 1fr;
    }
  }
</style>
<script id="v20_28_easy_mode_runtime">
(function(){
  const ADV_KEY = 'kcseduplay_teacher_advanced_v28';
  const SIMPLE_CONTROL_IDS = ['paperSizeSelect','b4PresetSelect','coverImageFillMmInput','coverImageOffsetMmInput','spreadImageFillMmInput','spreadImageOffsetMmInput'];
  const AUTO_VERSION = 'v28';
  const originalRenderAll = typeof renderAll === 'function' ? renderAll : null;

  function hasState() {
    return !!(window.state && state.project);
  }

  function paperKey() {
    if (!hasState()) return 'A4';
    return String(((state.project.typography || {}).paperSize || 'A4')).toUpperCase();
  }

  function autoDefaults(kind, paper) {
    const p = String(paper || paperKey()).toUpperCase();
    if (kind === 'cover') {
      return p === 'B4' ? { scale: 1.10, x: 0, y: 0 } : { scale: 1.04, x: 0, y: 0 };
    }
    return p === 'B4' ? { scale: 1.16, x: 0, y: 0 } : { scale: 1.08, x: 0, y: 0 };
  }

  function approx(a, b, epsilon) {
    const e = typeof epsilon === 'number' ? epsilon : 0.02;
    return Math.abs(Number(a || 0) - Number(b || 0)) <= e;
  }

  function ensureAutoLayout() {
    if (!hasState()) return false;
    state.project.typography = state.project.typography || {};
    const paper = paperKey();
    let changed = false;

    if (state.project.coverImage) {
      const t = state.project.typography;
      const prevPaper = t.coverAutoPaper || paper;
      const prev = autoDefaults('cover', prevPaper);
      const canRefresh = !t.coverAutoTouched && approx(t.coverImageOffsetX || 0, 0, 1) && approx(t.coverImageOffsetY || 0, 0, 1) && (typeof t.coverImageScale !== 'number' || approx(t.coverImageScale, 1) || approx(t.coverImageScale, prev.scale));
      if (canRefresh && (t.coverAutoPaper !== paper || t.coverAutoVersion !== AUTO_VERSION || typeof t.coverImageScale !== 'number')) {
        const next = autoDefaults('cover', paper);
        t.coverImageScale = next.scale;
        t.coverImageOffsetX = next.x;
        t.coverImageOffsetY = next.y;
        t.coverAutoPaper = paper;
        t.coverAutoVersion = AUTO_VERSION;
        changed = true;
      }
    }

    if (Array.isArray(state.spreads)) {
      state.spreads.forEach(function(spread){
        if (!spread || !spread.image) return;
        const prevPaper = spread.autoPaper || paper;
        const prev = autoDefaults('spread', prevPaper);
        const canRefresh = !spread.autoTouched && approx(spread.imageOffsetX || 0, 0, 1) && approx(spread.imageOffsetY || 0, 0, 1) && (typeof spread.imageScale !== 'number' || approx(spread.imageScale, 1) || approx(spread.imageScale, prev.scale));
        if (canRefresh && (spread.autoPaper !== paper || spread.autoVersion !== AUTO_VERSION || typeof spread.imageScale !== 'number')) {
          const next = autoDefaults('spread', paper);
          spread.imageScale = next.scale;
          spread.imageOffsetX = next.x;
          spread.imageOffsetY = next.y;
          spread.autoPaper = paper;
          spread.autoVersion = AUTO_VERSION;
          changed = true;
        }
      });
    }
    return changed;
  }

  function getControlById(id) {
    const el = document.getElementById(id);
    return el ? el.closest('.type-control') : null;
  }

  function ensureModeStrip() {
    const topbarAdvanced = document.getElementById('topbarAdvanced');
    const typebar = topbarAdvanced && topbarAdvanced.querySelector('.typebar');
    if (!typebar) return;

    let strip = document.getElementById('kcsModeStrip');
    let panel = document.getElementById('kcsAdvancedPanel');
    let btn = document.getElementById('kcsAdvancedToggleBtn');

    if (!strip) {
      strip = document.createElement('div');
      strip.id = 'kcsModeStrip';
      strip.className = 'kcs-mode-strip';
      strip.innerHTML = `
        <div class="kcs-mode-strip-head">
          <span class="kcs-mode-pill">학생 쉬운 모드</span>
          <button type="button" class="kcs-advanced-toggle" id="kcsAdvancedToggleBtn">교사용 상세 설정 열기</button>
        </div>
        <div class="kcs-mode-sub">학생은 그림 크기와 위치만 먼저 조절하면 되고, 교사는 필요할 때만 상세 설정을 열어 쓰면 됩니다.</div>
        <div class="kcs-advanced-panel" id="kcsAdvancedPanel"></div>
      `;
      typebar.insertAdjacentElement('afterend', strip);
      panel = document.getElementById('kcsAdvancedPanel');
      btn = document.getElementById('kcsAdvancedToggleBtn');
      if (btn) {
        btn.addEventListener('click', function(){
          const next = panel && !panel.classList.contains('open');
          if (panel) panel.classList.toggle('open', next);
          if (btn) btn.textContent = next ? '교사용 상세 설정 닫기' : '교사용 상세 설정 열기';
          try { localStorage.setItem(ADV_KEY, next ? '1' : '0'); } catch (e) {}
        });
      }
    }

    panel = document.getElementById('kcsAdvancedPanel');
    btn = document.getElementById('kcsAdvancedToggleBtn');
    const keep = SIMPLE_CONTROL_IDS.map(getControlById).filter(Boolean);
    const allControls = Array.from(topbarAdvanced.querySelectorAll('.type-control'));
    keep.forEach(function(control){ typebar.appendChild(control); });
    allControls.forEach(function(control){
      if (!keep.includes(control) && panel && !panel.contains(control)) panel.appendChild(control);
    });
    const guide = topbarAdvanced.querySelector('.print-guide');
    if (guide && panel && !panel.contains(guide)) panel.appendChild(guide);

    let isOpen = false;
    try { isOpen = localStorage.getItem(ADV_KEY) === '1'; } catch (e) {}
    if (panel) panel.classList.toggle('open', isOpen);
    if (btn) btn.textContent = isOpen ? '교사용 상세 설정 닫기' : '교사용 상세 설정 열기';
  }

  function markCoverTouched() {
    if (!hasState()) return;
    state.project.typography = state.project.typography || {};
    state.project.typography.coverAutoTouched = true;
  }

  function markSpreadTouched() {
    if (!hasState()) return;
    if (!window.selected || selected.kind !== 'spread' || !Array.isArray(state.spreads) || !state.spreads[selected.index]) return;
    state.spreads[selected.index].autoTouched = true;
  }

  function bindTouchedFlags() {
    [
      ['coverImageFillMmInput', markCoverTouched],
      ['coverImageOffsetMmInput', markCoverTouched],
      ['spreadImageFillMmInput', markSpreadTouched],
      ['spreadImageOffsetMmInput', markSpreadTouched]
    ].forEach(function(pair){
      const el = document.getElementById(pair[0]);
      if (!el || el.dataset.kcsBoundTouched === '1') return;
      el.dataset.kcsBoundTouched = '1';
      el.addEventListener('input', pair[1]);
      el.addEventListener('change', pair[1]);
    });

    const paper = document.getElementById('paperSizeSelect');
    if (paper && paper.dataset.kcsBoundPaper !== '1') {
      paper.dataset.kcsBoundPaper = '1';
      paper.addEventListener('change', function(){ setTimeout(queueEnhance, 40); });
    }
    const preset = document.getElementById('b4PresetSelect');
    if (preset && preset.dataset.kcsBoundPreset !== '1') {
      preset.dataset.kcsBoundPreset = '1';
      preset.addEventListener('change', function(){ setTimeout(queueEnhance, 40); });
    }
  }

  function queueEnhance() {
    ensureModeStrip();
    bindTouchedFlags();
  }

  if (originalRenderAll && !window.__kcsV28RenderWrapped) {
    window.__kcsV28RenderWrapped = true;
    renderAll = function() {
      ensureAutoLayout();
      const out = originalRenderAll.apply(this, arguments);
      setTimeout(queueEnhance, 0);
      return out;
    };
  }

  const prevRefresh = window.__refreshUpgradeControls;
  if (typeof prevRefresh === 'function' && !window.__kcsV28RefreshWrapped) {
    window.__kcsV28RefreshWrapped = true;
    window.__refreshUpgradeControls = function() {
      const out = prevRefresh.apply(this, arguments);
      queueEnhance();
      return out;
    };
  }

  function boot() {
    ensureAutoLayout();
    queueEnhance();
    setTimeout(queueEnhance, 200);
    setTimeout(queueEnhance, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    setTimeout(boot, 0);
  }
})();
