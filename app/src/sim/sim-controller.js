/* Controlador de la simulación: el ÚNICO módulo que habla con el motor `Lab`.
   - Traduce eventos del motor (una pieza que se quema, datos del puerto serie, muestras del osciloscopio) en acciones del store.
   - Atiende las acciones-comando de la UI (subir código, enviar por serie, reparar, pausar) mediante efectos.
   - Publica el estado a ~10 Hz para que la UI no dependa del ritmo del solver. */
const TICK_MS = 100;

export class SimController {
  constructor(Lab, store) {
    this.Lab = Lab; this.store = store;
    this.sim = new Lab.Sim();
    this.sim.onFail = ev => this.#onFail(ev);
    this.last = 0; this.pub = 0; this.serialSeen = -1; this.raf = 0;
    this.#effects();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.last = performance.now(); this.#loop(); } });
  }

  /* ---------- carga de prácticas ---------- */
  load(key) {
    const p = this.Lab.scenarios[key](); delete p.nets;
    /* resetAll: estados térmicos, fallas, búferes del osciloscopio y tiempo empiezan de cero (los ids se repiten entre prácticas) */
    this.Lab.setLayout(p.board); this.sim.setProject(p); this.sim.resetAll();
    const { dispatch } = this.store;
    dispatch({ type:'sim/reset' }); dispatch({ type:'tutor/cleared' });
    dispatch({ type:'project/loaded', payload:{ scenario:key, data:p } });
    const scope = p.components.find(c => c.type === 'scope' || c.type === 'scope4');
    dispatch({ type:'scope/attached', payload:scope ? scope.id : null });
    const mcu = p.components.find(c => c.type === 'arduino' || c.type === 'mcu');
    dispatch({ type:'serial/attached', payload:mcu ? mcu.id : null });
    dispatch({ type:'editor/opened', payload:mcu ? { mcuId:mcu.id, chip:mcu.type === 'arduino' ? 'Arduino UNO' : String(mcu.p.chip || '').toUpperCase(), lang:mcu.p.lang || 'arduino', code:this.#codeOf(mcu) } : { mcuId:null, chip:'', code:'' } });
    this.serialSeen = -1;
    if (!this.raf) { this.last = performance.now(); this.#loop(); }
  }
  /* acceso de solo lectura para componentes de dibujo (el osciloscopio lee el búfer circular sin copiarlo) */
  scopeSource(id) { const c = this.#comp(id); return c ? { comp:c, buffer:this.sim.scopes[id] || null } : null; }

  /* ---------- bucle: solver + publicación ---------- */
  #loop = () => {
    if (document.hidden) { this.raf = 0; return; }
    this.raf = requestAnimationFrame(this.#loop);
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    const st = this.store.getState();
    if (st.sim.running && st.project.data) this.sim.run(dt * st.sim.speed);
    if (now - this.pub >= TICK_MS) { this.pub = now; this.#publish(); }
  };
  #publish() {
    const { dispatch, getState } = this.store, st = getState(), p = st.project.data; if (!p) return;
    const readouts = {};
    p.components.forEach(c => { const r = this.sim.res[c.id], s = this.sim.st[c.id]; if (r || s) readouts[c.id] = { v:r ? r.v : 0, i:r ? r.i : 0, p:r ? r.p : 0, on:!!(r && r.on), T:s ? s.T : 25 }; });
    dispatch({ type:'sim/ticked', payload:{ time:this.sim.time, behind:!!this.sim.behind, noSource:!!this.sim.noSource, readouts } });
    if (st.scope.id && st.sim.running) dispatch({ type:'scope/sampled' });
    const mid = st.serial.mcuId, s = mid && this.sim.st[mid];
    if (s && s.serial) { const sig = (s.serialRev || 0) * 1e6 + s.serial.length + (s.serial.length ? s.serial[s.serial.length - 1].length : 0); if (sig !== this.serialSeen) { this.serialSeen = sig; dispatch({ type:'serial/received', payload:s.serial.slice() }); } }
  }

  /* ---------- eventos del motor → store ---------- */
  #onFail(ev) {
    const c = this.#comp(ev.id) || this.#comp(String(ev.id).split('/')[0]);
    const id = c ? c.id : ev.id, name = c ? c.name : 'Un cable';
    this.store.dispatch({ type:'sim/failed', payload:{ id, kind:ev.kind, tipo:ev.tipo || '', i:Math.abs(ev.i || 0), protegido:!!ev.protegido, at:this.sim.time } });
    const what = { D:ev.led ? 'el LED se quemó' : 'el diodo se quemó', R:'el resistor se quemó', C:'el capacitor explotó', W:'el cable se fundió', Q:'el transistor se quemó', IC:'el integrado se quemó', PIN:'se dañó un pin' }[ev.kind] || 'falló';
    const cur = Math.abs(ev.i || 0), amp = cur >= 1 ? cur.toFixed(1) + ' A' : Math.round(cur * 1000) + ' mA';
    this.store.dispatch({ type:'tutor/said', payload:{ tone:'bad', compId:id, text:name + ': ' + what + (cur ? ' (' + amp + ')' : '') + '. ' + (ev.kind === 'D' && ev.led ? 'Falta un resistor en serie: R = (V − V_LED) / 0,02 A.' : 'Revisa la corriente y la potencia que soporta.') } });
  }

  /* ---------- acciones-comando de la UI → motor ---------- */
  #effects() {
    const { on, dispatch } = this.store;
    on('sim/toggleRequested', (a, { getState }) => dispatch({ type:getState().sim.running ? 'sim/paused' : 'sim/started' }));
    on('sim/repairRequested', a => { this.sim.repair(a.payload); dispatch({ type:'sim/repaired', payload:a.payload }); dispatch({ type:'tutor/said', payload:{ tone:'ok', text:'Pieza reemplazada por una nueva.' } }); });
    on('project/loadRequested', a => this.load(a.payload));
    on('editor/uploadRequested', (a, { getState }) => {
      const st = getState().editor, c = this.#comp(st.mcuId); if (!c) return;
      c.p.code = st.code; this.sim.resetMcu(c.id); this.serialSeen = -1;
      dispatch({ type:'serial/cleared' }); dispatch({ type:'editor/uploaded' }); dispatch({ type:'project/changed' });
      setTimeout(() => { const s = this.sim.st[c.id]; if (s && s.err) dispatch({ type:'editor/statusSet', payload:{ text:'Error: ' + s.err, tone:'bad' } }); }, 300);
    });
    on('serial/sendRequested', (a, { getState }) => {
      const s = this.sim.st[getState().serial.mcuId]; if (!s) return;
      s.rx = s.rx || []; for (const ch of a.payload + '\n') s.rx.push(ch.charCodeAt(0));
      s.serial = s.serial || []; s.serial.push('› ' + a.payload);   /* el eco queda en el mismo búfer que lee el monitor */
      dispatch({ type:'serial/echoed', payload:a.payload });
    });
    on('scope/configRequested', a => {
      const c = this.#comp(a.payload.id), q = a.payload.patch; if (!c || !q) return;
      if (q.tb) c.p.tb = q.tb; if (q.run !== undefined) c.p.run = q.run;
      if (q.ch !== undefined && c.p.ch[q.ch]) { if (q.vdiv) c.p.ch[q.ch].vdiv = q.vdiv; if (q.on !== undefined) c.p.ch[q.ch].on = q.on; }
      this.sim.computeH(); dispatch({ type:'scope/configured' }); dispatch({ type:'project/changed' });
    });
    on('tutor/asked', (a, { getState }) => setTimeout(() => dispatch({ type:'tutor/said', payload:{ text:this.#answer(a.payload, getState()) } }), 250));
  }

  /* respuesta del tutor basada en el estado real del circuito (sin IA): fallas activas, pieza seleccionada y lecturas */
  #answer(q, st) {
    const f = Object.values(st.sim.failures), sel = st.project.selectedId && this.#comp(st.project.selectedId);
    if (/falla|quem|por qu|no funciona/i.test(q) && f.length) return 'Hay ' + f.length + ' pieza(s) dañada(s): ' + f.map(x => (this.#comp(x.id) || {}).name || x.id).join(', ') + '. Selecciónala y pulsa «Reparar» después de corregir el circuito.';
    if (sel) { const r = st.sim.readouts[sel.id] || {}, P = this.Lab.PARTS[sel.type] || {}; return sel.name + ' (' + (P.nombre || sel.type) + '): ' + (r.v || 0).toFixed(2) + ' V, ' + ((r.i || 0) * 1000).toFixed(1) + ' mA. Pines: ' + (P.pins || []).join(', ') + '.'; }
    return 'Selecciona una pieza en la escena para ver sus lecturas, o pregúntame por las fallas del circuito.';
  }
  #comp(id) { const p = this.store.getState().project.data; return p && p.components.find(c => c.id === id) || null; }
  /* el mismo programa que ejecuta el motor cuando la práctica no trae código propio */
  #codeOf(c) {
    if (c.p.code && c.p.code.trim()) return c.p.code;
    const D = this.Lab.DEFAULT_CODE, chip = String(c.p.chip || '');
    return (c.type === 'arduino' || /atmega/.test(chip) ? D.uno : /^esp32/.test(chip) ? D.esp32 : /^pic/.test(chip) ? D.pic : D.uno) || '';
  }
}
