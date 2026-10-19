/* =====================================================================================
   wire-router.js · Enrutamiento ortogonal de cables en 3D para protoboards (A* Manhattan)
   -------------------------------------------------------------------------------------
   · Rejilla 3D alineada al paso de la protoboard (2,54 mm en X/Z) y por capas en Y.
   · A* con 6 vecinos (±X, ±Y, ±Z), heurística Manhattan admisible, penalización por giro
     (menos codos), por subir de capa y por pasar junto a cables ya tendidos.
   · Obstáculos = cajas (THREE.Box3 o {min,max}) infladas con un margen de holgura.
     Las celdas dentro de la caja real son prohibidas; las del margen solo se permiten
     en la columna vertical que sale del propio agujero (para pines pegados a un chip).
   · Cada cable ruteado puede "comprometerse" (commit): sus celdas pasan a ser obstáculo
     duro (hardWires) o costo extra (por defecto), y el siguiente cable las esquiva.
   · La ruta se simplifica (puntos colineales fuera), las esquinas de 90° se redondean con
     una Bézier cuadrática tangente y se entrega una función que construye THREE.TubeGeometry.
   · El cálculo no depende de Three.js; la geometría recibe THREE como parámetro, así que
     sirve igual con three r128 (global) que con r160 (módulos).
   ===================================================================================== */

/* direcciones ortogonales: 0 +X · 1 −X · 2 +Y · 3 −Y · 4 +Z · 5 −Z ; 6 = sin dirección previa */
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const NONE = 6;

/* montículo binario mínimo sobre arreglos paralelos (prioridad f, estado) */
class MinHeap {
  constructor() { this.f = []; this.s = []; }
  get size() { return this.s.length; }
  push(f, s) {
    const F = this.f, S = this.s; let i = S.length; F.push(f); S.push(s);
    while (i > 0) { const p = (i - 1) >> 1; if (F[p] <= f) break; F[i] = F[p]; S[i] = S[p]; i = p; }
    F[i] = f; S[i] = s;
  }
  pop() {
    const F = this.f, S = this.s, top = S[0], lf = F.pop(), ls = S.pop(), n = S.length;
    if (n) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && F[c + 1] < F[c]) c++;
        if (F[c] >= lf) break;
        F[i] = F[c]; S[i] = S[c]; i = c;
      }
      F[i] = lf; S[i] = ls;
    }
    return top;
  }
}

const boxOf = b => ({ min:{ x:b.min.x, y:b.min.y, z:b.min.z }, max:{ x:b.max.x, y:b.max.y, z:b.max.z } });

/**
 * Crea un enrutador.
 * @param {object} [opts]
 * @param {number} [opts.cell=2.54]       paso de la rejilla en X y Z (mm)
 * @param {number} [opts.y0=0.9]          altura del primer nivel de cable sobre la placa (mm): cables pegados a la protoboard
 * @param {number} [opts.layer=1.25]      separación entre capas (mm): solo se sube al cruzar o rodear por encima
 * @param {{x:number,z:number}} [opts.origin={x:0,z:0}] origen de la rejilla (un agujero de la placa) para que los agujeros caigan en ella
 * @param {number} [opts.maxLayers=14]    capas disponibles sobre la placa
 * @param {number} [opts.clearance=0.9]   holgura alrededor de cada obstáculo (mm)
 * @param {number} [opts.margin=8]        celdas extra alrededor de A-B para buscar rodeos
 * @param {number} [opts.turnCost=4]      costo de cada codo de 90° (cables más limpios)
 * @param {number} [opts.upCost=3]        costo de moverse en Y: alto para que los cables vayan pegados a la placa y prefieran rodear
 * @param {number} [opts.crowdCost=8]     costo por pasar por una celda ya usada por otro cable
 * @param {boolean} [opts.hardWires=false] true: los cables ya tendidos son obstáculos absolutos
 * @param {number} [opts.maxExpand=600000] límite de nodos expandidos por cable
 * @param {object} [opts.THREE]           si se pasa, cada resultado trae buildGeometry()
 */
