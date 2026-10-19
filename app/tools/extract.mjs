// Extrae del monolito (index.html de la raíz del repo) las piezas que la arquitectura modular reutiliza tal cual:
//   1. el motor eléctrico `Lab` → app/src/engine/lab-core.js (módulo ES, sin cambios de código)
//   2. el bloque <style> → app/styles/legacy/NN-seccion.css + app/styles/legacy/index.css (@import en el mismo orden)
// Verifica que la concatenación de los módulos CSS sea idéntica byte a byte al bloque original.
// Uso: node app/tools/extract.mjs [ruta/al/monolito.html]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const src = process.argv[2] || path.resolve(app, '..', 'index.html');
const html = fs.readFileSync(src, 'utf8');

/* ---------- 1. motor ---------- */
const core = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
if (!/root\.Lab = api/.test(core)) throw new Error('El primer <script> clásico no es el motor Lab');
fs.mkdirSync(path.join(app, 'src/engine'), { recursive: true });
fs.writeFileSync(path.join(app, 'src/engine/lab-core.js'),
  '/* VectraLab 3D · motor eléctrico, térmico y de microcontroladores (MNA) como módulo ES.\n' +
  '   Generado desde el monolito por tools/extract.mjs: no editar a mano; el código es idéntico al del monolito. */\n' +
  core + '\nconst Lab = globalThis.Lab;\nexport default Lab;\n');

/* ---------- 2. estilos ---------- */
const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)][0][1];
const marks = [...css.matchAll(/\/\*\s*-{5,}\s*([^*]+?)\s*-{5,}\s*\*\//g)].map(m => ({ at:m.index, name:m[1] }));
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^v\d+\s*·\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const parts = [{ name:'00-base-y-tokens', body:css.slice(0, marks[0].at) }];
marks.forEach((m, i) => parts.push({ name:String(i + 1).padStart(2, '0') + '-' + slug(m.name), body:css.slice(m.at, i + 1 < marks.length ? marks[i + 1].at : css.length) }));
const dir = path.join(app, 'styles/legacy');
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
parts.forEach(p => fs.writeFileSync(path.join(dir, p.name + '.css'), p.body));
fs.writeFileSync(path.join(dir, 'index.css'), '/* Estilos del monolito divididos por sección (mismo orden de cascada). Generado por tools/extract.mjs */\n' + parts.map(p => '@import url("./' + p.name + '.css");').join('\n') + '\n');
const joined = parts.map(p => fs.readFileSync(path.join(dir, p.name + '.css'), 'utf8')).join('');
if (joined !== css) throw new Error('La concatenación de los módulos CSS no coincide con el original');
console.log('motor: ' + (core.length / 1024).toFixed(0) + ' KB · CSS: ' + parts.length + ' módulos, ' + css.split('\n').length + ' líneas, idéntico al original');
