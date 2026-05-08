// ABOUTME: Web components for AttentionFeed shared header and footer.
// ABOUTME: Provides <af-header> and <af-footer> elements using Shadow DOM.

class AFHeader extends HTMLElement {
  static get observedAttributes() {
    return ['base-url', 'project-name', 'project-url'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupToggle();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
      this.setupToggle();
    }
  }

  get baseUrl() {
    return (this.getAttribute('base-url') || 'https://attentionfeed.com')
      .replace(/\/$/, '');
  }

  get projectName() {
    return this.getAttribute('project-name') || '';
  }

  get projectUrl() {
    return this.getAttribute('project-url') || '';
  }

  render() {
    const base = this.baseUrl;
    const projectName = this.projectName;
    const projectUrl = this.projectUrl;

    /* Build the title: text "attention feed" on homepage, logo on subprojects */
    let titleHtml;
    if (projectName) {
      titleHtml = `<a href="${base}/" class="site-title-brand"><img src="${base}/shared/af-logo.svg" alt="attention feed" class="site-title-logo" /></a>`;
      const nameHtml = projectUrl
        ? `<a href="${projectUrl}" class="site-title-project">${projectName.toLowerCase()}</a>`
        : `<span class="site-title-project">${projectName.toLowerCase()}</span>`;
      titleHtml += `<span class="site-title-separator">:</span>${nameHtml}`;
    } else {
      titleHtml = `<a href="${base}/" class="site-title-brand">attention feed</a>`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .site-header {
          position: relative;
          border-bottom: 3px solid #501018;
          z-index: 100;
        }

        .site-header-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }

        .site-header-bg::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300vmax;
          height: 300vmax;
          background-color: var(--color-benday-bg);
          background-image: var(--benday-pattern);
          background-repeat: repeat;
          transform: translate(-50%, -50%) rotate(45deg);
        }

        .header-inner {
          position: relative;
          z-index: 1;
          margin: 0 auto;
          padding: var(--space-5) var(--space-5);
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }

        .site-title {
          display: flex;
          align-items: baseline;
          gap: 0;
          line-height: 1;
          white-space: nowrap;
        }

        .site-title-brand,
        .site-title-project {
          font-family: 'Baloo 2', cursive;
          font-weight: 700;
          font-size: var(--text-3xl);
          letter-spacing: 0.03em;
          color: white;
          text-decoration: none;
          line-height: 1;
        }

        .site-title-logo {
          height: 0.68em;
          width: auto;
          display: inline-block;
          vertical-align: -0.2em;
        }

        .site-title-brand:hover,
        .site-title-project:hover {
          text-decoration: none;
          opacity: 0.85;
        }

        .site-title-separator {
          font-family: 'Baloo 2', cursive;
          font-weight: 700;
          font-size: var(--text-3xl);
          color: white;
          opacity: 0.5;
          margin: 0 0.15em;
          line-height: 1;
        }

        /* Slotted nav links (light DOM) */
        .nav-area {
          display: flex;
          align-items: baseline;
          gap: 0;
        }

        ::slotted(a) {
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: white;
          text-decoration: none;
          opacity: 1;
          padding: var(--space-2) 0 var(--space-2) var(--space-4);
          display: inline-block;
        }

        ::slotted(a:hover) {
          opacity: 1;
          text-decoration: none;
        }

        .nav-toggle {
          display: none;
          background: none;
          border: none;
          color: white;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 400;
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
          gap: var(--space-1);
          align-items: center;
          padding: var(--space-2) 0;
        }

        @media (max-width: 768px) {
          .header-inner {
            padding: var(--space-4) var(--space-5);
            position: relative;
          }

          .site-title-brand,
          .site-title-project,
          .site-title-separator {
            font-size: var(--text-2xl);
          }

          .nav-toggle {
            display: flex;
          }

          .nav-area {
            display: none;
            position: absolute;
            top: 100%;
            right: var(--space-5);
            flex-direction: column;
            overflow: hidden;
            padding: var(--space-2) 0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            background-color: var(--color-bg);
          }

          ::slotted(a) {
            color: var(--color-primary);
            padding: var(--space-1) var(--space-4);
          }

          .nav-area.open {
            display: flex;
          }
        }
      </style>

      <header class="site-header">
        <div class="site-header-bg"></div>
        <div class="header-inner">
          <div class="site-title">
            ${titleHtml}
          </div>
          <nav class="site-nav" aria-label="Main navigation">
            <button class="nav-toggle" aria-expanded="false">
              <span class="nav-toggle-label">Menu</span>
              <span class="nav-toggle-arrow" aria-hidden="true">&#x25BE;</span>
            </button>
            <div class="nav-area">
              <slot></slot>
            </div>
          </nav>
        </div>
      </header>
    `;
  }

  setupToggle() {
    const toggle = this.shadowRoot.querySelector('.nav-toggle');
    const navArea = this.shadowRoot.querySelector('.nav-area');

    toggle?.addEventListener('click', () => {
      const isOpen = navArea?.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        navArea?.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
      }
    });
  }
}


class AFFooter extends HTMLElement {
  static get observedAttributes() {
    return ['base-url', 'colophon-url'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  get baseUrl() {
    return (this.getAttribute('base-url') || 'https://attentionfeed.com')
      .replace(/\/$/, '');
  }

  get colophonUrl() {
    return this.getAttribute('colophon-url') || `${this.baseUrl}/colophon`;
  }

  render() {
    const colophonUrl = this.colophonUrl;
    const year = new Date().getFullYear();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .site-footer {
          position: relative;
          overflow: hidden;
          border-top: 3px solid #501018;
          font-family: 'IBM Plex Mono', monospace;
          font-size: var(--text-xs);
          color: white;
        }

        .site-footer::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300vmax;
          height: 300vmax;
          background-color: var(--color-benday-bg);
          background-image: var(--benday-pattern);
          background-repeat: repeat;
          transform: translate(-50%, -50%) rotate(45deg);
          z-index: 0;
        }

        .footer-inner {
          position: relative;
          z-index: 1;
          margin: 0 auto;
          padding: var(--space-3) var(--space-5);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-left,
        .footer-right {
          flex: 1;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .footer-left {
          text-align: left;
        }

        .footer-right {
          text-align: right;
        }

        .footer-center {
          flex: 0 0 auto;
        }

        .footer-logo {
          height: 2.5rem;
          width: auto;
          display: block;
        }

        .separator {
          margin: 0 var(--space-2);
          opacity: 0.4;
        }

        a {
          color: white;
          text-decoration: none;
        }

        a:hover {
          color: white;
          text-decoration: none;
        }
      </style>

      <footer class="site-footer">
        <div class="footer-inner">
          <span class="footer-left">
            <a href="#">Terms</a>
            <span class="separator">:</span>
            <a href="#">Privacy</a>
          </span>
          <span class="footer-center">
            <img src="${this.baseUrl}/shared/af-logo.svg" alt="attention feed" class="footer-logo" />
          </span>
          <span class="footer-right">
            <a href="${colophonUrl}">Colophon</a>
            <span class="separator">:</span>
            <span>Copyright ${year}</span>
          </span>
        </div>
      </footer>
    `;
  }
}

customElements.define('af-header', AFHeader);
customElements.define('af-footer', AFFooter);
