const PROFILE_STORAGE_KEY = 'kcs-book-print-profiles-v1';

export const PAPER_SIZES = Object.freeze({
  A4: Object.freeze({ key: 'A4', name: 'A4', standard: 'ISO', widthMm: 210, heightMm: 297 }),
  A3: Object.freeze({ key: 'A3', name: 'A3', standard: 'ISO', widthMm: 297, heightMm: 420 }),
  B4_ISO: Object.freeze({ key: 'B4', name: 'B4 (ISO)', standard: 'ISO', widthMm: 250, heightMm: 353 }),
  B4_JIS: Object.freeze({ key: 'B4', name: 'B4 (복사기 규격)', standard: 'JIS', widthMm: 257, heightMm: 364 })
});

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function clamp(value, min, max, fallback = 0) {
  const number = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeColor(value, fallback = '#1f2937') {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function safeText(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

export function getPaperSize(size = 'A4', standard = 'ISO') {
  if (size === 'A3') return PAPER_SIZES.A3;
  if (size === 'B4') return standard === 'ISO' ? PAPER_SIZES.B4_ISO : PAPER_SIZES.B4_JIS;
  return PAPER_SIZES.A4;
}

export function normalizeCalibrationProfile(profile = {}) {
  const face = (source = {}) => ({
    xMm: clamp(source.xMm, -20, 20),
    yMm: clamp(source.yMm, -20, 20),
    rotationDeg: clamp(source.rotationDeg, -2, 2),
    scalePercent: clamp(source.scalePercent, 95, 105, 100)
  });

  return {
    id: String(profile.id || ''),
    name: String(profile.name || '기본 프린터'),
    paperSize: ['A4', 'B4', 'A3'].includes(profile.paperSize) ? profile.paperSize : 'A4',
    paperStandard: ['ISO', 'JIS'].includes(profile.paperStandard) ? profile.paperStandard : 'ISO',
    duplexFlip: profile.duplexFlip === 'short-edge' ? 'short-edge' : 'long-edge',
    paperThicknessMm: clamp(profile.paperThicknessMm, 0.04, 0.5, 0.1),
    front: face(profile.front),
    back: face(profile.back),
    updatedAt: String(profile.updatedAt || new Date().toISOString())
  };
}

export function createCalibrationProfile(options = {}) {
  return normalizeCalibrationProfile({
    id: options.id || `print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: options.name || '기본 프린터',
    paperSize: options.paperSize || 'A4',
    paperStandard: options.paperStandard || 'ISO',
    duplexFlip: options.duplexFlip || 'long-edge',
    paperThicknessMm: options.paperThicknessMm ?? 0.1,
    front: options.front,
    back: options.back
  });
}

export function listCalibrationProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || '[]');
    return Array.isArray(profiles) ? profiles.map(normalizeCalibrationProfile) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function saveCalibrationProfile(profile) {
  const normalized = normalizeCalibrationProfile({ ...profile, updatedAt: new Date().toISOString() });
  if (!normalized.id) normalized.id = `print_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const profiles = listCalibrationProfiles();
  const index = profiles.findIndex((item) => item.id === normalized.id);
  if (index >= 0) profiles[index] = normalized;
  else profiles.push(normalized);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  return clone(normalized);
}

export function findMatchingCalibrationProfile(paperSize, paperStandard) {
  return listCalibrationProfiles().find((profile) => (
    profile.paperSize === paperSize && profile.paperStandard === paperStandard
  )) || null;
}

function makeBlankPage(index) {
  return {
    id: `print_blank_${index}`,
    order: index,
    role: 'blank',
    title: '빈 페이지',
    background: '#ffffff',
    elements: [],
    printGenerated: true
  };
}

export function padPagesForBooklet(pages) {
  const padded = pages.map((page) => clone(page));
  while (padded.length % 4 !== 0) padded.push(makeBlankPage(padded.length));
  return padded;
}

export function buildBookletSheets(pages) {
  const padded = padPagesForBooklet(pages);
  const sheets = [];
  let left = 0;
  let right = padded.length - 1;

  while (left < right) {
    sheets.push({
      index: sheets.length,
      front: [padded[right], padded[left]],
      back: [padded[left + 1], padded[right - 1]]
    });
    left += 2;
    right -= 2;
  }
  return sheets;
}

function getCreepMm(sheetIndex, sheetCount, paperThicknessMm) {
  if (sheetCount <= 1) return 0;
  return Math.round(clamp(paperThicknessMm, 0.04, 0.5, 0.1) * sheetIndex * 100) / 100;
}

function renderElement(element, scale = 1) {
  const frame = element.frame || {};
  const frameStyle = `
    left:${clamp(frame.x, -100, 200)}%;
    top:${clamp(frame.y, -100, 200)}%;
    width:${clamp(frame.width, 0.1, 200, 10)}%;
    height:${clamp(frame.height, 0.1, 200, 10)}%;
    transform:rotate(${clamp(frame.rotation, -360, 360)}deg);
  `;

  if (element.type === 'text') {
    const style = element.style || {};
    const align = ['left', 'center', 'right', 'justify'].includes(style.align) ? style.align : 'left';
    return `
      <div class="book-element text-element" style="${frameStyle}
        font-family:'${escapeHtml(style.fontFamily || 'Noto Sans KR')}', 'Malgun Gothic', sans-serif;
        font-size:${clamp(style.fontSize, 6, 120, 16) * scale}px;
        font-weight:${escapeHtml(style.fontWeight || '400')};
        font-style:${style.italic ? 'italic' : 'normal'};
        text-decoration:${style.underline ? 'underline' : 'none'};
        color:${safeColor(style.color)};
        text-align:${align};
        line-height:${clamp(style.lineHeight, 0.8, 3, 1.5)};
        letter-spacing:${clamp(style.letterSpacing, -5, 20)}px;
      ">${safeText(element.text || '')}</div>
    `;
  }

  if (element.type === 'image') {
    return `
      <div class="book-element image-element" style="${frameStyle}">
        ${element.source
          ? `<img src="${escapeHtml(element.source)}" alt="${escapeHtml(element.alt || '')}" style="object-fit:${['contain', 'cover', 'fill'].includes(element.fit) ? element.fit : 'contain'}">`
          : ''}
      </div>
    `;
  }

  if (element.type === 'shape') {
    const radius = element.shape === 'ellipse' ? '50%' : '0';
    return `<div class="book-element" style="${frameStyle} border-radius:${radius}; background:${safeColor(element.fill, '#ffffff')}; border:${clamp(element.strokeWidth, 0, 20, 1)}px solid ${safeColor(element.stroke)};"></div>`;
  }

  return '';
}

function renderBookPage(page, options = {}) {
  const creepMm = Number(options.creepMm) || 0;
  const creepDirection = options.slot === 'left' ? 1 : -1;
  const pageLabel = page.printGenerated ? '자동으로 넣은 빈 페이지' : escapeHtml(page.title || '책 페이지');
  return `
    <article class="book-page ${page.role || 'content'}" style="background:${safeColor(page.background, '#ffffff')}; --creep-mm:${creepMm * creepDirection}mm;">
      <div class="page-content">
        ${(page.elements || []).filter((element) => !element.hidden).map((element) => renderElement(element, options.textScale || 1)).join('')}
      </div>
      <span class="page-label">${pageLabel}</span>
    </article>
  `;
}

function faceTransform(profile, side) {
  const face = side === 'back' ? profile.back : profile.front;
  return `translate(${face.xMm}mm, ${face.yMm}mm) rotate(${face.rotationDeg}deg) scale(${face.scalePercent / 100})`;
}

function buildPrintFaces(project, options, profile) {
  const pages = Array.isArray(project.pages) ? project.pages : [];
  const mode = options.mode;

  if (mode === 'booklet') {
    const sheets = buildBookletSheets(pages);
    return sheets.flatMap((sheet) => {
      const creepMm = getCreepMm(sheet.index, sheets.length, profile.paperThicknessMm);
      return [
        { label: `${sheet.index + 1}번째 종이 앞면`, side: 'front', pages: sheet.front, creepMm },
        { label: `${sheet.index + 1}번째 종이 뒷면`, side: 'back', pages: sheet.back, creepMm }
      ];
    });
  }

  if (mode === 'duplex') {
    const faces = [];
    for (let index = 0; index < pages.length; index += 2) {
      faces.push({ label: `${Math.floor(index / 2) + 1}번째 종이 앞면`, side: 'front', pages: [pages[index]], creepMm: 0 });
      faces.push({ label: `${Math.floor(index / 2) + 1}번째 종이 뒷면`, side: 'back', pages: [pages[index + 1] || makeBlankPage(index + 1)], creepMm: 0 });
    }
    return faces;
  }

  return pages.map((page, index) => ({
    label: `${index + 1}번째 인쇄면`,
    side: 'front',
    pages: [page],
    creepMm: 0
  }));
}

function buildPrintDocument(project, options, profile) {
  const paper = getPaperSize(options.paperSize, options.paperStandard);
  const booklet = options.mode === 'booklet';
  const sheetWidth = booklet ? paper.heightMm : paper.widthMm;
  const sheetHeight = booklet ? paper.widthMm : paper.heightMm;
  const faces = buildPrintFaces(project, options, profile);
  const fontScale = paper.key === 'A3' ? 1.22 : paper.key === 'B4' ? 1.12 : 1;

  return `<!doctype html>
  <html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(project.title || '책 인쇄')}</title>
    <style>
      @page { size: ${sheetWidth}mm ${sheetHeight}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; color: #1f2937; font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; }
      body { background: #e5e7eb; }
      .screen-guide { max-width: 980px; margin: 20px auto; padding: 16px 18px; border-radius: 14px; background: #fff7d6; line-height: 1.65; }
      .screen-guide strong { display: block; margin-bottom: 4px; }
      .sheet { position: relative; width: ${sheetWidth}mm; height: ${sheetHeight}mm; overflow: hidden; margin: 12mm auto; background: #fff; break-after: page; page-break-after: always; box-shadow: 0 10px 28px rgba(0,0,0,.18); }
      .face-content { width: 100%; height: 100%; display: flex; align-items: stretch; justify-content: center; transform-origin: center; }
      .book-page { position: relative; flex: ${booklet ? '0 0 50%' : '0 0 100%'}; height: 100%; overflow: hidden; transform: translateX(var(--creep-mm)); }
      .book-page + .book-page { border-left: .2mm dashed rgba(17,24,39,.24); }
      .page-content { position: absolute; inset: 0; overflow: hidden; }
      .book-element { position: absolute; overflow: hidden; }
      .text-element { padding: 1.4%; white-space: pre-wrap; word-break: break-word; }
      .image-element img { width: 100%; height: 100%; display: block; }
      .page-label { position: absolute; right: 2mm; bottom: 1.5mm; color: rgba(31,41,55,.38); font-size: 6px; }
      .face-label { position: absolute; z-index: 5; left: 2mm; top: 1.5mm; color: rgba(31,41,55,.42); font-size: 6px; }
      .print-button { position: fixed; z-index: 20; right: 20px; bottom: 20px; min-height: 48px; padding: 0 20px; border: 0; border-radius: 14px; color: #fff; background: #0f765d; font: inherit; font-weight: 700; cursor: pointer; box-shadow: 0 6px 0 #095744; }
      @media print {
        body { background: #fff; }
        .screen-guide, .print-button, .face-label, .page-label { display: none !important; }
        .sheet { margin: 0; box-shadow: none; }
      }
    </style>
  </head>
  <body>
    <div class="screen-guide">
      <strong>${escapeHtml(paper.name)} · ${options.mode === 'booklet' ? '소책자' : options.mode === 'duplex' ? '양면' : '한 면씩'} 인쇄 미리보기</strong>
      인쇄 창에서 반드시 배율을 <b>100% 또는 실제 크기</b>로 선택하세요. 브라우저 머리글과 바닥글은 끄는 것을 권장합니다.
    </div>
    ${faces.map((face) => `
      <section class="sheet">
        <span class="face-label">${escapeHtml(face.label)}</span>
        <div class="face-content" style="transform:${faceTransform(profile, face.side)}">
          ${face.pages.map((page, index) => renderBookPage(page, { slot: index === 0 ? 'left' : 'right', creepMm: face.creepMm, textScale: fontScale })).join('')}
        </div>
      </section>
    `).join('')}
    <button class="print-button" type="button" onclick="window.print()">인쇄 창 열기</button>
  </body>
  </html>`;
}

function openDocument(html) {
  document.getElementById('book-print-preview-fallback')?.remove();

  const previewUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const preview = document.createElement('section');
  preview.id = 'book-print-preview-fallback';
  preview.setAttribute('role', 'dialog');
  preview.setAttribute('aria-modal', 'true');
  preview.setAttribute('aria-labelledby', 'book-print-preview-title');
  preview.innerHTML = `
    <style>
      #book-print-preview-fallback { position: fixed; inset: 0; z-index: 30000; display: grid; grid-template-rows: auto minmax(0, 1fr); color: #20352d; background: #eef2ed; font-family: "Noto Sans KR", "Malgun Gothic", sans-serif; }
      #book-print-preview-fallback .preview-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 68px; padding: 10px 16px; border-bottom: 1px solid #cad5cf; background: #fffdf7; }
      #book-print-preview-fallback .preview-copy { min-width: 0; }
      #book-print-preview-fallback .preview-copy strong { display: block; font-size: 18px; }
      #book-print-preview-fallback .preview-copy span { display: block; margin-top: 2px; color: #64736c; font-size: 13px; }
      #book-print-preview-fallback .preview-actions { display: flex; flex-shrink: 0; gap: 8px; }
      #book-print-preview-fallback button { min-height: 44px; padding: 9px 15px; border: 2px solid #2f7057; border-radius: 12px; color: #2f7057; background: #fff; font: inherit; font-weight: 800; cursor: pointer; }
      #book-print-preview-fallback .preview-print { color: #fff; background: #2f7057; }
      #book-print-preview-fallback iframe { width: 100%; height: 100%; border: 0; background: #fff; }
      @media (max-width: 560px) {
        #book-print-preview-fallback .preview-bar { align-items: stretch; flex-direction: column; }
        #book-print-preview-fallback .preview-actions { display: grid; grid-template-columns: 1fr 1fr; }
      }
    </style>
    <header class="preview-bar">
      <div class="preview-copy">
        <strong id="book-print-preview-title">인쇄 미리보기</strong>
        <span>용지 크기와 페이지 순서를 확인한 뒤 인쇄 창을 열어 주세요.</span>
      </div>
      <div class="preview-actions">
        <button class="preview-close" type="button">편집기로 돌아가기</button>
        <button class="preview-print" type="button">인쇄 창 열기</button>
      </div>
    </header>
    <iframe title="책 인쇄 미리보기"></iframe>
  `;

  const frame = preview.querySelector('iframe');
  const closeButton = preview.querySelector('.preview-close');
  const cleanup = () => {
    URL.revokeObjectURL(previewUrl);
    preview.remove();
  };

  frame.src = previewUrl;
  closeButton.addEventListener('click', cleanup, { once: true });
  preview.querySelector('.preview-print').addEventListener('click', () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  });
  document.body.append(preview);
  closeButton.focus();
  return true;
}

export function openBookPrintPreview(project, options = {}, rawProfile = {}) {
  const profile = normalizeCalibrationProfile(rawProfile);
  const normalizedOptions = {
    paperSize: ['A4', 'B4', 'A3'].includes(options.paperSize) ? options.paperSize : 'A4',
    paperStandard: ['ISO', 'JIS'].includes(options.paperStandard) ? options.paperStandard : 'ISO',
    mode: ['single-sided', 'duplex', 'booklet'].includes(options.mode) ? options.mode : 'single-sided'
  };
  return openDocument(buildPrintDocument(project, normalizedOptions, profile));
}

function calibrationPage(label, color, transform) {
  return `
    <section class="calibration-sheet">
      <div class="calibration-content" style="transform:${transform}">
        <div class="edge edge-top"></div><div class="edge edge-right"></div><div class="edge edge-bottom"></div><div class="edge edge-left"></div>
        <div class="cross horizontal"></div><div class="cross vertical"></div>
        <div class="center-dot"></div>
        <div class="calibration-label" style="color:${color}">${label}</div>
        <div class="measure x-measure">가로 중심선</div>
        <div class="measure y-measure">세로 중심선</div>
      </div>
    </section>
  `;
}

export function openCalibrationPrint(options = {}, rawProfile = {}) {
  const profile = normalizeCalibrationProfile(rawProfile);
  const paper = getPaperSize(options.paperSize, options.paperStandard);
  const html = `<!doctype html>
  <html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>양면 위치 맞추기</title>
    <style>
      @page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; font-family: "Malgun Gothic", sans-serif; }
      body { background: #e5e7eb; }
      .guide { max-width: 860px; margin: 18px auto; padding: 16px; border-radius: 12px; background: #fff7d6; line-height: 1.6; }
      .calibration-sheet { position: relative; width: ${paper.widthMm}mm; height: ${paper.heightMm}mm; margin: 10mm auto; overflow: hidden; background: #fff; break-after: page; page-break-after: always; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
      .calibration-content { position: absolute; inset: 0; transform-origin: center; }
      .cross { position: absolute; background: #111827; }
      .horizontal { left: 10mm; right: 10mm; top: 50%; height: .25mm; }
      .vertical { top: 10mm; bottom: 10mm; left: 50%; width: .25mm; }
      .center-dot { position: absolute; left: 50%; top: 50%; width: 4mm; height: 4mm; margin: -2mm; border: .45mm solid #111827; border-radius: 50%; }
      .edge { position: absolute; background: #111827; }
      .edge-top, .edge-bottom { left: 10mm; right: 10mm; height: .25mm; }
      .edge-left, .edge-right { top: 10mm; bottom: 10mm; width: .25mm; }
      .edge-top { top: 10mm; } .edge-bottom { bottom: 10mm; } .edge-left { left: 10mm; } .edge-right { right: 10mm; }
      .calibration-label { position: absolute; left: 14mm; top: 14mm; font-size: 18px; font-weight: 800; }
      .measure { position: absolute; color: #64748b; font-size: 9px; }
      .x-measure { left: 50%; top: calc(50% + 3mm); transform: translateX(-50%); }
      .y-measure { left: calc(50% + 3mm); top: 50%; transform: rotate(90deg) translateX(-50%); transform-origin: left top; }
      .print-button { position: fixed; z-index: 10; right: 20px; bottom: 20px; min-height: 48px; padding: 0 18px; border: 0; border-radius: 12px; color: #fff; background: #0f765d; font: inherit; font-weight: 700; }
      @media print { body { background: #fff; } .guide, .print-button { display: none; } .calibration-sheet { margin: 0; box-shadow: none; } }
    </style>
  </head>
  <body>
    <div class="guide"><strong>양면 위치 맞추기</strong><br>배율을 100%로 하고 양면 인쇄하세요. 빛에 비춰 앞면과 뒷면 중심선 차이를 mm로 잰 뒤 책 편집기의 앞면·뒷면 보정칸에 입력합니다.</div>
    ${calibrationPage('앞면', '#0f765d', faceTransform(profile, 'front'))}
    ${calibrationPage('뒷면', '#d9604a', faceTransform(profile, 'back'))}
    <button class="print-button" type="button" onclick="window.print()">테스트 인쇄</button>
  </body>
  </html>`;
  return openDocument(html);
}
