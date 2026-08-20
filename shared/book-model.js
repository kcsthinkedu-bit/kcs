export const BOOK_FORMAT_VERSION = 'kcs-book-v2';

export const BOOK_TYPES = Object.freeze({
  COLORING_BOOK: 'coloringbook',
  PICTURE_BOOK: 'picturebook',
  STORY_BOOK: 'storybook',
  WORKSHEET: 'worksheet'
});

export const PAGE_ROLES = Object.freeze({
  FRONT_COVER: 'front-cover',
  INSIDE_FRONT_COVER: 'inside-front-cover',
  CONTENT: 'content',
  BLANK: 'blank',
  INSIDE_BACK_COVER: 'inside-back-cover',
  BACK_COVER: 'back-cover'
});

export const REVISION_KINDS = Object.freeze({
  DRAFT: 'draft',
  SUBMISSION: 'submission',
  TEACHER_EDIT: 'teacher-edit',
  RETURNED: 'returned',
  FINAL: 'final'
});

export const AUTHOR_ROLES = Object.freeze({
  MEMBER: 'member',
  STUDENT: 'student',
  TEACHER: 'teacher',
  SYSTEM: 'system'
});

const VALID_BOOK_TYPES = new Set(Object.values(BOOK_TYPES));
const VALID_PAGE_ROLES = new Set(Object.values(PAGE_ROLES));
const VALID_REVISION_KINDS = new Set(Object.values(REVISION_KINDS));
const VALID_AUTHOR_ROLES = new Set(Object.values(AUTHOR_ROLES));