export function createWireRouter(opts = {}) {
  const o = Object.assign({ cell:2.54, y0:0.9, layer:1.25, origin:{ x:0, z:0 }, maxLayers:14, clearance:0.9, margin:8, turnCost:4, upCost:3, crowdCost:8, hardWires:false, maxExpand:600000, THREE:null }, opts);
  let obstacles = [];
  const used = new Map();          /* "i,k,j" → cantidad de cables que pasan por la celda */
  const key = (i, k, j) => i + ',' + k + ',' + j;

  function addObstacle(b) { obstacles.push(boxOf(b)); }
  function setObstacles(list) { obstacles = (list || []).map(boxOf); }
  function clear() { obstacles = []; used.clear(); }

  /**
   * Busca la ruta entre dos agujeros.
   * @param {{x:number,y:number,z:number}} a  agujero de salida (superficie de la placa)
   * @param {{x:number,y:number,z:number}} b  agujero de llegada
   * @returns {{ok:boolean, points:Array<{x,y,z}>, cells:Array<[i,k,j]>, cost:number, expanded:number, buildGeometry?:Function}}
   */
  function route(a, b) {
    const C = o.cell, Ly = o.layer, NY = o.maxLayers + 1, ox = o.origin.x, oz = o.origin.z;
    const ia = Math.round((a.x - ox) / C), ja = Math.round((a.z - oz) / C), ib = Math.round((b.x - ox) / C), jb = Math.round((b.z - oz) / C);
    const i0 = Math.min(ia, ib) - o.margin, i1 = Math.max(ia, ib) + o.margin, j0 = Math.min(ja, jb) - o.margin, j1 = Math.max(ja, jb) + o.margin;
    const NX = i1 - i0 + 1, NZ = j1 - j0 + 1, N = NX * NY * NZ;
    if (N > 4e6) throw new Error('wire-router: la región de búsqueda es demasiado grande (' + N + ' celdas)');
    const idx = (i, k, j) => ((i - i0) * NY + k) * NZ + (j - j0);
    const yOf = k => (k === 0 ? 0 : o.y0 + (k - 1) * Ly);

    /* 1 = caja real (prohibida) · 2 = margen de holgura (prohibido salvo en las columnas de A y B) */
    const block = new Uint8Array(N);
    const mark = (bx, val) => {
      const ci0 = Math.max(i0, Math.ceil((bx.min.x - ox) / C)), ci1 = Math.min(i1, Math.floor((bx.max.x - ox) / C));
      const cj0 = Math.max(j0, Math.ceil((bx.min.z - oz) / C)), cj1 = Math.min(j1, Math.floor((bx.max.z - oz) / C));
      for (let k = 1; k < NY; k++) { const y = yOf(k); if (y < bx.min.y || y > bx.max.y) continue;
        for (let i = ci0; i <= ci1; i++) for (let j = cj0; j <= cj1; j++) { const n = idx(i, k, j); if (block[n] !== 1) block[n] = val; } }
    };
    const cl = o.clearance;
    for (const bx of obstacles) {
      if (bx.max.x < ox + i0 * C - cl || bx.min.x > ox + i1 * C + cl || bx.max.z < oz + j0 * C - cl || bx.min.z > oz + j1 * C + cl) continue;
      mark({ min:{ x:bx.min.x - cl, y:bx.min.y - cl, z:bx.min.z - cl }, max:{ x:bx.max.x + cl, y:bx.max.y + cl, z:bx.max.z + cl } }, 2);
      mark(bx, 1);
    }
    /* cables ya tendidos: obstáculo duro o costo de "aglomeración" */
    const crowd = new Uint8Array(N);
    used.forEach((cnt, kk) => {
      const [i, k, j] = kk.split(',').map(Number);
      if (i < i0 || i > i1 || j < j0 || j > j1 || k < 1 || k >= NY) return;
      const n = idx(i, k, j);
      if (o.hardWires) { if (!block[n]) block[n] = 2; } else crowd[n] = Math.min(255, cnt);
    });
    /* la columna vertical sobre cada agujero ignora la holgura (pines pegados a un chip) */
    const freeCol = (i, j) => { for (let k = 1; k < NY; k++) { const n = idx(i, k, j); if (block[n] === 1) break; block[n] = 0; } };
    freeCol(ia, ja); freeCol(ib, jb);

    const S = N * 7, g = new Float32Array(S).fill(Infinity), came = new Int32Array(S).fill(-1), closed = new Uint8Array(S);
    const start = idx(ia, 0, ja), goal = idx(ib, 0, jb);
    const h = (i, k, j) => Math.abs(i - ib) + Math.abs(j - jb) + k * Math.min(1, o.upCost);
    const heap = new MinHeap();
    g[start * 7 + NONE] = 0; heap.push(h(ia, 0, ja), start * 7 + NONE);
    let expanded = 0, found = -1;
    while (heap.size) {
      const st = heap.pop(); if (closed[st]) continue; closed[st] = 1;
      const cellN = (st / 7) | 0, dIn = st % 7;
      if (cellN === goal) { found = st; break; }
      if (++expanded > o.maxExpand) break;
      const i = ((cellN / (NY * NZ)) | 0) + i0, k = ((cellN / NZ) | 0) % NY, j = (cellN % NZ) + j0, gs = g[st];
      for (let d = 0; d < 6; d++) {
        if (dIn !== NONE && d === (dIn ^ 1)) continue;                 /* sin marcha atrás */
        const ni = i + DIRS[d][0], nk = k + DIRS[d][1], nj = j + DIRS[d][2];
        if (ni < i0 || ni > i1 || nj < j0 || nj > j1 || nk < 0 || nk >= NY) continue;
        if (k === 0 && d !== 2) continue;                                /* de un agujero solo se sale hacia arriba */
        if (nk === 0 && !(ni === ib && nj === jb)) continue;              /* a la placa solo se baja en el destino */
        const nn = idx(ni, nk, nj); if (block[nn]) continue;
        let cost = d === 2 || d === 3 ? o.upCost : 1;
        if (dIn !== NONE && d !== dIn) cost += o.turnCost;
        if (crowd[nn]) cost += o.crowdCost * crowd[nn];
        const ns = nn * 7 + d, ng = gs + cost;
        if (ng < g[ns]) { g[ns] = ng; came[ns] = st; heap.push(ng + h(ni, nk, nj), ns); }
      }
    }
    if (found < 0) {
      /* sin ruta: arco de respaldo para no dejar el cable sin dibujar */
      const top = Math.max(a.y, b.y, 0) + o.y0 + 4 * Ly;
      const pts = [a, { x:a.x, y:top, z:a.z }, { x:b.x, y:top, z:b.z }, b].map(p => ({ x:p.x, y:p.y, z:p.z }));
      return decorate({ ok:false, points:pts, cells:[], cost:Infinity, expanded });
    }
    const cells = [];
    for (let st = found; st >= 0; st = came[st]) { const n = (st / 7) | 0; cells.push([((n / (NY * NZ)) | 0) + i0, ((n / NZ) | 0) % NY, (n % NZ) + j0]); }
    cells.reverse();
    /* las líneas de la rejilla que pasan por A y B se corren a la posición exacta del agujero: la ruta sigue
       ortogonal aunque el agujero no caiga justo en la rejilla (otra protoboard, rieles, columnas impares) */
    const X = i => (i === ia ? a.x : i === ib ? b.x : ox + i * C), Z = j => (j === ja ? a.z : j === jb ? b.z : oz + j * C);
    const pts = cells.map(([i, k, j]) => ({ x:X(i), y:yOf(k), z:Z(j) }));
    pts[0] = { x:a.x, y:a.y, z:a.z }; pts[pts.length - 1] = { x:b.x, y:b.y, z:b.z };
    return decorate({ ok:true, points:simplify(pts), cells, cost:g[found], expanded });
  }

  function decorate(r) {
    if (o.THREE) r.buildGeometry = (gopts = {}) => buildWireGeometry(o.THREE, r.points, gopts);
    return r;
  }
  /* marca las celdas del cable para que los siguientes lo esquiven */
  function commit(r) { (r.cells || []).forEach(([i, k, j]) => { if (k > 0) { const kk = key(i, k, j); used.set(kk, (used.get(kk) || 0) + 1); } }); return r; }
  function release(r) { (r.cells || []).forEach(([i, k, j]) => { const kk = key(i, k, j), v = (used.get(kk) || 0) - 1; if (v > 0) used.set(kk, v); else used.delete(kk); }); }
  /* rutea varios cables, los cortos primero (los largos tienen más espacio para rodear) */
  function routeAll(pairs) {
    const order = pairs.map((p, n) => ({ p, n, L:Math.abs(p.a.x - p.b.x) + Math.abs(p.a.z - p.b.z) })).sort((x, y) => x.L - y.L);
    const out = new Array(pairs.length);
    order.forEach(({ p, n }) => { out[n] = commit(routeRetry(p.a, p.b)); });
    return out;
  }
  /* si no hay ruta: se reintenta con el doble de margen y, en vez de prohibir las celdas de otros cables,
     se las encarece (crowdCost): solo se comparten si no queda otro camino */
  function routeRetry(a, b) {
    let r = route(a, b);
    if (r.ok) return r;
    const keep = { hardWires:o.hardWires, margin:o.margin, maxLayers:o.maxLayers };
    o.hardWires = false; o.margin = keep.margin * 2; o.maxLayers = keep.maxLayers + 4;
    try { r = route(a, b); if (r.ok) r.retried = true; } finally { Object.assign(o, keep); }
    return r;
  }
  return { route, routeRetry, routeAll, commit, release, addObstacle, setObstacles, clear, options:o };
}

