/* <vl-scope-hud>: pantalla del osciloscopio (2 o 4 canales).
   Entradas: store (slice `scope` para saber cuándo redibujar) y la propiedad `source` → { comp, buffer } de solo lectura.
   Salidas: acción `scope/configRequested` con un parche de parámetros (V/div, tiempo/div, run/stop). No toca el motor. */
import { VlElement } from '../../ui/vl-element.js';

const VD = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
const TB = [1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1];
const COLORS = ['--ch1', '--ch2', '--ch3', '--ch4'];
const fmtV = v => Math.abs(v) >= 1 ? v.toFixed(2) + ' V' : (v * 1000).toFixed(0) + ' mV';
const fmtT = t => t >= 1 ? t + ' s' : t >= 1e-3 ? +(t * 1e3).toPrecision(3) + ' ms' : +(t * 1e6).toPrecision(3) + ' µs';
const fmtF = f => !f ? '—' : f >= 1000 ? (f / 1000).toFixed(2) + ' kHz' : f.toFixed(1) + ' Hz';

export class VlScopeHud extends VlElement {
  static styles = [new URL('./vl-scope-hud.css', import.meta.url).href];
  source = null;      // { comp, buffer } lo inyecta el contenedor
  template() {
    return `<section class="hud" aria-label="Pantalla del osciloscopio">
      <header><b class="name">Osciloscopio</b><span class="state" aria-live="polite">—</span><span class="sp"></span>
        <label>Tiempo/div <select class="tb">${TB.map(t => `<option value="${t}">${fmtT(t)}</option>`).join('')}</select></label>
        <button class="run" type="button">Detener</button><button class="auto" type="button">Autoajuste</button></header>
      <canvas width="800" height="420" aria-label="Trazas del osciloscopio"></canvas>
      <div class="chans"></div>
      <p class="empty" hidden>Esta práctica no tiene osciloscopio.</p></section>`;
  }
  mount() {
    this.cv = this.$('canvas'); this.g = this.cv.getContext('2d');
    this.$('.tb').addEventListener('change', e => this.#config({ tb:+e.target.value }));
    this.$('.run').addEventListener('click', () => this.#config({ run:this.source && this.source.comp.p.run === false }));
    this.$('.auto').addEventListener('click', () => this.#autoset());
    this.$('.chans').addEventListener('change', e => { const ch = +e.target.dataset.ch; if (e.target.matches('select')) this.#config({ ch, vdiv:+e.target.value }); else this.#config({ ch, on:e.target.checked }); });
  }
  bind() {
    this.watch(st => st.scope.id, id => { this.$('.empty').hidden = !!id; this.cv.hidden = !id; this.$('header').hidden = !id; this.#controls(); });
    this.watch(st => st.scope.rev, () => this.#draw());
  }
  #config(patch) { if (this.source) this.dispatch({ type:'scope/configRequested', payload:{ id:this.source.comp.id, patch } }); }
  #controls() {
    const c = this.source && this.source.comp; if (!c) { this.$('.chans').innerHTML = ''; return; }
    this.$('.name').textContent = c.name + (c.p.ch.length > 2 ? ' · 4 canales' : ' · 2 canales');
    this.$('.tb').value = String(c.p.tb);
    this.$('.chans').innerHTML = c.p.ch.map((q, i) => `<label class="ch" style="--c:var(${COLORS[i]})"><input type="checkbox" data-ch="${i}" ${q.on ? 'checked' : ''}> CH${i + 1}
      <select data-ch="${i}">${VD.map(v => `<option value="${v}" ${v === q.vdiv ? 'selected' : ''}>${fmtV(v)}/div</option>`).join('')}</select><output data-m="${i}">—</output></label>`).join('');
  }
  #arrays(b) { return [b.a, b.b, b.c, b.d]; }
  #window(c, b) {
    const W = c.p.tb * 10, n = b.count, idx = i => (b.head - n + i + b.N) % b.N; if (n < 2) return null;
    const src = this.#arrays(b)[c.p.trig.src] || b.a, lvl = c.p.trig.level, tLast = b.t[idx(n - 1)];
    for (let i = n - 1; i > 0; i--) { const t1 = b.t[idx(i)]; if (t1 > tLast - W / 2) continue; if (t1 - W / 2 < b.t[idx(0)]) break; const v0 = src[idx(i - 1)], v1 = src[idx(i)]; if (v0 < lvl && v1 >= lvl) return { t0:t1 - W / 2, t1:t1 + W / 2, idx, n, trig:true }; }
    return { t0:tLast - W, t1:tLast, idx, n, trig:false };
  }
  #draw() {
    const src = this.source, c = src && src.comp, b = src && src.buffer; if (!c || !this.g) return;
    if (!src.buffer && src.refresh) { const s = src.refresh(); src.buffer = s && s.buffer; }
    const g = this.g, W = this.cv.width, H = this.cv.height, cs = getComputedStyle(this), divW = W / 10, divH = H / 8, cy = H / 2;
    g.fillStyle = '#070b09'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(140,220,180,.14)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 10; i++) { g.moveTo(i * divW + .5, 0); g.lineTo(i * divW + .5, H); } for (let j = 1; j < 8; j++) { g.moveTo(0, j * divH + .5); g.lineTo(W, j * divH + .5); } g.stroke();
    const buf = src.buffer; this.$('.run').textContent = c.p.run === false ? 'Continuar' : 'Detener';
    if (!buf || buf.count < 2) { this.$('.state').textContent = 'ESPERA'; return; }
    const win = this.#window(c, buf); if (!win) return;
    this.$('.state').textContent = c.p.run === false ? 'STOP' : win.trig ? "TRIG'D" : 'AUTO';
    this.#arrays(buf).forEach((arr, ch) => {
      const q = c.p.ch[ch]; if (!q || !q.on || !arr) return;
      g.strokeStyle = cs.getPropertyValue(COLORS[ch]).trim() || '#fff'; g.lineWidth = 2; g.beginPath();
      let first = true, mn = Infinity, mx = -Infinity, up = [], st = 0;
      for (let i = 0; i < win.n; i++) { const k = win.idx(i), t = buf.t[k]; if (t < win.t0) continue; if (t > win.t1) break; const v = arr[k], x = (t - win.t0) / (win.t1 - win.t0) * W, y = cy - (v / q.vdiv + q.pos) * divH;
        if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); if (v < mn) mn = v; if (v > mx) mx = v; }
      g.stroke();
      const mid = (mx + mn) / 2; for (let i = 1; i < win.n; i++) { const a = arr[win.idx(i - 1)], bb = arr[win.idx(i)]; if (!st && a < mid && bb >= mid && mx - mn > 0.02) up.push(buf.t[win.idx(i)]); st = 0; }
      const f = up.length > 1 ? (up.length - 1) / (up[up.length - 1] - up[0]) : 0, o = this.$(`output[data-m="${ch}"]`);
      if (o) o.textContent = isFinite(mx) ? 'Vpp ' + fmtV(mx - mn) + ' · ' + fmtF(f) : '—';
    });
  }
  #autoset() {
    const c = this.source && this.source.comp, b = this.source && this.source.buffer; if (!c || !b || b.count < 20) return;
    this.#arrays(b).forEach((arr, ch) => { if (!arr || !c.p.ch[ch]) return; let mn = Infinity, mx = -Infinity; for (let i = 0; i < b.count; i++) { const v = arr[(b.head - b.count + i + b.N) % b.N]; if (v < mn) mn = v; if (v > mx) mx = v; }
      const span = Math.max(mx - mn, Math.abs(mx) * 0.3, 0.02), vdiv = VD.find(v => span / v <= (c.p.ch.length > 2 ? 1.8 : 5.5)) || 10; this.#config({ ch, vdiv }); });
  }
}
customElements.define('vl-scope-hud', VlScopeHud);
