/* <vl-code-editor>: editor del programa del microcontrolador.
   Lee el slice `editor` (código, chip, estado) y emite `editor/edited` y `editor/uploadRequested`.
   Quien compila y reinicia el micro es el controlador de la simulación. */
import { VlElement, esc } from '../../ui/vl-element.js';

export class VlCodeEditor extends VlElement {
  static styles = [new URL('./vl-code-editor.css', import.meta.url).href];
  template() {
    return `<section aria-label="Editor de programa"><header><b class="chip">Sin microcontrolador</b><span class="dirty" hidden>● sin subir</span><span class="sp"></span>
      <button class="upload" type="button" title="Subir el programa al microcontrolador [Ctrl+Enter]">⬆ Subir al micro</button></header>
      <div class="code"><pre class="gutter" aria-hidden="true"></pre><textarea spellcheck="false" aria-label="Código del programa"></textarea></div>
      <p class="status" role="status"></p></section>`;
  }
  mount() {
    const ta = this.$('textarea'), gut = this.$('.gutter');
    let t = 0;
    ta.addEventListener('input', () => { this.#lines(); clearTimeout(t); t = setTimeout(() => this.dispatch({ type:'editor/edited', payload:ta.value }), 250); });
    ta.addEventListener('scroll', () => { gut.scrollTop = ta.scrollTop; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.#upload(); }
    });
    this.$('.upload').addEventListener('click', () => this.#upload());
  }
  bind() {
    this.watch(st => st.editor.mcuId, id => { this.$('.upload').disabled = !id; this.$('textarea').disabled = !id; });
    this.watch(st => st.editor.chip, chip => { this.$('.chip').textContent = chip ? chip + ' · ' + this.store.getState().editor.lang : 'Esta práctica no tiene microcontrolador'; });
    /* el texto solo se reemplaza cuando llega código nuevo de afuera (otra práctica), no mientras escribes */
    this.watch(st => st.project.scenario + '|' + st.editor.mcuId, () => { this.$('textarea').value = this.store.getState().editor.code; this.#lines(); });
    this.watch(st => st.editor.dirty, d => { this.$('.dirty').hidden = !d; });
    this.watch(st => st.editor.status + '|' + st.editor.statusTone, () => { const e = this.store.getState().editor, p = this.$('.status'); p.textContent = e.status; p.className = 'status ' + e.statusTone; });
  }
  #upload() { const ta = this.$('textarea'); this.dispatch({ type:'editor/edited', payload:ta.value }); this.dispatch({ type:'editor/uploadRequested' }); }
  #lines() { const n = this.$('textarea').value.split('\n').length; this.$('.gutter').textContent = Array.from({ length:n }, (_, i) => i + 1).join('\n'); }
}
customElements.define('vl-code-editor', VlCodeEditor);