/* quita los puntos intermedios de tramos rectos: deja solo los codos */
export function simplify(pts) {
  if (pts.length < 3) return pts.slice();
  const out = [pts[0]];
  for (let n = 1; n < pts.length - 1; n++) {
    const p = out[out.length - 1], q = pts[n], r = pts[n + 1];
    const ux = Math.sign(q.x - p.x), uy = Math.sign(q.y - p.y), uz = Math.sign(q.z - p.z), vx = Math.sign(r.x - q.x), vy = Math.sign(r.y - q.y), vz = Math.sign(r.z - q.z);
    if (ux !== vx || uy !== vy || uz !== vz) out.push(q);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Curva suavizada: tramos rectos (LineCurve3) unidos por Bézier cuadráticas en cada codo de 90°.
 * El punto de control es el vértice del codo, así que la curva es tangente a ambos tramos.
 * @param {object} THREE
 * @param {Array<{x,y,z}>} points  ruta ortogonal (codos)
 * @param {number} [bendRadius=1.6] radio de curvatura (se recorta a la mitad del tramo más corto)
 */
export function buildWireCurve(THREE, points, bendRadius = 1.6) {
  const P = points.map(p => new THREE.Vector3(p.x, p.y, p.z));
  const path = new THREE.CurvePath();
  if (P.length < 2) return path;
  let cur = P[0].clone();
  for (let n = 1; n < P.length - 1; n++) {
    const prev = P[n - 1], c = P[n], next = P[n + 1];
    const dIn = c.clone().sub(prev), dOut = next.clone().sub(c), lIn = dIn.length(), lOut = dOut.length();
    if (lIn < 1e-6 || lOut < 1e-6) continue;
    const r = Math.min(bendRadius, lIn / 2, lOut / 2);
    const A = c.clone().addScaledVector(dIn.normalize(), -r), B = c.clone().addScaledVector(dOut.normalize(), r);
    if (cur.distanceTo(A) > 1e-6) path.add(new THREE.LineCurve3(cur, A));
    path.add(new THREE.QuadraticBezierCurve3(A, c.clone(), B));
    cur = B;
  }
  const end = P[P.length - 1];
  if (cur.distanceTo(end) > 1e-6) path.add(new THREE.LineCurve3(cur, end));
  return path;
}

/**
 * THREE.TubeGeometry a lo largo de la ruta. Los segmentos se reparten por longitud y se agregan
 * más en las curvas para que los codos queden redondos.
 * @param {object} THREE
 * @param {Array<{x,y,z}>} points
 * @param {{radius?:number, radialSegments?:number, bendRadius?:number, segmentsPerMM?:number}} [g]
 */
export function buildWireGeometry(THREE, points, g = {}) {
  const radius = g.radius !== undefined ? g.radius : 0.55, bend = g.bendRadius !== undefined ? g.bendRadius : 1.6;
  const curve = buildWireCurve(THREE, points, bend);
  const L = curve.curves.length ? curve.getLength() : 0;
  const bends = Math.max(0, points.length - 2);
  const seg = Math.max(8, Math.min(800, Math.ceil(L * (g.segmentsPerMM || 1.5)) + bends * 10));
  const geo = new THREE.TubeGeometry(curve, seg, radius, g.radialSegments || 10, false);
  geo.userData.wireLength = L; geo.userData.bends = bends;
  return geo;
}

export default createWireRouter;
