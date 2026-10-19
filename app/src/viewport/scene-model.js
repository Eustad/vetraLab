/* Adaptador puro: proyecto del motor → descripción serializable de la escena.
   El viewport 3D solo conoce estos descriptores (no importa `Lab` ni el store), así puede probarse, reemplazarse
   o moverse a un Worker con OffscreenCanvas sin tocar la simulación. Unidades: 1 = 1 mm. */
const TYPE_COLOR = { resistor:'#d8c3a0', led:'#ff3b30', capacitor:'#2b4fa8', ceramic:'#d9a441', diode:'#222326', ic:'#17181b', mcu:'#17181b', button:'#2b2d31', pot:'#2f6fe0',
  arduino:'#0f7c8a', supply:'#3a4048', fgen:'#d9d6cd', scope:'#d9d6cd', scope4:'#dcdcd6', dmm:'#c8232a', batteryPack:'#2b2d31', trafo:'#7d8189', relay:'#1f4fa8' };
const LED_RGB = { rojo:'#ff3b30', verde:'#2fd158', azul:'#3d7bff', amarillo:'#ffd21a', blanco:'#ffffff', naranja:'#ff8a1a' };

export function describeScene(Lab, project) {
  if (!project) return { board:null, parts:[], wires:[] };
  Lab.setLayout(project.board);
  const L = Lab.L, parts = [];
  project.components.forEach(c => {
    const P = Lab.PARTS[c.type] || {};
    if (P.kind === 'bench') {
      parts.push({ id:c.id, name:c.name, type:c.type, bench:true, pos:[c.x || 0, Lab.TABLE_Y, c.z || 0], size:[P.w || 40, P.h || 20, P.d || 30], rotY:(+c.rot || 0) * Math.PI / 180, color:TYPE_COLOR[c.type] || '#8a8f96' });
      return;
    }
    const pins = Lab.compPins(c).map(h => Lab.holeXZ(h.bd, h.row, h.col)); if (!pins.length) return;
    const xs = pins.map(q => q.x), zs = pins.map(q => q.z), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const led = c.type === 'led' || c.type === 'rgbled';
    parts.push({ id:c.id, name:c.name, type:c.type, bench:false, pins:pins.map(q => [q.x, q.z]), pos:[(x0 + x1) / 2, 0, (z0 + z1) / 2],
      size:[Math.max(2.4, x1 - x0 + 2), P.dip ? 3.3 : led ? 5 : 2.4, Math.max(2.4, z1 - z0 + (P.dip ? 1.5 : 2))], shape:led ? 'led' : P.dip ? 'dip' : 'axial',
      color:led ? (LED_RGB[c.p.color] || '#ff3b30') : TYPE_COLOR[c.type] || '#8a8f96' });
  });
  const wires = project.wires.map(w => { const a = Lab.epXYZ(project, w.a), b = Lab.epXYZ(project, w.b); return { id:w.id, color:w.color || '#2fae52', a:[a.x, a.y, a.z], b:[b.x, b.y, b.z] }; });
  return { board:{ w:L.W, d:L.D, cols:L.cols, n:L.n, holes:holesOf(Lab) }, parts, wires };
}
function holesOf(Lab) {
  const out = [];
  for (let bd = 0; bd < Lab.L.n; bd++) Lab.ROWS.forEach(r => { for (let col = 0; col < Lab.L.cols; col++) { const h = Lab.holeXZ(bd, r, col); out.push(h.x, h.z); } });
  return out;
}
/* estado visual por pieza a partir de lecturas y fallas del store: brillo de LEDs, temperatura y daño */
export function describeState(readouts, failures) {
  const out = {};
  Object.keys(readouts || {}).forEach(id => { const r = readouts[id]; out[id] = { glow:Math.max(0, Math.min(1, Math.abs(r.i || 0) / 0.02)), hot:Math.max(0, Math.min(1, ((r.T || 25) - 60) / 90)) }; });
  Object.keys(failures || {}).forEach(id => { out[id] = Object.assign(out[id] || {}, { failed:true, protected:!!failures[id].protegido, glow:0 }); });
  return out;
}
