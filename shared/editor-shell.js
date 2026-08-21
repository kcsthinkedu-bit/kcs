const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: 12px;
      color: #17352d;
      font-family: "Noto Sans KR", "Malgun Gothic", sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:focus-visible {
      outline: 4px solid rgba(241, 196, 83, 0.9);
      outline-offset: 3px;
    }

    .shell {
      min-height: 62px;
      display: grid;
      grid-template-columns: auto auto minmax(300px, 1fr) auto;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: 1px solid #d7e1da;
      border-radius: 18px;
      background: rgba(255, 253, 247, 0.96);
      box-shadow: 0 12px 34px rgba(35, 57, 48, 0.09);
    }

    .back-link {
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 11px;
      border: 1px solid #d7e1da;
      border-radius: 14px;
      color: #315047;
      background: #ffffff;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .back-link:hover {
      border-color: #8bb6a8;
      background: #f2faf6;
    }

    .arrow {
      font-size: 19px;
      line-height: 1;
    }

    .identity {
      min-width: 0;
    }

    .kind,
    .title {
      display: block;
    }

    .kind {
      min-height: 30px;
      display: inline-flex;
      align-items: center;
      padding: 0 10px;
      border-radius: 999px;
      color: #095744;
      background: #e3f2eb;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
    }

    .title {
      display: none;
    }

    slot[name="project-controls"] {
      min-width: 0;
      display: block;
    }

    nav {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px;
      border-radius: 12px;
      background: #edf3ef;
    }

    .view-link {
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 11px;
      border-radius: 9px;
      color: #586a64;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .view-link:hover {
      color: #17352d;
      background: rgba(255, 255, 255, 0.72);
    }

    .view-link[aria-current="page"] {
      color: #ffffff;
      background: #0f765d;
      box-shadow: 0 4px 0 #095744;
    }

    .view-link[data-view="edit"] {
      display: none;
    }

    @media (max-width: 1200px) {
      .shell {
        grid-template-columns: auto 1fr auto;
      }

      slot[name="project-controls"] {
        grid-row: 2;
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 520px) {
      .shell {
        grid-template-columns: auto 1fr auto;
        gap: 6px;
        padding: 7px;
      }

      .view-link {
        min-height: 38px;
        padding: 0 7px;
        font-size: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        scroll-behavior: auto !important;
      }
    }
  </style>

  <div class="shell">
    <a class="back-link" part="back-link">
      <span class="arrow" aria-hidden="true">←</span>
      <span>책 종류</span>
    </a>

    <div class="identity">
      <span class="kind"></span>
      <strong class="title"></strong>
    </div>

    <slot name="project-controls"></slot>

    <nav aria-label="책 만들기 화면">
      <a class="view-link" data-view="edit" aria-current="page">편집하기</a>
      <a class="view-link" data-view="preview">책으로 보기</a>
      <a class="view-link" data-view="print">인쇄하기</a>
    </nav>
  </div>
`;

class BookEditorShell extends HTMLElement {
  static get observedAttributes() {
    return ['book-kind', 'editor-title', 'editor-description', 'preview-label'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.shadowRoot || oldValue === newValue) return;
    if (name === 'book-kind') {
      this.shadowRoot.querySelector('.kind').textContent = newValue || '책 만들기';
    }
    if (name === 'editor-title') {
      const titleText = newValue || '내 책 만들기';
      this.shadowRoot.querySelector('.title').textContent = titleText;
      document.title = `${titleText} | KCS 책 만들기`;
      const title = document.querySelector('.title-block h1');
      if (title) title.textContent = titleText;
    }
    if (name === 'editor-description') {
      const description = document.querySelector('.title-block p');
      if (description && newValue) description.textContent = newValue;
    }
    if (name === 'preview-label') {
      this.shadowRoot.querySelector('[data-view="preview"]').textContent = newValue || '책으로 보기';
    }
  }

  connectedCallback() {
    if (this.shadowRoot) return;

    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));

    const homeUrl = this.getAttribute('home-url') || '/books/';
    const bookKind = this.getAttribute('book-kind') || '책 만들기';
    const editorTitle = this.getAttribute('editor-title') || '내 책 만들기';
    const editorDescription = this.getAttribute('editor-description') || '';

    root.querySelector('.back-link').href = homeUrl;
    root.querySelector('.kind').textContent = bookKind;
    root.querySelector('.title').textContent = editorTitle;
    root.querySelector('[data-view="preview"]').textContent = this.getAttribute('preview-label') || '책으로 보기';

    const targets = {
      edit: this.getAttribute('edit-target') || '#editWorkspace',
      preview: this.getAttribute('preview-target') || '#bookFlipPreview',
      print: this.getAttribute('print-target') || '#printBookBtn'
    };

    root.querySelectorAll('[data-view]').forEach((link) => {
      const view = link.dataset.view;
      link.href = targets[view];
      link.addEventListener('click', () => this.selectView(view));
    });

    document.title = `${editorTitle} | KCS 책 만들기`;
    const title = document.querySelector('.title-block h1');
    const description = document.querySelector('.title-block p');
    if (title) title.textContent = editorTitle;
    if (description && editorDescription) description.textContent = editorDescription;
  }

  selectView(view) {
    this.shadowRoot.querySelectorAll('[data-view]').forEach((link) => {
      if (link.dataset.view === view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
}

if (!customElements.get('book-editor-shell')) {
  customElements.define('book-editor-shell', BookEditorShell);
}
