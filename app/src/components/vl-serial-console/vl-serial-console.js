/* <vl-serial-console>: monitor del puerto serie del microcontrolador (equivalente a #pxs-live).
   Lee el slice `serial` y emite `serial/sendRequested` y `serial/cleared`. Hace autoscroll solo si el usuario estaba al final. */
import { VlElement, esc } from '../../ui/vl-element.js';

export class VlSerialConsole extends VlElement {
  static styles = [new URL('./vl-serial-console.css', import.meta.url).href];
  template() {
    return `<section aria-label="Monitor serie"><header><b>Monitor serie</b><span class="baud">9600 baudios</span><span class="sp"></span>
      <label><input type="checkbox" class="ts"> Marca de tiempo</label><button class="clear" type="button">Limpiar</button></header>
      <pre class="out" role="log" aria-live="polite"></pre>
      <form><input name="tx" autocomplete="off" placeholder="Enviar al micro (Enter)" aria-label="Texto a enviar por el puerto serie"><button type="submit">Enviar</button></form></section>`;
  }
  mount() {
    this.$('form').addEventListener('submit', e => { e.preventDefault(); const t = e.target.tx.value; if (!t) return; e.target.tx.value = ''; this.dispatch({ type:'serial/sendRequested', payload:t }); });
    this.$('.clear').addEventListener('click', () => this.dispatch({ type:'serial/cleared' }));
    this.$('.ts').addEventListener('change', () => this.#render(this.store.getState().serial.lines));
  }
  bind() {
    this.watch(st => st.serial.mcuId, id => { this.$('form input').disabled = !id; this.$('form button').disabled = !id; });
    this.watch(st => st.serial.rev, () => this.#render(this.store.getState().serial.lines));
  }
  #render(lines) {
    const out = this.$('.out'), atEnd = out.scrollHeight - out.scrollTop - out.clientHeight < 24, ts = this.$('.ts').checked;
    const t = this.store.getState().sim.time;
    out.innerHTML = lines.length ? lines.map(l => (ts ? '<span class="t">' + t.toFixed(2) + ' s</span> ' : '') + (l.startsWith('› ') ? '<span class="tx">' + esc(l) + '</span>' : esc(l))).join('\n') : '<span class="hint">Sin datos: el programa debe llamar a Serial.begin() y Serial.println().</span>';
    if (atEnd) out.scrollTop = out.scrollHeight;
  }
}
customElements.define('vl-serial-console', VlSerialConsole);
