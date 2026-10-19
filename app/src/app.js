/* Punto de composición: crea el store, el controlador de la simulación y conecta componentes por propiedades y eventos.
   Es el único archivo que conoce a todos; ningún componente conoce a otro. */
import Lab from './engine/lab-core.js';
import { createStore, shallowEqual } from './state/store.js';
import { initialState, reducers } from './state/slices.js';
import { SimController } from './sim/sim-controller.js';
import { describeScene, describeState } from './viewport/scene-model.js';
import './viewport/vl-viewport.js';
import './components/vl-scope-hud/vl-scope-hud.js';
import './components/vl-tutor/vl-tutor.js';
import './components/vl-code-editor/vl-code-editor.js';
import './components/vl-serial-console/vl-serial-console.js';
import './components/vl-status-bar/vl-status-bar.js';
import './components/vl-inspector/vl-inspector.js';

const store = createStore(initialState, reducers, { log:new URLSearchParams(location.search).has('debug') });
const sim = new SimController(Lab, store);
const $ = s => document.querySelector(s);

/* componentes conectados al store */
['vl-tutor', 'vl-code-editor', 'vl-serial-console', 'vl-status-bar', 'vl-inspector', 'vl-scope-hud'].forEach(t => { $(t).store = store; });

/* osciloscopio: acceso de solo lectura al búfer circular del motor (sin copiar 4 × 16 384 muestras por cuadro) */
store.select(st => st.scope.id, id => { $('vl-scope-hud').source = id ? { get comp() { return sim.scopeSource(id) && sim.scopeSource(id).comp; }, get buffer() { return sim.sim.scopes[id] || null; } } : null; });

/* viewport 3D: props desde el store, eventos hacia el store */
const vp = $('vl-viewport');
store.select(st => st.project.data, p => { vp.scene = describeScene(Lab, p); });
store.select(st => ({ r:st.sim.readouts, f:st.sim.failures }), ({ r, f }) => { vp.state = describeState(r, f); }, shallowEqual);
store.select(st => st.project.selectedId, id => { vp.selected = id; });
vp.addEventListener('vl-select', e => store.dispatch({ type:'project/selected', payload:e.detail.id }));

/* pestañas del dock inferior (DOM propio del contenedor) */
document.querySelectorAll('[data-dock]').forEach(b => b.addEventListener('click', () => store.dispatch({ type:'ui/dockShown', payload:b.dataset.dock })));
store.select(st => st.ui.dock, d => {
  document.querySelectorAll('[data-dock]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.dock === d)));
  document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== d; });
});

/* selector de prácticas */
const PRACT = { ardBlink:'Arduino · Blink', astable:'555 astable (osciloscopio)', ledNoR:'LED sin resistor (falla)', short:'Cortocircuito (falla)', p4ast:'Multivibrador astable (2 canales)', digChase:'Secuencia de LEDs', ardServo:'Arduino · Servo', rc:'Circuito RC' };
const sel = $('#scenario');
sel.innerHTML = Object.keys(Lab.scenarios).map(k => `<option value="${k}">${PRACT[k] || k}</option>`).join('');
sel.addEventListener('change', () => store.dispatch({ type:'project/loadRequested', payload:sel.value }));
store.select(st => st.project.scenario, k => { if (k) sel.value = k; });

document.addEventListener('keydown', e => { if (e.key === ' ' && !/input|textarea|select/i.test(e.target.tagName)) { e.preventDefault(); store.dispatch({ type:'sim/toggleRequested' }); } });

const start = new URLSearchParams(location.search).get('p');
sim.load(start && Lab.scenarios[start] ? start : 'ardBlink');
store.dispatch({ type:'tutor/said', payload:{ text:'Hola: esta es la arquitectura modular de VectraLab. Selecciona una pieza o carga «LED sin resistor» para ver cómo una falla del motor llega a la UI a través del store.' } });
window.__vl = { store, sim, Lab };
