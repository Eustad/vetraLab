/* Estado inicial y reductores puros de cada slice.
   El proyecto del motor es un objeto mutable grande: el store guarda su referencia y un contador «rev» que sube en cada cambio,
   así los selectores detectan cambios sin copiar el circuito entero. */
export const initialState = {
  project: { scenario:null, data:null, rev:0, selectedId:null },
  sim: { running:true, speed:1, time:0, behind:false, noSource:false, readouts:{}, failures:{}, rev:0 },
  scope: { id:null, rev:0 },
  editor: { mcuId:null, chip:'', lang:'arduino', code:'', dirty:false, status:'', statusTone:'' },
  serial: { mcuId:null, lines:[], rev:0 },
  tutor: { messages:[], busy:false },
  ui: { dock:'scope' }
};

const msgId = (() => { let n = 0; return () => ++n; })();

export const reducers = {
  project(s, { type, payload }) {
    switch (type) {
      case 'project/loaded': return { scenario:payload.scenario, data:payload.data, rev:s.rev + 1, selectedId:null };
      case 'project/changed': return { ...s, rev:s.rev + 1 };
      case 'project/selected': return payload === s.selectedId ? s : { ...s, selectedId:payload };
      default: return s;
    }
  },
  sim(s, { type, payload }) {
    switch (type) {
      case 'sim/started': return s.running ? s : { ...s, running:true };
      case 'sim/paused': return s.running ? { ...s, running:false } : s;
      case 'sim/speedSet': return { ...s, speed:payload };
      case 'sim/ticked': return { ...s, ...payload, rev:s.rev + 1 };
      case 'sim/failed': return { ...s, failures:{ ...s.failures, [payload.id]:payload } };
      case 'sim/repaired': { const f = { ...s.failures }; delete f[payload]; return { ...s, failures:f }; }
      case 'sim/reset': return { ...s, time:0, readouts:{}, failures:{}, rev:s.rev + 1 };
      default: return s;
    }
  },
  scope(s, { type, payload }) {
    switch (type) {
      case 'scope/attached': return { id:payload, rev:s.rev + 1 };
      case 'scope/sampled': case 'scope/configured': return { ...s, rev:s.rev + 1 };
      default: return s;
    }
  },
  editor(s, { type, payload }) {
    switch (type) {
      case 'editor/opened': return { ...s, ...payload, dirty:false, status:'', statusTone:'' };
      case 'editor/edited': return { ...s, code:payload, dirty:true };
      case 'editor/uploaded': return { ...s, dirty:false, status:payload || 'Programa cargado en el microcontrolador', statusTone:'ok' };
      case 'editor/statusSet': return { ...s, status:payload.text, statusTone:payload.tone || '' };
      default: return s;
    }
  },
  serial(s, { type, payload }) {
    switch (type) {
      case 'serial/attached': return { mcuId:payload, lines:[], rev:s.rev + 1 };
      case 'serial/received': return { ...s, lines:payload.slice(-300), rev:s.rev + 1 };
      case 'serial/echoed': return { ...s, lines:[...s.lines, '› ' + payload].slice(-300), rev:s.rev + 1 };
      case 'serial/cleared': return { ...s, lines:[], rev:s.rev + 1 };
      default: return s;
    }
  },
  tutor(s, { type, payload }) {
    switch (type) {
      case 'tutor/said': return { ...s, busy:false, messages:[...s.messages, { id:msgId(), role:'tutor', tone:payload.tone || 'info', text:payload.text, compId:payload.compId || null }].slice(-60) };
      case 'tutor/asked': return { ...s, busy:true, messages:[...s.messages, { id:msgId(), role:'user', text:payload }].slice(-60) };
      case 'tutor/cleared': return { ...s, messages:[] };
      default: return s;
    }
  },
  ui(s, { type, payload }) {
    switch (type) {
      case 'ui/dockShown': return s.dock === payload ? s : { ...s, dock:payload };
      default: return s;
    }
  }
};

/* selectores reutilizables */
export const selectComp = (st, id) => st.project.data && st.project.data.components.find(c => c.id === id) || null;
export const selectFailureCount = st => Object.keys(st.sim.failures).length;
