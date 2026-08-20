const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: 16px;
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
      min-height: 76px;
      display: grid;
      grid-template-columns: minmax(190px, auto) minmax(280px, 1fr) auto;
      align-items: center;
      gap: 18px;
      padding: 12px 16px;
      border: 1px solid #d7e1da;
      border-radius: 22px;
      background: rgba(255, 253, 247, 0.96);
      box-shadow: 0 12px 34px rgba(35, 57, 48, 0.09);
    }

    .back-link {
      min-height: 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 15px;
      border: 1px solid #d7e1da;
      border-radius: 14px;
      color: #315047;
      background: #ffffff;
      font-size: 14px;
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
      margin-bottom: 2px;
      color: #0f765d;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
    }

    .title {
      overflow: hidden;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.025em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    nav {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px;
      border-radius: 15px;
      background: #edf3ef;
    }

    .view-link {
      min-height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      border-radius: 11px;
      color: #586a64;
      font-size: 14px;
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

    @media (max-width: 900px) {
      .shell {
        grid-template-columns: auto 1fr;
      }

      nav {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 520px) {
      .shell {
        grid-template-columns: 1fr;
        padding: 11px;
      }

      .identity {
        grid-row: 1;
      }

      .back-link {
        grid-row: 2;
      }

      nav {
        grid-column: auto;
        grid-row: 3;
      }

      .view-link {
        min-height: 48px;
        padding: 0 8px;
        font-size: 13px;
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
      <span>책 종류 고르기</span>
    </a>

    <div class="identity">
      <span class="kind"></span>
      <strong class="title"></strong>
    </div>

    <nav aria-label="책 만들기 화면">
      <a class="view-link" data-view="edit" aria-current="page">편집하기</a>
      <a class="view-link" data-view="preview">책으로 보기</a>
      <a class="view-link" data-view="print">인쇄하기</a>
    </nav>
  </div>
`;

class BookEditorShell extends HTMLElement {
  static get observedAttributes() {
    return ['book-kind', 'editor-title', 'editor-description'];
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
