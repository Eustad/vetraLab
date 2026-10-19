/* <vl-tutor>: conversación del tutor de laboratorio.
   Lee el slice `tutor` (mensajes) y emite `tutor/asked`. Los avisos de fallas los genera el controlador al recibir
   el evento del motor: el tutor no sabe nada de Three.js ni del solver. Un mensaje con compId ofrece «Ver pieza». */
import { VlElement, esc } from '../../ui/vl-element.js';

export class VlTutor extends VlElement {
  static styles = [new URL('./vl-tutor.css', import.meta.url).href];
  template() {
    return `<section aria-label="Tutor de laboratorio"><header><b>Tutor de laboratorio</b><button class="clear" type="button" title="Borrar la conversación">Limpiar</button></header>
      <ol class="log" aria-live="polite"></ol>
      <form><input name="q" autocomplete="off" placeholder="Pregunta algo: ¿por qué falla?, ¿qué mide esta pieza?" aria-label="Pregunta al tutor"><button type="submit">Enviar</button></form></section>`;
  }
  mount() {
    this.$('form').addEventListener('submit', e => { e.preventDefault(); const q = e.target.q.value.trim(); if (!q) return; e.target.q.value = ''; this.dispatch({ type:'tutor/asked', payload:q }); });
    this.$('.clear').addEventListener('click', () => this.dispatch({ type:'tutor/cleared' }));
    this.$('.log').addEventListener('click', e => { const b = e.target.closest('[data-comp]'); if (b) this.dispatch({ type:'project/selected', payload:b.dataset.comp }); });
  }
  bind() {
    this.watch(st => st.tutor.messages, msgs => {
      const log = this.$('.log');
      log.innerHTML = msgs.length ? msgs.map(m => `<li class="${m.role} ${m.tone || ''}">${esc(m.text)}${m.compId ? ` <button type="button" data-comp="${esc(m.compId)}">Ver pieza</button>` : ''}</li>`).join('') : '<li class="hint">Pregúntame por el circuito o selecciona una pieza.</li>';
      log.scrollTop = log.scrollHeight;
    });
    this.watch(st => st.tutor.busy, busy => { this.$('form button').disabled = busy; });
  }
}
customElements.define('vl-tutor', VlTutor);
