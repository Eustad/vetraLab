/* Base de los componentes de VectraLab: Shadow DOM con hojas de estilo propias (archivos .css del componente),
   conexión al store por propiedad (`el.store = store`), suscripciones que se liberan solas al desmontar
   y eventos de salida `vl-*` que atraviesan el Shadow DOM. */
const sheets = new Map();
export function sheetFrom(url) {
  if (!sheets.has(url)) sheets.set(url, fetch(url).then(r => r.text()).then(t => { const s = new CSSStyleSheet(); s.replaceSync(t); return s; }));
  return sheets.get(url);
}
export class VlElement extends HTMLElement {
  static styles = [];                    // URLs absolutas (new URL('./x.css', import.meta.url))
  #store = null; #unsubs = []; #ready = false;
  constructor() { super(); this.attachShadow({ mode:'open' }); }
  set store(s) { this.#store = s; if (this.#ready) this.#bind(); }
  get store() { return this.#store; }
  async connectedCallback() {
    const urls = [new URL('../../styles/tokens.css', import.meta.url).href, ...this.constructor.styles];
    this.shadowRoot.adoptedStyleSheets = await Promise.all(urls.map(sheetFrom));
    this.shadowRoot.innerHTML = this.template();
    this.#ready = true; this.mount?.();
    if (this.#store) this.#bind();
  }
  disconnectedCallback() { this.#unsubs.forEach(u => u()); this.#unsubs = []; this.#ready = false; this.unmount?.(); }
  #bind() { this.#unsubs.forEach(u => u()); this.#unsubs = []; this.bind?.(); }
  /* suscripción a una parte del estado; se cancela al desmontar */
  watch(selector, cb, equal) { this.#unsubs.push(this.#store.select(selector, cb, equal)); }
  dispatch(action) { return this.#store.dispatch(action); }
  emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail, bubbles:true, composed:true })); }
  $(sel) { return this.shadowRoot.querySelector(sel); }
  template() { return ''; }
}
export const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[ch]);
