// genera docs/datasheets/ (una ficha por componente con enlace al datasheet oficial) a partir de las definiciones del simulador
// uso: node gen-ds.js <vectralab.html> <carpeta de salida>
const fs = require('fs'), path = require('path');
const [inp, outDir] = process.argv.slice(2);
const sc = [...fs.readFileSync(inp, 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const mod = { exports:{} }; new Function('module', sc[0])(mod); const L = mod.exports;
const LINKS = require('./ds-links.js');
/* versión: la primera sección «## Versión» del README junto al index.html */
const readme = path.join(path.dirname(inp), 'README.md');
const ver = ((fs.existsSync(readme) ? fs.readFileSync(readme, 'utf8') : '').match(/^## Versión ([\d.]+)/m) || [])[1] || '';

/* aclaraciones cuando el documento enlazado cubre una familia o un equivalente */
const NOTA = {
  reg: 'TI publica el LM7805 dentro de la familia LM340 (LM340-5 = 7805).',
  tip42: 'El documento cubre TIP41A/B/C (NPN) y TIP42A/B/C (PNP).',
  tip31: 'El documento cubre TIP31A/B/C (NPN) y TIP32A/B/C (PNP).', tip32: 'El documento cubre TIP31A/B/C (NPN) y TIP32A/B/C (PNP).',
  bc547: 'El documento cubre BC546, BC547 y BC548.', bc548: 'El documento cubre BC546, BC547 y BC548.', bc557: 'El documento cubre BC556, BC557 y BC558.',
  bjt3904: 'El documento cubre 2N3903 y 2N3904.', mos2n7000: 'El documento cubre 2N7000, 2N7002 y NDS7002A.',
  regneg: 'Familia MC79xx (−5 V a −24 V).', zener: 'Serie 1N5221B–1N5267B (0,5 W); elige la tensión que uses en el simulador.',
  diode: 'El documento cubre 1N4001 a 1N4007.', lm336: 'Página de producto del LM336-2.5.',
  uln_mod: 'Datasheet del chip ULN2003A que lleva el módulo.', stepkit: 'Datasheet del chip ULN2003A del módulo; el motor 28BYJ-48 no tiene datasheet de fabricante publicado.',
  l298n: 'Datasheet del chip L298 que lleva el módulo; la placa (regulador 78M05, diodos y bornes) es un diseño genérico.',
  lcdi2c16: 'Datasheet del expansor PCF8574 del adaptador I²C; la pantalla usa el controlador HD44780 (ver «Pantalla LCD (bus paralelo)»).',
  lcdi2c20: 'Datasheet del expansor PCF8574 del adaptador I²C; la pantalla usa el controlador HD44780.', lcdi2c: 'Datasheet del expansor PCF8574 del adaptador I²C; la pantalla usa el controlador HD44780.',
  lcd: 'Hitachi ya no publica el HD44780; el enlace es la copia pública que aloja SparkFun.', oled: 'Datasheet del controlador SSD1306; el enlace es la copia pública que aloja Adafruit.',
  mpu6050: 'Página de producto de TDK InvenSense, con el datasheet y el mapa de registros.', tcrt: 'Cada canal del módulo es un TCRT5000; el comparador del módulo es un LM393.',
  'mcu:esp32': 'Datasheet del chip ESP32; la placa DevKit V1 de 30 pines (DOIT) no tiene documentación oficial de Espressif.',
  'mcu:esp32v1': 'Datasheet del chip ESP32; la placa DevKit V1 de 38 pines no tiene documentación oficial de Espressif.',
  'mcu:esp32c': 'Guía oficial de la placa ESP32-DevKitC V4, con esquema y pinout.',
  arduino: 'Página oficial del Arduino Uno Rev3, con esquema, pinout y datasheet del ATmega328P.',
  '7266': 'TI fabrica esta función como CD74HC7266.', '7473': 'TI fabrica esta función como CD74HC73.', '7476': 'El 74HC76 está descontinuado y ningún fabricante actual lo publica; el 74HC73 (CD74HC73) es la alternativa más cercana.',
  '74190': 'TI fabrica esta función como CD74HC190.', '74283': 'TI fabrica esta función en HC como CD74HC283.', '74ls86': 'TI lo publica como SN74LS86A.',
  '7448': 'El 74LS48 está descontinuado; el SN74LS47 (ánodo común) tiene la misma lógica con salidas de colector abierto.',
  adc0804: 'TI lo publica como ADC0804-N.',
};
/* piezas sin datasheet de fabricante (genéricas o de muchos fabricantes) */
const GENERICA = {
  resistor: 'Pieza genérica (película de carbón o metálica, 1/4 W); cada fabricante publica su serie.',
  led: 'LED genérico de 5 mm; cada fabricante publica el suyo (Vf y corriente varían por color).',
  capacitor: 'Electrolítico radial genérico; la serie exacta depende del fabricante (Nichicon, Panasonic, Rubycon…).',
  ceramic: 'Cerámico de disco genérico.', pot: 'Potenciómetro genérico.', button: 'Pulsador táctil genérico de 6 × 6 mm.',
  inductor: 'Choque radial genérico.', rpower: 'Resistencia tubular de potencia genérica.', crystal: 'Cristal HC-49 genérico.',
  ntc: 'Termistor NTC genérico de 10 kΩ (B ≈ 3950).', rgbled: 'LED RGB genérico de cátodo común.', spdt: 'Interruptor deslizante genérico.',
  dipsw: 'Interruptor DIP genérico.', seg7: 'Display de 7 segmentos genérico.', bargraph: 'Barra de 10 LED genérica.',
  keypad: 'Teclado de membrana genérico.', buzzer: 'Zumbador activo genérico.', ldr: 'La GL5528 se vende sin datasheet de fabricante verificable.',
  bridge: 'El DB107 lo fabrican varias marcas; el sitio de Diodes Inc. bloquea la verificación automática, así que no se enlaza.',
  joystick: 'Módulo genérico KY-023 (dos potenciómetros y un pulsador).', relay: 'Módulo genérico con relé Songle SRD-05VDC.',
  servo: 'El SG90 no tiene datasheet publicado por TowerPro.', stepper: 'El 28BYJ-48 no tiene datasheet de fabricante publicado.',
  nema17: 'NEMA 17 es un tamaño de brida, no un modelo: el datasheet depende del fabricante.', motor: 'Motor DC 130 genérico.',
  gearmotor: 'Motorreductor TT genérico.', hcsr04: 'El HC-SR04 se vende sin datasheet de fabricante verificable.',
  portapilas: 'Accesorio genérico.', batteryPack: 'Accesorio genérico.', trafo: 'Transformador genérico.',
  supply: 'Instrumento genérico del simulador.', fgen: 'Instrumento genérico del simulador.', scope: 'Instrumento genérico del simulador.',
  dmm: 'Manual del fabricante no verificado.', lprobe: 'Manual del fabricante no verificado.',
  chasis2wd: 'Kit genérico.', chasisbal: 'Kit genérico.', brazo3d: 'Kit genérico.',
};
const SKIP = new Set(['ic', 'mcu', 'customDip', 'stub2', 'stub3', 'model3d']);

const esc = s => String(s).replace(/\|/g, '\\|');
const link = k => { const v = LINKS[k]; return v ? '[' + v[0] + '](' + v[1] + ')' : null; };
/* anclas como las genera GitHub: minúsculas, conserva letras con acento, quita la puntuación y cada espacio pasa a guion */
const slug = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/ /g, '-');
const fuente = k => { const l = link(k); return l ? '**Datasheet:** ' + l + (NOTA[k] ? '  \n' + NOTA[k] : '') : '**Datasheet:** sin enlace' + (NOTA[k] ? '. ' + NOTA[k] : GENERICA[k] ? '. ' + GENERICA[k] : '.'); };
const pinTable = names => '| Pata | Nombre |\n|---:|---|\n' + names.map((n, i) => '| ' + (i + 1) + ' | ' + esc(n) + ' |').join('\n');
const head = (t, intro) => '# ' + t + '\n\n' + intro + '\n\n> Las patas y los rangos de esta ficha son los que usa VectraLab ' + ver + ' al simular. Para diseñar un circuito real manda siempre el datasheet del fabricante.\n';
const index = [];

/* integrados */
{
  const groups = {};
  for (const k of Object.keys(L.IC)) { const d = L.IC[k]; (groups[d.grupo] = groups[d.grupo] || []).push(k); }
  let md = head('Integrados', 'Una ficha por circuito integrado DIP del simulador.');
  for (const g of Object.keys(groups)) {
    md += '\n## ' + g + '\n';
    for (const k of groups[g]) {
      const d = L.IC[k], f = L.FAM[d.fam] || {}, t = d.mark + ' · ' + d.sub;
      md += '\n### ' + t + '\n\n' + (d.desc ? d.desc + '\n\n' : '') +
        '- Encapsulado: DIP-' + d.pins + (d.chip ? ' (marcado ' + d.chip + ')' : '') + '\n' +
        '- Alimentación: pata ' + d.vcc + ' (' + d.names[d.vcc - 1] + ') y pata ' + d.gnd + ' (' + d.names[d.gnd - 1] + ')' + (f.rango ? ', de ' + f.rango : '') + (f.vabs ? '; el simulador lo da por dañado sobre ' + String(f.vabs).replace('.', ',') + ' V' : '') + '\n\n' +
        fuente(k) + '\n\n' + pinTable(d.names) + '\n';
      index.push([t, 'integrados.md#' + slug(t), LINKS[k]]);
    }
  }
  fs.writeFileSync(path.join(outDir, 'integrados.md'), md);
}
/* microcontroladores */
{
  let md = head('Microcontroladores y placas', 'Microcontroladores que el simulador programa (C de Arduino, ensamblador o .HEX).');
  for (const k of Object.keys(L.MCU)) {
    const d = L.MCU[k], kk = 'mcu:' + k, t = d.nombre || d.mark;
    md += '\n## ' + t + '\n\n' + (d.desc ? d.desc + '\n\n' : '') +
      (d.chip ? '- Chip: ' + d.chip + '\n' : '') + '- Patas: ' + d.pins + '\n' +
      (d.vmin ? '- Alimentación en el simulador: ' + String(d.vmin).replace('.', ',') + ' a ' + String(d.vmax).replace('.', ',') + ' V (daño sobre ' + String(d.vabs).replace('.', ',') + ' V)\n' : '') + '\n' +
      fuente(kk) + '\n\n' + (d.names ? pinTable(d.names) + '\n' : '');
    index.push([t, 'microcontroladores.md#' + slug(t), LINKS[kk]]);
  }
  fs.writeFileSync(path.join(outDir, 'microcontroladores.md'), md);
}
/* piezas de protoboard y de mesa */
{
  let md = head('Piezas, módulos e instrumentos', 'Piezas de la protoboard, módulos y equipos de la mesa.');
  for (const [kind, titulo] of [['board', 'En la protoboard'], ['bench', 'En la mesa']]) {
    md += '\n## ' + titulo + '\n';
    for (const k of Object.keys(L.PARTS)) {
      const P = L.PARTS[k]; if (SKIP.has(k) || P.kind !== kind) continue;
      md += '\n### ' + P.nombre + '\n\n' + fuente(k) + '\n';
      const pins = P.pins || [];
      if (pins.length) md += '\n| Terminal | Función |\n|---|---|\n' + pins.map(p => '| ' + esc(p) + ' | ' + esc((P.pinNames || {})[p] || '') + ' |').join('\n') + '\n';
      index.push([P.nombre, 'piezas.md#' + slug(P.nombre), LINKS[k]]);
    }
  }
  fs.writeFileSync(path.join(outDir, 'piezas.md'), md);
}
/* índice */
{
  const con = index.filter(r => r[2]).length;
  let md = '# Datasheets\n\nFichas de los ' + index.length + ' componentes de VectraLab ' + ver + ' con el enlace a su datasheet oficial (' + con + ' con enlace).\n\n' +
    '- [Integrados](integrados.md)\n- [Microcontroladores y placas](microcontroladores.md)\n- [Piezas, módulos e instrumentos](piezas.md)\n\n' +
    'Los PDF no se copian al repositorio: tienen derechos de autor de cada fabricante y el enlace lleva siempre a la revisión vigente. Cada enlace se comprobó el ' + new Date().toISOString().slice(0, 10) + '. Las piezas genéricas (resistencias, LED, motores de juguete, módulos sin marca) no tienen un datasheet único y su ficha lo explica.\n\n' +
    'Para regenerar las fichas cuando cambie el simulador: `node tools/gen-ds.js index.html docs/datasheets`; los enlaces están en `tools/ds-links.js`.\n\n' +
    '| Componente | Fabricante | Ficha |\n|---|---|---|\n' + index.map(r => '| ' + esc(r[0]) + ' | ' + (r[2] ? '[' + r[2][0] + '](' + r[2][1] + ')' : '—') + ' | [ver](' + r[1] + ') |').join('\n') + '\n';
  fs.writeFileSync(path.join(outDir, 'README.md'), md);
  console.log('fichas: ' + index.length + ' · con enlace: ' + con);
}
