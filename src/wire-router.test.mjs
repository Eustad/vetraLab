// Pruebas de wire-router.js (solo la lógica de pathfinding, sin Three.js): node wire-router.test.mjs
import { createWireRouter, simplify } from './wire-router.js';

let fails = 0;
const ok = (c, msg) => { if (!c) fails++; console.log((c ? 'OK   ' : 'FALLA') + ' ' + msg); };
const P = 2.54, hole = (col, row) => ({ x:col * P, y:0, z:row * P });

/* toda la ruta debe moverse en un solo eje por tramo */
const orthogonal = pts => pts.every((p, n) => n === 0 || [p.x !== pts[n - 1].x, p.y !== pts[n - 1].y, p.z !== pts[n - 1].z].filter(Boolean).length === 1);
/* ninguna celda de la ruta (fuera de los agujeros) dentro de una caja */
const inside = (c, b, cell) => { const x = c[0] * cell, y = 0.9 + (c[1] - 1) * 1.25, z = c[2] * cell; return x >= b.min.x && x <= b.max.x && y >= b.min.y && y <= b.max.y && z >= b.min.z && z <= b.max.z; };

{ /* 1. tramo libre: la ruta óptima sube, cruza y baja con 2 codos */
  const R = createWireRouter();
  const r = R.route(hole(0, 0), hole(10, 0));
  ok(r.ok && orthogonal(r.points), 'Ruta libre ortogonal (' + r.points.length + ' puntos de codo, ' + r.expanded + ' nodos)');
  ok(r.points.length === 4 && r.points[1].y === r.points[2].y && Math.abs(r.points[1].y - 0.9) < 1e-9, 'Ruta libre mínima pegada a la placa: sube a 0,9 mm, cruza 10 columnas y baja (2 codos)');
}
{ /* 2. un chip DIP en medio: la ruta lo esquiva por encima o por los costados, nunca lo atraviesa */
  const R = createWireRouter();
  const chip = { min:{ x:3 * P, y:0, z:-3 * P }, max:{ x:7 * P, y:4.5, z:3 * P } };
  R.addObstacle(chip);
  const r = R.route(hole(0, 0), hole(10, 0));
  ok(r.ok && orthogonal(r.points), 'Con un chip en medio sigue siendo ortogonal');
  ok(!r.cells.some(c => c[1] > 0 && inside(c, chip, P, P)), 'La ruta no entra en el chip');
  const clear = r.cells.filter(c => c[1] > 0).every(c => { const x = c[0] * P, y = 0.9 + (c[1] - 1) * 1.25, z = c[2] * P; return x < chip.min.x - 0.9 || x > chip.max.x + 0.9 || y > chip.max.y + 0.9 || z < chip.min.z - 0.9 || z > chip.max.z + 0.9 || (c[0] === 0 && c[2] === 0) || (c[0] === 10 && c[2] === 0); });
  ok(clear, 'Respeta la holgura de 0,9 mm alrededor del chip (máx. altura ' + Math.max(...r.points.map(p => p.y)).toFixed(2) + ' mm)');
}
{ /* 3. agujero pegado al chip: la columna de salida ignora la holgura y la ruta existe */
  const R = createWireRouter();
  R.addObstacle({ min:{ x:1.2, y:0, z:-5 }, max:{ x:12, y:4.5, z:5 } });
  const r = R.route(hole(0, 0), hole(-8, 0));
  ok(r.ok, 'Agujero a 1,2 mm de un chip: sale verticalmente y encuentra ruta');
}
{ /* 4. cables paralelos: con commit no comparten ninguna celda */
  const R = createWireRouter({ hardWires:true });
  const pairs = [0, 1, 2, 3, 4].map(n => ({ a:hole(0, n), b:hole(12, n) }));
  const rs = R.routeAll(pairs);
  const seen = new Map(); let shared = 0;
  rs.forEach((r, w) => r.cells.forEach(c => { if (c[1] === 0) return; const k = c.join(','); if (seen.has(k) && seen.get(k) !== w) shared++; seen.set(k, w); }));
  ok(rs.every(r => r.ok) && shared === 0, '5 cables paralelos sin compartir celdas (alturas máximas: ' + rs.map(r => Math.max(...r.points.map(p => p.y)).toFixed(1)).join(', ') + ' mm)');
}
{ /* 5. cables que se cruzan en X: el segundo pasa por otra capa */
  const R = createWireRouter({ hardWires:true });
  const r1 = R.commit(R.route(hole(0, 0), hole(10, 0)));
  const r2 = R.commit(R.route(hole(5, -5), hole(5, 5)));
  const c1 = new Set(r1.cells.filter(c => c[1] > 0).map(c => c.join(','))), cross = r2.cells.filter(c => c[1] > 0 && c1.has(c.join(','))).length;
  ok(r1.ok && r2.ok && cross === 0, 'Cruce en X: el segundo cable cambia de capa (' + cross + ' celdas compartidas)');
}
{ /* 6. modo suave (por defecto): permite compartir solo si no hay alternativa, pero prefiere separarse */
  const R = createWireRouter();
  const a = R.commit(R.route(hole(0, 0), hole(10, 0))), b = R.commit(R.route(hole(0, 1), hole(10, 1)));
  const s = new Set(a.cells.filter(c => c[1] > 0).map(c => c.join(','))), shared = b.cells.filter(c => c[1] > 0 && s.has(c.join(','))).length;
  ok(shared === 0, 'Costo de aglomeración: el segundo cable evita las celdas del primero');
}
{ /* 7. simplify deja solo codos */
  const s = simplify([{ x:0, y:0, z:0 }, { x:0, y:1, z:0 }, { x:0, y:2, z:0 }, { x:1, y:2, z:0 }, { x:2, y:2, z:0 }, { x:2, y:0, z:0 }]);
  ok(s.length === 4, 'simplify elimina puntos colineales (' + s.length + ' puntos)');
}
{ /* 8. rendimiento: 40 cables sobre una protoboard de 63 columnas con 4 chips */
  const R = createWireRouter();
  [8, 20, 34, 48].forEach(c => R.addObstacle({ min:{ x:c * P - 1, y:0, z:-4.5 }, max:{ x:(c + 7) * P + 1, y:4.5, z:4.5 } }));
  const pairs = []; let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let n = 0; n < 40; n++) pairs.push({ a:hole(Math.floor(rnd() * 63), rnd() < 0.5 ? -5 : 5), b:hole(Math.floor(rnd() * 63), rnd() < 0.5 ? -6 : 6) });
  const t0 = performance.now(), rs = R.routeAll(pairs), ms = performance.now() - t0;
  ok(rs.every(r => r.ok && orthogonal(r.points)), '40 cables ruteados y ortogonales en ' + ms.toFixed(0) + ' ms (' + (ms / 40).toFixed(1) + ' ms por cable)');
}
{ /* 9. pegados a la placa: sin obstáculos, todos los cables van en el primer nivel (0,9 mm) */
  const R = createWireRouter({ hardWires:true });
  const rs = R.routeAll([0, 2, 4, 6].map(n => ({ a:hole(0, n), b:hole(15, n) })));
  ok(rs.every(r => Math.max(...r.points.map(p => p.y)) <= 0.9 + 1e-9), 'Cables paralelos a 0,9 mm de la placa (máx. ' + Math.max(...rs.flatMap(r => r.points.map(p => p.y))).toFixed(2) + ' mm)');
}
{ /* 10. agujeros fuera de la rejilla (otra protoboard o columna impar): ruta ortogonal hasta el agujero exacto */
  const R = createWireRouter({ origin:{ x:0, z:1.27 } });
  const a = { x:1.27, y:-0.8, z:-13.97 }, b = { x:30.48 + 1.27, y:-0.8, z:56 + 3.81 };
  const r = R.route(a, b), last = r.points[r.points.length - 1];
  ok(r.ok && orthogonal(r.points) && last.x === b.x && last.z === b.z, 'Agujeros fuera de la rejilla: ruta ortogonal hasta el agujero exacto');
}
console.log(fails ? fails + ' pruebas fallaron' : 'Todas las pruebas pasaron');
process.exit(fails ? 1 : 0);
