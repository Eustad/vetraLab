/* <vl-inspector>: datos de la pieza seleccionada (voltaje, corriente, temperatura) y su estado de daño.
   La selección puede venir del viewport, del tutor («Ver pieza») o de cualquier otro componente: todos escriben
   `project/selected` y este panel solo reacciona al store. */
import { VlElement, esc } from '../../ui/vl-element.js';
import { selectComp } from '../../state/slices.js';

export class VlInspector extends VlElement {
  static styles = [new URL('./vl-inspector.css', import.meta.url).href];
  template() { return `<section aria-label="Inspector"><div class="body"><p class="hint">Haz clic en una pieza de la escena.</p></div></section>`; }
  mount() { this.shadowRoot.addEventListener('click', e => { if (e.target.closest('.repair')) this.dispatch({ type:'sim/repairRequested', payload:this.store.getState().project.selectedId }); }); }
  bind() {
    this.watch(st => st.project.selectedId + '|' + !!(st.project.selectedId && st.sim.failures[st.project.selectedId]), () => this.#render());
    this.watch(st => st.sim.rev, () => this.#readouts());
  }
  #render() {
    const st = this.store.getState(), c = selectComp(st, st.project.selectedId), body = this.$('.body');
    if (!c) { body.innerHTML = '<p class="hint">Haz clic en una pieza de la escena.</p>'; return; }
    const f = st.sim.failures[c.id];
    body.innerHTML = `<header><h2>${esc(c.name)}</h2><span class="chip ${f ? (f.protegido ? 'warn' : 'bad') : 'ok'}">${f ? (f.protegido ? 'Protegida' : 'Dañada') : 'Normal'}</span></header>
      <p class="kind">${esc(c.type)}</p>
      <dl><div><dt>Voltaje</dt><dd class="v">—</dd></div><div><dt>Corriente</dt><dd class="i">—</dd></div><div><dt>Temperatura</dt><dd class="T">—</dd></div></dl>
      ${f ? `<p class="fail">Falla: ${esc(f.kind)}${f.i ? ' con ' + (f.i * 1000).toFixed(0) + ' mA' : ''} a los ${f.at.toFixed(2)} s.</p><button class="repair" type="button">Reparar (reemplazar por una nueva)</button>` : ''}`;
    this.#readouts();
  }
  #readouts() {
    const st = this.store.getState(), r = st.sim.readouts[st.project.selectedId]; if (!r) return;
    const set = (k, v) => { const el = this.$('.' + k); if (el) el.textContent = v; };
    set('v', r.v.toFixed(2) + ' V'); set('i', Math.abs(r.i) >= 1 ? r.i.toFixed(2) + ' A' : (r.i * 1000).toFixed(1) + ' mA'); set('T', Math.round(r.T) + ' °C');
  }
}
customElements.define('vl-inspector', VlInspector);
