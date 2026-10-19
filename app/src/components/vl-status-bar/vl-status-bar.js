/* <vl-status-bar>: LED de estado, tiempo simulado y conteo de fallas. Una pieza que se quema en el motor
   llega aquí como cambio del slice `sim.failures`: el LED se pone rojo sin que nadie toque este DOM desde fuera. */
import { VlElement } from '../../ui/vl-element.js';
import { selectFailureCount } from '../../state/slices.js';

export class VlStatusBar extends VlElement {
  static styles = [new URL('./vl-status-bar.css', import.meta.url).href];
  template() {
    return `<footer><i class="led" aria-hidden="true"></i><span class="main" role="status">Cargando…</span><span class="time"></span><span class="sp"></span>
      <button class="play" type="button" title="Pausar o continuar la simulación [Espacio]">⏸ Pausar</button></footer>`;
  }
  mount() { this.$('.play').addEventListener('click', () => this.dispatch({ type:'sim/toggleRequested' })); }
  bind() {
    const paint = () => {
      const st = this.store.getState(), n = selectFailureCount(st), led = this.$('.led'), main = this.$('.main');
      led.className = 'led ' + (n ? 'bad' : !st.sim.running ? 'idle' : st.sim.noSource ? 'warn' : 'ok');
      main.textContent = n ? n + (n === 1 ? ' pieza dañada' : ' piezas dañadas') + ' · revisa el tutor' : !st.sim.running ? 'En pausa' : st.sim.noSource ? 'Sin fuente de alimentación' : st.sim.behind ? 'Simulando más lento que el tiempo real' : 'Simulando';
      this.$('.play').textContent = st.sim.running ? '⏸ Pausar' : '▶ Continuar';
    };
    this.watch(st => selectFailureCount(st) + '|' + st.sim.running + '|' + st.sim.noSource + '|' + st.sim.behind, paint);
    this.watch(st => st.sim.time.toFixed(2), t => { this.$('.time').textContent = 't = ' + t + ' s'; });
  }
}
customElements.define('vl-status-bar', VlStatusBar);
