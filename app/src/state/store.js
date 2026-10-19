/* Store global de VectraLab: un único estado inmutable dividido en «slices», acciones con forma { type:'slice/evento', payload }
   y efectos para los comandos que tocan el motor. Ningún componente modifica el DOM de otro ni el motor directamente:
   todos leen con select() y escriben con dispatch(). */
export function createStore(initial, reducers, { log = false } = {}) {
  let state = initial;
  const subs = new Set(), effects = new Map();
  const getState = () => state;

  function dispatch(action) {
    if (typeof action === 'function') return action(dispatch, getState);
    const slice = action.type.split('/')[0], reducer = reducers[slice];
    const prev = state;
    if (reducer) {
      const next = reducer(state[slice], action);
      if (next !== state[slice]) state = { ...state, [slice]: next };
    }
    if (log) console.debug('[store]', action.type, action.payload ?? '');
    if (state !== prev) subs.forEach(fn => fn(state, prev, action));
    (effects.get(action.type) || []).forEach(fx => fx(action, { dispatch, getState }));
    return action;
  }
  /* suscripción con selector: el callback solo corre cuando cambia el valor seleccionado */
  function select(selector, cb, equal = Object.is) {
    let cur = selector(state);
    cb(cur, undefined);
    const fn = st => { const next = selector(st); if (!equal(next, cur)) { const old = cur; cur = next; cb(next, old); } };
    subs.add(fn);
    return () => subs.delete(fn);
  }
  /* efectos: reaccionan a una acción después de reducirla (comandos al motor, peticiones, temporizadores) */
  function on(type, fx) { if (!effects.has(type)) effects.set(type, []); effects.get(type).push(fx); return () => effects.set(type, effects.get(type).filter(f => f !== fx)); }
  return { getState, dispatch, select, on, subscribe: fn => (subs.add(fn), () => subs.delete(fn)) };
}

export const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => Object.is(a[k], b[k]));
};