const BOOK_PRESETS = Object.freeze({
  [BOOK_TYPES.COLORING_BOOK]: Object.freeze({
    pageView: 'single',
    printMode: 'single-sided',
    allowedElements: ['image', 'text', 'shape']
  }),
  [BOOK_TYPES.PICTURE_BOOK]: Object.freeze({
    pageView: 'facing',
    printMode: 'duplex',
    allowedElements: ['image', 'text', 'shape']
  }),
  [BOOK_TYPES.STORY_BOOK]: Object.freeze({
    pageView: 'facing',
    printMode: 'duplex',
    allowedElements: ['image', 'text', 'shape']
  }),
  [BOOK_TYPES.WORKSHEET]: Object.freeze({
    pageView: 'single',
    printMode: 'single-sided',
    allowedElements: ['image', 'text', 'shape']
  })
});

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function copy(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix) {
  const suffix = globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${suffix}`;
}

function isoNow() {
  return new Date().toISOString();
}

function normalizeFrame(frame) {
  const source = isObject(frame) ? frame : {};
  return {
    x: asNumber(source.x, 10),
    y: asNumber(source.y, 10),
    width: Math.max(1, asNumber(source.width, 80)),
    height: Math.max(1, asNumber(source.height, 30)),
    rotation: asNumber(source.rotation, 0)
  };
}

function normalizeTextStyle(style) {
  const source = isObject(style) ? style : {};
  return {
    fontFamily: asString(source.fontFamily, 'Noto Sans KR'),
    fontSize: Math.max(6, asNumber(source.fontSize, 18)),
    fontWeight: asString(source.fontWeight, '400'),
    italic: asBoolean(source.italic, false),
    underline: asBoolean(source.underline, false),
    color: asString(source.color, '#1f2937'),
    align: ['left', 'center', 'right', 'justify'].includes(source.align) ? source.align : 'left',
    lineHeight: Math.max(0.8, asNumber(source.lineHeight, 1.5)),
    letterSpacing: asNumber(source.letterSpacing, 0)
  };
}

function normalizeElement(element) {
  const source = isObject(element) ? element : {};
  const type = ['text', 'image', 'shape'].includes(source.type) ? source.type : 'text';
  const normalized = {
    id: asString(source.id, makeId('element')),
    type,
    name: asString(source.name, ''),
    locked: asBoolean(source.locked, false),
    hidden: asBoolean(source.hidden, false),
    frame: normalizeFrame(source.frame)
  };

  if (type === 'text') {
    normalized.text = asString(source.text, '');
    normalized.style = normalizeTextStyle(source.style);
  }

  if (type === 'image') {
    const crop = isObject(source.crop) ? source.crop : {};
    normalized.assetId = asString(source.assetId, '');
    normalized.source = asString(source.source, '');
    normalized.alt = asString(source.alt, '');
    normalized.fit = ['contain', 'cover', 'fill'].includes(source.fit) ? source.fit : 'contain';
    normalized.crop = {
      x: asNumber(crop.x, 0),
      y: asNumber(crop.y, 0),
      scale: Math.max(0.05, asNumber(crop.scale, 1))
    };
  }

  if (type === 'shape') {
    normalized.shape = ['rectangle', 'ellipse', 'line'].includes(source.shape) ? source.shape : 'rectangle';
    normalized.fill = asString(source.fill, '#ffffff');
    normalized.stroke = asString(source.stroke, '#1f2937');
    normalized.strokeWidth = Math.max(0, asNumber(source.strokeWidth, 1));
  }

  return normalized;
}

function normalizePage(page, index) {
  const source = isObject(page) ? page : {};
  const role = VALID_PAGE_ROLES.has(source.role) ? source.role : PAGE_ROLES.CONTENT;
  return {
    id: asString(source.id, makeId('page')),
    order: index,
    role,
    title: asString(source.title, ''),
    background: asString(source.background, '#ffffff'),
    locked: asBoolean(source.locked, false),
    elements: Array.isArray(source.elements) ? source.elements.map(normalizeElement) : []
  };
}

function normalizeAsset(asset) {
  const source = isObject(asset) ? asset : {};
  return {
    id: asString(source.id, makeId('asset')),
    type: asString(source.type, 'image'),
    name: asString(source.name, ''),
    mimeType: asString(source.mimeType, ''),
    originalAssetId: asString(source.originalAssetId, ''),
    storagePath: asString(source.storagePath, ''),
    source: asString(source.source, ''),
    width: Math.max(0, asNumber(source.width, 0)),
    height: Math.max(0, asNumber(source.height, 0)),
    size: Math.max(0, asNumber(source.size, 0))
  };
}

function createBasePages() {
  return [
    normalizePage({ role: PAGE_ROLES.FRONT_COVER, title: '앞표지' }, 0),
    normalizePage({ role: PAGE_ROLES.CONTENT, title: '첫 번째 페이지' }, 1),
    normalizePage({ role: PAGE_ROLES.BACK_COVER, title: '뒤표지' }, 2)
  ];
}

export function getBookPreset(bookType) {
  const safeType = VALID_BOOK_TYPES.has(bookType) ? bookType : BOOK_TYPES.COLORING_BOOK;
  return copy(BOOK_PRESETS[safeType]);
}

export function createBookProject(options = {}) {
  const bookType = VALID_BOOK_TYPES.has(options.bookType)
    ? options.bookType
    : BOOK_TYPES.COLORING_BOOK;
  const preset = getBookPreset(bookType);
  const createdAt = isoNow();

  return {
    formatVersion: BOOK_FORMAT_VERSION,
    id: asString(options.id, makeId('book')),
    bookType,
    title: asString(options.title, '제목 없는 책'),
    description: asString(options.description, ''),
    pageSetup: {
      view: preset.pageView,
      readingDirection: 'left-to-right',
      finishedSize: 'auto'
    },
    printSetup: {
      sheetSize: asString(options.sheetSize, 'A4'),
      sheetStandard: asString(options.sheetStandard, 'ISO'),
      orientation: 'portrait',
      mode: preset.printMode,
      binding: 'left',
      duplexFlip: 'long-edge',
      bleedMm: 0,
      gutterMm: 0,
      calibrationProfileId: ''
    },
    toolSetup: {
      allowedElements: preset.allowedElements,
      studentTools: ['image', 'text', 'undo', 'redo', 'page-navigation']
    },
    pages: createBasePages(),
    assets: [],
    createdAt,
    updatedAt: createdAt
  };
}

export function normalizeBookProject(rawProject) {
  if (!isObject(rawProject)) {
    throw new TypeError('책 데이터가 올바른 형식이 아닙니다.');
  }

  if (rawProject.formatVersion === 'kcs-book-v1') {
    return upgradeLegacyProject(rawProject);
  }

  if (rawProject.formatVersion !== BOOK_FORMAT_VERSION) {
    throw new Error(`지원하지 않는 책 형식입니다: ${asString(rawProject.formatVersion, '버전 없음')}`);
  }

  const base = createBookProject({
    id: rawProject.id,
    bookType: rawProject.bookType,
    title: rawProject.title,
    description: rawProject.description
  });
  const pageSetup = isObject(rawProject.pageSetup) ? rawProject.pageSetup : {};
  const printSetup = isObject(rawProject.printSetup) ? rawProject.printSetup : {};
  const toolSetup = isObject(rawProject.toolSetup) ? rawProject.toolSetup : {};
  const pages = Array.isArray(rawProject.pages) && rawProject.pages.length
    ? rawProject.pages.map(normalizePage)
    : base.pages;

  return {
    ...base,
    id: asString(rawProject.id, base.id),
    bookType: VALID_BOOK_TYPES.has(rawProject.bookType) ? rawProject.bookType : base.bookType,
    title: asString(rawProject.title, base.title),
    description: asString(rawProject.description, ''),
    pageSetup: {
      view: ['single', 'facing'].includes(pageSetup.view) ? pageSetup.view : base.pageSetup.view,
      readingDirection: pageSetup.readingDirection === 'right-to-left' ? 'right-to-left' : 'left-to-right',
      finishedSize: asString(pageSetup.finishedSize, 'auto')
    },
    printSetup: {
      ...base.printSetup,
      sheetSize: ['A4', 'B4', 'A3'].includes(printSetup.sheetSize) ? printSetup.sheetSize : base.printSetup.sheetSize,
      sheetStandard: ['ISO', 'JIS'].includes(printSetup.sheetStandard) ? printSetup.sheetStandard : base.printSetup.sheetStandard,
      orientation: ['portrait', 'landscape'].includes(printSetup.orientation) ? printSetup.orientation : base.printSetup.orientation,
      mode: ['single-sided', 'duplex', 'booklet'].includes(printSetup.mode) ? printSetup.mode : base.printSetup.mode,
      binding: ['left', 'right', 'top'].includes(printSetup.binding) ? printSetup.binding : base.printSetup.binding,
      duplexFlip: ['long-edge', 'short-edge'].includes(printSetup.duplexFlip) ? printSetup.duplexFlip : base.printSetup.duplexFlip,
      bleedMm: Math.max(0, asNumber(printSetup.bleedMm, 0)),
      gutterMm: Math.max(0, asNumber(printSetup.gutterMm, 0)),
      calibrationProfileId: asString(printSetup.calibrationProfileId, '')
    },
    toolSetup: {
      allowedElements: Array.isArray(toolSetup.allowedElements)
        ? toolSetup.allowedElements.filter((type) => ['image', 'text', 'shape'].includes(type))
        : base.toolSetup.allowedElements,
      studentTools: Array.isArray(toolSetup.studentTools)
        ? toolSetup.studentTools.filter((tool) => typeof tool === 'string')
        : base.toolSetup.studentTools
    },
    pages,
    assets: Array.isArray(rawProject.assets) ? rawProject.assets.map(normalizeAsset) : [],
    createdAt: asString(rawProject.createdAt, base.createdAt),
    updatedAt: asString(rawProject.updatedAt, isoNow())
  };
}

export function upgradeLegacyProject(legacyProject) {
  if (!isObject(legacyProject) || legacyProject.formatVersion !== 'kcs-book-v1') {
    throw new Error('이전 형식의 책 데이터가 아닙니다.');
  }

  const project = createBookProject({
    bookType: BOOK_TYPES.COLORING_BOOK,
    title: asString(legacyProject.title, '제목 없는 책'),
    sheetSize: asString(legacyProject.paper, 'A4')
  });
  const legacyCover = isObject(legacyProject.cover) ? legacyProject.cover : {};
  const pages = [];

  pages.push(normalizePage({
    role: PAGE_ROLES.FRONT_COVER,
    title: asString(legacyCover.title, project.title),
    elements: [
      {
        type: 'image',
        name: '표지 그림',
        source: asString(legacyCover.imageSrc, ''),
        frame: { x: 10, y: 10, width: 80, height: 58 }
      },
      {
        type: 'text',
        name: '표지 제목',
        text: asString(legacyCover.title, project.title),
        frame: { x: 10, y: 70, width: 80, height: 10 },
        style: { fontSize: 28, fontWeight: '700', align: 'center' }
      },
      {
        type: 'text',
        name: '표지 설명',
        text: asString(legacyCover.subtitle, ''),
        frame: { x: 10, y: 82, width: 80, height: 8 },
        style: { fontSize: 15, align: 'center' }
      }
    ]
  }, 0));

  const spreads = Array.isArray(legacyProject.spreads) ? legacyProject.spreads : [];
  spreads.forEach((spread, spreadIndex) => {
    const safeSpread = isObject(spread) ? spread : {};
    pages.push(normalizePage({
      role: PAGE_ROLES.CONTENT,
      title: asString(safeSpread.leftTitle, `${spreadIndex + 1}번째 글`),
      elements: [
        {
          type: 'text',
          name: '페이지 제목',
          text: asString(safeSpread.leftTitle, ''),
          frame: { x: 10, y: 12, width: 80, height: 12 },
          style: {
            fontSize: asNumber(safeSpread.leftFontSize, 24),
            fontWeight: asString(safeSpread.leftFontWeight, '700'),
            align: 'left'
          }
        },
        {
          type: 'text',
          name: '페이지 글',
          text: asString(safeSpread.leftBody, ''),
          frame: { x: 10, y: 28, width: 80, height: 60 },
          style: {
            fontSize: asNumber(safeSpread.leftFontSize, 24),
            fontWeight: asString(safeSpread.leftFontWeight, '400'),
            align: 'left'
          }
        }
      ]
    }, pages.length));

    pages.push(normalizePage({
      role: PAGE_ROLES.CONTENT,
      title: `${spreadIndex + 1}번째 그림`,
      elements: [
        {
          type: 'image',
          name: '페이지 그림',
          source: asString(safeSpread.rightImage, ''),
          crop: {
            x: asNumber(safeSpread.rightImageX, 0),
            y: asNumber(safeSpread.rightImageY, 0),
            scale: asNumber(safeSpread.rightImageScale, 1)
          },
          frame: { x: 8, y: 8, width: 84, height: 84 }
        }
      ]
    }, pages.length));
  });

  pages.push(normalizePage({ role: PAGE_ROLES.BACK_COVER, title: '뒤표지' }, pages.length));

  return {
    ...project,
    pages,
    createdAt: asString(legacyProject.savedAt, project.createdAt),
    updatedAt: asString(legacyProject.savedAt, project.updatedAt),
    migration: {
      sourceFormat: 'kcs-book-v1',
      convertedAt: isoNow()
    }
  };
}

export function createRevisionSnapshot(options = {}) {
  const document = normalizeBookProject(options.document);
  const kind = VALID_REVISION_KINDS.has(options.kind) ? options.kind : REVISION_KINDS.DRAFT;
  const authorRole = VALID_AUTHOR_ROLES.has(options.authorRole) ? options.authorRole : AUTHOR_ROLES.MEMBER;

  return {
    id: asString(options.id, makeId('revision')),
    projectId: asString(options.projectId, document.id),
    parentRevisionId: asString(options.parentRevisionId, ''),
    kind,
    authorRole,
    createdAt: isoNow(),
    document
  };
}

export function getReadingPages(project) {
  return normalizeBookProject(project).pages.map((page, index) => ({ ...page, order: index }));
}

export function getFacingSpreads(project) {
  const pages = getReadingPages(project);
  if (!pages.length) return [];

  const spreads = [{ index: 0, pages: [pages[0]] }];
  for (let index = 1; index < pages.length; index += 2) {
    spreads.push({ index: spreads.length, pages: pages.slice(index, index + 2) });
  }
  return spreads;
}
