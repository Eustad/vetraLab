/* VectraLab 3D · motor eléctrico, térmico y de microcontroladores (MNA) como módulo ES.
   Generado desde el monolito por tools/extract.mjs: no editar a mano; el código es idéntico al del monolito. */

/* Laboratorio Virtual 3D - núcleo: geometría de protoboards, catálogo de piezas, modelo de datos y motor eléctrico/térmico.
   Unidades: 1 unidad de escena = 1 mm. Motor en SI (V, A, Ω, s). Análisis nodal modificado con paso de tiempo variable. */
(function (root) {
'use strict';

const PITCH = 2.54;
const ROWS = ['N1','P1','a','b','c','d','e','f','g','h','i','j','P2','N2'];
const ROW_Z = { N1:-21.59, P1:-19.05, a:-13.97, b:-11.43, c:-8.89, d:-6.35, e:-3.81,
                f:3.81, g:6.35, h:8.89, i:11.43, j:13.97, P2:19.05, N2:21.59 };
const BOARD_D = 56, TABLE_Y = -8, VT = 0.02585, AMB = 25, GND = 'EARTH';
const TABLE = { hx:760, hz:740 };
const MAT = { cx:0, cz:410, hx:750, hz:330 };   // tapete de robótica (mm), al frente de la mesa
const BOARD_SIZES = [
  { cols:17, nombre:'Mini · 17 col.' }, { cols:30, nombre:'Media · 30 col.' }, { cols:47, nombre:'¾ · 47 col.' },
  { cols:63, nombre:'Completa · 63 col.' }, { cols:94, nombre:'Extra larga · 94 col.' }
];
const L = { cols:30, n:1, W:90, D:56 };
function setLayout(b) { L.cols = b.cols; L.n = b.n; L.W = (b.cols - 1) * PITCH + 16.34; L.D = BOARD_D * b.n; }
function boardZ(bd) { return (bd - (L.n - 1) / 2) * BOARD_D; }
function holeXZ(bd, row, col) { return { x:(col - (L.cols - 1) / 2) * PITCH, z:ROW_Z[row] + boardZ(bd) }; }
function stripOf(bd, row, col) {
  const r = row.charAt(0);
  if (r === 'N' || r === 'P') return 'R:' + bd + ':' + row;
  return 'S:' + bd + ':' + (row < 'f' ? 't' : 'b') + ':' + col;
}
function isBoardRow(row) { return typeof row === 'string' && row.length === 1 && row >= 'a' && row <= 'j'; }
function holeKey(bd, row, col) { return bd + ':' + row + ':' + col; }
function epKey(e) { return e.k === 'h' ? 'h:' + holeKey(e.bd || 0, e.row, e.col) : 't:' + e.comp + ':' + e.pin; }

/* ---------- diodos y LED ---------- */
const LED_TYPES = {
  rojo:     { vf:1.95, n:1.9, hex:0xff2a1a, nombre:'Rojo' },
  amarillo: { vf:2.05, n:2.0, hex:0xffc21a, nombre:'Amarillo' },
  verde:    { vf:2.15, n:2.0, hex:0x2bff4a, nombre:'Verde' },
  azul:     { vf:3.00, n:2.6, hex:0x2a6bff, nombre:'Azul' },
  blanco:   { vf:3.00, n:2.6, hex:0xf4f7ff, nombre:'Blanco' }
};
const DIODE = { vf:0.72, n:1.9, nombre:'1N4007' };
function prepDiode(t) {
  t.is = 0.01 * Math.exp(-t.vf / (t.n * VT));       // corriente de saturación para Vf a 10 mA
  t.vcrit = t.n * VT * Math.log(t.n * VT / (Math.SQRT2 * t.is));
}
Object.keys(LED_TYPES).forEach(k => prepDiode(LED_TYPES[k]));
prepDiode(DIODE);
const DIODES = {
  '1N4007': DIODE,
  '1N4148': { vf:0.74, n:1.85, nombre:'1N4148', spec:'DS' },
  '1N5819': { vf:0.36, n:1.3, nombre:'1N5819 (Schottky)', spec:'D' }
};
prepDiode(DIODES['1N4148']); prepDiode(DIODES['1N5819']);
DIODE.spec = 'D';
const ZENER_V = [2.7, 3.3, 4.7, 5.1, 5.6, 6.2, 6.8, 8.2, 9.1, 10, 12, 15];
const ZCACHE = {};
function zenerType(vz, nz) {
  const k = vz + '|' + (nz || 0.6);
  if (ZCACHE[k]) return ZCACHE[k];
  const t = { vf:0.75, n:1.9, vz, nz:nz || 0.6, isz:5e-3, nombre:'Zener ' + String(vz).replace('.', ',') + ' V', spec:'Z' };
  prepDiode(t);
  t.vcritz = t.nz * VT * Math.log(t.nz * VT / (Math.SQRT2 * t.isz));
  return (ZCACHE[k] = t);
}

const SPEC = {
  R:   { Rth:250, Cth:0.03, Twarn:100, Tmax:180 },
  LED: { Rth:300, Cth:0.003, Twarn:70, Tmax:120 },
  D:   { Rth:80, Cth:0.06, Twarn:120, Tmax:175 },
  W:   { Rw:0.02, Irated:3, dTr:100, tau:4, Twarn:80, Tmax:250 },
  C:   { overFactor:1.10, overTime:0.5, revV:-1, revTime:1.2 },
  V:   { Rint:0.05, Vmax:30, Imax:5 },
  G:   { Rout:50 },
  REG: { Rth:50, Cth:0.3, Ttrip:150, Treset:125, Rout:0.1 },
  DS:  { Rth:350, Cth:0.004, Twarn:120, Tmax:175 },
  Z:   { Rth:300, Cth:0.02, Twarn:120, Tmax:175 },
  L:   { Rth:60, Cth:0.4, Twarn:100, Tmax:150 },
  RP:  { Rth:9, Cth:4, Twarn:200, Tmax:320 }
};

/* ---------- circuitos integrados ---------- */
const FAM = {
  hc:    { vmin:2,   vmax:6,  vabs:7,  rout:45,  hyst:0.06, rango:'2 a 6 V' },
  cmos:  { vmin:3,   vmax:18, vabs:20, rout:350, hyst:0.06, rango:'3 a 18 V' },
  t555:  { vmin:4.5, vmax:16, vabs:18, rout:8,   hyst:0.05, rango:'4,5 a 16 V' },
  op358: { vmin:3,   vmax:32, vabs:34, dhi:1.5, dlo:0.02, rout:75, rango:'3 a 32 V' },
  op741: { vmin:8,   vmax:36, vabs:38, dhi:1.5, dlo:1.5,  rout:75, rango:'10 a 36 V' },
  uln:   { vmin:0,   vmax:50, vabs:55, rout:6, thr:1.6, always:true, rango:'hasta 50 V en las salidas' },
  l293:  { vmin:4.5, vmax:7,  vabs:7.5, rout:2, thr:2.3, rango:'lógica 4,5 a 7 V, motor hasta 36 V' },
  adcf:  { vmin:4.5, vmax:6.3, vabs:6.5, rout:250, hyst:0.06, rango:'4,5 a 6,3 V (5 V típico)' },
  dacf:  { vmin:4.5, vmax:18, vabs:18.5, rout:100, rango:'VCC de 4,5 a 18 V y VEE de −5 a −15 V' },
  tlf:   { vmin:7, vmax:40, vabs:42, rout:3, rango:'7 a 40 V' },
  tlea:  { vmin:7, vmax:40, vabs:42, dhi:1.5, dlo:0.3, rout:300, rango:'' },
  ttl:   { vmin:4.5, vmax:5.5, vabs:7,  rout:30,  hyst:0.08, rango:'4,75 a 5,25 V (TTL)' },
  tl08:  { vmin:7,   vmax:36, vabs:38, dhi:1.5, dlo:1.5, rout:75, rango:'±3,5 a ±18 V' },
  cmpf:  { vmin:2,   vmax:36, vabs:38, rout:30, rango:'2 a 36 V (salida colector abierto)' },
  a386f: { vmin:4,   vmax:12, vabs:15, rout:4,  rango:'4 a 12 V' },
  optof: { vmin:0,   vmax:80, vabs:80, rout:1,  always:true, rango:'LED 1,2 V · salida hasta 35–80 V' }
};
const QUAD_NAMES = ['1A','1B','1Y','2A','2B','2Y','GND','3Y','3A','3B','4Y','4A','4B','VCC'];
const QUAD_GATES = [[1,2,3],[4,5,6],[9,10,8],[12,13,11]];
const HEX_NAMES = ['1A','1Y','2A','2Y','3A','3Y','GND','4Y','4A','5Y','5A','6Y','6A','VCC'];
const HEX_GATES = [[1,2],[3,4],[5,6],[9,8],[11,10],[13,12]];
function quad(fn, mark, sub, desc) {
  return { kind:'gate', fam:'hc', pins:14, vcc:14, gnd:7, fn, mark, chip:'SN' + mark + 'N', sub, desc, names:QUAD_NAMES, gates:QUAD_GATES, grupo:'Compuertas lógicas' };
}
const IC = {
  '7400': quad('nand', '74HC00', '4 × NAND', 'Cuatro compuertas NAND de dos entradas.'),
  '7402': Object.assign(quad('nor', '74HC02', '4 × NOR', 'Cuatro compuertas NOR de dos entradas. Ojo: las salidas están en los pines 1, 4, 10 y 13.'),
    { names:['1Y','1A','1B','2Y','2A','2B','GND','3A','3B','3Y','4A','4B','4Y','VCC'], gates:[[2,3,1],[5,6,4],[8,9,10],[11,12,13]] }),
  '7404': Object.assign(quad('not', '74HC04', '6 × NOT', 'Seis inversores.'), { names:HEX_NAMES, gates:HEX_GATES }),
  '7408': quad('and', '74HC08', '4 × AND', 'Cuatro compuertas AND de dos entradas.'),
  '7414': Object.assign(quad('not', '74HC14', '6 × NOT Schmitt', 'Seis inversores con disparador Schmitt (histéresis amplia).'), { names:HEX_NAMES, gates:HEX_GATES, hyst:0.17 }),
  '7432': quad('or', '74HC32', '4 × OR', 'Cuatro compuertas OR de dos entradas.'),
  '7486': quad('xor', '74HC86', '4 × XOR', 'Cuatro compuertas OR exclusiva de dos entradas.'),
  '7474': { kind:'ff', fam:'hc', pins:14, vcc:14, gnd:7, mark:'74HC74', chip:'SN74HC74N', sub:'2 × flip-flop D', grupo:'Secuenciales',
    desc:'Dos flip-flops tipo D con preset y clear (activos en bajo, con pull-up interno).',
    names:['/1CLR','1D','1CLK','/1PRE','1Q','/1Q','GND','/2Q','2Q','/2PRE','2CLK','2D','/2CLR','VCC'],
    ffs:[{ clr:1, d:2, clk:3, pre:4, q:5, qn:6 }, { clr:13, d:12, clk:11, pre:10, q:9, qn:8 }], outs:[5,6,8,9], pullUp:[1,4,10,13] },
  '74595': { kind:'595', fam:'hc', pins:16, vcc:16, gnd:8, mark:'74HC595', chip:'SN74HC595N', sub:'Registro 8 bits', grupo:'Secuenciales',
    desc:'Registro de desplazamiento serie a paralelo con latch. /SRCLR con pull-up interno.',
    names:['QB','QC','QD','QE','QF','QG','QH','GND',"QH'",'/SRCLR','SRCLK','RCLK','/OE','SER','QA','VCC'], outs:[15,1,2,3,4,5,6,7,9], pullUp:[10] },
  '4017': { kind:'4017', fam:'cmos', pins:16, vcc:16, gnd:8, mark:'CD4017', chip:'CD4017BE', sub:'Contador decimal', grupo:'Secuenciales',
    desc:'Contador Johnson de 10 salidas. Avanza en cada flanco de subida de CLK.',
    names:['Q5','Q1','Q0','Q2','Q6','Q7','Q3','VSS','Q8','Q4','Q9','CO','INH','CLK','RST','VDD'], outs:[3,2,4,7,10,1,5,6,9,11,12] },
  '555': { kind:'555', fam:'t555', pins:8, vcc:8, gnd:1, mark:'NE555', chip:'NE555P', sub:'Temporizador', grupo:'Analógicos',
    desc:'Temporizador clásico: astable, monoestable y PWM. RESET con pull-up interno.',
    names:['GND','TRIG','OUT','RESET','CTRL','THR','DIS','VCC'], outs:[3], ins:[2,4,6], pullUp:[4], weak:[2,6] },
  '358': { kind:'op', fam:'op358', pins:8, vcc:8, gnd:4, mark:'LM358', chip:'LM358N', sub:'2 × op-amp', grupo:'Analógicos',
    desc:'Doble amplificador operacional de fuente simple; la salida llega casi a 0 V.',
    names:['OUT A','IN− A','IN+ A','GND','IN+ B','IN− B','OUT B','VCC'], amps:[{ o:1, n:2, p:3 }, { o:7, n:6, p:5 }] },
  '324': { kind:'op', fam:'op358', pins:14, vcc:4, gnd:11, mark:'LM324', chip:'LM324N', sub:'4 × op-amp', grupo:'Analógicos',
    desc:'Cuatro amplificadores operacionales. Con fuente dual: VCC (4) a +V y GND (11) a −V. La salida llega a 1,5 V del positivo y casi al negativo.',
    names:['OUT 1','IN− 1','IN+ 1','VCC','IN+ 2','IN− 2','OUT 2','OUT 3','IN− 3','IN+ 3','GND','IN+ 4','IN− 4','OUT 4'],
    amps:[{ o:1, n:2, p:3 }, { o:7, n:6, p:5 }, { o:8, n:9, p:10 }, { o:14, n:13, p:12 }] },
  'adc0804': { kind:'adc', fam:'adcf', pins:20, vcc:20, gnd:10, mark:'ADC0804', chip:'ADC0804LCN', sub:'ADC de 8 bits', grupo:'Conversores',
    desc:'Conversor analógico a digital de 8 bits por aproximaciones sucesivas. /CS y /RD a tierra; cada flanco de subida en /WR inicia una conversión (unos 100 µs) y al terminar /INTR baja. Une /WR con /INTR para que convierta solo. VREF/2 abierto equivale a VCC/2.',
    names:['/CS','/RD','/WR','CLK IN','/INTR','VIN+','VIN−','AGND','VREF/2','DGND','DB7','DB6','DB5','DB4','DB3','DB2','DB1','DB0','CLK R','VCC'],
    outs:[18,17,16,15,14,13,12,11,5], ins:[1,2,3] },
  'dac0808': { kind:'dac', fam:'dacf', pins:16, vcc:13, gnd:2, mark:'DAC0808', chip:'DAC0808LCN', sub:'DAC de 8 bits', grupo:'Conversores',
    desc:'Conversor digital a analógico de 8 bits con salida de corriente. VREF+ (14) recibe la corriente de referencia por un resistor; IO (4) absorbe Iref·(A1/2 + … + A8/256). Se convierte a voltaje con un op-amp. A1 es el bit más significativo. VEE (3) a −12/−15 V.',
    names:['NC','GND','VEE','IO','A1','A2','A3','A4','A5','A6','A7','A8','VCC','VREF+','VREF−','COMP'],
    ins:[5,6,7,8,9,10,11,12], nc:[1,16] },
  'tl494': { kind:'tl494', fam:'tlf', pins:16, vcc:12, gnd:7, mark:'TL494', chip:'TL494CN', sub:'Controlador PWM', grupo:'Potencia',
    desc:'Controlador PWM para fuentes conmutadas. f = 1,1 / (RT·CT). La salida conduce mientras la rampa de CT supera al voltaje de FEEDBACK (3) y al de DTC (4). Dos amplificadores de error (1/2 y 16/15) con salida a FEEDBACK. REF (14) entrega 5 V. OUTPUT CTRL (13) a tierra: salidas en paralelo; a REF: push-pull.',
    names:['1IN+','1IN−','FEEDBACK','DTC','CT','RT','GND','C1','E1','E2','C2','VCC','OUT CTRL','REF','2IN−','2IN+'],
    ins:[], nc:[] },
  '741': { kind:'op', fam:'op741', pins:8, vcc:7, gnd:4, mark:'LM741', chip:'LM741CN', sub:'Op-amp', grupo:'Analógicos',
    desc:'Amplificador operacional de propósito general. Su salida queda 1,5 V lejos de cada riel.',
    names:['NULL','IN−','IN+','V−','NULL','OUT','V+','NC'], amps:[{ o:6, n:2, p:3 }], nc:[1,5,8] },
  '2003': { kind:'drv', fam:'uln', pins:16, vcc:9, gnd:8, mark:'ULN2003', chip:'ULN2003AN', sub:'7 × Darlington', grupo:'Controladores',
    desc:'Siete Darlington de colector abierto: con la entrada en alto, la salida conecta la carga a GND. Ideal para el paso a paso 28BYJ-48 y relés. COM va al positivo del motor.',
    names:['1B','2B','3B','4B','5B','6B','7B','GND','COM','7C','6C','5C','4C','3C','2C','1C'], chans:[[1,16],[2,15],[3,14],[4,13],[5,12],[6,11],[7,10]], oc:true, ins:[1,2,3,4,5,6,7], pullDn:2700 },
  '293': { kind:'drv', fam:'l293', pins:16, vcc:16, gnd:4, vmot:8, mark:'L293D', chip:'L293DNE', sub:'Doble puente H', grupo:'Controladores',
    desc:'Cuatro medios puentes H para motores DC y paso a paso bipolares. VCC1 (16) es la lógica a 5 V; VCC2 (8) es el voltaje del motor. EN en alto habilita cada par.',
    names:['EN1,2','1A','1Y','GND','GND','2Y','2A','VCC2','EN3,4','3A','3Y','GND','GND','4Y','4A','VCC1'], chans:[[2,3,1],[7,6,1],[10,11,9],[15,14,9]], ins:[1,2,7,9,10,15], gndx:[5,12,13] },
  /* ---------- TTL 74LS (entradas al aire = alto) y 74HC adicionales ---------- */
  '7266': Object.assign(quad('xnor', '74HC7266', '4 × XNOR', 'Cuatro compuertas XNOR: la salida es 1 cuando las dos entradas son iguales.'),
    { names:['1A','1B','1Y','2Y','2A','2B','GND','3A','3B','3Y','4Y','4A','4B','VCC'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '74ls00': Object.assign(quad('nand', '74LS00', '4 × NAND TTL', 'Versión TTL bipolar del 7400: 5 V ± 5 %; una entrada al aire se lee como 1.'), { fam:'ttl', ttlUp:true, grupo:'TTL 74LS' }),
  '74ls02': Object.assign(quad('nor', '74LS02', '4 × NOR TTL', 'Versión TTL del 7402.'), { fam:'ttl', ttlUp:true, grupo:'TTL 74LS', names:['1Y','1A','1B','2Y','2A','2B','GND','3A','3B','3Y','4A','4B','4Y','VCC'], gates:[[2,3,1],[5,6,4],[8,9,10],[11,12,13]] }),
  '74ls04': Object.assign(quad('not', '74LS04', '6 × NOT TTL', 'Seis inversores TTL.'), { fam:'ttl', ttlUp:true, grupo:'TTL 74LS', names:HEX_NAMES, gates:HEX_GATES }),
  '74ls08': Object.assign(quad('and', '74LS08', '4 × AND TTL', 'Cuatro AND TTL.'), { fam:'ttl', ttlUp:true, grupo:'TTL 74LS' }),
  '74ls32': Object.assign(quad('or', '74LS32', '4 × OR TTL', 'Cuatro OR TTL.'), { fam:'ttl', ttlUp:true, grupo:'TTL 74LS' }),
  '74ls86': Object.assign(quad('xor', '74LS86', '4 × XOR TTL', 'Cuatro XOR TTL.'), { fam:'ttl', ttlUp:true, grupo:'TTL 74LS' }),
  '7410': { kind:'gate', fn:'nand', fam:'hc', pins:14, vcc:14, gnd:7, mark:'74HC10', chip:'SN74HC10N', sub:'3 × NAND de 3 entradas', grupo:'Compuertas lógicas', desc:'Tres compuertas NAND de tres entradas.',
    names:['1A','1B','2A','2B','2C','2Y','GND','3Y','3A','3B','3C','1Y','1C','VCC'], gates:[[1,2,13,12],[3,4,5,6],[9,10,11,8]] },
  '7411': { kind:'gate', fn:'and', fam:'hc', pins:14, vcc:14, gnd:7, mark:'74HC11', chip:'SN74HC11N', sub:'3 × AND de 3 entradas', grupo:'Compuertas lógicas', desc:'Tres compuertas AND de tres entradas.',
    names:['1A','1B','2A','2B','2C','2Y','GND','3Y','3A','3B','3C','1Y','1C','VCC'], gates:[[1,2,13,12],[3,4,5,6],[9,10,11,8]] },
  '7420': { kind:'gate', fn:'nand', fam:'hc', pins:14, vcc:14, gnd:7, mark:'74HC20', chip:'SN74HC20N', sub:'2 × NAND de 4 entradas', grupo:'Compuertas lógicas', desc:'Dos compuertas NAND de cuatro entradas.',
    names:['1A','1B','NC','1C','1D','1Y','GND','2Y','2A','2B','NC','2C','2D','VCC'], gates:[[1,2,4,5,6],[9,10,12,13,8]], nc:[3,11] },
  '7473': { kind:'jk', fam:'hc', pins:14, vcc:4, gnd:11, mark:'74HC73', chip:'SN74HC73N', sub:'2 × flip-flop JK', grupo:'Secuenciales',
    desc:'Dos flip-flops JK con clear activo en bajo. Cambian en el flanco de BAJADA del reloj: J=K=1 alterna (divide por 2).',
    names:['1CLK','/1CLR','1K','VCC','2CLK','/2CLR','2J','/2Q','2Q','2K','GND','1Q','/1Q','1J'],
    jks:[{ clk:1, clr:2, k:3, j:14, q:12, qn:13 }, { clk:5, clr:6, j:7, k:10, q:9, qn:8 }], outs:[12,13,9,8], pullUp:[2,6] },
  '7476': { kind:'jk', fam:'hc', pins:16, vcc:5, gnd:13, mark:'74HC76', chip:'SN74HC76N', sub:'2 × JK con preset', grupo:'Secuenciales',
    desc:'Dos flip-flops JK con preset y clear (activos en bajo). Flanco de bajada.',
    names:['1CLK','/1PRE','/1CLR','1J','VCC','2CLK','/2PRE','/2CLR','2J','/2Q','2Q','2K','GND','/1Q','1Q','1K'],
    jks:[{ clk:1, pre:2, clr:3, j:4, k:16, q:15, qn:14 }, { clk:6, pre:7, clr:8, j:9, k:12, q:11, qn:10 }], outs:[15,14,11,10], pullUp:[2,3,7,8] },
  '74164': { kind:'164', fam:'hc', pins:14, vcc:14, gnd:7, mark:'74HC164', chip:'SN74HC164N', sub:'Registro serie-paralelo', grupo:'Secuenciales',
    desc:'Registro de desplazamiento de 8 bits: el dato serie es A·B y entra en cada flanco de subida de CLK. /CLR en bajo borra (pull-up interno).',
    names:['A','B','QA','QB','QC','QD','GND','CLK','/CLR','QE','QF','QG','QH','VCC'], outs:[3,4,5,6,10,11,12,13], pullUp:[9] },
  '7447': { kind:'bcd7', fam:'ttl', ttlUp:true, oc:true, low:true, pins:16, vcc:16, gnd:8, mark:'74LS47', chip:'SN74LS47N', sub:'BCD → 7 seg (ánodo común)', grupo:'Decodificadores y contadores',
    desc:'Decodificador BCD a 7 segmentos con salidas de colector abierto activas en bajo: maneja un display de ÁNODO común con un resistor por segmento.',
    names:['B','C','/LT','/BI-RBO','/RBI','D','A','GND','e','d','c','b','a','g','f','VCC'], outs:[13,12,11,10,9,15,14], pullUp:[3,4,5] },
  '7448': { kind:'bcd7', fam:'ttl', ttlUp:true, pins:16, vcc:16, gnd:8, mark:'74LS48', chip:'SN74LS48N', sub:'BCD → 7 seg (cátodo común)', grupo:'Decodificadores y contadores',
    desc:'Decodificador BCD a 7 segmentos con salidas activas en alto (pull-up interno de 2 kΩ): display de CÁTODO común.',
    names:['B','C','/LT','/BI-RBO','/RBI','D','A','GND','e','d','c','b','a','g','f','VCC'], outs:[13,12,11,10,9,15,14], pullUp:[3,4,5] },
  '74138': { kind:'138', fam:'hc', pins:16, vcc:16, gnd:8, mark:'74HC138', chip:'SN74HC138N', sub:'Decodificador 3 → 8', grupo:'Decodificadores y contadores',
    desc:'Activa (en bajo) una de 8 salidas según A, B, C. Habilitado con G1 en alto y /G2A, /G2B en bajo.',
    names:['A','B','C','/G2A','/G2B','G1','/Y7','GND','/Y6','/Y5','/Y4','/Y3','/Y2','/Y1','/Y0','VCC'], outs:[15,14,13,12,11,10,9,7] },
  '74151': { kind:'151', fam:'hc', pins:16, vcc:16, gnd:8, mark:'74HC151', chip:'SN74HC151N', sub:'Multiplexor 8 → 1', grupo:'Decodificadores y contadores',
    desc:'Envía a Y la entrada D0–D7 elegida por A, B, C; /W es la salida invertida. /G en bajo habilita.',
    names:['D3','D2','D1','D0','Y','/W','/G','GND','C','B','A','D7','D6','D5','D4','VCC'], outs:[5,6] },
  '74190': { kind:'updn', mod:10, fam:'hc', pins:16, vcc:16, gnd:8, mark:'74HC190', chip:'SN74HC190N', sub:'Contador década ↑↓', grupo:'Decodificadores y contadores',
    desc:'Contador BCD síncrono ascendente/descendente: D/U en bajo cuenta hacia arriba, /CTEN en bajo habilita, /LOAD en bajo carga A–D.',
    names:['B','QB','QA','/CTEN','D/U','QC','QD','GND','D','C','/LOAD','MAX/MIN','/RCO','CLK','A','VCC'], outs:[3,2,6,7,12,13], pullUp:[11] },
  '74193': { kind:'193', fam:'hc', pins:16, vcc:16, gnd:8, mark:'74HC193', chip:'SN74HC193N', sub:'Contador binario ↑↓', grupo:'Decodificadores y contadores',
    desc:'Contador de 4 bits con relojes separados: flanco de subida en UP suma, en DOWN resta (el otro en alto). CLR en alto borra; /LOAD en bajo carga A–D.',
    names:['B','QB','QA','DOWN','UP','QC','QD','GND','D','C','/LOAD','/CO','/BO','CLR','A','VCC'], outs:[3,2,6,7,12,13], pullUp:[4,5,11] },
  '74283': { kind:'283', fam:'hc', pins:16, vcc:16, gnd:8, mark:'74HC283', chip:'SN74HC283N', sub:'Sumador de 4 bits', grupo:'Decodificadores y contadores',
    desc:'Suma A + B + C0 en binario de 4 bits: S1–S4 y acarreo C4.',
    names:['S2','B2','A2','S1','A1','B1','C0','GND','C4','S4','B4','A4','S3','A3','B3','VCC'], outs:[4,1,13,10,9] },
  /* ---------- CMOS CD4000 ---------- */
  '4011': Object.assign(quad('nand', 'CD4011', '4 × NAND CMOS', 'Cuatro NAND CMOS de 3 a 18 V. Pinout CD4000: no es igual al 74HC00.'), { fam:'cmos', chip:'CD4011BE', grupo:'CMOS 4000', names:['A','B','J','K','C','D','VSS','E','F','L','M','G','H','VDD'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '4001': Object.assign(quad('nor', 'CD4001', '4 × NOR CMOS', 'Cuatro NOR CMOS de 3 a 18 V.'), { fam:'cmos', chip:'CD4001BE', grupo:'CMOS 4000', names:['A','B','J','K','C','D','VSS','E','F','L','M','G','H','VDD'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '4081': Object.assign(quad('and', 'CD4081', '4 × AND CMOS', 'Cuatro AND CMOS de 3 a 18 V.'), { fam:'cmos', chip:'CD4081BE', grupo:'CMOS 4000', names:['A','B','J','K','C','D','VSS','E','F','L','M','G','H','VDD'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '4071': Object.assign(quad('or', 'CD4071', '4 × OR CMOS', 'Cuatro OR CMOS de 3 a 18 V.'), { fam:'cmos', chip:'CD4071BE', grupo:'CMOS 4000', names:['A','B','J','K','C','D','VSS','E','F','L','M','G','H','VDD'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '4070': Object.assign(quad('xor', 'CD4070', '4 × XOR CMOS', 'Cuatro XOR CMOS de 3 a 18 V.'), { fam:'cmos', chip:'CD4070BE', grupo:'CMOS 4000', names:['A','B','J','K','C','D','VSS','E','F','L','M','G','H','VDD'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '4093': Object.assign(quad('nand', 'CD4093', '4 × NAND Schmitt', 'Cuatro NAND CMOS con disparador Schmitt: ideal para osciladores RC y limpiar pulsadores.'), { fam:'cmos', chip:'CD4093BE', grupo:'CMOS 4000', hyst:0.17, names:['A','B','J','K','C','D','VSS','E','F','L','M','G','H','VDD'], gates:[[1,2,3],[5,6,4],[8,9,10],[12,13,11]] }),
  '4069': Object.assign(quad('not', 'CD4069', '6 × NOT CMOS', 'Seis inversores CMOS de 3 a 18 V.'), { fam:'cmos', chip:'CD4069UBE', grupo:'CMOS 4000', names:HEX_NAMES.map(n => n === 'GND' ? 'VSS' : n === 'VCC' ? 'VDD' : n), gates:HEX_GATES }),
  '4013': { kind:'ff', hi:true, fam:'cmos', pins:14, vcc:14, gnd:7, mark:'CD4013', chip:'CD4013BE', sub:'2 × flip-flop D', grupo:'CMOS 4000',
    desc:'Dos flip-flops D CMOS con SET y RESET activos en ALTO (al revés que el 74HC74).',
    names:['Q1','/Q1','CLK1','RST1','D1','SET1','VSS','SET2','D2','RST2','CLK2','/Q2','Q2','VDD'],
    ffs:[{ q:1, qn:2, clk:3, clr:4, d:5, pre:6 }, { pre:8, d:9, clr:10, clk:11, qn:12, q:13 }], outs:[1,2,12,13] },
  '4026': { kind:'4026', fam:'cmos', pins:16, vcc:16, gnd:8, mark:'CD4026', chip:'CD4026BE', sub:'Contador + driver 7 seg', grupo:'CMOS 4000',
    desc:'Contador de décadas con salidas directas para un display de cátodo común. DEI en alto muestra los segmentos (pull-up incluido aquí por comodidad); CO divide por 10.',
    names:['CLK','CLK INH','DEI','DEO','CO','f','g','VSS','d','a','e','b','c','UNG C','RST','VDD'], outs:[10,12,13,9,11,6,7,4,5,14], pullUp:[3] },
  '4511': { kind:'4511', fam:'cmos', pins:16, vcc:16, gnd:8, mark:'CD4511', chip:'CD4511BE', sub:'Latch BCD → 7 seg', grupo:'CMOS 4000',
    desc:'Decodificador BCD a 7 segmentos con latch y salidas de alta corriente para cátodo común. /LT en bajo prueba todos los segmentos; /BL en bajo apaga; LE en alto congela el número.',
    names:['B','C','/LT','/BL','LE','D','A','VSS','e','d','c','b','a','g','f','VDD'], outs:[13,12,11,10,9,15,14], pullUp:[3,4] },
  '4051': { kind:'mux8', fam:'cmos', pins:16, vcc:16, gnd:8, mark:'CD4051', chip:'CD4051BE', sub:'Mux analógico 8 → 1', grupo:'CMOS 4000',
    desc:'Interruptor analógico bidireccional: une X (pin 3) con el canal X0–X7 elegido por A, B, C (≈ 125 Ω). /INH en alto abre todo. Las señales deben quedar entre VEE y VDD.',
    names:['X4','X6','X','X7','X5','/INH','VEE','VSS','C','B','A','X3','X0','X1','X2','VDD'], chan:[13,14,15,12,1,5,2,4], com:3, ins:[6,9,10,11], nc:[1,2,3,4,5,7,12,13,14,15] },
  /* ---------- analógicos ---------- */
  '556': { kind:'555', fam:'t555', pins:14, vcc:14, gnd:7, mark:'NE556', chip:'NE556N', sub:'Doble temporizador', grupo:'Analógicos',
    desc:'Dos 555 independientes en un solo chip (comparten alimentación).',
    names:['DIS 1','THR 1','CTRL 1','RESET 1','OUT 1','TRIG 1','GND','TRIG 2','OUT 2','RESET 2','CTRL 2','THR 2','DIS 2','VCC'],
    timers:[{ dis:1, thr:2, ctrl:3, rst:4, out:5, trig:6 }, { trig:8, out:9, rst:10, ctrl:11, thr:12, dis:13 }], outs:[5,9], ins:[2,4,6,8,10,12], pullUp:[4,10], weak:[2,6,8,12] },
  'tl081': { kind:'op', fam:'tl08', pins:8, vcc:7, gnd:4, mark:'TL081', chip:'TL081CP', sub:'Op-amp JFET', grupo:'Analógicos',
    desc:'Amplificador operacional con entrada JFET (corriente de entrada casi nula). Mismo pinout que el 741.', names:['NULL','IN−','IN+','V−','NULL','OUT','V+','NC'], amps:[{ o:6, n:2, p:3 }], nc:[1,5,8] },
  'tl082': { kind:'op', fam:'tl08', pins:8, vcc:8, gnd:4, mark:'TL082', chip:'TL082CP', sub:'2 × op-amp JFET', grupo:'Analógicos',
    desc:'Doble op-amp JFET; mismo pinout que el LM358 pero necesita fuente dual (±).', names:['OUT A','IN− A','IN+ A','V−','IN+ B','IN− B','OUT B','V+'], amps:[{ o:1, n:2, p:3 }, { o:7, n:6, p:5 }] },
  'tl084': { kind:'op', fam:'tl08', pins:14, vcc:4, gnd:11, mark:'TL084', chip:'TL084CN', sub:'4 × op-amp JFET', grupo:'Analógicos',
    desc:'Cuádruple op-amp JFET; mismo pinout que el LM324.', names:['OUT 1','IN− 1','IN+ 1','V+','IN+ 2','IN− 2','OUT 2','OUT 3','IN− 3','IN+ 3','V−','IN+ 4','IN− 4','OUT 4'],
    amps:[{ o:1, n:2, p:3 }, { o:7, n:6, p:5 }, { o:8, n:9, p:10 }, { o:14, n:13, p:12 }] },
  'lm339': { kind:'cmp', fam:'cmpf', oc:true, pins:14, vcc:3, gnd:12, mark:'LM339', chip:'LM339N', sub:'4 × comparador', grupo:'Comparadores',
    desc:'Cuatro comparadores de colector abierto: la salida se va a GND cuando IN− > IN+ y queda abierta (necesita pull-up) cuando IN+ > IN−.',
    names:['OUT 2','OUT 1','VCC','IN1−','IN1+','IN2−','IN2+','IN3−','IN3+','IN4−','IN4+','GND','OUT 4','OUT 3'], cmps:[{ o:2, n:4, p:5 }, { o:1, n:6, p:7 }, { o:14, n:8, p:9 }, { o:13, n:10, p:11 }], outs:[2,1,14,13], ins:[] },
  'lm393': { kind:'cmp', fam:'cmpf', oc:true, pins:8, vcc:8, gnd:4, mark:'LM393', chip:'LM393N', sub:'2 × comparador', grupo:'Comparadores',
    desc:'Doble comparador de colector abierto (el del módulo TCRT5000). Usa un resistor de pull-up en cada salida.',
    names:['OUT A','IN− A','IN+ A','GND','IN+ B','IN− B','OUT B','VCC'], cmps:[{ o:1, n:2, p:3 }, { o:7, n:6, p:5 }], outs:[1,7], ins:[] },
  'lm386': { kind:'a386', fam:'a386f', pins:8, vcc:6, gnd:4, mark:'LM386', chip:'LM386N-1', sub:'Amplificador de audio', grupo:'Analógicos',
    desc:'Amplificador de potencia de audio con ganancia interna de 20: la salida queda en Vs/2 y amplifica (IN+ − IN−). Con 10 µF entre GAIN (1-8) la ganancia sube a 200.',
    names:['GAIN','IN−','IN+','GND','VOUT','VS','BYPASS','GAIN'], outs:[5], ins:[2,3], pullDn:50000, nc:[1,7,8] },
  /* ---------- optoacopladores ---------- */
  'pc817': { kind:'opto', fam:'optof', pins:4, vcc:4, gnd:3, mark:'PC817', chip:'PC817', sub:'Optoacoplador DIP-4', grupo:'Optoacopladores',
    desc:'LED infrarrojo y fototransistor en el mismo encapsulado, aislados eléctricamente: la corriente del LED (1-2) controla la del transistor (4-3) con CTR ≈ 100 %.',
    names:['A','K','E','C'], led:{ a:1, k:2 }, ph:{ c:4, e:3 }, ctr:1.0, ins:[], outs:[] },
  '4n25': { kind:'opto', fam:'optof', pins:6, vcc:5, gnd:4, mark:'4N25', chip:'4N25', sub:'Optoacoplador DIP-6', grupo:'Optoacopladores',
    desc:'Optoacoplador clásico con base accesible (6). CTR ≈ 50 %.', names:['A','K','NC','E','C','B'], led:{ a:1, k:2 }, ph:{ c:5, e:4 }, ctr:0.5, ins:[], outs:[], nc:[3,6] }
};
IC['555'].timers = [{ trig:2, out:3, rst:4, ctrl:5, thr:6, dis:7 }];
Object.keys(IC).forEach(k => {
  const d = IC[k];
  if (d.gates) d.outs = d.gates.map(g => g[g.length - 1]);
  if (d.chans) d.outs = d.chans.map(ch => ch[1]);
  d.outs = d.outs || [];
  if (!d.ins) {
    d.ins = [];
    if (d.kind !== 'op') for (let p = 1; p <= d.pins; p++) if (p !== d.vcc && p !== d.gnd && !d.outs.includes(p) && !(d.nc || []).includes(p)) d.ins.push(p);
  }
  d.pulls = d.ins.map(p => [p, (d.pullUp || []).includes(p) || d.ttlUp ? 'up' : 'dn', (d.weak || []).includes(p) ? 1e-8 : d.pullDn ? 1 / d.pullDn : 1e-6]);
});
function gateN(fn, a) {
  const all = a.every(x => x), any = a.some(x => x), par = a.reduce((p, q) => p ^ q, 0);
  switch (fn) { case 'and': return all ? 1 : 0; case 'nand': return all ? 0 : 1; case 'or': return any ? 1 : 0; case 'nor': return any ? 0 : 1; case 'xor': return par; case 'xnor': return par ? 0 : 1; case 'not': return a[0] ? 0 : 1; default: return a[0] ? 1 : 0; }
}
const GATE_FN = {
  nand:(a, b) => a && b ? 0 : 1, and:(a, b) => a && b ? 1 : 0, or:(a, b) => a || b ? 1 : 0,
  nor:(a, b) => a || b ? 0 : 1, xor:(a, b) => a !== b ? 1 : 0, not:a => a ? 0 : 1
};

/* ---------- microcontroladores ---------- */
const PIC40 = ['MCLR','RA0/AN0','RA1/AN1','RA2/AN2','RA3/AN3','RA4','RA5/AN4','RE0/AN5','RE1/AN6','RE2/AN7','VDD','VSS','OSC1','OSC2','RC0','RC1','RC2','RC3','RD0','RD1','RD2','RD3','RC4','RC5','RC6/TX','RC7/RX','RD4','RD5','RD6','RD7','VSS','VDD','RB0/AN12','RB1/AN10','RB2/AN8','RB3/AN9','RB4/AN11','RB5','RB6','RB7'];
const MCU = {
  esp32: { mark:'ESP32', chip:'ESP32-WROOM-32', nombre:'ESP32 DevKit V1 (30 pines)', pins:30, rows:['b','i'], self:true, vlogic:3.3, vabsPin:3.6, adc:4095, rout:30, pullup:45000, imax:0.04, lang:'arduino',
    names:['EN','VP','VN','D34','D35','D32','D33','D25','D26','D27','D14','D12','D13','GND','VIN','3V3','GND','D15','D2','D4','RX2','TX2','D5','D18','D19','D21','RX0','TX0','D22','D23'],
    alias:{ VP:36, VN:39, RX2:16, TX2:17, RX0:3, TX0:1 }, sda:21, scl:22, led:2,
    desc:'Wi-Fi y Bluetooth, lógica de 3,3 V: sus pines no aceptan 5 V. Alimentado por USB: el pin 3V3 entrega 3,3 V y VIN entrega 5 V.' },
  esp32v1: { mark:'ESP32', chip:'ESP32-WROOM-32', nombre:'ESP32 DevKit V1 (38 pines)', pins:38, rows:['b','i'], self:true, vlogic:3.3, vabsPin:3.6, adc:4095, rout:30, pullup:45000, imax:0.04, lang:'arduino', model:'esp32v1',
    names:["CLK","SD0","SD1","D15","D2","D0","D4","D16","D17","D5","D18","D19","GND","D21","RX0","TX0","D22","D23","GND","3V3","EN","VP","VN","D34","D35","D32","D33","D25","D26","D27","D14","D12","GND","D13","SD2","SD3","CMD","5V"], alias:{ VP:36, VN:39, RX0:3, TX0:1 }, sda:21, scl:22, led:2,
    desc:'Versión de 38 pines. Lógica de 3,3 V: sus pines no aceptan 5 V. Por USB: 3V3 entrega 3,3 V y 5V entrega 5 V. Los pines SD0–SD3, CMD y CLK son de la memoria flash: no los uses.' },
  esp32c: { mark:'ESP32', chip:'ESP32-WROOM-32', nombre:'ESP32 DevKitC V4 (38 pines)', pins:38, rows:['b','i'], self:true, vlogic:3.3, vabsPin:3.6, adc:4095, rout:30, pullup:45000, imax:0.04, lang:'arduino', model:'esp32c',
    names:["3V3","EN","VP","VN","D34","D35","D32","D33","D25","D26","D27","D14","D12","GND","D13","SD2","SD3","CMD","5V","CLK","SD0","SD1","D15","D2","D0","D4","D16","D17","D5","D18","D19","GND","D21","RX0","TX0","D22","D23","GND"], alias:{ VP:36, VN:39, RX0:3, TX0:1 }, sda:21, scl:22, led:2,
    desc:'Placa oficial de Espressif. No trae LED de usuario: conecta uno con resistor al GPIO 2. Lógica de 3,3 V. Los pines SD0–SD3, CMD y CLK son de la memoria flash.' },
  atmega328p: { mark:'ATmega328P', chip:'ATMEGA328P-PU', nombre:'ATmega328P (DIP-28, Arduino en protoboard)', pins:28, rows:['e', 'f'], ard:true, vmin:2.7, vmax:5.5, vabs:6, adc:1023, rout:25, pullup:35000, imax:0.04, lang:'arduino', sda:18, scl:19, led:13,
    names:['RESET','D0/RXD','D1/TXD','D2','D3','D4','VCC','GND','XTAL1','XTAL2','D5','D6','D7','D8','D9','D10','D11/MOSI','D12/MISO','D13/SCK','AVCC','AREF','GND','A0','A1','A2','A3','A4/SDA','A5/SCL'],
    desc:'El chip del Arduino Uno suelto en la protoboard: alimenta VCC (7) y AVCC (20) con 5 V y GND (8, 22). Se programa igual que el Uno (C de Arduino, ensamblador AVR o .HEX) y usa la misma numeración D0–D13 y A0–A5.' },
  pic18f4550: { mark:'PIC18F4550', chip:'PIC18F4550-I/P', nombre:'PIC18F4550 (40 pines, USB)', pins:40, rows:['d','g'], vmin:4.2, vmax:5.5, vabs:6.5, adc:1023, rout:25, pullup:30000, imax:0.025, lang:'pic',
    names:PIC40.map((n, i) => i === 17 ? 'VUSB' : i === 13 ? 'OSC2/RA6' : n),
    desc:'PIC de 8 bits con USB. Necesita VDD (11 y 32) a 5 V, VSS (12 y 31) a tierra y MCLR (1) en alto con una resistencia de 10 kΩ. Se asume el cristal funcionando.' },
  pic16f877a: { mark:'PIC16F877A', chip:'PIC16F877A-I/P', nombre:'PIC16F877A (40 pines)', pins:40, rows:['d','g'], vmin:4, vmax:5.5, vabs:6.5, adc:1023, rout:25, pullup:30000, imax:0.025, lang:'pic',
    names:PIC40, desc:'El PIC clásico de 40 pines. VDD (11 y 32) a 5 V, VSS (12 y 31) a tierra y MCLR (1) en alto con 10 kΩ. Se asume el cristal funcionando.' },
  pic16f84a: { mark:'PIC16F84A', chip:'PIC16F84A-04/P', nombre:'PIC16F84A (18 pines)', pins:18, rows:['e','f'], vmin:4, vmax:5.5, vabs:6.5, adc:0, rout:25, pullup:30000, imax:0.025, lang:'pic',
    names:['RA2','RA3','RA4','MCLR','VSS','RB0','RB1','RB2','RB3','RB4','RB5','RB6','RB7','VDD','OSC2','OSC1','RA0','RA1'],
    desc:'PIC pequeño de 18 pines, sin conversor analógico. VDD (14) a 5 V, VSS (5) a tierra y MCLR (4) en alto con 10 kΩ.' }
};
Object.keys(MCU).forEach(k => {
  const d = MCU[k];
  d.port = {}; d.an = {}; d.gpio = {}; d.vdd = []; d.vss = []; d.gnds = [];
  d.names.forEach((nm, i) => {
    const ph = i + 1;
    nm.split('/').forEach(part => {
      let m;
      if ((m = /^R([A-E])(\d)$/.exec(part))) { (d.port[m[1]] = d.port[m[1]] || {})[+m[2]] = ph; }
      else if ((m = /^AN(\d+)$/.exec(part))) d.an[+m[1]] = ph;
      else if (/^D\d+$/.test(part)) d.gpio[+part.slice(1)] = ph;
      else if (d.alias && d.alias[part] !== undefined) d.gpio[d.alias[part]] = ph;
    });
    if (nm === 'VDD' || (d.ard && (nm === 'VCC' || nm === 'AVCC'))) d.vdd.push(ph);
    if (nm === 'VSS' || (d.ard && nm === 'GND')) d.vss.push(ph);
    if (d.ard) nm.split('/').forEach(part => { const m = /^A([0-5])$/.exec(part); if (m) d.gpio[14 + +m[1]] = ph; });
    if (nm === 'GND') d.gnds.push(ph);
    if (nm === 'MCLR') d.mclr = ph;
    if (nm === 'EN') d.en = ph;
    if (nm === '3V3') d.p3v3 = ph;
    if (nm === 'VIN' || nm === '5V') d.pvin = ph;
  });
  d.io = [];
  for (let ph = 1; ph <= d.pins; ph++) if (/^(R[A-E]\d|D\d+|VP|VN|RX\d|TX\d)/.test(d.names[ph - 1]) || (d.ard && /^A\d/.test(d.names[ph - 1]))) d.io.push(ph);
});
const UNO_IO = [];
for (let k = 0; k < 14; k++) UNO_IO.push('D' + k);
for (let k = 0; k < 6; k++) UNO_IO.push('A' + k);
const LCD_SIZES = { '16x1':[16, 1], '16x2':[16, 2], '20x2':[20, 2], '20x4':[20, 4] };
const SEG_NAMES1 = ['e','d','COM','c','dp','b','a','COM','f','g'], SEG_NAMES4 = ['e','d','dp','c','g','D4','b','D3','D2','f','a','D1'];
const SEG7 = {
  '1cc': { mark:'5161AS', nombre:'1 dígito · cátodo común', pins:10, rows:['d','g'], digits:1, cc:true, names:SEG_NAMES1, seg:{ a:7, b:6, c:4, d:2, e:1, f:9, g:10, dp:5 }, com:[[3, 8]] },
  '1ca': { mark:'5161BS', nombre:'1 dígito · ánodo común', pins:10, rows:['d','g'], digits:1, cc:false, names:SEG_NAMES1, seg:{ a:7, b:6, c:4, d:2, e:1, f:9, g:10, dp:5 }, com:[[3, 8]] },
  '4cc': { mark:'5461AS', nombre:'4 dígitos · cátodo común', pins:12, rows:['d','g'], digits:4, cc:true, names:SEG_NAMES4, seg:{ a:11, b:7, c:4, d:2, e:1, f:10, g:5, dp:3 }, com:[[12], [9], [8], [6]] },
  '4ca': { mark:'5461BS', nombre:'4 dígitos · ánodo común', pins:12, rows:['d','g'], digits:4, cc:false, names:SEG_NAMES4, seg:{ a:11, b:7, c:4, d:2, e:1, f:10, g:5, dp:3 }, com:[[12], [9], [8], [6]] }
};
const DIPSW = {};
[1, 2, 3, 4, 5, 6, 8, 10].forEach(n => { const names = []; for (let k = 1; k <= 2 * n; k++) names.push(k <= n ? String(k) : String(2 * n + 1 - k) + "'"); DIPSW[n] = { mark:'DIP-' + n, pins:2 * n, rows:['e','f'], names }; });
const BARGRAPH = { mark:'BAR-10', chip:'LED-BARGRAPH', sub:'10 LEDs', pins:20, rows:['e', 'f'], names:['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','K10','K9','K8','K7','K6','K5','K4','K3','K2','K1'] };
const STUB_DEFS = {};
function stubDipDef(c) {
  const n = [4, 6, 8, 14, 16, 18, 20, 24, 28, 40].includes(+c.p.n) ? +c.p.n : 8, code = String(c.p.code || 'CHIP').slice(0, 16), names = Array.isArray(c.p.names) ? c.p.names : [];
  const key = n + '|' + code + '|' + names.join(',');
  return STUB_DEFS[key] || (STUB_DEFS[key] = { mark:code, chip:code, sub:'Auto-generado · DIP-' + n, pins:n, rows:['e', 'f'], names:Array.from({ length:n }, (_, i) => String(names[i] || i + 1).slice(0, 10)) });
}
function dipDef(c) { return c.type === 'customDip' ? stubDipDef(c) : c.type === 'bargraph' ? BARGRAPH : c.type === 'ic' ? IC[c.p.part] : c.type === 'mcu' ? MCU[c.p.chip] : c.type === 'seg7' ? SEG7[c.p.model] : c.type === 'dipsw' ? DIPSW[c.p.n] : null; }

/* ---------- catálogo de piezas ---------- */
const PARTS = {
  resistor:  { kind:'board', prefix:'R',   nombre:'Resistor', pins:['A','B'], span:4, h:4, fz:3.6, pinNames:{ A:'terminal 1', B:'terminal 2' } },
  diode:     { kind:'board', prefix:'D',   nombre:'Diodo rectificador 1N4007', pins:['A','K'], span:4, h:4, fz:3.6, pinNames:{ A:'ánodo', K:'cátodo' } },
  led:       { kind:'board', prefix:'LED', nombre:'LED de 5 mm', pins:['A','K'], span:1, h:9, fz:6.4, pinNames:{ A:'ánodo (+)', K:'cátodo (−)' } },
  capacitor: { kind:'board', prefix:'C',   nombre:'Capacitor electrolítico', pins:['+','-'], span:2, h:14, fz:8.6, pinNames:{ '+':'positivo', '-':'negativo (franja)' } },
  ceramic:   { kind:'board', prefix:'C',   nombre:'Capacitor cerámico', pins:['1','2'], span:1, h:8, fz:4, pinNames:{ 1:'terminal 1', 2:'terminal 2' } },
  pot:       { kind:'board', prefix:'RV',  nombre:'Potenciómetro', pins:['1','W','3'], span:2, h:9, fz:10, pinNames:{ 1:'extremo 1', W:'cursor', 3:'extremo 3' } },
  button:    { kind:'board', prefix:'SW',  nombre:'Pulsador', pins:['1','2'], span:2, h:6, fz:7, pinNames:{ 1:'terminal 1', 2:'terminal 2' } },
  reg:       { kind:'board', prefix:'U',   nombre:'Regulador LM7805 (TO-220)', pins:['IN','GND','OUT'], span:2, h:19, fz:6, pinNames:{ IN:'entrada', GND:'tierra', OUT:'salida 5 V' } },
  ic:        { kind:'board', prefix:'U',   nombre:'Circuito integrado', dip:true, h:5, fz:9.4 },
  mcu:       { kind:'board', prefix:'U',   nombre:'Microcontrolador', dip:true, h:7, fz:16 },
  seg7:      { kind:'board', prefix:'DS',  nombre:'Display de 7 segmentos', dip:true, h:8, fz:16 },
  dipsw:     { kind:'board', prefix:'SW',  nombre:'Interruptor DIP', dip:true, h:6, fz:9 },
  stepkit:   { kind:'bench', prefix:'M',   nombre:'Kit 28BYJ-48 + módulo ULN2003', w:88, h:32, d:54, pins:['IN1', 'IN2', 'IN3', 'IN4', '-', '+'],
               pinNames:{ IN1:'entrada 1 (bobina A)', IN2:'entrada 2 (bobina B)', IN3:'entrada 3 (bobina C)', IN4:'entrada 4 (bobina D)', '-':'tierra', '+':'5–12 V' } },
  lcd:       { kind:'board', prefix:'LCD', nombre:'Pantalla LCD (bus paralelo)', pins:['VSS','VDD','V0','RS','RW','E','D0','D1','D2','D3','D4','D5','D6','D7','A','K'], span:15, h:44, fz:5,
               pinNames:{ VSS:'tierra', VDD:'+5 V', V0:'contraste', RS:'registro (comando/dato)', RW:'lectura/escritura', E:'habilitación', A:'luz de fondo +', K:'luz de fondo −' } },
  lcdi2c16:  { kind:'bench', prefix:'LCD', nombre:'LCD 16x2 con módulo I2C', w:82, h:23, d:38, pins:['GND', 'VCC', 'SDA', 'SCL'], pinNames:{ GND:'tierra', VCC:'+5 V', SDA:'datos I2C', SCL:'reloj I2C' } },
  lcdi2c20:  { kind:'bench', prefix:'LCD', nombre:'LCD 20x4 con módulo I2C', w:100, h:24, d:62, pins:['GND', 'VCC', 'SDA', 'SCL'], pinNames:{ GND:'tierra', VCC:'+5 V', SDA:'datos I2C', SCL:'reloj I2C' } },
  bjt2222:   { kind:'board', prefix:'Q', nombre:'Transistor NPN 2N2222A (TO-92)', pins:['E', 'B', 'C'], span:2, h:7, fz:5, pinNames:{ E:'emisor', B:'base', C:'colector' } },
  tip120:    { kind:'board', prefix:'Q', nombre:'Darlington NPN TIP120 (TO-220)', pins:['B', 'C', 'E'], span:2, h:19, fz:6, pinNames:{ B:'base', C:'colector', E:'emisor' } },
  bjt3904:   { kind:'board', prefix:'Q', nombre:'Transistor NPN 2N3904 / 2N3903 (TO-92)', pins:['E', 'B', 'C'], span:2, h:7, fz:5, pinNames:{ E:'emisor', B:'base', C:'colector' } },
  pnp3906:   { kind:'board', prefix:'Q', nombre:'Transistor PNP 2N3906 / 2N3905 (TO-92)', pins:['E', 'B', 'C'], span:2, h:7, fz:5, pinNames:{ E:'emisor', B:'base', C:'colector' } },
  tip42:     { kind:'board', prefix:'Q', nombre:'Transistor PNP de potencia TIP42C (TO-220)', pins:['B', 'C', 'E'], span:2, h:19, fz:6, pinNames:{ B:'base', C:'colector', E:'emisor' } },
  rpower:    { kind:'board', prefix:'R', nombre:'Resistencia de potencia (tubular, 10 W)', pins:['A','B'], span:6, h:9, fz:6, pinNames:{ A:'terminal 1', B:'terminal 2' } },
  zener:     { kind:'board', prefix:'DZ', nombre:'Diodo zener (0,5 W)', pins:['A','K'], span:4, h:4, fz:3.6, pinNames:{ A:'ánodo', K:'cátodo (franja)' } },
  lm336:     { kind:'board', prefix:'U', nombre:'Referencia de voltaje LM336-2,5', pins:['ADJ', '+', '-'], span:2, h:7, fz:5, pinNames:{ ADJ:'ajuste (puede quedar libre)', '+':'cátodo (+)', '-':'ánodo (−)' } },
  inductor:  { kind:'board', prefix:'L', nombre:'Inductor (choque radial)', pins:['1','2'], span:2, h:12, fz:6.5, pinNames:{ 1:'terminal 1', 2:'terminal 2' } },
  lcdi2c:    { kind:'board', prefix:'LCD', nombre:'Pantalla LCD con módulo I2C', pins:['GND','VCC','SDA','SCL'], span:3, h:44, fz:5, pinNames:{ GND:'tierra', VCC:'+5 V', SDA:'datos I2C', SCL:'reloj I2C' } },
  motor:     { kind:'bench', prefix:'M', nombre:'Motor DC tipo 130 (3–6 V)', w:42, h:16, d:24, pins:['+','-'], pinNames:{ '+':'terminal +', '-':'terminal −' } },
  gearmotor: { kind:'bench', prefix:'M', nombre:'Motorreductor TT 1:48 (3–6 V)', w:72, h:25, d:40, pins:['+','-'], pinNames:{ '+':'terminal +', '-':'terminal −' } },
  stepper:   { kind:'bench', prefix:'M', nombre:'Paso a paso 28BYJ-48 (unipolar 5 V)', w:76, h:31, d:60, pins:['A','B','C','D','COM'],
               pinNames:{ A:'bobina A (azul)', B:'bobina B (rosa)', C:'bobina C (amarillo)', D:'bobina D (naranja)', COM:'común (rojo)' } },
  nema17:    { kind:'bench', prefix:'M', nombre:'Paso a paso NEMA 17 (bipolar 12 V)', w:46, h:64, d:46, pins:['A+','A-','B+','B-'],
               pinNames:{ 'A+':'bobina A+ (negro)', 'A-':'bobina A− (verde)', 'B+':'bobina B+ (rojo)', 'B-':'bobina B− (azul)' } },
  servo:     { kind:'bench', prefix:'SV', nombre:'Servomotor SG90', w:62, h:36, d:42, pins:['GND','VCC','SIG'], pinNames:{ GND:'tierra (cable negro)', VCC:'+5 V (cable rojo)', SIG:'señal PWM (cable amarillo)' } },
  uln_mod:   { kind:'bench', prefix:'DRV', nombre:'Módulo ULN2003 para paso a paso', w:36, h:16, d:34, pins:['IN1', 'IN2', 'IN3', 'IN4', '-', '+', 'A', 'B', 'C', 'D', 'COM'],
               pinNames:{ IN1:'entrada 1', IN2:'entrada 2', IN3:'entrada 3', IN4:'entrada 4', '-':'tierra del módulo', '+':'5–12 V del motor', A:'motor A (azul)', B:'motor B (rosa)', C:'motor C (amarillo)', D:'motor D (naranja)', COM:'motor común (rojo)' } },
  l298n:     { kind:'bench', prefix:'DRV', nombre:'Módulo puente H L298N', w:44, h:28, d:44, pins:['IN1', 'IN2', 'IN3', 'IN4', 'ENA', 'ENB', 'OUT1', 'OUT2', 'OUT3', 'OUT4', '12V', 'GND', '5V'],
               pinNames:{ ENA:'habilita motor A (PWM)', ENB:'habilita motor B (PWM)', OUT1:'motor A', OUT2:'motor A', OUT3:'motor B', OUT4:'motor B', '12V':'alimentación del motor (5–35 V)', GND:'tierra', '5V':'5 V (salida si el puente del regulador está puesto)' } },
  arduino:   { kind:'bench', prefix:'ARD', nombre:'Arduino Uno R3', w:70, h:16, d:54, earth:true, pins:UNO_IO.concat(['5V', '3V3', 'GND', 'GND2', 'GND3']),
               pinNames:{ '5V':'salida 5 V', '3V3':'salida 3,3 V', GND:'tierra', GND2:'tierra', GND3:'tierra' } },
  tcrt:      { kind:'bench', prefix:'IR', nombre:'Sensor de línea TCRT5000 doble', w:44, h:9, d:22, pins:['VCC', 'GND', 'DO_L', 'DO_R', 'AO_L', 'AO_R'],
               pinNames:{ VCC:'+5 V', GND:'tierra', DO_L:'salida digital izquierda (alto = ve la línea negra)', DO_R:'salida digital derecha (alto = ve la línea negra)', AO_L:'salida analógica izquierda', AO_R:'salida analógica derecha' } },
  hcsr04:    { kind:'bench', prefix:'US', nombre:'Sensor ultrasónico HC-SR04', w:46, h:24, d:22, pins:['VCC', 'TRIG', 'ECHO', 'GND'],
               pinNames:{ VCC:'+5 V', TRIG:'disparo (pulso de 10 µs)', ECHO:'eco (pulso de 58 µs por cm)', GND:'tierra' } },
  mpu6050:   { kind:'bench', prefix:'IMU', nombre:'IMU MPU6050 (giroscopio + acelerómetro)', w:22, h:6, d:18, pins:['VCC', 'GND', 'SCL', 'SDA'],
               pinNames:{ VCC:'+5 V (regulador en el módulo)', GND:'tierra', SCL:'reloj I2C', SDA:'datos I2C (dirección 0x68)' } },
  chasis2wd: { kind:'bench', prefix:'CH', nombre:'Chasis 2WD modular (motores integrados)', w:215, h:60, d:180, pins:['M_IZQ+', 'M_IZQ-', 'M_DER+', 'M_DER-'],
               pinNames:{ 'M_IZQ+':'motor izquierdo +', 'M_IZQ-':'motor izquierdo −', 'M_DER+':'motor derecho +', 'M_DER-':'motor derecho −' } },
  chasisbal: { kind:'bench', prefix:'CHB', nombre:'Chasis de auto-balanceo (motores integrados)', w:150, h:190, d:180, pins:['M_IZQ+', 'M_IZQ-', 'M_DER+', 'M_DER-'],
               pinNames:{ 'M_IZQ+':'motor izquierdo +', 'M_IZQ-':'motor izquierdo −', 'M_DER+':'motor derecho +', 'M_DER-':'motor derecho −' } },
  brazo3d:   { kind:'bench', prefix:'ARM', nombre:'Brazo robótico 4-DOF articulado (J1 base · J2 hombro · J3 codo · J4 pinza)', w:90, h:80, d:90, pins:['GND', 'VCC', 'S1', 'S2', 'S3', 'S4'],
               pinNames:{ GND:'tierra de los 4 servos', VCC:'+5 V de los 4 servos (fuente aparte)', S1:'señal PWM · J1 base', S2:'señal PWM · J2 hombro', S3:'señal PWM · J3 codo', S4:'señal PWM · J4 pinza' } },
  portapilas:{ kind:'bench', prefix:'BAT', nombre:'Portapilas AA con interruptor', w:62, h:20, d:58, pins:['+', '-'], pinNames:{ '+':'positivo de las pilas (cable rojo)', '-':'negativo (cable negro)' } },
  buzzer:    { kind:'board', prefix:'BZ',  nombre:'Zumbador (buzzer activo 5 V)', pins:['+','-'], span:3, h:10, fz:6.5, pinNames:{ '+':'positivo (pata larga)', '-':'negativo' } },
  ldr:       { kind:'board', prefix:'LDR', nombre:'Fotorresistencia LDR (GL5528)', pins:['1','2'], span:1, h:6, fz:3.2, pinNames:{ 1:'terminal 1', 2:'terminal 2' } },
  batteryPack:{ kind:'bench', prefix:'BAT', nombre:'Batería / portapilas con interruptor (3–12 V)', w:70, h:26, d:40, pins:['+', '-'], pinNames:{ '+':'positivo (cable rojo)', '-':'negativo (cable negro)' } },
  joystick:  { kind:'bench', prefix:'JOY', nombre:'Joystick analógico de 2 ejes (KY-023)', w:34, h:32, d:26, pins:['GND', '+5V', 'VRx', 'VRy', 'SW'],
               pinNames:{ GND:'tierra', '+5V':'alimentación de los potenciómetros', VRx:'salida analógica del eje X', VRy:'salida analógica del eje Y', SW:'pulsador (a GND al presionar)' } },
  relay:     { kind:'bench', prefix:'K', nombre:'Módulo relé 5 V (SRD-05VDC)', w:50, h:19, d:26, pins:['VCC', 'GND', 'IN', 'COM', 'NO', 'NC'],
               pinNames:{ VCC:'+5 V de la bobina', GND:'tierra', IN:'entrada de control', COM:'común del contacto', NO:'normalmente abierto', NC:'normalmente cerrado' } },
  bc547:     { kind:'board', prefix:'Q', nombre:'Transistor NPN BC547 (TO-92)', pins:['C', 'B', 'E'], span:2, h:7, fz:5, pinNames:{ C:'colector', B:'base', E:'emisor' } },
  bc548:     { kind:'board', prefix:'Q', nombre:'Transistor NPN BC548 (TO-92)', pins:['C', 'B', 'E'], span:2, h:7, fz:5, pinNames:{ C:'colector', B:'base', E:'emisor' } },
  bc557:     { kind:'board', prefix:'Q', nombre:'Transistor PNP BC557 (TO-92)', pins:['C', 'B', 'E'], span:2, h:7, fz:5, pinNames:{ C:'colector', B:'base', E:'emisor' } },
  tip31:     { kind:'board', prefix:'Q', nombre:'Transistor NPN de potencia TIP31C (TO-220)', pins:['B', 'C', 'E'], span:2, h:19, fz:6, pinNames:{ B:'base', C:'colector', E:'emisor' } },
  tip32:     { kind:'board', prefix:'Q', nombre:'Transistor PNP de potencia TIP32C (TO-220)', pins:['B', 'C', 'E'], span:2, h:19, fz:6, pinNames:{ B:'base', C:'colector', E:'emisor' } },
  irfz44n:   { kind:'board', prefix:'Q', nombre:'MOSFET canal N IRFZ44N (TO-220)', pins:['G', 'D', 'S'], span:2, h:19, fz:6, pinNames:{ G:'compuerta', D:'drenador', S:'fuente' } },
  irf540n:   { kind:'board', prefix:'Q', nombre:'MOSFET canal N IRF540N (TO-220)', pins:['G', 'D', 'S'], span:2, h:19, fz:6, pinNames:{ G:'compuerta', D:'drenador', S:'fuente' } },
  mos2n7000: { kind:'board', prefix:'Q', nombre:'MOSFET canal N 2N7000 (TO-92)', pins:['S', 'G', 'D'], span:2, h:7, fz:5, pinNames:{ S:'fuente', G:'compuerta', D:'drenador' } },
  regneg:    { kind:'board', prefix:'U', nombre:'Regulador negativo 79xx (TO-220)', pins:['GND', 'IN', 'OUT'], span:2, h:19, fz:6, pinNames:{ GND:'tierra', IN:'entrada negativa', OUT:'salida negativa' } },
  lm317:     { kind:'board', prefix:'U', nombre:'Regulador ajustable LM317 (TO-220)', pins:['ADJ', 'OUT', 'IN'], span:2, h:19, fz:6, pinNames:{ ADJ:'ajuste', OUT:'salida', IN:'entrada' } },
  lm35:      { kind:'board', prefix:'U', nombre:'Sensor de temperatura LM35 (TO-92)', pins:['VCC', 'VOUT', 'GND'], span:2, h:7, fz:5, pinNames:{ VCC:'+4 a 30 V', VOUT:'salida 10 mV/°C', GND:'tierra' } },
  ntc:       { kind:'board', prefix:'RT', nombre:'Termistor NTC 10 kΩ', pins:['1', '2'], span:2, h:6, fz:3, pinNames:{ 1:'terminal 1', 2:'terminal 2' } },
  crystal:   { kind:'board', prefix:'X', nombre:'Cristal de cuarzo (HC-49)', pins:['1', '2'], span:2, h:11, fz:3, pinNames:{ 1:'terminal 1', 2:'terminal 2' } },
  rgbled:    { kind:'board', prefix:'LED', nombre:'LED RGB de cátodo común', pins:['R', 'K', 'G', 'B'], span:3, h:9, fz:6.4, pinNames:{ R:'ánodo rojo', K:'cátodo común (pata más larga)', G:'ánodo verde', B:'ánodo azul' } },
  bridge:    { kind:'board', prefix:'BR', nombre:'Puente rectificador (DB107)', pins:['+', '~1', '~2', '-'], span:3, h:6, fz:5, pinNames:{ '+':'salida +', '~1':'entrada de alterna', '~2':'entrada de alterna', '-':'salida −' } },
  spdt:      { kind:'board', prefix:'SW', nombre:'Interruptor deslizante SPDT', pins:['1', 'C', '2'], span:2, h:6, fz:5, pinNames:{ 1:'posición 1', C:'común', 2:'posición 2' } },
  bargraph:  { kind:'board', prefix:'LED', nombre:'Barra de 10 LEDs (DIP-20)', dip:true, h:8, fz:10 },
  customDip: { kind:'board', prefix:'U', nombre:'Chip auto-generado (Proteus)', dip:true, h:5, fz:9.4 },
  stub2:     { kind:'board', prefix:'X', nombre:'Pieza de 2 terminales (Proteus)', pins:['1', '2'], span:3, h:6, fz:4, pinNames:{ 1:'pin 1', 2:'pin 2' } },
  stub3:     { kind:'board', prefix:'X', nombre:'Pieza de 3 terminales (Proteus)', pins:['1', '2', '3'], span:2, h:7, fz:5, pinNames:{ 1:'pin 1', 2:'pin 2', 3:'pin 3' } },
  dmm:       { kind:'bench', prefix:'DMM', nombre:'Multímetro digital UNI-T UT53', w:78, h:66, d:150, pins:['A', 'MA', 'COM', 'VOHM'],
               pinNames:{ A:'borne 10 A (corriente alta, shunt 0,01 Ω)', MA:'borne mA (hasta 200 mA, shunt 1 Ω)', COM:'común (punta negra)', VOHM:'V Ω → (punta roja: voltaje, resistencia, diodo, continuidad y capacidad)' } },
  lprobe:    { kind:'bench', prefix:'LP', nombre:'Punta lógica digital TESTECH EM4610', w:210, h:24, d:72, pins:['TIP', 'VCC', 'GND'],
               pinNames:{ TIP:'punta de aguja: nodo que se analiza', VCC:'caimán rojo: alimentación 4,5 a 18 V del circuito', GND:'caimán negro: tierra del circuito' } },
  keypad:    { kind:'bench', prefix:'KP', nombre:'Teclado matricial 4×4', w:69, h:6, d:77, pins:['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3', 'C4'],
               pinNames:{ R1:'fila 1 (1 2 3 A)', R2:'fila 2 (4 5 6 B)', R3:'fila 3 (7 8 9 C)', R4:'fila 4 (* 0 # D)', C1:'columna 1', C2:'columna 2', C3:'columna 3', C4:'columna 4' } },
  oled:      { kind:'bench', prefix:'OLED', nombre:'Pantalla OLED 0,96" 128×64 I2C (SSD1306)', w:27, h:8, d:28, pins:['GND', 'VCC', 'SCL', 'SDA'], pinNames:{ GND:'tierra', VCC:'3,3 a 5 V', SCL:'reloj I2C', SDA:'datos I2C (dirección 0x3C)' } },
  supply:    { kind:'bench', prefix:'PS',  nombre:'Fuente de alimentación DC', w:84, h:44, d:58, pins:['+','-','gnd'], pinNames:{ '+':'salida +', '-':'salida −', gnd:'tierra' } },
  fgen:      { kind:'bench', prefix:'FG',  nombre:'Generador de señales', w:92, h:38, d:58, pins:['out','gnd'], pinNames:{ out:'salida', gnd:'tierra' } },
  trafo:     { kind:'bench', prefix:'TR', nombre:'Transformador 120 V → 12-0-12 V con toma central', w:84, h:64, d:72, pins:['A', 'CT', 'B'], pinNames:{ A:'secundario, extremo A', CT:'toma central (0 V)', B:'secundario, extremo B' } },
  scope4:    { kind:'bench', prefix:'OSC', nombre:'Osciloscopio Rigol DS1054Z (4 canales)', w:314, h:167, d:124, pins:['ch1','ch2','ch3','ch4','gnd'], pinNames:{ ch1:'canal 1 (BNC)', ch2:'canal 2 (BNC)', ch3:'canal 3 (BNC)', ch4:'canal 4 (BNC)', gnd:'tierra de las puntas' } },
  scope:     { kind:'bench', prefix:'OSC', nombre:'Osciloscopio de 2 canales', w:124, h:70, d:72, pins:['ch1','ch2','gnd'], pinNames:{ ch1:'canal 1', ch2:'canal 2', gnd:'tierra' } }
};
const TERMS = {
  tcrt:      { VCC:{ x:-6.35, y:11, z:-8, up:true, r:1.2 }, GND:{ x:-3.81, y:11, z:-8, up:true, r:1.2 }, DO_L:{ x:-1.27, y:11, z:-8, up:true, r:1.2 }, DO_R:{ x:1.27, y:11, z:-8, up:true, r:1.2 }, AO_L:{ x:3.81, y:11, z:-8, up:true, r:1.2 }, AO_R:{ x:6.35, y:11, z:-8, up:true, r:1.2 } },
  hcsr04:    { VCC:{ x:-3.81, y:6, z:-8.5, up:true, r:1.2 }, TRIG:{ x:-1.27, y:6, z:-8.5, up:true, r:1.2 }, ECHO:{ x:1.27, y:6, z:-8.5, up:true, r:1.2 }, GND:{ x:3.81, y:6, z:-8.5, up:true, r:1.2 } },
  mpu6050:   { VCC:{ x:-7.62, y:7, z:-6.5, up:true, r:1.1 }, GND:{ x:-5.08, y:7, z:-6.5, up:true, r:1.1 }, SCL:{ x:-2.54, y:7, z:-6.5, up:true, r:1.1 }, SDA:{ x:0, y:7, z:-6.5, up:true, r:1.1 } },
  chasis2wd: { 'M_IZQ+':{ x:47, y:56, z:-52, up:true, r:1.7, out:[0, 0, 1], exit:7 }, 'M_IZQ-':{ x:52, y:56, z:-52, up:true, r:1.7, out:[0, 0, 1], exit:7 },
               'M_DER+':{ x:47, y:56, z:52, up:true, r:1.7, out:[0, 0, -1], exit:7 }, 'M_DER-':{ x:52, y:56, z:52, up:true, r:1.7, out:[0, 0, -1], exit:7 } },
  chasisbal: { 'M_IZQ+':{ x:21.5, y:56, z:-40, up:true, r:1.7, out:[0, 0, 1], exit:7 }, 'M_IZQ-':{ x:26.5, y:56, z:-40, up:true, r:1.7, out:[0, 0, 1], exit:7 },
               'M_DER+':{ x:21.5, y:56, z:40, up:true, r:1.7, out:[0, 0, -1], exit:7 }, 'M_DER-':{ x:26.5, y:56, z:40, up:true, r:1.7, out:[0, 0, -1], exit:7 } },
  dmm:       (() => {
                const a = -65 * Math.PI / 180, co = Math.cos(a), si = Math.sin(a), zoff = 58.5, J = (x, yl, zl) => ({ x, y:+(yl * co - zl * si).toFixed(2), z:+(yl * si + zl * co + zoff).toFixed(2), up:true, r:3.2, out:[0, -si, co], exit:10 });
                return { A:J(-24, 12, 35.5), MA:J(-8, 12, 35.5), COM:J(8, 12, 35.5), VOHM:J(24, 12, 35.5) };
              })(),
  lprobe:    { TIP:{ x:104.4, y:10.5, z:0, up:true, r:2.4, out:[1, 0.3, 0], exit:8 }, VCC:{ x:-96, y:4.5, z:-22, up:true, r:3, out:[-1, 0.4, 0], exit:8 }, GND:{ x:-96, y:4.5, z:22, up:true, r:3, out:[-1, 0.4, 0], exit:8 } },
  keypad:    { R1:{ x:-8.89, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 }, R2:{ x:-6.35, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 }, R3:{ x:-3.81, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 }, R4:{ x:-1.27, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 },
               C1:{ x:1.27, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 }, C2:{ x:3.81, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 }, C3:{ x:6.35, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 }, C4:{ x:8.89, y:1.2, z:41, up:true, r:1.1, out:[0, 0, 1], exit:8 } },
  oled:      { GND:{ x:-3.81, y:3.2, z:-15, up:true, r:1.1, out:[0, 0, -1], exit:6 }, VCC:{ x:-1.27, y:3.2, z:-15, up:true, r:1.1, out:[0, 0, -1], exit:6 }, SCL:{ x:1.27, y:3.2, z:-15, up:true, r:1.1, out:[0, 0, -1], exit:6 }, SDA:{ x:3.81, y:3.2, z:-15, up:true, r:1.1, out:[0, 0, -1], exit:6 } },
  brazo3d:   { GND:{ x:-12.5, y:13, z:40, up:true, r:1.4 }, VCC:{ x:-7.5, y:13, z:40, up:true, r:1.4 }, S1:{ x:-2.5, y:13, z:40, up:true, r:1.4 }, S2:{ x:2.5, y:13, z:40, up:true, r:1.4 }, S3:{ x:7.5, y:13, z:40, up:true, r:1.4 }, S4:{ x:12.5, y:13, z:40, up:true, r:1.4 } },
  batteryPack: { '+':{ x:27, y:20, z:-7, up:true, r:1.5 }, '-':{ x:27, y:20, z:7, up:true, r:1.5 } },
  joystick:  { GND:{ x:-19.8, y:3, z:-5.08, up:true, r:1.1, out:[-1, 0, 0], exit:6 }, '+5V':{ x:-19.8, y:3, z:-2.54, up:true, r:1.1, out:[-1, 0, 0], exit:6 }, VRx:{ x:-19.8, y:3, z:0, up:true, r:1.1, out:[-1, 0, 0], exit:6 },
               VRy:{ x:-19.8, y:3, z:2.54, up:true, r:1.1, out:[-1, 0, 0], exit:6 }, SW:{ x:-19.8, y:3, z:5.08, up:true, r:1.1, out:[-1, 0, 0], exit:6 } },
  relay:     { VCC:{ x:-26, y:3.5, z:-2.54, up:true, r:1.1, out:[-1, 0, 0], exit:6 }, GND:{ x:-26, y:3.5, z:0, up:true, r:1.1, out:[-1, 0, 0], exit:6 }, IN:{ x:-26, y:3.5, z:2.54, up:true, r:1.1, out:[-1, 0, 0], exit:6 },
               NO:{ x:25.5, y:6.5, z:-5, up:true, r:1.5, out:[1, 0, 0], exit:7 }, COM:{ x:25.5, y:6.5, z:0, up:true, r:1.5, out:[1, 0, 0], exit:7 }, NC:{ x:25.5, y:6.5, z:5, up:true, r:1.5, out:[1, 0, 0], exit:7 } },
  portapilas: { '+':{ x:24, y:13, z:-16, up:true, r:1.4 }, '-':{ x:24, y:13, z:-22, up:true, r:1.4 } },
  supply: { gnd:{ x:8, y:10 }, '-':{ x:20, y:10 }, '+':{ x:32, y:10 } },
  fgen:   { out:{ x:26, y:9 }, gnd:{ x:38, y:9 } },
  scope:  { ch1:{ x:24, y:12 }, ch2:{ x:38, y:12 }, gnd:{ x:52, y:12 } },
  trafo:  { A:{ x:-14, y:13 }, CT:{ x:0, y:13 }, B:{ x:14, y:13 } },
  scope4: { ch1:{ x:16.3, y:26.9, z:76.6, up:true, r:5.5, out:[0, 0, 1], exit:14 }, ch2:{ x:52, y:26.9, z:76.6, up:true, r:5.5, out:[0, 0, 1], exit:14 }, ch3:{ x:87, y:26.9, z:76.6, up:true, r:5.5, out:[0, 0, 1], exit:14 }, ch4:{ x:120.5, y:26.9, z:76.6, up:true, r:5.5, out:[0, 0, 1], exit:14 }, gnd:{ x:147.6, y:25.6, z:69.2, up:true, r:3.6, out:[0.35, -0.2, 1], exit:10 } },
  motor:     { '+':{ x:19.2, y:7.6, z:6, up:true, r:1.2 }, '-':{ x:19.2, y:7.6, z:-6, up:true, r:1.2 } },
  gearmotor: { '+':{ x:34.6, y:20.2, z:4.6, up:true, r:1.3 }, '-':{ x:34.6, y:20.2, z:-4.6, up:true, r:1.3 } },
  stepper:   { A:{ x:36.9, y:1.3, z:25.8, up:true, r:1.1 }, B:{ x:36.9, y:3.8, z:25.8, up:true, r:1.1 }, C:{ x:36.9, y:6.3, z:25.8, up:true, r:1.1 }, D:{ x:36.9, y:8.8, z:25.8, up:true, r:1.1 }, COM:{ x:36.9, y:11.3, z:25.8, up:true, r:1.1 } },
  nema17:    { 'A+':{ x:20.4, y:3.9, z:-5, up:true, r:0.9 }, 'A-':{ x:20.4, y:3.9, z:-1, up:true, r:0.9 }, 'B+':{ x:20.4, y:3.9, z:1, up:true, r:0.9 }, 'B-':{ x:20.4, y:3.9, z:5, up:true, r:0.9 } },
  servo:     { GND:{ x:23.9, y:1.4, fz:5.2, r:1.2 }, VCC:{ x:23.9, y:3.9, fz:5.2, r:1.2 }, SIG:{ x:23.9, y:6.4, fz:5.2, r:1.2 } },
  stepkit:   { IN1:{ x:11.9, y:11.5, z:-1.1, up:true, r:1.2 }, IN2:{ x:14.4, y:11.5, z:-1.1, up:true, r:1.2 }, IN3:{ x:17, y:11.5, z:-1.1, up:true, r:1.2 }, IN4:{ x:19.5, y:11.5, z:-1.1, up:true, r:1.2 },
               '-':{ x:34.3, y:11.5, z:0, up:true, r:1.2 }, '+':{ x:34.3, y:11.5, z:2.5, up:true, r:1.2 } },
  arduino:   {},
  lcdi2c16:  { GND:{ x:13.4, y:8.9, z:-11.4, up:true, r:1.1, out:[1, 0, 0], exit:36 }, VCC:{ x:13.4, y:8.9, z:-8.9, up:true, r:1.1, out:[1, 0, 0], exit:36 }, SDA:{ x:13.4, y:8.9, z:-6.3, up:true, r:1.1, out:[1, 0, 0], exit:36 }, SCL:{ x:13.4, y:8.9, z:-3.8, up:true, r:1.1, out:[1, 0, 0], exit:36 } },
  lcdi2c20:  { GND:{ x:6.4, y:8.9, z:-23.4, up:true, r:1.1, out:[1, 0, 0], exit:52 }, VCC:{ x:6.4, y:8.9, z:-20.9, up:true, r:1.1, out:[1, 0, 0], exit:52 }, SDA:{ x:6.4, y:8.9, z:-18.3, up:true, r:1.1, out:[1, 0, 0], exit:52 }, SCL:{ x:6.4, y:8.9, z:-15.8, up:true, r:1.1, out:[1, 0, 0], exit:52 } },
  uln_mod:   {},
  l298n:     {}
};
(function () {
  const U = TERMS.uln_mod, up = (x, z, y) => ({ x, y:y || 11, z, up:true, r:1.3 });
  ['IN1', 'IN2', 'IN3', 'IN4'].forEach((n, i) => { U[n] = up(-10.5 + i * 2.54, 14.5); });
  U['-'] = up(9.5, 14.5); U['+'] = up(12.04, 14.5);
  ['A', 'B', 'C', 'D', 'COM'].forEach((n, i) => { U[n] = up(-5.08 + i * 2.54, -12, 8); });
  const Lt = TERMS.l298n, sc = (x, z) => ({ x, y:12.6, z, up:true, r:1.7 });
  const face = (x, z, o) => ({ x, y:7.5, z, up:true, r:1.7, out:o, exit:7 });
  Lt.OUT1 = face(-21.5, -11.5, [-1, 0, 0]); Lt.OUT2 = face(-21.5, -6.5, [-1, 0, 0]); Lt.OUT3 = face(21.5, -6.5, [1, 0, 0]); Lt.OUT4 = face(21.5, -11.5, [1, 0, 0]);
  Lt['12V'] = face(-13.6, 21.5, [0, 0, 1]); Lt.GND = face(-8.5, 21.5, [0, 0, 1]); Lt['5V'] = face(-3.4, 21.5, [0, 0, 1]);
  ['ENA', 'IN1', 'IN2', 'IN3', 'IN4', 'ENB'].forEach((n, i) => { Lt[n] = { x:[2.4, 4.9, 7.5, 10, 12.6, 15.1][i], y:12.2, z:18.5, up:true, r:1.2 }; });
})();
(function () {
  const A = TERMS.arduino, up = (x, z) => ({ x, y:12.9, z, up:true, r:1.25 });
  for (let k = 0; k < 14; k++) A['D' + k] = up(k < 8 ? 29.19 - k * 2.54 : 7.33 - (k - 8) * 2.54, -24.1);
  A.GND = up(-7.91, -24.1);
  ['3V3', '5V', 'GND2', 'GND3'].forEach((n, i) => { A[n] = up(1.23 + i * 2.54, 24.1); });
  for (let k = 0; k < 6; k++) A['A' + k] = up(16.45 + k * 2.54, 24.1);
})();
(function () {
  Object.values(TERMS.hcsr04).forEach(t => { t.out = [0, 0, -1]; t.exit = 6; });
  Object.values(TERMS.tcrt).forEach(t => { t.exit = 3; });
})();
const BENCH_HOME = { trafo:{ x:-235, z:-150 }, scope4:{ x:250, z:-190 }, dmm:{ x:260, z:110 }, lprobe:{ x:-250, z:150 }, keypad:{ x:-230, z:-10 }, oled:{ x:150, z:-20 }, batteryPack:{ x:-200, z:140 }, joystick:{ x:-150, z:60 }, relay:{ x:130, z:95 }, chasis2wd:{ x:-330, z:430 }, chasisbal:{ x:-250, z:250 }, brazo3d:{ x:300, z:250 }, portapilas:{ x:-200, z:200 }, tcrt:{ x:-20, z:95 }, hcsr04:{ x:-20, z:95 }, mpu6050:{ x:-20, z:95 }, supply:{ x:-95, z:-82 }, fgen:{ x:5, z:-82 }, scope:{ x:125, z:-88 }, arduino:{ x:-100, z:20 },
  uln_mod:{ x:60, z:45 }, stepkit:{ x:40, z:-72 }, l298n:{ x:70, z:50 }, motor:{ x:95, z:30 }, gearmotor:{ x:110, z:35 }, stepper:{ x:95, z:30 }, nema17:{ x:95, z:35 }, servo:{ x:90, z:25 } };
const TB_LIST = [1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1];
const VD_LIST = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
const WAVES = ['sine', 'square', 'tri', 'saw'];

/* (x, z) local de la pieza → mundo, girado θ grados sobre su centro (misma convención que rotation.y de three.js) */
function benchRotXZ(c, lx, lz) {
  const a = (c.mount ? 0 : (+c.rot || 0)) * Math.PI / 180;
  if (!a) return { x:c.x + lx, z:c.z + lz };
  const co = Math.cos(a), si = Math.sin(a);
  return { x:c.x + lx * co + lz * si, z:c.z - lx * si + lz * co };
}
/* medio ancho y media profundidad de la huella girada (caja envolvente alineada con la mesa) */
function benchHalf(c) {
  const P = PARTS[c.type], a = (c.mount ? 0 : (+c.rot || 0)) * Math.PI / 180, co = Math.abs(Math.cos(a)), si = Math.abs(Math.sin(a));
  return { hw:P.w / 2 * co + P.d / 2 * si, hd:P.w / 2 * si + P.d / 2 * co };
}
function terminalXYZ(c, pin) {
  const t = TERMS[c.type] && TERMS[c.type][pin], P = PARTS[c.type];
  if (!t) return { x:c.x || 0, y:0, z:c.z || 0 };
  const lz = t.up ? t.z : t.fz !== undefined ? t.fz : P.d / 2 + (t.len === undefined ? 7 : t.len), w = benchRotXZ(c, t.x, lz);
  return { x:w.x, y:TABLE_Y + t.y, z:w.z };
}
function epXYZ(project, ep) {
  if (ep.k === 'h') { const p = holeXZ(ep.bd || 0, ep.row, ep.col); return { x:p.x, y:0, z:p.z }; }
  const c = project.components.find(q => q.id === ep.comp);
  return c && PARTS[c.type].kind === 'bench' ? terminalXYZ(c, ep.pin) : { x:0, y:0, z:0 };
}
function compPins(c) {
  const P = PARTS[c.type], bd = c.bd || 0;
  if (P.dip) {
    const dd = dipDef(c), N = dd.pins, half = N / 2, out = [], rw = dd.rows || ['e', 'f'];
    for (let k = 1; k <= N; k++) {
      let row = k <= half ? rw[1] : rw[0], off = k <= half ? k - 1 : N - k;
      if (c.flip) { row = row === rw[1] ? rw[0] : rw[1]; off = half - 1 - off; }
      out.push({ pin:String(k), bd, row, col:c.col + off });
    }
    return out;
  }
  const n = P.pins.length;
  return P.pins.map((pin, i) => {
    const j = c.flip ? n - 1 - i : i;
    return { pin, bd, row:c.row, col:c.col + Math.round(j * P.span / (n - 1)) };
  });
}
function compSpan(c) { const P = PARTS[c.type]; return P.dip ? dipDef(c).pins / 2 - 1 : P.span; }
function bodyCells(c) {
  const P = PARTS[c.type];
  if (P.dip) {
    const rw = dipDef(c).rows || ['e', 'f'], out = [], span = compSpan(c);
    'abcdefghij'.split('').forEach(r => { if (r > rw[0] && r < rw[1] && r !== 'e' && r !== 'f') for (let k = 0; k <= span; k++) out.push(holeKey(c.bd || 0, r, c.col + k)); });
    return out;
  }
  if (P.kind !== 'board') return [];
  const pinCols = new Set(compPins(c).map(h => h.col)), out = [];
  for (let k = 1; k < P.span; k++) if (!pinCols.has(c.col + k)) out.push(holeKey(c.bd || 0, c.row, c.col + k));
  return out;
}
function pinLabel(c, pin) {
  if (PARTS[c.type].dip) { const d = dipDef(c); if (d && d.names) return 'pin ' + pin + ' · ' + d.names[+pin - 1]; }
  const P = PARTS[c.type];
  return (P.pinNames && P.pinNames[pin]) || 'pin ' + pin;
}
function occupiedHoles(project, ignoreId) {
  const m = new Map();
  project.components.forEach(c => {
    if (c.id === ignoreId || PARTS[c.type].kind !== 'board') return;
    compPins(c).forEach(h => m.set(holeKey(h.bd, h.row, h.col), c.id));
  });
  project.wires.forEach(w => [w.a, w.b].forEach(e => { if (e.k === 'h') m.set(holeKey(e.bd || 0, e.row, e.col), w.id); }));
  return m;
}
function canPlaceOnBoard(project, c) {
  const P = PARTS[c.type], bd = c.bd || 0;
  if (!P || P.kind !== 'board' || bd < 0 || bd >= L.n) return false;
  if (!P.dip && !isBoardRow(c.row)) return false;
  if (!Number.isInteger(c.col) || c.col < 0 || c.col + compSpan(c) > L.cols - 1) return false;
  const occ = occupiedHoles(project, c.id);
  const mine = compPins(c).map(h => holeKey(h.bd, h.row, h.col));
  if (mine.some(k => occ.has(k))) return false;
  const myBody = new Set(bodyCells(c)), all = new Set(mine.concat(Array.from(myBody)));
  for (const o of project.components) {
    if (o.id === c.id || PARTS[o.type].kind !== 'board') continue;
    if (bodyCells(o).some(k => all.has(k))) return false;
    if (compPins(o).some(h => myBody.has(holeKey(h.bd, h.row, h.col)))) return false;
  }
  return true;
}
function canPlaceBench(project, c) {
  const P = PARTS[c.type];
  if (c.mount) return project.components.some(o => o.id === c.mount);
  const Hc = benchHalf(c);
  if (Math.abs(c.x) > TABLE.hx - Hc.hw || Math.abs(c.z) > TABLE.hz - Hc.hd) return false;
  if (Math.abs(c.x) < L.W / 2 + Hc.hw + 6 && Math.abs(c.z) < L.D / 2 + Hc.hd + 6) return false;
  return !project.components.some(o => {
    if (o.id === c.id || o.mount || PARTS[o.type].kind !== 'bench') return false;
    const Ho = benchHalf(o);
    return Math.abs(o.x - c.x) < Hc.hw + Ho.hw + 4 && Math.abs(o.z - c.z) < Hc.hd + Ho.hd + 4;
  });
}
function canPlace(project, c) { return PARTS[c.type].kind === 'bench' ? canPlaceBench(project, c) : canPlaceOnBoard(project, c); }
function holeFree(project, bd, row, col) { return !occupiedHoles(project).has(holeKey(bd, row, col)); }
function findBenchSpot(project, c) {
  const P = PARTS[c.type], home = BENCH_HOME[c.type] || { x:0, z:-90 };
  const zs = [], back = -(L.D / 2 + P.d / 2 + 26);
  for (let k = 0; k < 6; k++) zs.push(back - k * 70, -back + k * 70);
  const tries = [[home.x, Math.min(home.z, back)]];
  zs.forEach(z => { for (let s = 0; s <= 420; s += 10) { tries.push([home.x + s, z]); if (s) tries.push([home.x - s, z]); } });
  for (const t of tries) { c.x = t[0]; c.z = t[1]; if (canPlaceBench(project, c)) return true; }
  return false;
}

/* ---------- proyecto ---------- */
function newProject() { return { v:2, seq:1, counts:{}, board:{ cols:30, n:1 }, components:[], wires:[] }; }
function nextId(project) { return 'k' + (project.seq++); }
function defaultParams(type) {
  switch (type) {
    case 'resistor': return { R:330 };
    case 'led': return { color:'rojo' };
    case 'diode': return { model:'1N4007' };
    case 'zener': return { vz:5.1 };
    case 'tcrt': return { auto:true, line:null };
    case 'chasis2wd': return { pista:'ovalo', mot:true };
    case 'chasisbal': return { mot:true };
    case 'reg': return { model:'7805' };
    case 'dmm': return { mode:'vdc', on:true, beep:true };
    case 'lprobe': return { fam:'ttl', mem:false, tone:false, rails:false };
    case 'regneg': return { model:'7905' };
    case 'lm35': return { T:25 };
    case 'ntc': return { R25:10000, B:3950, T:25, R:10000 };
    case 'crystal': return { f:16 };
    case 'spdt': return { on:[true, false] };
    case 'keypad': return { on:new Array(16).fill(false) };
    case 'customDip': return { n:8, code:'CHIP', names:[] };
    case 'stub2': return { code:'' };
    case 'stub3': return { code:'' };
    case 'brazo3d': return { servos:true };
    case 'buzzer': return { R:170, sound:false };
    case 'ldr': return { lux:50, R:ldrR(50) };
    case 'batteryPack': return { V:7.4, on:true };
    case 'joystick': return { R:10000, x:0.5, y:0.5, pressed:false };
    case 'relay': return { low:false, coil:5 };
    case 'portapilas': return { celdas:4, on:true };
    case 'hcsr04': return { auto:true, dist:50 };
    case 'mpu6050': return { auto:true, pitch:0 };
    case 'rpower': return { R:5 };
    case 'inductor': return { L:1e-3, R:0.5 };
    case 'capacitor': return { C:1000e-6, Vmax:16 };
    case 'ceramic': return { C:100e-9 };
    case 'pot': return { R:10000, pos:0.5 };
    case 'button': return { pressed:false, latch:false };
    case 'ic': return { part:'7400' };
    case 'supply': return { V:9, I:1, on:true, link:true, dual:false };
    case 'fgen': return { wave:'sine', f:1000, vpp:4, off:0, duty:50, on:true };
    case 'scope': return { ch:[{ on:true, vdiv:2, pos:0 }, { on:true, vdiv:2, pos:0 }], tb:1e-3, trig:{ src:0, slope:1, level:0, mode:'auto' }, run:true, xy:false };
    case 'trafo': return { V:12, f:60, on:true };
    case 'scope4': return { ch:[{ on:true, vdiv:2, pos:2 }, { on:true, vdiv:2, pos:0.5 }, { on:true, vdiv:2, pos:-1 }, { on:true, vdiv:2, pos:-2.5 }], tb:1e-3, trig:{ src:0, slope:1, level:0, mode:'auto' }, run:true, xy:false, sel:0 };
    case 'mcu': return { chip:'esp32', code:'' };
    case 'seg7': return { model:'1cc', color:'rojo' };
    case 'dipsw': return { n:4, on:[false, false, false, false, false, false, false, false, false, false] };
    case 'arduino': return { code:'' };
    case 'l298n': return { ena:true, enb:true, reg5:true };
    case 'lcd': return { size:'16x2', color:'verde' };
    case 'lcdi2c': return { size:'16x2', color:'azul' };
    case 'lcdi2c16': return { size:'16x2', color:'azul' };
    case 'lcdi2c20': return { size:'20x4', color:'azul' };
    default: return {};
  }
}
function makeComp(project, type, props) {
  const P = PARTS[type], counts = project.counts;
  counts[P.prefix] = (counts[P.prefix] || 0) + 1;
  const c = Object.assign({ id:nextId(project), type, name:P.prefix + counts[P.prefix], flip:false }, props || {});
  c.p = Object.assign(defaultParams(type), (props && props.p) || {});
  if (P.kind === 'board') { if (c.bd === undefined) c.bd = 0; if (P.dip) c.row = (dipDef(c).rows || ['e'])[0]; }
  return c;
}
function uncount(project, type) { const k = PARTS[type].prefix; if (project.counts[k]) project.counts[k]--; }
function autoWireColor(project, a, b) {
  const kind = ep => {
    if (ep.k === 't') return { '+':'p', '-':'n', gnd:'g', out:'s', ch1:'c1', ch2:'c2', '5V':'p', '3V3':'p', VCC:'p', COM:'p', GND:'n', GND2:'n', GND3:'n' }[ep.pin] || '';
    const r = ep.row.charAt(0); return r === 'P' ? 'p' : r === 'N' ? 'n' : '';
  };
  const k = [kind(a), kind(b)];
  if (k.includes('c1')) return '#f2c418';
  if (k.includes('c2')) return '#25b5cf';
  if (k.includes('p')) return '#d8321f';
  if (k.includes('g')) return '#2f9e44';
  if (k.includes('n')) return '#1c1c1f';
  if (k.includes('s')) return '#f07a1a';
  const cols = ['#2f6fe0', '#e8b923', '#2fae52', '#f07a1a', '#e9e9e4', '#8b4fd1'];
  return cols[project.wires.length % cols.length];
}
function addWire(project, a, b, color) {
  const w = { id:nextId(project), a, b, color:color || autoWireColor(project, a, b) };
  project.wires.push(w);
  return w;
}
function trim(x) { return String(Math.round(x * 100) / 100).replace('.', ','); }
function formatR(r) {
  if (r >= 1e6) return trim(r / 1e6) + ' MΩ';
  if (r >= 1e3) return trim(r / 1e3) + ' kΩ';
  return trim(r) + ' Ω';
}
function formatC(c) {
  if (c >= 1e-6) return trim(c * 1e6) + ' µF';
  if (c >= 1e-9) return trim(c * 1e9) + ' nF';
  return trim(c * 1e12) + ' pF';
}

/* ---------- escenarios ---------- */
const H = (row, col, bd) => ({ k:'h', bd:bd || 0, row, col });
const T = (c, pin) => ({ k:'t', comp:c.id, pin });
function bench(p, type, params) { const c = makeComp(p, type, Object.assign({}, BENCH_HOME[type], { p:params || {} })); p.components.push(c); return c; }
function part(p, type, row, col, params, extra) { const c = makeComp(p, type, Object.assign({ row, col, p:params || {} }, extra || {})); p.components.push(c); return c; }
function scenarioBase(V, I) {
  const p = newProject();
  const f = bench(p, 'supply', { V:V || 9, I:I || 1 });
  part(p, 'resistor', 'a', 3, { R:330 });
  part(p, 'led', 'b', 7, { color:'rojo' });
  addWire(p, T(f, '+'), H('c', 3)); addWire(p, T(f, '-'), H('c', 8));
  return p;
}
function scenarioShort() { const p = scenarioBase(9, 5); addWire(p, H('d', 3), H('d', 8)); return p; }
function scenarioLedNoR() {
  const p = newProject();
  const f = bench(p, 'supply', { V:12, I:1 });
  part(p, 'led', 'b', 7, { color:'rojo' });
  addWire(p, T(f, '+'), H('c', 7)); addWire(p, T(f, '-'), H('c', 8));
  return p;
}
function scenarioCap() {
  const p = newProject();
  const f = bench(p, 'supply', { V:20, I:1 });
  part(p, 'resistor', 'a', 3, { R:100 });
  part(p, 'capacitor', 'b', 7, { C:1000e-6, Vmax:16 });
  addWire(p, T(f, '+'), H('c', 3)); addWire(p, T(f, '-'), H('c', 9));
  return p;
}
function scenarioRes() {
  const p = newProject();
  const f = bench(p, 'supply', { V:12, I:2 });
  part(p, 'resistor', 'a', 3, { R:10 });
  addWire(p, T(f, '+'), H('c', 3)); addWire(p, T(f, '-'), H('c', 7));
  return p;
}
function scenarioRC() {
  const p = newProject();
  const g = bench(p, 'fgen', { wave:'sine', f:1000, vpp:4 });
  const o = bench(p, 'scope', { tb:2e-4, ch:[{ on:true, vdiv:1, pos:0 }, { on:true, vdiv:1, pos:0 }], trig:{ src:0, slope:1, level:0, mode:'auto' } });
  part(p, 'resistor', 'a', 10, { R:1000 });
  part(p, 'ceramic', 'b', 14, { C:100e-9 });
  addWire(p, T(g, 'out'), H('c', 10)); addWire(p, T(g, 'gnd'), H('N1', 3));
  addWire(p, H('c', 15), H('N1', 15));
  addWire(p, T(o, 'ch1'), H('d', 10)); addWire(p, T(o, 'ch2'), H('c', 14)); addWire(p, T(o, 'gnd'), H('N1', 6));
  return p;
}
function scenarioAstable() {
  const p = newProject();
  const f = bench(p, 'supply', { V:9, I:1 });
  const o = bench(p, 'scope', { tb:0.2, ch:[{ on:true, vdiv:5, pos:-1 }, { on:true, vdiv:5, pos:-1 }], trig:{ src:0, slope:1, level:4.5, mode:'auto' } });
  part(p, 'ic', 'e', 10, { part:'555' });
  part(p, 'resistor', 'b', 11, { R:10000 });
  part(p, 'resistor', 'c', 12, { R:47000 });
  part(p, 'capacitor', 'i', 9, { C:10e-6, Vmax:16 }, { flip:true });
  part(p, 'resistor', 'g', 12, { R:330 });
  part(p, 'led', 'h', 16, { color:'rojo' });
  addWire(p, T(f, '+'), H('P1', 2)); addWire(p, T(f, '+'), H('P2', 2)); addWire(p, T(f, '-'), H('N2', 2));
  addWire(p, H('P1', 10), H('a', 10)); addWire(p, H('j', 13), H('P2', 13)); addWire(p, H('j', 10), H('N2', 10));
  addWire(p, H('a', 15), H('P1', 15)); addWire(p, H('d', 16), H('d', 11)); addWire(p, H('g', 11), H('a', 12));
  addWire(p, H('j', 9), H('N2', 9)); addWire(p, H('i', 17), H('N2', 17));
  addWire(p, T(o, 'ch1'), H('i', 12)); addWire(p, T(o, 'ch2'), H('d', 12)); addWire(p, T(o, 'gnd'), H('N2', 20));
  return p;
}
function scenarioNand(V) {
  const p = newProject();
  const f = bench(p, 'supply', { V:V || 5, I:1 });
  part(p, 'ic', 'e', 8, { part:'7400' });
  part(p, 'button', 'h', 6, {});
  part(p, 'button', 'i', 7, {});
  part(p, 'resistor', 'g', 20, { R:220 });
  part(p, 'led', 'h', 24, { color:'verde' });
  addWire(p, T(f, '+'), H('P1', 2)); addWire(p, T(f, '+'), H('P2', 2)); addWire(p, T(f, '-'), H('N2', 2));
  addWire(p, H('a', 8), H('P1', 8)); addWire(p, H('j', 14), H('N2', 14));
  addWire(p, H('j', 6), H('P2', 6)); addWire(p, H('j', 7), H('P2', 7));
  addWire(p, H('h', 10), H('h', 20)); addWire(p, H('i', 25), H('N2', 25));
  return p;
}

function rcBase(o) {
  const p = newProject();
  const g = bench(p, 'fgen', { wave:o.wave, f:o.f, vpp:4 });
  const sc = bench(p, 'scope', { tb:o.tb, ch:[{ on:true, vdiv:1, pos:o.pos || 0 }, { on:true, vdiv:1, pos:o.pos || 0 }], trig:{ src:0, slope:1, level:0, mode:'auto' } });
  addWire(p, T(g, 'gnd'), H('N1', 3)); addWire(p, T(sc, 'gnd'), H('N1', 6));
  return { p, g, sc };
}
function scenarioRCLow(wave, f, R, C, tb) {
  const { p, g, sc } = rcBase({ wave, f, tb });
  part(p, 'resistor', 'a', 10, { R });
  part(p, 'ceramic', 'b', 14, { C });
  addWire(p, T(g, 'out'), H('c', 10)); addWire(p, H('c', 15), H('N1', 15));
  addWire(p, T(sc, 'ch1'), H('d', 10)); addWire(p, T(sc, 'ch2'), H('c', 14));
  return p;
}
function scenarioRCHigh(wave, f, R, C, tb) {
  const { p, g, sc } = rcBase({ wave, f, tb });
  part(p, 'ceramic', 'b', 10, { C });
  part(p, 'resistor', 'a', 11, { R });
  addWire(p, T(g, 'out'), H('c', 10)); addWire(p, H('c', 15), H('N1', 15));
  addWire(p, T(sc, 'ch1'), H('d', 10)); addWire(p, T(sc, 'ch2'), H('c', 11));
  return p;
}
function scenarioRC2() {
  const { p, g, sc } = rcBase({ wave:'sine', f:1600, tb:2e-4 });
  part(p, 'resistor', 'a', 10, { R:1000 }); part(p, 'ceramic', 'b', 14, { C:100e-9 });
  part(p, 'resistor', 'c', 14, { R:1000 }); part(p, 'ceramic', 'b', 18, { C:100e-9 });
  addWire(p, T(g, 'out'), H('c', 10)); addWire(p, H('d', 15), H('N1', 15)); addWire(p, H('c', 19), H('N1', 19));
  addWire(p, T(sc, 'ch1'), H('e', 10)); addWire(p, T(sc, 'ch2'), H('e', 18));
  return p;
}
/* Montaje por nodos: cada pieza se ubica a mano y se declara a qué nodo va cada pin.
   El ayudante comprueba que ninguna tira quede con dos nodos y tiende los puentes que faltan. */
const NET_COL = { gnd:'#1c1c1f', vp:'#d8321f', vn:'#2f6fe0', v5:'#e8590c', v10:'#d8321f' };
function montaje(o) {
  const p = newProject();
  p.board = Object.assign({ cols:63, n:1 }, o.board || {}); setLayout(p.board);
  const occ = new Set(), stripNet = {}, netStrips = {}, palette = ['#2fae52', '#e8b923', '#8b4fd1', '#f07a1a', '#20a4b8', '#c2255c', '#5c7cfa', '#94d82d', '#e64980', '#868e96'];
  let pi = 0;
  const netColor = {};
  const colorOf = net => netColor[net] || (netColor[net] = NET_COL[net] || palette[pi++ % palette.length]);
  const claim = (key, net, desc) => {
    if (stripNet[key] && stripNet[key] !== net) throw new Error('Tira ' + key + ' con dos nodos: ' + stripNet[key] + ' y ' + net);
    stripNet[key] = net; (netStrips[net] = netStrips[net] || new Map()).set(key, desc);
  };
  const rails = o.rails || {};
  for (let bd = 0; bd < p.board.n; bd++) Object.keys(rails).forEach(row => { if (rails[row]) claim('R:' + bd + ':' + row, rails[row], { rail:row, bd }); });
  const comps = {}, nets = {};
  const note = (net, who) => { const l = nets[net] = nets[net] || []; if (!l.includes(who)) l.push(who); };
  (o.parts || []).forEach(q => {
    const [name, type, row, col, params, , extra] = q;
    const c = makeComp(p, type, Object.assign({ row, col, bd:0, p:params || {} }, extra || {}));
    if (!canPlaceOnBoard(p, c)) throw new Error('No cabe ' + name + ' (' + type + ') en ' + row + col);
    p.components.push(c); comps[name] = c;
    compPins(c).forEach(h => {
      occ.add(holeKey(h.bd, h.row, h.col));
      const net = q[5] && q[5][h.pin];
      if (net) { claim(stripOf(h.bd, h.row, h.col), net, { bd:h.bd, half:h.row < 'f' ? 't' : 'b', col:h.col }); note(net, PARTS[type].pins && PARTS[type].pins.length === 2 && type !== 'diode' && type !== 'zener' && type !== 'led' && type !== 'capacitor' ? name : name + '·' + h.pin); }
    });
    bodyCells(c).forEach(k => occ.add(k));
  });
  const holeFreeK = (bd, row, col) => !occ.has(holeKey(bd, row, col));
  const pickHole = (d, pref) => {
    const rows = d.half === 't' ? (pref === 'gap' ? ['e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e']) : (pref === 'gap' ? ['f', 'g', 'h', 'i', 'j'] : ['j', 'i', 'h', 'g', 'f']);
    for (const r of rows) if (holeFreeK(d.bd, r, d.col)) { occ.add(holeKey(d.bd, r, d.col)); return { k:'h', bd:d.bd, row:r, col:d.col }; }
    throw new Error('Tira llena en la columna ' + d.col);
  };
  const railHole = (bd, row, col) => {
    for (let k = 0; k < 40; k++) for (const s of [1, -1]) {
      const cc = col + s * k;
      if (cc >= 0 && cc < p.board.cols && holeFreeK(bd, row, cc)) { occ.add(holeKey(bd, row, cc)); return { k:'h', bd, row, col:cc }; }
    }
    throw new Error('Riel ' + row + ' lleno');
  };
  const W = (a, b, net, style) => {
    const w = addWire(p, a, b, colorOf(net));
    const lejos = a.k === 'h' && b.k === 'h' && (a.bd !== b.bd || Math.abs(a.col - b.col) > 14);
    if (style !== 'arco' && !lejos && a.k === 'h' && b.k === 'h') w.style = style || 'plano';
    return w;
  };
  Object.keys(netStrips).forEach(net => {
    const all = Array.from(netStrips[net].values()), rl = all.filter(d => d.rail), st = all.filter(d => !d.rail);
    if (rl.length) {
      st.forEach(d => {
        const sc = r => ((d.half === 't') === (r.rail.charAt(1) === '1') ? 0 : 1), near = rl.filter(r => r.bd === d.bd).sort((x, y) => sc(x) - sc(y))[0] || rl[0];
        const same = (d.half === 't') === (near.rail.charAt(1) === '1');
        W(pickHole(d, same ? 'out' : 'gap'), railHole(near.bd, near.rail, d.col), net, same ? 'plano' : 'arco');
      });
    } else {
      st.sort((a, b) => a.bd - b.bd || (a.half === b.half ? a.col - b.col : a.half === 't' ? -1 : 1));
      for (let i = 1; i < st.length; i++) {
        const a = st[i - 1], b = st[i], cross = a.half !== b.half;
        W(pickHole(a, cross ? 'gap' : 'out'), pickHole(b, cross ? 'gap' : 'out'), net);
      }
    }
  });
  // une los rieles con el mismo nodo (arriba con abajo)
  const railsOf = {}; Object.keys(rails).forEach(r => { if (rails[r]) (railsOf[rails[r]] = railsOf[rails[r]] || []).push(r); });
  Object.keys(railsOf).forEach(net => { const rs = railsOf[net]; for (let i = 1; i < rs.length; i++) for (let bd = 0; bd < p.board.n; bd++) W(railHole(bd, rs[i - 1], 0), railHole(bd, rs[i], 0), net, 'arco'); });
  for (let bd = 1; bd < p.board.n; bd++) Object.keys(rails).forEach(row => { if (rails[row]) W(railHole(bd - 1, row, p.board.cols - 1), railHole(bd, row, p.board.cols - 1), rails[row], 'arco'); });
  const inst = {}, termNet = {};
  (o.bench || []).forEach(q => {
    const [name, type, params, conns, pos] = q;
    const c = makeComp(p, type, Object.assign({}, BENCH_HOME[type], pos || {}, { p:params || {} }));
    p.components.push(c); inst[name] = c;
    Object.keys(conns || {}).forEach(pin => {
      const net = conns[pin], rs = railsOf[net];
      note(net, name + '·' + pin);
      let hole;
      if (rs) hole = railHole(0, rs[0], pin === 'gnd' ? 3 : 1);
      else {
        const st = netStrips[net] && Array.from(netStrips[net].values()).filter(d => !d.rail);
        if (!st || !st.length) { const prev = termNet[net]; termNet[net] = { k:'t', comp:c.id, pin }; if (prev) addWire(p, prev, termNet[net], colorOf(net)); return; }
        for (const d of st) { try { hole = pickHole(d, 'out'); break; } catch (err) { /* tira llena: prueba la siguiente */ } }
        if (!hole) throw new Error('No queda lugar en la protoboard para el nodo ' + net);
      }
      const col = { ch1:'#f2c418', ch2:'#25b5cf', ch3:'#e64bd0', ch4:'#3d6bff' }[pin] || autoWireColor(p, { k:'t', comp:c.id, pin }, hole);
      addWire(p, { k:'t', comp:c.id, pin }, hole, col);
    });
  });
  p.comps = comps; p.inst = inst; p.nets = nets;
  return p;
}
function sinRefs(p) { delete p.comps; delete p.inst; return p; }
/* ---------- Prácticas de laboratorio de Electrónica II ---------- */
const RAILS_DUAL = { N1:'vn', P1:'vp', P2:'gnd', N2:'gnd' };
const PS_DUAL = (V) => ['PS', 'supply', { V:V || 12, I:1, dual:true, link:true }, { '+':'vp', '-':'vn', gnd:'gnd' }];
const SCOPE = (o, conns) => ['OSC', 'scope', { tb:o.tb, ch:[{ on:true, vdiv:o.v1 || 2, pos:o.p1 || 0 }, { on:true, vdiv:o.v2 || 2, pos:o.p2 || 0 }], trig:{ src:o.src || 0, slope:1, level:o.lvl || 0, mode:'auto' }, run:true, xy:!!o.xy }, conns];
const D48 = { model:'1N4148' };
// Práctica 2 — limitador de amplitud con dos etapas (ganancia 10, límites +6 V y −4 V)
function scenarioP2Lim() {
  return sinRefs(montaje({
    rails:RAILS_DUAL,
    parts:[
      ['U1', 'ic', 'e', 30, { part:'324' }, { 1:'V1', 2:'nA', 3:'gnd', 4:'vp', 5:'gnd', 6:'nB', 7:'Vo', 11:'vn' }],
      ['R1', 'resistor', 'j', 20, { R:10000 }, { A:'Vi', B:'nA' }],
      ['Rf', 'resistor', 'i', 24, { R:100000 }, { A:'nA', B:'V1' }],
      ['R6', 'resistor', 'j', 39, { R:10000 }, { A:'V1', B:'nB' }],
      ['R7', 'resistor', 'i', 43, { R:10000 }, { A:'nB', B:'Vo' }],
      ['R3', 'resistor', 'c', 40, { R:10000 }, { A:'V1', B:'X' }],
      ['D1', 'diode', 'b', 44, D48, { A:'X', K:'nA' }],
      ['R2', 'resistor', 'd', 52, { R:36000 }, { A:'X', B:'vn' }],
      ['R5', 'resistor', 'c', 18, { R:10000 }, { A:'Y', B:'V1' }],
      ['D2', 'diode', 'b', 14, D48, { A:'nA', K:'Y' }],
      ['R4', 'resistor', 'd', 4, { R:24000 }, { A:'vp', B:'Y' }]
    ],
    bench:[PS_DUAL(12), ['FG', 'fgen', { wave:'sine', f:400, vpp:2, off:0 }, { out:'Vi', gnd:'gnd' }],
      SCOPE({ tb:5e-4, v1:1, v2:2 }, { ch1:'Vi', ch2:'Vo', gnd:'gnd' })]
  }));
}
// Práctica 2 — amplificador con zona muerta de ±2 V y ganancia 5
function zonaMuertaParts(out) {
  return [
    ['R1', 'resistor', 'd', 4, { R:12000 }, { A:'vn', B:'P' }],
    ['R2', 'resistor', 'c', 8, { R:2000 }, { A:'P', B:'Vi' }],
    ['D1', 'diode', 'b', 16, D48, { A:'P', K:'S' }],
    ['R4', 'resistor', 'c', 40, { R:2000 }, { A:'Vi', B:'N' }],
    ['R3', 'resistor', 'd', 44, { R:12000 }, { A:'N', B:'vp' }],
    ['D2', 'diode', 'b', 50, D48, { A:'S', K:'N' }],
    ['R', 'resistor', 'i', 24, { R:10000 }, { A:'S', B:out }],
    ['D3', 'diode', 'h', 14, D48, { A:'gnd', K:'P' }],
    ['D4', 'diode', 'h', 8, D48, { A:'N', K:'gnd' }]
  ];
}
function scenarioP2Dz() {
  return sinRefs(montaje({
    rails:RAILS_DUAL,
    parts:[['U1', 'ic', 'e', 30, { part:'324' }, { 1:'Vo', 2:'S', 3:'gnd', 4:'vp', 11:'vn' }]].concat(zonaMuertaParts('Vo')),
    bench:[PS_DUAL(12), ['FG', 'fgen', { wave:'sine', f:200, vpp:6, off:0 }, { out:'Vi', gnd:'gnd' }],
      SCOPE({ tb:1e-3, v1:2, v2:2 }, { ch1:'Vi', ch2:'Vo', gnd:'gnd' })]
  }));
}
// Práctica 3 — biestable con AO y zeners, activación manual con pulsadores
function scenarioP3Bi() {
  return sinRefs(montaje({
    rails:RAILS_DUAL,
    parts:[
      ['U1', 'ic', 'e', 30, { part:'324' }, { 1:'Va', 2:'Vr', 3:'Pp', 4:'vp', 11:'vn' }],
      ['Ro', 'resistor', 'i', 26, { R:470 }, { A:'Vo', B:'Va' }],
      ['DZ1', 'zener', 'h', 22, { vz:6.8 }, { A:'m', K:'Vo' }],
      ['DZ2', 'zener', 'g', 18, { vz:6.8 }, { A:'m', K:'gnd' }, { flip:true }],
      ['R1', 'resistor', 'j', 28, { R:100000 }, { A:'Vo', B:'Pp' }],
      ['Rs', 'resistor', 'j', 40, { R:10000 }, { A:'Vs', B:'Pp' }],
      ['R3', 'resistor', 'c', 38, { R:22000 }, { A:'vp', B:'Vr' }],
      ['R4', 'resistor', 'h', 46, { R:1000 }, { A:'Vr', B:'gnd' }],
      ['S', 'button', 'c', 50, {}, { 1:'vp', 2:'Vs' }],
      ['Rr', 'button', 'd', 54, {}, { 1:'Vs', 2:'vn' }],
      ['Rd', 'resistor', 'i', 52, { R:10000 }, { A:'Vs', B:'gnd' }],
      ['Rl', 'resistor', 'j', 6, { R:3300 }, { A:'Vo', B:'l' }],
      ['LED1', 'led', 'i', 10, { color:'rojo' }, { A:'l', K:'gnd' }],
      ['LED2', 'led', 'h', 10, { color:'verde' }, { A:'gnd', K:'l' }, { flip:true }]
    ],
    bench:[PS_DUAL(12), SCOPE({ tb:0.2, v1:5, v2:5 }, { ch1:'Vs', ch2:'Vo', gnd:'gnd' })]
  }));
}
// Práctica 3 — biestable disparado por la salida bipolar de la zona muerta
function scenarioP3BiDz() {
  return sinRefs(montaje({
    rails:RAILS_DUAL,
    parts:[['U1', 'ic', 'e', 30, { part:'324' }, { 1:'Vd', 2:'S', 3:'gnd', 4:'vp', 11:'vn', 5:'Pp', 6:'gnd', 7:'Va' }]].concat(zonaMuertaParts('Vd'), [
      ['Ro', 'resistor', 'i', 47, { R:470 }, { A:'Va', B:'Vo' }],
      ['DZ1', 'zener', 'h', 51, { vz:6.8 }, { A:'m', K:'Vo' }, { flip:true }],
      ['DZ2', 'zener', 'g', 55, { vz:6.8 }, { A:'m', K:'gnd' }],
      ['R1', 'resistor', 'j', 38, { R:100000 }, { A:'Vo', B:'Pp' }],
      ['Rs', 'resistor', 'i', 42, { R:10000 }, { A:'Pp', B:'Vd' }]
    ]),
    bench:[PS_DUAL(12), ['FG', 'fgen', { wave:'sine', f:200, vpp:6, off:0 }, { out:'Vi', gnd:'gnd' }],
      SCOPE({ tb:2e-3, v1:5, v2:5 }, { ch1:'Vd', ch2:'Vo', gnd:'gnd' })]
  }));
}
// Práctica 3 — monoestable con AO (≈10 s) y, opcionalmente, en cascada con un 555 (≈60 s)
function scenarioP3Mono(cascada) {
  const parts = [
    ['U1', 'ic', 'e', 30, { part:'324' }, { 1:'Vo', 2:'Cn', 3:'Pp', 4:'vp', 11:'vn' }],
    ['R1', 'resistor', 'i', 26, { R:10000 }, { A:'Pp', B:'Vo' }],
    ['R2', 'resistor', 'j', 22, { R:10000 }, { A:'gnd', B:'Pp' }],
    ['RT', 'resistor', 'g', 38, { R:100000 }, { A:'Vo', B:'m' }],
    ['RP', 'pot', 'i', 42, { R:100000, pos:0.31 }, { 1:'m', W:'Cn' }],
    ['C1', 'capacitor', 'h', 43, { C:100e-6, Vmax:25 }, { '+':'Cn', '-':'gnd' }],
    ['D1', 'diode', 'j', 47, D48, { A:'gnd', K:'Cn' }],
    ['SW', 'button', 'c', 50, {}, { 1:'vp', 2:'Tr' }],
    ['R3', 'resistor', 'j', 52, { R:10000 }, { A:'Tr', B:'gnd' }],
    ['C2', 'ceramic', 'g', 52, { C:1e-6 }, { 1:'Tr', 2:'X' }],
    ['R4', 'resistor', 'h', 53, { R:100000 }, { A:'X', B:'vn' }],
    ['R5', 'resistor', 'g', 58, { R:100000 }, { A:'X', B:'gnd' }],
    ['D2', 'diode', 'i', 49, D48, { A:'X', K:'Pp' }, { flip:true }],
    ['Rl', 'resistor', 'j', 10, { R:1000 }, { A:'Vo', B:'l' }],
    ['LED1', 'led', 'i', 14, { color:'rojo' }, { A:'l', K:'gnd' }],
    ['D3', 'diode', 'g', 15, D48, { A:'gnd', K:'l' }]
  ];
  if (cascada) parts.push(
    ['U2', 'ic', 'e', 66, { part:'555' }, { 1:'gnd', 2:'T2', 3:'O2', 4:'rst', 5:'ctl', 6:'Cx', 7:'Cx', 8:'vp' }],
    ['Rpor', 'resistor', 'g', 80, { R:100000 }, { A:'vp', B:'rst' }],
    ['Cpor', 'capacitor', 'h', 84, { C:10e-6, Vmax:25 }, { '+':'rst', '-':'gnd' }],
    ['RA', 'resistor', 'c', 67, { R:560000 }, { A:'Cx', B:'vp' }],
    ['CT', 'capacitor', 'a', 68, { C:100e-6, Vmax:25 }, { '+':'Cx', '-':'gnd' }],
    ['C5', 'ceramic', 'd', 69, { C:10e-9 }, { 1:'ctl', 2:'gnd' }],
    ['Rpu', 'resistor', 'j', 63, { R:10000 }, { A:'vp', B:'T2' }],
    ['SW2', 'button', 'h', 71, {}, { 1:'T2', 2:'gnd' }],
    ['Cc', 'ceramic', 'i', 75, { C:1e-6 }, { 1:'Vo', 2:'T2' }],
    ['Dn', 'diode', 'g', 72, D48, { A:'gnd', K:'T2' }],
    ['Dp', 'diode', 'j', 76, D48, { A:'T2', K:'vp' }],
    ['Rl2', 'resistor', 'i', 64, { R:1000 }, { A:'l2', B:'O2' }],
    ['LED2', 'led', 'h', 64, { color:'verde' }, { A:'l2', K:'gnd' }]
  );
  return sinRefs(montaje({
    board:{ cols:cascada ? 94 : 63, n:1 }, rails:RAILS_DUAL, parts,
    bench:[PS_DUAL(10), SCOPE({ tb:1, v1:5, v2:5, p1:0, p2:cascada ? -1 : 0 }, { ch1:'Vo', ch2:cascada ? 'O2' : 'Cn', gnd:'gnd' })]
  }));
}
// Práctica 4 — multivibrador astable con AO (ciclo útil por diodos D1/D2 y potenciómetro P)
function scenarioP4Ast() {
  return sinRefs(montaje({
    rails:RAILS_DUAL,
    parts:[
      ['U1', 'ic', 'e', 30, { part:'324' }, { 1:'Vo', 2:'Vc', 3:'Vr', 4:'vp', 11:'vn' }],
      ['R1', 'resistor', 'i', 26, { R:4700 }, { A:'Vr', B:'Vo' }],
      ['R2', 'resistor', 'j', 22, { R:4700 }, { A:'gnd', B:'Vr' }],
      ['C', 'ceramic', 'g', 20, { C:100e-9 }, { 1:'gnd', 2:'Vc' }],
      ['D1', 'diode', 'j', 38, D48, { A:'Vo', K:'d1' }],
      ['R3', 'resistor', 'i', 42, { R:47000 }, { A:'d1', B:'Vc' }],
      ['P', 'pot', 'j', 46, { R:100000, pos:0.53 }, { 1:'Vc', W:'m' }],
      ['R4', 'resistor', 'i', 47, { R:24000 }, { A:'m', B:'d2' }],
      ['D2', 'diode', 'g', 51, D48, { A:'d2', K:'Vo' }]
    ],
    bench:[PS_DUAL(12), SCOPE({ tb:5e-3, v1:5, v2:5 }, { ch1:'Vo', ch2:'Vc', gnd:'gnd' })]
  }));
}
// Práctica 4 — generador de barrido, comparador de ciclo útil y 555 modulado
function scenarioP4Barr(modo) {
  return sinRefs(montaje({
    board:{ cols:94, n:1 }, rails:RAILS_DUAL,
    parts:[
      ['U1', 'ic', 'e', 30, { part:'324' }, { 1:'Vo1', 2:'Vc1', 3:'Pp', 4:'vp', 5:'Vr2', 6:'Vo2', 7:'Vo2', 8:'Vo3', 9:'Vy', 10:'Vo2', 11:'vn' }],
      ['R1', 'resistor', 'i', 26, { R:4700 }, { A:'Pp', B:'Vo1' }],
      ['R2', 'resistor', 'j', 22, { R:4700 }, { A:'gnd', B:'Pp' }],
      ['C1', 'ceramic', 'g', 20, { C:100e-9 }, { 1:'gnd', 2:'Vc1' }],
      ['D1', 'diode', 'j', 8, D48, { A:'Vo1', K:'d1' }],
      ['R3', 'resistor', 'i', 12, { R:10000 }, { A:'d1', B:'p1' }],
      ['P1', 'pot', 'j', 16, { R:100000, pos:0.4 }, { 1:'p1', W:'Vc1' }],
      ['R4', 'resistor', 'h', 2, { R:4700 }, { A:'Vc1', B:'d2' }],
      ['D2', 'diode', 'g', 6, D48, { A:'d2', K:'Vo1' }],
      ['Q2', 'pnp3906', 'c', 10, {}, { E:'vp', B:'q2b', C:'q2c' }],
      ['R9', 'resistor', 'd', 11, { R:4700 }, { A:'q2b', B:'vp' }],
      ['R10', 'resistor', 'b', 7, { R:22000 }, { A:'Vo1', B:'q2b' }],
      ['R8', 'resistor', 'a', 12, { R:1000 }, { A:'q2c', B:'Vr2' }],
      ['C2', 'ceramic', 'h', 40, { C:22e-9 }, { 1:'Vr2', 2:'gnd' }],
      ['D3', 'zener', 'g', 41, { vz:9.1 }, { A:'gnd', K:'Vr2' }],
      ['Q1', 'bjt3904', 'c', 40, {}, { E:'q1e', B:'q1b', C:'Vr2' }],
      ['LED', 'led', 'b', 46, { color:'rojo' }, { A:'q1b', K:'vn' }],
      ['R6', 'resistor', 'j', 46, { R:10000 }, { A:'q1b', B:'gnd' }],
      ['R5', 'resistor', 'd', 50, { R:22000 }, { A:'q1e', B:'p2' }],
      ['P2', 'pot', 'c', 54, { R:50000, pos:0.36 }, { 1:'p2', W:'vn' }],
      ['P3', 'pot', 'h', 52, { R:50000, pos:0.33 }, { 1:'gnd', W:'Vy', 3:'vp' }],
      ['D4', 'diode', 'a', 60, D48, { A:'Vo3', K:'Vo3b' }],
      ['R11', 'resistor', 'j', 64, { R:10000 }, { A:'Vo3b', B:'gnd' }],
      ['U2', 'ic', 'e', 72, { part:'555' }, { 1:'gnd', 2:'c3', 3:'Vo4', 4:modo === 'libre' ? 'vp' : 'Vo3b', 5:'c4', 6:'c3', 7:'dis', 8:'vp' }],
      ['R12', 'resistor', 'c', 69, { R:10000 }, { A:'vp', B:'dis' }],
      ['R13', 'resistor', 'd', 73, { R:10000 }, { A:'dis', B:'c3' }],
      ['C3', 'ceramic', 'h', 77, { C:10e-9 }, { 1:'c3', 2:'gnd' }],
      ['C4', 'ceramic', 'b', 75, { C:100e-9 }, { 1:'c4', 2:'gnd' }]
    ],
    bench:[PS_DUAL(12), modo === 'barrido' ? SCOPE({ tb:2e-3, v1:5, v2:5, p1:-1, p2:-2 }, { ch1:'Vo2', ch2:'Vo3b', gnd:'gnd' })
      : SCOPE({ tb:2e-3, v1:5, v2:5, p1:0, p2:-2 }, { ch1:'Vo3b', ch2:'Vo4', gnd:'gnd' })]
  }));
}
// Práctica 5 — ADC0804 → DAC0808 (pruebas, ajuste del span y aliasing)
function scenarioP5(alias) {
  const parts = [
    ['U5', 'reg', 'a', 2, {}, { IN:'vp', GND:'gnd', OUT:'v5' }],
    ['U2', 'ic', 'e', 10, { part:'358' }, { 1:'vref2', 2:'vref2', 3:'r1w', 4:'vn', 5:'vina', 6:'vin', 7:'vin', 8:'vp' }],
    ['U1', 'lm336', 'a', 16, {}, { '+':'ref', '-':'gnd' }],
    ['R3', 'resistor', 'c', 17, { R:1000 }, { A:'ref', B:'v5' }],
    ['R1', 'pot', 'd', 22, { R:10000, pos:1 }, { 1:'gnd', W:'r1w', 3:'ref' }],
    ['R2', 'pot', 'd', 30, { R:10000, pos:0 }, { 1:'gnd', W:'vinm', 3:'v5' }],
    ['U4', 'ic', 'e', 36, { part:'adc0804' }, { 1:'gnd', 2:'gnd', 3:'wr', 4:'clk', 6:'vin', 7:'vinm', 8:'gnd', 9:'vref2', 10:'gnd', 20:'v5', 19:'clkr',
      18:'d0', 17:'d1', 16:'d2', 15:'d3', 14:'d4', 13:'d5', 12:'d6', 11:'d7' }],
    ['R4', 'resistor', 'a', 33, { R:10000 }, { A:'clk', B:'clkr' }],
    ['C4', 'ceramic', 'j', 33, { C:150e-12 }, { 1:'gnd', 2:'clk' }],
    ['U6', 'ic', 'e', 40, { part:'dac0808' }, { 2:'gnd', 3:'vn', 4:'io', 5:'d7', 6:'d6', 7:'d5', 8:'d4', 9:'d3', 10:'d2', 11:'d1', 12:'d0', 13:'v5', 14:'vrefp', 15:'vrefm', 16:'comp' }, { bd:1 }],
    ['R14', 'resistor', 'c', 38, { R:4700 }, { A:'v5', B:'vrefp' }, { bd:1 }],
    ['R15', 'resistor', 'd', 37, { R:4700 }, { A:'gnd', B:'vrefm' }, { bd:1 }],
    ['C1', 'ceramic', 'a', 39, { C:100e-9 }, { 1:'vn', 2:'comp' }, { bd:1 }],
    ['U3', 'ic', 'e', 52, { part:'358' }, { 1:'vo', 2:'io', 3:'gnd', 4:'vn', 8:'vp' }, { bd:1 }],
    ['Rf', 'resistor', 'j', 49, { R:4700 }, { A:'vo', B:'io' }, { bd:1 }]
  ];
  if (!alias) parts.push(['R16', 'pot', 'c', 26, { R:10000, pos:0.4 }, { 1:'gnd', W:'vina', 3:'v5' }]);
  for (let k = 0; k < 8; k++) {
    const x = 46 + 6 * k;
    parts.push(['RL' + k, 'resistor', 'j', x, { R:1000 }, { A:'v5', B:'la' + k }]);
    parts.push(['D' + (k + 1), 'led', 'h', x + 4, { color:'rojo' }, { A:'la' + k, K:'d' + k }]);
  }
  const bench = [['PS', 'supply', { V:15, I:1, dual:true }, { '+':'vp', '-':'vn', gnd:'gnd' }],
    ['FG', 'fgen', { wave:'square', f:alias ? 5000 : 5000, vpp:5, off:2.5, duty:90 }, { out:'wr', gnd:'gnd' }],
    SCOPE(alias ? { tb:5e-3, v1:2, v2:2, p1:-1, p2:-1 } : { tb:1e-3, v1:2, v2:2, p1:-2, p2:-2 }, { ch1:'vin', ch2:'vo', gnd:'gnd' })];
  if (alias) bench.push(['FG2', 'fgen', { wave:'sine', f:60, vpp:4.6, off:2.5 }, { out:'vina', gnd:'gnd' }, { x:5, z:-150 }]);
  return sinRefs(montaje({ board:{ cols:94, n:2 }, rails:{ N1:'vn', P1:'vp', P2:'v5', N2:'gnd' }, parts, bench }));
}
// Práctica 6 — prueba del TL494
function scenarioP6Tl() {
  return sinRefs(montaje({
    rails:{ N1:'gnd', P1:'vp', P2:'vp', N2:'gnd' },
    parts:[
      ['U1', 'ic', 'e', 30, { part:'tl494' }, { 1:'in1', 2:'in2', 3:'fb', 4:'gnd', 5:'ct', 6:'rt', 7:'gnd', 8:'c1', 9:'gnd', 10:'gnd', 11:'c1', 12:'vp', 13:'gnd', 14:'ref', 15:'ref', 16:'gnd' }],
      ['R1', 'resistor', 'j', 35, { R:56000 }, { A:'rt', B:'gnd' }],
      ['C1', 'ceramic', 'i', 33, { C:1e-9 }, { 1:'ct', 2:'gnd' }, { flip:true }],
      ['R5', 'resistor', 'j', 26, { R:5100 }, { A:'vg', B:'in1' }],
      ['R6', 'resistor', 'h', 16, { R:5100 }, { A:'gnd', B:'in1' }],
      ['R8', 'resistor', 'c', 27, { R:5100 }, { A:'in2', B:'ref' }],
      ['R9', 'resistor', 'd', 23, { R:5100 }, { A:'gnd', B:'in2' }],
      ['R3', 'resistor', 'h', 40, { R:5100 }, { A:'fb', B:'in2' }],
      ['R11', 'resistor', 'a', 35, { R:470 }, { A:'c1', B:'vp' }]
    ],
    bench:[['PS', 'supply', { V:15, I:1 }, { '+':'vp', '-':'gnd' }], ['FG', 'fgen', { wave:'square', f:200, vpp:1, off:5, duty:50 }, { out:'vg', gnd:'gnd' }],
      SCOPE({ tb:2e-5, v1:1, v2:5, p1:-2, p2:-2 }, { ch1:'ct', ch2:'c1', gnd:'gnd' })]
  }));
}
// Práctica 6 — regulador conmutado reductor de 15 V a 5 V / 1 A con TL494
function scenarioP6Buck() {
  return sinRefs(montaje({
    board:{ cols:94, n:1 }, rails:{ N1:'gnd', P1:'vp', P2:'vp', N2:'gnd' },
    parts:[
      ['U1', 'ic', 'e', 30, { part:'tl494' }, { 1:'in1', 2:'in2', 3:'fb', 4:'dtc', 5:'ct', 6:'rt', 7:'gnd', 8:'c1', 9:'gnd', 10:'gnd', 11:'c1', 12:'vp', 13:'gnd', 14:'ref', 15:'in3', 16:'ls' }],
      ['RT', 'resistor', 'j', 35, { R:56000 }, { A:'rt', B:'gnd' }],
      ['CT', 'ceramic', 'h', 42, { C:1e-9 }, { 1:'ct', 2:'gnd' }],
      ['Rss', 'resistor', 'i', 29, { R:10000 }, { A:'gnd', B:'dtc' }],
      ['Css', 'ceramic', 'g', 45, { C:1e-6 }, { 1:'dtc', 2:'ref' }],
      ['Ra', 'resistor', 'j', 26, { R:5100 }, { A:'vout', B:'in1' }],
      ['Rb', 'resistor', 'i', 16, { R:5100 }, { A:'gnd', B:'in1' }],
      ['Rc', 'resistor', 'c', 28, { R:5100 }, { A:'in2', B:'ref' }],
      ['Rd', 'resistor', 'd', 24, { R:5100 }, { A:'gnd', B:'in2' }],
      ['Rcomp', 'resistor', 'h', 48, { R:47000 }, { A:'fb', B:'in2' }],
      ['Re', 'resistor', 'a', 27, { R:33000 }, { A:'ref', B:'in3' }],
      ['Rf', 'resistor', 'd', 18, { R:1000 }, { A:'gnd', B:'in3' }],
      ['Q1', 'tip42', 'c', 56, {}, { B:'qb', C:'sw', E:'vp' }],
      ['Rbe', 'resistor', 'a', 58, { R:470 }, { A:'vp', B:'qb' }],
      ['Rbs', 'resistor', 'd', 52, { R:220 }, { A:'c1', B:'qb' }],
      ['D1', 'diode', 'j', 58, { model:'1N5819' }, { A:'gnd', K:'sw' }],
      ['L1', 'inductor', 'h', 62, { L:1e-3, R:0.3 }, { 1:'sw', 2:'vout' }],
      ['C2', 'capacitor', 'g', 64, { C:470e-6, Vmax:25 }, { '+':'vout', '-':'gnd' }],
      ['RL', 'rpower', 'j', 70, { R:5 }, { A:'vout', B:'ls' }],
      ['Rs', 'rpower', 'i', 76, { R:0.1 }, { A:'ls', B:'gnd' }]
    ],
    bench:[['PS', 'supply', { V:15, I:3 }, { '+':'vp', '-':'gnd' }],
      SCOPE({ tb:2e-5, v1:2, v2:5, p1:-2, p2:-3 }, { ch1:'vout', ch2:'sw', gnd:'gnd' })]
  }));
}

/* ---------- Robótica ---------- */
function roboProj(p, mode) { p.robo = { mode, track:'ovalo' }; return p; }
const MOT_POS = { izq:{ x:150, z:40 }, der:{ x:150, z:110 } };
function scenarioRoboArm() {
  const pots = [['P1', 6, 'w0'], ['P2', 12, 'w1'], ['P3', 18, 'w2'], ['P4', 24, 'w3']];
  const p = sinRefs(montaje({
    board:{ cols:30, n:1 }, rails:{ N1:'gnd', P1:'v5', P2:'v5', N2:'gnd' },
    parts:pots.map((q, i) => [q[0], 'pot', 'e', q[1], { R:10000, pos:[0.5, 0.6, 0.45, 0.8][i] }, { 1:'gnd', W:q[2], 3:'v5' }]),
    bench:[
      ['ARD', 'arduino', { code:"// Brazo robótico de 4 servos controlado con 4 potenciómetros\n#include <Servo.h>\n\nServo base;\nServo hombro;\nServo codo;\nServo pinza;\n\nvoid setup() {\n  base.attach(3);\n  hombro.attach(5);\n  codo.attach(6);\n  pinza.attach(9);\n}\n\nvoid loop() {\n  base.write(map(analogRead(A0), 0, 1023, 0, 180));\n  hombro.write(map(analogRead(A1), 0, 1023, 0, 180));\n  codo.write(map(analogRead(A2), 0, 1023, 0, 180));\n  pinza.write(map(analogRead(A3), 0, 1023, 20, 90));   // 20° = cerrada, 90° = abierta\n  delay(15);\n}\n" }, { A0:'w0', A1:'w1', A2:'w2', A3:'w3', D3:'s0', D5:'s1', D6:'s2', D9:'s3', '5V':'v5', GND:'gnd' }, { x:-95, z:20 }],
      ['PS', 'supply', { V:5, I:3 }, { '+':'vsv', '-':'gnd' }],
      ['ARM', 'brazo3d', { servos:true }, { GND:'gnd', VCC:'vsv', S1:'s0', S2:'s1', S3:'s2', S4:'s3' }, { x:300, z:260 }]
    ]
  }));
  return roboProj(p, 'arm');
}

/* ---------- Robótica 3D: robots ensamblados sobre el chasis ---------- */
function montarEn(p, chasisName, mounts) {
  const ch = p.inst[chasisName];
  Object.keys(mounts).forEach(n => { const c = p.inst[n] || p.comps[n]; if (c) { c.mount = ch.id; c.slot = mounts[n]; } });
  return p;
}
function robotLine(code, analog) {
  const ard = analog ? [] : [['ARD', 'arduino', { code }, { D8:'in1', D7:'in2', D5:'in3', D4:'in4', D9:'ena', D10:'enb', D2:'sl', D3:'sr', '5V':'v5', GND:'gnd' }]];
  const p = montaje({ board:{ cols:30, n:1 }, rails:{}, parts:[],
    bench:[['CH', 'chasis2wd', { pista:'ovalo', mot:true }, { 'M_IZQ+':'ml1', 'M_IZQ-':'ml2', 'M_DER+':'mr1', 'M_DER-':'mr2' }],
      ['BAT', 'portapilas', { celdas:6, on:true }, { '+':'vbat', '-':'gnd' }]].concat(ard, [
      ['DRV', 'l298n', { ena:!!analog, enb:!!analog, reg5:true }, analog ? { IN1:'v5', IN2:'sl', IN3:'v5', IN4:'sr', '12V':'vbat', GND:'gnd', '5V':'v5', OUT1:'ml1', OUT2:'ml2', OUT3:'mr1', OUT4:'mr2' }
        : { IN1:'in1', IN2:'in2', IN3:'in3', IN4:'in4', ENA:'ena', ENB:'enb', '12V':'vbat', GND:'gnd', OUT1:'ml1', OUT2:'ml2', OUT3:'mr1', OUT4:'mr2' }],
      ['IR', 'tcrt', { auto:true, line:null }, { VCC:'v5', GND:'gnd', DO_L:'sl', DO_R:'sr' }]]) });
  montarEn(p, 'CH', Object.assign({ BAT:'bat', DRV:'drv', IR:'irF' }, analog ? {} : { ARD:'ard' }));
  p.robo = { mode:'line', track:'ovalo' };
  return sinRefs(p);
}
function scenarioRoboLine() { return robotLine("// Seguidor de líneas con Arduino + TCRT5000 doble + puente H L298N\n// El sensor da HIGH cuando ve la línea negra.\nint IN1 = 8;    // motor izquierdo\nint IN2 = 7;\nint IN3 = 5;    // motor derecho\nint IN4 = 4;\nint ENA = 9;    // velocidad izquierda (PWM)\nint ENB = 10;   // velocidad derecha (PWM)\nint SENS_IZQ = 2;\nint SENS_DER = 3;\nint VEL = 150;  // velocidad en recta (0-255)\nint GIRO = 40;  // velocidad de la rueda interior al corregir\n\nvoid motores(int izq, int der) {\n  digitalWrite(IN1, izq >= 0 ? HIGH : LOW);\n  digitalWrite(IN2, izq >= 0 ? LOW : HIGH);\n  digitalWrite(IN3, der >= 0 ? HIGH : LOW);\n  digitalWrite(IN4, der >= 0 ? LOW : HIGH);\n  analogWrite(ENA, abs(izq));\n  analogWrite(ENB, abs(der));\n}\n\nvoid setup() {\n  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);\n  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);\n  pinMode(SENS_IZQ, INPUT); pinMode(SENS_DER, INPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int izq = digitalRead(SENS_IZQ);\n  int der = digitalRead(SENS_DER);\n  if (izq == LOW && der == LOW) motores(VEL, VEL);        // línea centrada: recto\n  else if (izq == HIGH && der == LOW) motores(GIRO, VEL); // línea a la izquierda: girar a la izquierda\n  else if (izq == LOW && der == HIGH) motores(VEL, GIRO); // línea a la derecha: girar a la derecha\n  else motores(VEL, VEL);                                 // ambos en negro: cruce, seguir recto\n  delay(5);\n}\n", false); }
function scenarioRoboLineAn() { return robotLine('', true); }
function scenarioRoboAvoid() {
  const p = montaje({ board:{ cols:30, n:1 }, rails:{}, parts:[],
    bench:[['CH', 'chasis2wd', { pista:'obstaculos', mot:true }, { 'M_IZQ+':'ml1', 'M_IZQ-':'ml2', 'M_DER+':'mr1', 'M_DER-':'mr2' }],
      ['BAT', 'portapilas', { celdas:6, on:true }, { '+':'vbat', '-':'gnd' }],
      ['ARD', 'arduino', { code:"// Robot evasor de obstáculos: HC-SR04 + puente H L298N (IN1..IN4 = D8, D7, D5, D4; ENA/ENB = D9/D10)\nint TRIG = 12;\nint ECHO = 11;\n\nvoid motores(int izq, int der) {\n  digitalWrite(8, izq >= 0 ? HIGH : LOW); digitalWrite(7, izq >= 0 ? LOW : HIGH);\n  digitalWrite(5, der >= 0 ? HIGH : LOW); digitalWrite(4, der >= 0 ? LOW : HIGH);\n  analogWrite(9, abs(izq)); analogWrite(10, abs(der));\n}\n\nlong distanciaCm() {\n  digitalWrite(TRIG, LOW);\n  delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH);      // pulso de 10 µs\n  delayMicroseconds(10);\n  digitalWrite(TRIG, LOW);\n  long t = pulseIn(ECHO, HIGH, 30000);   // tiempo de ida y vuelta en µs\n  if (t == 0) return 400;\n  return t / 58;                 // 58 µs por cada cm\n}\n\nvoid setup() {\n  pinMode(TRIG, OUTPUT); pinMode(ECHO, INPUT);\n  pinMode(8, OUTPUT); pinMode(7, OUTPUT); pinMode(5, OUTPUT); pinMode(4, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  long d = distanciaCm();\n  Serial.println(d);\n  if (d < 18) {\n    motores(-160, -160);   // retroceder\n    delay(300);\n    motores(170, -170);    // girar sobre sí mismo\n    delay(250);\n  } else {\n    motores(170, 170);     // avanzar\n  }\n  delay(30);\n}\n" }, { D8:'in1', D7:'in2', D5:'in3', D4:'in4', D9:'ena', D10:'enb', D12:'trig', D11:'echo', '5V':'v5', GND:'gnd' }],
      ['DRV', 'l298n', { ena:false, enb:false, reg5:true }, { IN1:'in1', IN2:'in2', IN3:'in3', IN4:'in4', ENA:'ena', ENB:'enb', '12V':'vbat', GND:'gnd', OUT1:'ml1', OUT2:'ml2', OUT3:'mr1', OUT4:'mr2' }],
      ['US', 'hcsr04', { auto:true, dist:50 }, { VCC:'v5', GND:'gnd', TRIG:'trig', ECHO:'echo' }]] });
  montarEn(p, 'CH', { BAT:'bat', ARD:'ard', DRV:'drv', US:'usF' });
  p.robo = { mode:'avoid', track:'ovalo' };
  return sinRefs(p);
}
function scenarioRoboBal() {
  const p = montaje({ board:{ cols:30, n:1 }, rails:{}, parts:[],
    bench:[['CHB', 'chasisbal', { mot:true }, { 'M_IZQ+':'ml1', 'M_IZQ-':'ml2', 'M_DER+':'mr1', 'M_DER-':'mr2' }],
      ['BAT', 'portapilas', { celdas:8, on:true }, { '+':'vbat', '-':'gnd' }],
      ['ARD', 'arduino', { code:"// Robot de auto-balanceo: MPU6050 (I2C) + control PID + L298N\n#include <Wire.h>\n\nfloat Kp = 800;       // proporcional: corrige según cuánto está inclinado (error en radianes)\nfloat Ki = 8000;      // integral: con motores DC el PWM fija la velocidad; la integral da la aceleración que levanta al robot\nfloat Kd = 20;        // derivativo: frena la caída (amortigua las oscilaciones)\nfloat angulo = 0;     // ángulo filtrado (grados)\nfloat integral = 0;\nunsigned long tPrev = 0;\nfloat vel = 0;        // estimación de la velocidad de avance (lazo externo)\nfloat Kv = 3;         // cuánto se inclina la consigna para frenar la deriva\n\nvoid motores(int u) {\n  u = constrain(u, -255, 255);\n  digitalWrite(8, u >= 0 ? HIGH : LOW); digitalWrite(7, u >= 0 ? LOW : HIGH);\n  digitalWrite(5, u >= 0 ? HIGH : LOW); digitalWrite(4, u >= 0 ? LOW : HIGH);\n  analogWrite(9, abs(u)); analogWrite(10, abs(u));\n}\n\nvoid setup() {\n  Wire.begin();\n  Wire.beginTransmission(0x68);\n  Wire.write(0x6B);            // registro PWR_MGMT_1\n  Wire.write(0);               // despertar el MPU6050\n  Wire.endTransmission();\n  pinMode(8, OUTPUT); pinMode(7, OUTPUT); pinMode(5, OUTPUT); pinMode(4, OUTPUT);\n  Serial.begin(115200);\n  tPrev = micros();\n}\n\nvoid loop() {\n  Wire.beginTransmission(0x68);\n  Wire.write(0x3B);            // primer registro del acelerómetro\n  Wire.endTransmission(false);\n  Wire.requestFrom(0x68, 14);\n  int16_t ax = Wire.read() << 8 | Wire.read();\n  int16_t ay = Wire.read() << 8 | Wire.read();\n  int16_t az = Wire.read() << 8 | Wire.read();\n  int16_t tmp = Wire.read() << 8 | Wire.read();\n  int16_t gx = Wire.read() << 8 | Wire.read();\n  int16_t gy = Wire.read() << 8 | Wire.read();\n  int16_t gz = Wire.read() << 8 | Wire.read();\n\n  unsigned long ahora = micros();\n  float dt = (ahora - tPrev) / 1000000.0;\n  tPrev = ahora;\n  float angAcel = atan2(ax, az) * 57.2958;   // ángulo según la gravedad\n  float velGiro = gy / 131.0;                // grados por segundo\n  angulo = 0.98 * (angulo + velGiro * dt) + 0.02 * angAcel;   // filtro complementario\n\n  vel = 0.98 * vel + 0.02 * integral;        // la integral es proporcional a la velocidad pedida a las ruedas\n  float e = angulo / 57.2958 + Kv * vel;     // error en radianes: consigna 0° corregida para no alejarse\n  integral = integral + e * dt;\n  float u = Kp * e + Ki * integral + Kd * velGiro / 57.2958;\n  if (abs(angulo) > 40) { u = 0; integral = 0; }   // si ya cayó, apagar motores\n  motores((int)u);\n  delay(4);\n}\n" }, { D8:'in1', D7:'in2', D5:'in3', D4:'in4', D9:'ena', D10:'enb', A4:'sda', A5:'scl', '5V':'v5', GND:'gnd' }],
      ['DRV', 'l298n', { ena:false, enb:false, reg5:true }, { IN1:'in1', IN2:'in2', IN3:'in3', IN4:'in4', ENA:'ena', ENB:'enb', '12V':'vbat', GND:'gnd', OUT1:'ml1', OUT2:'ml2', OUT3:'mr1', OUT4:'mr2' }],
      ['IMU', 'mpu6050', { auto:true, pitch:0 }, { VCC:'v5', GND:'gnd', SDA:'sda', SCL:'scl' }]] });
  montarEn(p, 'CHB', { BAT:'bat', ARD:'ard', DRV:'drv', IMU:'imu' });
  p.robo = { mode:'bal', track:'ovalo' };
  return sinRefs(p);
}
/* ---------- Circuitos digitales ---------- */
function scenarioDigChase() {
  const parts = [
    ['U1', 'ic', 'e', 6, { part:'555' }, { 1:'gnd', 2:'ct', 3:'clk', 4:'v5', 5:'ctl', 6:'ct', 7:'dis', 8:'v5' }],
    ['RA', 'resistor', 'c', 3, { R:10000 }, { A:'v5', B:'dis' }],
    ['RB', 'resistor', 'b', 7, { R:68000 }, { A:'dis', B:'ct' }],
    ['C1', 'capacitor', 'h', 2, { C:2.2e-6, Vmax:16 }, { '+':'ct', '-':'gnd' }],
    ['C2', 'ceramic', 'a', 9, { C:10e-9 }, { 1:'ctl', 2:'gnd' }],
    ['U2', 'ic', 'e', 16, { part:'4017' }, { 3:'q0', 2:'q1', 4:'q2', 7:'q3', 10:'q4', 1:'q5', 5:'q6', 6:'q7', 9:'q8', 11:'q9', 8:'gnd', 13:'gnd', 14:'clk', 15:'gnd', 16:'v5' }],
    ['RL', 'resistor', 'j', 54, { R:470 }, { A:'k', B:'gnd' }]
  ];
  for (let i = 0; i < 10; i++) parts.push(['D' + (i + 1), 'led', i % 2 ? 'h' : 'g', 30 + i * 2, { color:['rojo', 'amarillo', 'verde'][i % 3] }, { A:'q' + i, K:'k' }]);
  return sinRefs(montaje({ board:{ cols:63, n:1 }, rails:{ N1:'gnd', P1:'v5', P2:'v5', N2:'gnd' }, parts,
    bench:[['PS', 'supply', { V:5, I:1 }, { '+':'v5', '-':'gnd' }], SCOPE({ tb:0.2, v1:5, v2:5, p1:-1, p2:-3 }, { ch1:'clk', ch2:'q0', gnd:'gnd' })] }));
}
function scenarioDigAdder() {
  return sinRefs(montaje({ board:{ cols:63, n:1 }, rails:{ N1:'gnd', P1:'v5', P2:'v5', N2:'gnd' },
    parts:[
      ['SW', 'dipsw', 'e', 4, { n:2, on:[false, false] }, { 1:'a', 2:'b', 3:'v5', 4:'v5' }],
      ['RA', 'resistor', 'h', 4, { R:10000 }, { A:'a', B:'gnd' }],
      ['RB', 'resistor', 'i', 5, { R:10000 }, { A:'b', B:'gnd' }],
      ['U1', 'ic', 'e', 14, { part:'7486' }, { 1:'a', 2:'b', 3:'s', 7:'gnd', 14:'v5' }],
      ['U2', 'ic', 'e', 26, { part:'7408' }, { 1:'a', 2:'b', 3:'cy', 7:'gnd', 14:'v5' }],
      ['R1', 'resistor', 'i', 40, { R:330 }, { A:'s', B:'ls' }],
      ['LS', 'led', 'h', 44, { color:'verde' }, { A:'ls', K:'gnd' }],
      ['R2', 'resistor', 'i', 48, { R:330 }, { A:'cy', B:'lc' }],
      ['LC', 'led', 'h', 52, { color:'rojo' }, { A:'lc', K:'gnd' }]
    ],
    bench:[['PS', 'supply', { V:5, I:1 }, { '+':'v5', '-':'gnd' }]] }));
}
function ardCode(p, a, code) { a.p.code = code; return p; }
function scenarioArdBlink() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  part(p, 'resistor', 'b', 10, { R:220 });
  part(p, 'led', 'c', 14, { color:'rojo' });
  addWire(p, T(a, 'D13'), H('a', 10)); addWire(p, H('d', 15), T(a, 'GND'));
  return p;
}
function scenarioArdServo() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  const sv = bench(p, 'servo', {});
  addWire(p, T(sv, 'GND'), T(a, 'GND2')); addWire(p, T(sv, 'VCC'), T(a, '5V')); addWire(p, T(sv, 'SIG'), T(a, 'D9'));
  return ardCode(p, a, '#include <Servo.h>\n\nServo servo;\n\nvoid setup() {\n  servo.attach(9);\n}\n\nvoid loop() {\n  for (int ang = 0; ang <= 180; ang += 5) {\n    servo.write(ang);\n    delay(30);\n  }\n  for (int ang = 180; ang >= 0; ang -= 5) {\n    servo.write(ang);\n    delay(30);\n  }\n}\n');
}
function scenarioArdLcd() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  part(p, 'lcd', 'j', 5, { size:'16x2', color:'verde' });
  addWire(p, T(a, '5V'), H('P1', 2)); addWire(p, T(a, 'GND'), H('N1', 2));
  addWire(p, H('i', 5), H('N1', 5)); addWire(p, H('i', 6), H('P1', 6)); addWire(p, H('i', 7), H('N1', 7)); addWire(p, H('i', 9), H('N1', 9));
  addWire(p, H('i', 19), H('P1', 19)); addWire(p, H('i', 20), H('N1', 20));
  addWire(p, H('i', 8), T(a, 'D12')); addWire(p, H('i', 10), T(a, 'D11'));
  addWire(p, H('i', 15), T(a, 'D5')); addWire(p, H('i', 16), T(a, 'D4')); addWire(p, H('i', 17), T(a, 'D3')); addWire(p, H('i', 18), T(a, 'D2'));
  return ardCode(p, a, '#include <LiquidCrystal.h>\n\n// RS, E, D4, D5, D6, D7\nLiquidCrystal lcd(12, 11, 5, 4, 3, 2);\n\nvoid setup() {\n  lcd.begin(16, 2);\n  lcd.print("Hola mundo!");\n}\n\nvoid loop() {\n  lcd.setCursor(0, 1);\n  int seg = millis() / 1000;\n  lcd.print("Tiempo: ");\n  lcd.print(seg);\n  lcd.print(" s");\n  delay(200);\n}\n');
}
function scenarioBjt() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  part(p, 'bjt2222', 'c', 20, {});
  part(p, 'resistor', 'a', 17, { R:1000 });
  part(p, 'led', 'e', 22, { color:'verde' }, { flip:true });
  part(p, 'resistor', 'd', 23, { R:220 });
  addWire(p, T(a, '5V'), H('P1', 2)); addWire(p, T(a, 'GND'), H('N1', 2));
  addWire(p, T(a, 'D9'), H('d', 17)); addWire(p, H('a', 27), H('P1', 27)); addWire(p, H('b', 20), H('N1', 20));
  return ardCode(p, a, '// 2N2222 como interruptor: D9 -> 1 kOhm -> base; LED + 220 Ohm en el colector\nvoid setup() {\n  pinMode(9, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(9, HIGH);\n  Serial.println("Base en alto: transistor saturado, LED encendido");\n  delay(1000);\n  digitalWrite(9, LOW);\n  Serial.println("Base en bajo: transistor en corte");\n  delay(1000);\n}\n');
}
function scenarioTipMotor() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  const f = bench(p, 'supply', { V:9, I:2 });
  const mo = makeComp(p, 'gearmotor', { x:110, z:-62 }); p.components.push(mo);
  part(p, 'tip120', 'c', 20, {});
  part(p, 'resistor', 'a', 16, { R:1000 });
  addWire(p, T(a, 'D9'), H('d', 16)); addWire(p, H('b', 21), T(mo, '-')); addWire(p, T(mo, '+'), T(f, '+'));
  addWire(p, H('b', 22), H('N1', 22)); addWire(p, T(f, '-'), H('N1', 1)); addWire(p, T(a, 'GND'), H('N1', 2));
  return ardCode(p, a, '// TIP120 maneja el motor a 9 V; D9 regula la velocidad con PWM\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  for (int v = 0; v <= 255; v += 15) {\n    analogWrite(9, v);\n    Serial.print("PWM: ");\n    Serial.println(v);\n    delay(200);\n  }\n  delay(1000);\n  analogWrite(9, 0);\n  delay(1000);\n}\n');
}
function scenarioArdSeg() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  part(p, 'seg7', 'd', 20, { model:'1cc', color:'rojo' });
  part(p, 'resistor', 'b', 22, { R:220 });
  addWire(p, T(a, 'GND'), H('N1', 2)); addWire(p, H('c', 26), H('N1', 26));
  addWire(p, T(a, 'D2'), H('a', 23)); addWire(p, T(a, 'D3'), H('a', 24)); addWire(p, T(a, 'D4'), H('j', 23)); addWire(p, T(a, 'D5'), H('j', 21));
  addWire(p, T(a, 'D6'), H('j', 20)); addWire(p, T(a, 'D7'), H('a', 21)); addWire(p, T(a, 'D8'), H('a', 20));
  return ardCode(p, a, '// Contador 0-9 en display de 7 segmentos (cátodo común)\n// Segmentos a..g en D2..D8\nconst byte DIG[10] = {0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F};\n\nvoid setup() {\n  for (int p = 2; p <= 8; p++) pinMode(p, OUTPUT);\n}\n\nvoid loop() {\n  for (int n = 0; n < 10; n++) {\n    for (int s = 0; s < 7; s++) {\n      digitalWrite(2 + s, (DIG[n] >> s) & 1);\n    }\n    delay(700);\n  }\n}\n');
}
function scenarioEspLcd() {
  const p = newProject();
  part(p, 'mcu', 'b', 2, { chip:'esp32v1', code:'#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\nvoid setup() {\n  lcd.init();\n  lcd.backlight();\n  lcd.print("ESP32 + LCD I2C");\n  pinMode(2, OUTPUT);\n}\n\nvoid loop() {\n  int seg = millis() / 1000;\n  lcd.setCursor(0, 1);\n  lcd.print("Contador: ");\n  lcd.print(seg);\n  digitalWrite(2, seg % 2);\n  delay(250);\n}\n' });
  const l = makeComp(p, 'lcdi2c16', { x:-108, z:2 }); p.components.push(l);
  addWire(p, H('j', 14), T(l, 'GND')); addWire(p, H('a', 2), T(l, 'VCC')); addWire(p, H('j', 15), T(l, 'SDA')); addWire(p, H('j', 18), T(l, 'SCL'));
  return p;
}
function scenarioStepper() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  const u = makeComp(p, 'stepkit', { x:40, z:-72 }); p.components.push(u);
  addWire(p, T(a, 'D8'), T(u, 'IN1')); addWire(p, T(a, 'D9'), T(u, 'IN2')); addWire(p, T(a, 'D10'), T(u, 'IN3')); addWire(p, T(a, 'D11'), T(u, 'IN4'));
  addWire(p, T(a, 'GND2'), T(u, '-')); addWire(p, T(a, '5V'), T(u, '+'));
  return ardCode(p, a, '#include <Stepper.h>\n\n// 2048 pasos por vuelta; orden IN1, IN3, IN2, IN4\nStepper motor(2048, 8, 10, 9, 11);\n\nvoid setup() {\n  motor.setSpeed(10);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println("Media vuelta adelante");\n  motor.step(1024);\n  delay(500);\n  Serial.println("Media vuelta atras");\n  motor.step(-1024);\n  delay(500);\n}\n');
}
function scenarioL293() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  const m = bench(p, 'gearmotor', {});
  part(p, 'ic', 'e', 10, { part:'293' });
  addWire(p, T(a, '5V'), H('P1', 2)); addWire(p, T(a, '5V'), H('P2', 3)); addWire(p, T(a, 'GND'), H('N2', 2));
  addWire(p, H('a', 10), H('P1', 10)); addWire(p, H('j', 17), H('P2', 17)); addWire(p, H('j', 13), H('N2', 13));
  addWire(p, T(a, 'D9'), H('j', 10)); addWire(p, T(a, 'D8'), H('j', 11)); addWire(p, T(a, 'D7'), H('j', 16));
  addWire(p, T(m, '+'), H('g', 12)); addWire(p, T(m, '-'), H('g', 15));
  return ardCode(p, a, '// Motorreductor con L293D: EN1 = D9 (PWM), 1A = D8, 2A = D7\nvoid setup() {\n  pinMode(8, OUTPUT);\n  pinMode(7, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  digitalWrite(7, LOW);\n  for (int v = 0; v <= 255; v += 15) {\n    analogWrite(9, v);\n    Serial.print("Velocidad: ");\n    Serial.println(v);\n    delay(150);\n  }\n  delay(1000);\n  analogWrite(9, 0);\n  delay(500);\n  digitalWrite(8, LOW);\n  digitalWrite(7, HIGH);\n  analogWrite(9, 180);\n  Serial.println("Reversa");\n  delay(1500);\n  analogWrite(9, 0);\n  delay(500);\n}\n');
}
function scenarioL298() {
  const p = newProject();
  const a = bench(p, 'arduino', {});
  const f = bench(p, 'supply', { V:9, I:2 });
  const d = makeComp(p, 'l298n', { x:20, z:-66, p:{ ena:false } }); p.components.push(d);
  const m = makeComp(p, 'gearmotor', { x:100, z:-62 }); p.components.push(m);
  addWire(p, T(f, '+'), T(d, '12V')); addWire(p, T(f, '-'), T(d, 'GND')); addWire(p, T(a, 'GND2'), T(d, 'GND'));
  addWire(p, T(a, 'D9'), T(d, 'ENA')); addWire(p, T(a, 'D8'), T(d, 'IN1')); addWire(p, T(a, 'D7'), T(d, 'IN2'));
  addWire(p, T(m, '+'), T(d, 'OUT1')); addWire(p, T(m, '-'), T(d, 'OUT2'));
  return ardCode(p, a, '// Motorreductor con el módulo L298N\n// ENA = D9 (PWM, sin el puente ENA), IN1 = D8, IN2 = D7\nvoid setup() {\n  pinMode(8, OUTPUT);\n  pinMode(7, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  digitalWrite(8, HIGH);\n  digitalWrite(7, LOW);\n  for (int v = 60; v <= 255; v += 15) {\n    analogWrite(9, v);\n    Serial.print("Velocidad: ");\n    Serial.println(v);\n    delay(200);\n  }\n  delay(1000);\n  analogWrite(9, 0);\n  delay(600);\n  digitalWrite(8, LOW);\n  digitalWrite(7, HIGH);\n  analogWrite(9, 200);\n  Serial.println("Reversa");\n  delay(1500);\n  analogWrite(9, 0);\n  delay(600);\n}\n');
}
function scenarioPic() {
  const p = newProject();
  p.board = { cols:63, n:1 };
  setLayout(p.board);
  const f = bench(p, 'supply', { V:5, I:1 });
  part(p, 'mcu', 'd', 4, { chip:'pic18f4550', code:'// Luces secuenciales en RB0..RB3 (estilo CCS C)\nvoid main() {\n  set_tris_b(0x00);\n  int i;\n  while (TRUE) {\n    for (i = 0; i < 4; i++) {\n      output_b(1 << i);\n      delay_ms(200);\n    }\n  }\n}\n' });
  part(p, 'resistor', 'h', 0, { R:10000 });
  addWire(p, T(f, '+'), H('P1', 1)); addWire(p, T(f, '+'), H('P2', 1)); addWire(p, T(f, '-'), H('N1', 1)); addWire(p, T(f, '-'), H('N2', 1));
  addWire(p, H('a', 12), H('P1', 12)); addWire(p, H('a', 13), H('N1', 13)); addWire(p, H('j', 14), H('P2', 14)); addWire(p, H('j', 15), H('N2', 15));
  addWire(p, H('j', 0), H('P2', 0));
  [11, 10, 9, 8].forEach((pc, i) => {
    const X = 26 + i * 6;
    addWire(p, H('b', pc), H('a', X));
    part(p, 'resistor', 'b', X, { R:330 });
    part(p, 'led', 'c', X + 4, { color:['rojo', 'amarillo', 'verde', 'azul'][i] });
    addWire(p, H('d', X + 5), H('N1', X + 5));
  });
  return p;
}

/* ---------- álgebra ---------- */
function solveDense(A, B, n, X) {
  // LU en banda con pivoteo parcial: mide la banda real de la matriz y limita todos los recorridos a ella
  let bl = 0, bu = 0;
  for (let i = 0; i < n; i++) {
    const r = i * n;
    for (let j = 0; j < i - bl; j++) if (A[r + j] !== 0) { bl = i - j; break; }
    for (let j = n - 1; j > i + bu; j--) if (A[r + j] !== 0) { bu = j - i; break; }
  }
  const ub = bu + bl;
  let idx = solveDense.idx;
  if (!idx || idx.length < n) idx = solveDense.idx = new Int32Array(Math.max(n, 64));
  for (let k = 0; k < n; k++) {
    const iend = Math.min(n - 1, k + bl), jend = Math.min(n - 1, k + ub);
    let piv = k, mx = Math.abs(A[k * n + k]);
    for (let i = k + 1; i <= iend; i++) { const v = Math.abs(A[i * n + k]); if (v > mx) { mx = v; piv = i; } }
    if (mx < 1e-18) return false;
    if (piv !== k) {
      for (let j = k; j <= jend; j++) { const t = A[k * n + j]; A[k * n + j] = A[piv * n + j]; A[piv * n + j] = t; }
      const tb = B[k]; B[k] = B[piv]; B[piv] = tb;
    }
    const kn = k * n, d = A[kn + k];
    let m = 0;
    for (let j = k + 1; j <= jend; j++) if (A[kn + j] !== 0) idx[m++] = j;
    for (let i = k + 1; i <= iend; i++) {
      const in_ = i * n, f = A[in_ + k] / d;
      if (f === 0) continue;
      A[in_ + k] = 0;
      for (let q = 0; q < m; q++) { const j = idx[q]; A[in_ + j] -= f * A[kn + j]; }
      B[i] -= f * B[k];
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = B[i];
    const in_ = i * n, jend = Math.min(n - 1, i + ub);
    for (let j = i + 1; j <= jend; j++) { const a = A[in_ + j]; if (a !== 0) s -= a * X[j]; }
    X[i] = s / A[in_ + i];
  }
  return true;
}
function pnjlim(vnew, vold, vt, vcrit) {
  if (vnew > vcrit && Math.abs(vnew - vold) > 2 * vt) {
    if (vold > 0) { const arg = 1 + (vnew - vold) / vt; vnew = arg > 0 ? vold + vt * Math.log(arg) : vcrit; }
    else vnew = vt * Math.log(vnew / vt);
  }
  return vnew;
}
function sG(G, n, ia, ib, g) {
  if (ia >= 0) G[ia * n + ia] += g;
  if (ib >= 0) G[ib * n + ib] += g;
  if (ia >= 0 && ib >= 0) { G[ia * n + ib] -= g; G[ib * n + ia] -= g; }
}
function gE(G, n, r, c, v) { if (r >= 0 && c >= 0) G[r * n + c] += v; }
/* Interruptor promediado: la salida o vale d·V(v) + (1−d)·V(gn) con resistencia 1/g,
   y la corriente se toma de v en proporción d (la fuente entrega d·I, como un puente H real). */
function sAvg(G, n, o, v, gn, g, d) {
  gE(G, n, o, o, g); gE(G, n, o, v, -g * d); gE(G, n, o, gn, -g * (1 - d));
  gE(G, n, v, v, g * d * d); gE(G, n, v, gn, g * d * (1 - d)); gE(G, n, v, o, -g * d);
  gE(G, n, gn, v, g * d * (1 - d)); gE(G, n, gn, gn, g * (1 - d) * (1 - d)); gE(G, n, gn, o, -g * (1 - d));
}
function sI(B, ia, ib, i) { if (ia >= 0) B[ia] -= i; if (ib >= 0) B[ib] += i; }
function genValue(p, t) {
  const ph = ((t * p.f) % 1 + 1) % 1, A = p.vpp / 2;
  let w;
  switch (p.wave) {
    case 'square': w = ph < p.duty / 100 ? 1 : -1; break;
    case 'tri': w = ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph; break;
    case 'saw': w = 2 * ph - 1; break;
    default: w = Math.sin(2 * Math.PI * ph);
  }
  return p.off + A * w;
}
/* segmentos a..g (bit 0 = a) para 0–9 */
const SEG7_BCD = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f];
function icLogic(d, Lg, s, Vr) {
  switch (d.kind) {
    case 'gate':
      for (const g of d.gates) s.out[g[g.length - 1]] = gateN(d.fn, g.slice(0, -1).map(Lg));
      break;
    case 'ff':
      if (!s.ff) { s.ff = [0, 0]; s.pc = [0, 0]; }
      d.ffs.forEach((f, i) => {
        const clr = d.hi ? !!Lg(f.clr) : !Lg(f.clr), pre = d.hi ? !!Lg(f.pre) : !Lg(f.pre), clk = Lg(f.clk), dd = Lg(f.d);
        let q = s.ff[i], qn;
        if (clr || pre) { q = pre ? 1 : 0; qn = clr ? 1 : 0; }
        else { if (clk && !s.pc[i]) q = dd; qn = 1 - q; }
        s.ff[i] = q; s.pc[i] = clk; s.out[f.q] = q; s.out[f.qn] = qn;
      });
      break;
    case '4017': {
      const clk = Lg(14), inh = Lg(13), rst = Lg(15);
      s.cnt = s.cnt || 0;
      if (rst) s.cnt = 0; else if (clk && !s.pclk && !inh) s.cnt = (s.cnt + 1) % 10;
      s.pclk = clk;
      [3, 2, 4, 7, 10, 1, 5, 6, 9, 11].forEach((p, i) => { s.out[p] = s.cnt === i ? 1 : 0; });
      s.out[12] = s.cnt < 5 ? 1 : 0;
      break;
    }
    case '595': {
      const ser = Lg(14), sck = Lg(11), rck = Lg(12), clr = !Lg(10), en = !Lg(13);
      s.sr = s.sr || 0; s.lat = s.lat || 0;
      if (rck && !s.prck) s.lat = s.sr;                 // el latch toma el valor previo al desplazamiento
      if (clr) s.sr = 0; else if (sck && !s.psck) s.sr = ((s.sr << 1) | ser) & 0xff;
      s.psck = sck; s.prck = rck;
      [15, 1, 2, 3, 4, 5, 6, 7].forEach((p, i) => { s.out[p] = en ? (s.lat >> i) & 1 : null; });
      s.out[9] = (s.sr >> 7) & 1;
      break;
    }
    case '555': {
      s.qs = s.qs || d.timers.map(() => 0);
      d.timers.forEach((tm, i) => {
        const vc = Vr(tm.ctrl), tr = Vr(tm.trig), th = Vr(tm.thr), rs = Vr(tm.rst), q0 = s.qs[i];
        let q = q0; if (rs < 0.7) q = 0; else if (tr < vc / 2) q = 1; else if (th > vc) q = 0;
        s.qs[i] = q; s.out[tm.out] = q;
        if (i === 0) { s.q = q; if (q && !q0) { if (s.tq !== undefined && s.t - s.tq > 0) { const f = 1 / (s.t - s.tq); s.fest = s.fest ? s.fest * 0.5 + f * 0.5 : f; } s.tq = s.t; } }
      });
      break;
    }
    case 'jk':
      if (!s.ff) { s.ff = d.jks.map(() => 0); s.pc = d.jks.map(() => 0); }
      d.jks.forEach((f, i) => {
        const clr = f.clr ? !Lg(f.clr) : false, pre = f.pre ? !Lg(f.pre) : false, clk = Lg(f.clk), j = Lg(f.j), k = Lg(f.k);
        let q = s.ff[i];
        if (clr || pre) q = pre && !clr ? 1 : 0;
        else if (!clk && s.pc[i]) q = j && k ? 1 - q : j ? 1 : k ? 0 : q;
        s.ff[i] = q; s.pc[i] = clk; s.out[f.q] = q; s.out[f.qn] = clr && pre ? 1 : 1 - q;
      });
      break;
    case '164': {
      const ser = Lg(1) && Lg(2) ? 1 : 0, clk = Lg(8), clr = !Lg(9);
      s.sr = s.sr || 0;
      if (clr) s.sr = 0; else if (clk && !s.pclk) s.sr = ((s.sr << 1) | ser) & 0xff;
      s.pclk = clk;
      [3, 4, 5, 6, 10, 11, 12, 13].forEach((p, i) => { s.out[p] = (s.sr >> i) & 1; });
      break;
    }
    case 'bcd7': {
      const n = Lg(7) | (Lg(1) << 1) | (Lg(2) << 2) | (Lg(6) << 3), lt = !Lg(3), bi = !Lg(4), rbi = !Lg(5);
      const segs = lt ? 0x7f : bi || (rbi && n === 0) || n > 9 ? 0 : SEG7_BCD[n];
      d.outs.forEach((p, i) => { const on = (segs >> i) & 1; s.out[p] = d.low ? (on ? 0 : 1) : on; });
      break;
    }
    case '4511': {
      const lt = !Lg(3), bl = !Lg(4), le = Lg(5);
      if (!le || s.lat === undefined) s.lat = Lg(7) | (Lg(1) << 1) | (Lg(2) << 2) | (Lg(6) << 3);
      const segs = lt ? 0x7f : bl || s.lat > 9 ? 0 : SEG7_BCD[s.lat];
      d.outs.forEach((p, i) => { s.out[p] = (segs >> i) & 1; });
      break;
    }
    case '4026': {
      const clk = Lg(1), inh = Lg(2), dei = Lg(3), rst = Lg(15);
      s.cnt = s.cnt || 0;
      if (rst) s.cnt = 0; else if (clk && !s.pclk && !inh) s.cnt = (s.cnt + 1) % 10;
      s.pclk = clk;
      const segs = SEG7_BCD[s.cnt];
      [10, 12, 13, 9, 11, 6, 7].forEach((p, i) => { s.out[p] = dei ? (segs >> i) & 1 : 0; });
      s.out[4] = dei; s.out[5] = s.cnt < 5 ? 1 : 0; s.out[14] = (segs >> 2) & 1;
      break;
    }
    case '138': {
      const en = Lg(6) && !Lg(4) && !Lg(5), sel = Lg(1) | (Lg(2) << 1) | (Lg(3) << 2);
      d.outs.forEach((p, i) => { s.out[p] = en && i === sel ? 0 : 1; });
      break;
    }
    case '151': {
      const en = !Lg(7), sel = Lg(11) | (Lg(10) << 1) | (Lg(9) << 2), y = en ? Lg([4, 3, 2, 1, 15, 14, 13, 12][sel]) : 0;
      s.out[5] = y; s.out[6] = 1 - y;
      break;
    }
    case 'updn': {
      const clk = Lg(14), en = !Lg(4), down = Lg(5), load = !Lg(11), M = d.mod;
      s.cnt = s.cnt || 0;
      if (load) s.cnt = (Lg(15) | (Lg(1) << 1) | (Lg(10) << 2) | (Lg(9) << 3)) % 16;
      else if (clk && !s.pclk && en) s.cnt = down ? (s.cnt + M - 1) % M : (s.cnt + 1) % M;
      s.pclk = clk;
      [3, 2, 6, 7].forEach((p, i) => { s.out[p] = (s.cnt >> i) & 1; });
      const mm = down ? s.cnt === 0 : s.cnt === M - 1;
      s.out[12] = mm ? 1 : 0; s.out[13] = mm && en && !clk ? 0 : 1;
      break;
    }
    case '193': {
      const up = Lg(5), dn = Lg(4), clr = Lg(14), load = !Lg(11);
      s.cnt = s.cnt || 0;
      if (clr) s.cnt = 0;
      else if (load) s.cnt = Lg(15) | (Lg(1) << 1) | (Lg(10) << 2) | (Lg(9) << 3);
      else { if (up && !s.pup && dn) s.cnt = (s.cnt + 1) & 15; if (dn && !s.pdn && up) s.cnt = (s.cnt + 15) & 15; }
      s.pup = up; s.pdn = dn;
      [3, 2, 6, 7].forEach((p, i) => { s.out[p] = (s.cnt >> i) & 1; });
      s.out[12] = s.cnt === 15 && !up ? 0 : 1; s.out[13] = s.cnt === 0 && !dn ? 0 : 1;
      break;
    }
    case '283': {
      const A = Lg(5) | (Lg(3) << 1) | (Lg(14) << 2) | (Lg(12) << 3), B = Lg(6) | (Lg(2) << 1) | (Lg(15) << 2) | (Lg(11) << 3), sum = A + B + Lg(7);
      [4, 1, 13, 10].forEach((p, i) => { s.out[p] = (sum >> i) & 1; });
      s.out[9] = (sum >> 4) & 1;
      break;
    }
    case 'cmp':
      d.cmps.forEach(k => { const prev = s.out[k.o], dv = Vr(k.p) - Vr(k.n); s.out[k.o] = dv > (prev === 0 ? 0.003 : -0.003) ? 1 : 0; });
      break;
    case 'a386': {
      const vs = Math.max(1, Vr(d.vcc)), x = Math.max(0.03, Math.min(0.97, 0.5 + 20 * (Vr(3) - Vr(2)) / vs));
      s.out[5] = [x, 1 - x];
      break;
    }
    case 'mux8': {
      const inh = Lg(6);
      s.sel = inh ? null : Lg(11) | (Lg(10) << 1) | (Lg(9) << 2);
      break;
    }
  }
}

const OA_VOS = 5e-4;   // voltaje de offset de entrada de los op-amps (rompe la simetría de los osciladores)
/* ---------- transistores (modelo de Ebers-Moll) ---------- */
const BJT = {
  bjt2222: { nombre:'2N2222A', Is:1e-14, n:1, bf:200, br:3, Rth:200, Cth:0.012, Twarn:110, Tmax:150, Icmax:0.8, Pmax:0.625 },
  tip120:  { nombre:'TIP120', Is:1.7e-12, n:2, bf:1000, br:2, Rth:62.5, Cth:0.4, Twarn:120, Tmax:150, Icmax:5, Pmax:2 },
  bjt3904: { nombre:'2N3904', Is:6.7e-15, n:1, bf:180, br:4, Rth:200, Cth:0.01, Twarn:110, Tmax:150, Icmax:0.2, Pmax:0.625 },
  pnp3906: { nombre:'2N3906', Is:1.4e-14, n:1, bf:160, br:4, Rth:200, Cth:0.01, Twarn:110, Tmax:150, Icmax:0.2, Pmax:0.625, pnp:true },
  tip42:   { nombre:'TIP42C', Is:3e-13, n:1.1, bf:75, br:3, Rth:15, Cth:1.2, Twarn:120, Tmax:150, Icmax:6, Pmax:65, pnp:true },
  bc547:   { nombre:'BC547B', Is:1.8e-14, n:1, bf:290, br:5, Rth:250, Cth:0.01, Twarn:110, Tmax:150, Icmax:0.1, Pmax:0.5 },
  bc548:   { nombre:'BC548B', Is:1.8e-14, n:1, bf:290, br:5, Rth:250, Cth:0.01, Twarn:110, Tmax:150, Icmax:0.1, Pmax:0.5 },
  bc557:   { nombre:'BC557B', Is:2e-14, n:1, bf:250, br:5, Rth:250, Cth:0.01, Twarn:110, Tmax:150, Icmax:0.1, Pmax:0.5, pnp:true },
  tip31:   { nombre:'TIP31C', Is:2e-13, n:1.05, bf:60, br:3, Rth:62.5, Cth:0.4, Twarn:120, Tmax:150, Icmax:3, Pmax:40 },
  tip32:   { nombre:'TIP32C', Is:2e-13, n:1.05, bf:60, br:3, Rth:62.5, Cth:0.4, Twarn:120, Tmax:150, Icmax:3, Pmax:40, pnp:true }
};
/* MOSFET canal N (modelo cuadrático con canal corto λ) */
const MOSM = {
  irfz44n: { nombre:'IRFZ44N', vt:3, k:8, lam:0.01, Rth:62, Cth:0.4, Twarn:120, Tmax:175, body:true },
  irf540n: { nombre:'IRF540N', vt:3, k:5, lam:0.01, Rth:62, Cth:0.4, Twarn:120, Tmax:175, body:true },
  mos2n7000: { nombre:'2N7000', vt:2.1, k:0.12, lam:0.02, Rth:312, Cth:0.01, Twarn:110, Tmax:150 }
};
function mosId(m, vgs, vds) {
  const vov = vgs - m.vt; if (vov <= 0) return { id:0, gm:0, gds:0 };
  const cl = 1 + m.lam * vds;
  if (vds < vov) return { id:m.k * (vov * vds - vds * vds / 2) * cl, gm:m.k * vds * cl, gds:m.k * (vov - vds) * cl + m.k * (vov * vds - vds * vds / 2) * m.lam };
  return { id:m.k / 2 * vov * vov * cl, gm:m.k * vov * cl, gds:m.k / 2 * vov * vov * m.lam };
}

/* ---------- motores y pantallas ---------- */
const MOTOR = {
  motor:     { R:1.5, ke:0.00258, b:4.9e-7, j:2.5e-7, rated:3, Rth:60, tau:15, Tmax:140, gear:1 },
  gearmotor: { R:8,   ke:0.23,    b:0.0016, j:0.00025, rated:6, Rth:40, tau:25, Tmax:140, gear:48 }
};
/* fotorresistencia: 100 kΩ en oscuridad → 500 Ω con luz intensa (variación logarítmica) */
function ldrR(lux) { const f = Math.max(0, Math.min(1, (+lux || 0) / 100)); return 100000 * Math.pow(0.005, f); }
/* interruptores: pulsador, DIP o contacto de relé (NO/NC según la bobina) */
function swOn(e) { if (e.rlyOf) return !!(e.rlyOf.s && e.rlyOf.s.on) !== !!e.nc; return e.sw !== undefined ? e.c.p.on[e.sw] : e.c.p.pressed; }
function srcP(e) { return e.vfun ? { V:e.vfun(), I:e.ilim, on:e.cond ? e.cond() : true } : e.vset !== undefined ? { V:e.vset, I:e.ilim, on:e.cond ? e.cond() : true } : e.c.p; }
/* pantalla de 3½ dígitos (1999 cuentas) con autorrango y prefijo SI */
function fmtDmm(v, u) {
  if (v === null || v === undefined || !isFinite(v)) return 'OL';
  const a = Math.abs(v), sg = v < 0 ? '-' : '';
  const pre = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  let k = pre.find(q => a >= q[0] * 0.9995) || pre[pre.length - 1];
  if (u === 'V' || u === 'A') { if (k[1] === 'M' || k[1] === 'k') k = [1, '']; }
  /* rango más bajo del autorrango (200 mV, 200 µA, 200 Ω, 2 nF): por debajo se lee 0,0 y no «pV» */
  const floor = { V:1e-3, A:1e-6, 'Ω':1, F:1e-9 }[u], low = floor !== undefined && k[0] < floor;
  if (low) k = pre.find(q => q[0] === floor);
  const m = a / k[0], dec = low ? 1 : m >= 200 ? 0 : m >= 20 ? 1 : m >= 2 ? 2 : 3;
  let txt = m.toFixed(dec); if (+txt >= 2000) txt = m.toFixed(0);
  return sg + txt + ' ' + k[1] + u;
}
function lcdExec(L, rs, b) {
  if (rs) { L.ddr[L.ac] = b; L.ac = (L.ac + 1) & 0x7f; if (L.ac === 0x28) L.ac = 0x40; else if (L.ac === 0x68) L.ac = 0; return; }
  if (b & 0x80) L.ac = b & 0x7f;
  else if (b & 0x40) { /* CGRAM: caracteres propios, no se simulan */ }
  else if (b & 0x20) { L.mode8 = !!(b & 0x10); L.nib = null; }
  else if (b & 0x08) L.disp = !!(b & 0x04);
  else if (b & 0x04) { /* modo de entrada */ }
  else if (b & 0x02) L.ac = 0;
  else if (b === 0x01) { L.ddr.fill(32); L.ac = 0; }
}
function lcdNew() { return { ddr:new Array(128).fill(32), ac:0, mode8:true, nib:null, disp:true, pe:0 }; }
function lcdRows(L, size) {
  const sz = LCD_SIZES[size] || LCD_SIZES['16x2'], base = [0x00, 0x40, 0x14, 0x54], out = [];
  for (let r = 0; r < sz[1]; r++) { let s = ''; for (let k = 0; k < sz[0]; k++) { const ch = L && L.disp ? L.ddr[(base[r] + k) & 0x7f] : 32; s += ch >= 32 && ch < 127 ? String.fromCharCode(ch) : ch === 0xdf ? '°' : ' '; } out.push(s); }
  return out;
}

/* ---------- microcontroladores: traductor de C simplificado y ejecución ---------- */
const UNO = { mark:'ATmega328P', self:true, vlogic:5, vabsPin:5.6, adc:1023, rout:25, pullup:35000, imax:0.04, led:13, sda:18, scl:19, lang:'arduino' };
const DEFAULT_CODE = {
  uno: '// Parpadeo del LED integrado (pin 13)\nvoid setup() {\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(500);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(500);\n}\n',
  esp32_py: '# Parpadeo del LED azul (GPIO 2) en MicroPython\nfrom machine import Pin\nimport time\n\nled = Pin(2, Pin.OUT)\nn = 0\n\nwhile True:\n    led.value(1)\n    time.sleep(0.5)\n    led.value(0)\n    time.sleep(0.5)\n    n += 1\n    print("Parpadeos:", n)\n',
  esp32: '// Parpadeo del LED azul integrado (GPIO 2)\nvoid setup() {\n  pinMode(2, OUTPUT);\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  digitalWrite(2, HIGH);\n  delay(500);\n  digitalWrite(2, LOW);\n  delay(500);\n  Serial.println(millis());\n}\n',
  uno_asm: '; Parpadeo del LED del pin 13 (PB5) - ATmega328P a 16 MHz\n.include "m328pdef.inc"\n\n.org 0x0000\n    rjmp inicio\n\ninicio:\n    ldi  r16, high(RAMEND)   ; pila al final de la RAM\n    out  SPH, r16\n    ldi  r16, low(RAMEND)\n    out  SPL, r16\n    sbi  DDRB, DDB5          ; PB5 (pin 13) como salida\n\nbucle:\n    sbi  PORTB, PORTB5       ; LED encendido\n    rcall espera\n    cbi  PORTB, PORTB5       ; LED apagado\n    rcall espera\n    rjmp bucle\n\n; unos 500 ms: 41 x 200 x 244 vueltas de 4 ciclos a 16 MHz\nespera:\n    ldi  r18, 41\ne1: ldi  r19, 200\ne2: ldi  r20, 244\ne3: dec  r20\n    nop\n    brne e3\n    dec  r19\n    brne e2\n    dec  r18\n    brne e1\n    ret\n',
  pic_asm: '; Parpadeo de un LED en RB0 (PIC16F877A / 16F84A, cristal de 4 MHz)\n        LIST    P=16F877A\n        #include <P16F877A.INC>\n\n        CBLOCK  0x20\n          CONT1\n          CONT2\n          CONT3\n        ENDC\n\n        ORG     0x00\n        GOTO    INICIO\n\nINICIO\n        BSF     STATUS, RP0     ; banco 1\n        CLRF    TRISB           ; puerto B como salida\n        BCF     STATUS, RP0     ; banco 0\nBUCLE\n        BSF     PORTB, 0        ; LED encendido\n        CALL    RETARDO\n        BCF     PORTB, 0        ; LED apagado\n        CALL    RETARDO\n        GOTO    BUCLE\n\nRETARDO                         ; unos 500 ms\n        MOVLW   D\'2\'\n        MOVWF   CONT3\nR3      MOVLW   D\'250\'\n        MOVWF   CONT2\nR2      MOVLW   D\'250\'\n        MOVWF   CONT1\nR1      NOP\n        DECFSZ  CONT1, F\n        GOTO    R1\n        DECFSZ  CONT2, F\n        GOTO    R2\n        DECFSZ  CONT3, F\n        GOTO    R3\n        RETURN\n\n        END\n',
  pic18_asm: '; Luces secuenciales en RB0..RB3 (PIC18F4550, 4 MHz)\n        LIST    P=18F4550\n        #include <P18F4550.INC>\n\nCONT1   EQU     0x00\nCONT2   EQU     0x01\nCONT3   EQU     0x02\n\n        ORG     0x00\n        GOTO    INICIO\n\nINICIO\n        MOVLW   0x0F\n        MOVWF   ADCON1          ; pines digitales\n        CLRF    TRISB           ; puerto B como salida\n        MOVLW   B\'00000001\'\n        MOVWF   LATB\nBUCLE\n        CALL    RETARDO\n        RLNCF   LATB, F         ; rota el bit encendido\n        BTFSS   LATB, 4\n        BRA     BUCLE\n        MOVLW   B\'00000001\'\n        MOVWF   LATB\n        BRA     BUCLE\n\nRETARDO                         ; unos 200 ms\n        MOVLW   D\'1\'\n        MOVWF   CONT3\nR3      MOVLW   D\'200\'\n        MOVWF   CONT2\nR2      MOVLW   D\'250\'\n        MOVWF   CONT1\nR1      DECFSZ  CONT1, F\n        BRA     R1\n        DECFSZ  CONT2, F\n        BRA     R2\n        DECFSZ  CONT3, F\n        BRA     R3\n        RETURN\n\n        END\n',
  pic: '// Parpadeo en RB0 (estilo CCS C)\nvoid main() {\n  set_tris_b(0x00);\n  while (TRUE) {\n    output_high(PIN_B0);\n    delay_ms(500);\n    output_low(PIN_B0);\n    delay_ms(500);\n  }\n}\n'
};
const C_TYPES = '(?:(?:unsigned|signed|const|static|volatile|register)\\s+)*(?:void|int|long|float|double|bool|boolean|byte|char|short|word|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|int1|int8|int16|int32|unsigned)\\b(?:\\s+long)?\\s*\\**';
function findClose(s, i) { let dep = 0; for (; i < s.length; i++) { const ch = s[i]; if (ch === '(') dep++; else if (ch === ')') { dep--; if (dep === 0) return i; } } return -1; }
function wrapCalls(s, names, objs) {
  const re = new RegExp('\\b(?:(' + objs.join('|') + ')\\s*\\.\\s*\\w+|(' + names.join('|') + '))\\s*\\(', 'g');
  const hits = []; let m;
  while ((m = re.exec(s))) {
    if (m[1] === '' && !m[2]) continue;
    if (!m[1] && m[2] === undefined) continue;
    const before = s.slice(Math.max(0, m.index - 10), m.index);
    if (/function\*\s*$/.test(before) || /\.\s*$/.test(before)) continue;
    hits.push(m.index);
  }
  for (let h = hits.length - 1; h >= 0; h--) {
    const st = hits[h], op = s.indexOf('(', st), cl = findClose(s, op);
    if (cl < 0) continue;
    s = s.slice(0, st) + '(yield* ' + s.slice(st, cl + 1) + ')' + s.slice(cl + 1);
  }
  return s;
}
function injectTicks(s) {
  const re = /\b(while|for)\s*\(/g; const pos = []; let m;
  while ((m = re.exec(s))) pos.push(m.index + m[0].length - 1);
  for (let k = pos.length - 1; k >= 0; k--) {
    const cl = findClose(s, pos[k]); if (cl < 0) continue;
    let j = cl + 1; while (j < s.length && /\s/.test(s[j])) j++;
    if (s[j] === '{') s = s.slice(0, j + 1) + ' if (__tick()) yield 0;' + s.slice(j + 1);
    else if (s[j] === ';') { const prevWord = s.slice(0, pos[k]).match(/(\w+)\s*$/); if (prevWord && prevWord[1] === 'while' && !/\}\s*while\s*\($/.test(s.slice(0, pos[k] + 1))) s = s.slice(0, j) + '{ yield 0; }' + s.slice(j + 1); }
  }
  return s.replace(/\bdo\s*\{/g, 'do { if (__tick()) yield 0;');
}
function transpileC(src) {
  const strs = [], objs = [];
  let s = String(src || '').replace(/\r/g, '');
  s = s.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)'/g, x => { strs.push(x); return '\u0001' + (strs.length - 1) + '\u0001'; });
  s = s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  s = s.replace(/^[ \t]*#[ \t]*define[ \t]+(\w+)[ \t]+([^\n]+)$/gm, 'const $1 = $2;').replace(/^[ \t]*#[^\n]*$/gm, '');
  s = s.replace(/\bF\s*\(/g, '(').replace(/\bB([01]{1,8})\b/g, '0b$1');
  s = s.replace(/\bServo\s+(\w+)\s*;/g, 'let $1 = new Servo();');
  s = s.replace(/\b(LiquidCrystal_I2C|LiquidCrystal|Stepper|Adafruit_SSD1306)\s+(\w+)\s*\(([^)]*)\)\s*;/g, (x, cls, n, a) => { objs.push(n); return 'let ' + n + ' = new ' + cls + '(' + a.replace(/&/g, '') + ');'; });
  s = s.replace(/\bKeypad\s+(\w+)\s*=\s*Keypad\s*\(/g, (x, n) => { objs.push(n); return 'let ' + n + ' = new Keypad('; });
  const fnames = [];
  s = s.replace(new RegExp('(^|[;}\\s])' + C_TYPES + '\\s*(\\w+)\\s*\\(([^)]*)\\)\\s*\\{', 'g'), (x, pre, name, params) => {
    if (/^(if|while|for|switch|return)$/.test(name)) return x;
    fnames.push(name);
    const ps = /^\s*(void)?\s*$/.test(params) ? '' : params.split(',').map(p => { const mm = /(\w+)\s*(\[\s*\])?\s*(=[^,]*)?$/.exec(p.trim()); return mm ? mm[1] + (mm[3] || '') : ''; }).join(', ');
    return pre + 'function* ' + name + '(' + ps + ') {';
  });
  s = s.replace(new RegExp('(^|[;}\\s])' + C_TYPES + '\\s*\\w+\\s*\\([^)]*\\)\\s*;', 'g'), '$1');
  s = s.replace(new RegExp(C_TYPES + '\\s*(\\w+)\\s*((?:\\[[^\\]]*\\])+)\\s*=\\s*\\{([^;]*)\\}\\s*;', 'g'), (x, n, dims, body) => 'let ' + n + ' = [' + body.replace(/\{/g, '[').replace(/\}/g, ']') + '];');
  s = s.replace(new RegExp(C_TYPES + '\\s*(\\w+)\\s*\\[([^\\]]+)\\]\\s*;', 'g'), 'let $1 = new Array($2).fill(0);');
  s = s.replace(/\b(?:int16_t|short)\s+(\w+)\s*=\s*([^;,{]+);/g, 'let $1 = __i16($2);');
  s = s.replace(/\(\s*int16_t\s*\)/g, '');
  s = s.replace(/\b(?:(?:unsigned|signed|const|static|volatile)\s+)*(?:int|long|byte|short|word|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|int8|int16|int32)\s+(\w+)\s*=\s*([^;,{]+);/g, 'let $1 = __int($2);');
  s = s.replace(new RegExp('\\b' + C_TYPES + '\\s+(?=[A-Za-z_])', 'g'), 'let ');
  s = s.replace(/\(\s*(?:int|long|byte|float|double|char|unsigned\s+\w+|unsigned|short|word|uint8_t|uint16_t|int8|int16)\s*\)/g, '');
  s = injectTicks(s);
  s = wrapCalls(s, fnames.concat(['pulseIn', 'delay', 'delayMicroseconds', 'delay_ms', 'delay_us', '__delay_ms', '__delay_us']), objs.length ? objs : ['__ninguno__']);
  s = s.replace(/\u0001(\d+)\u0001/g, (x, i) => strs[+i]);
  return s;
}
function fmtSerial(x, b) {
  if (typeof x === 'boolean') return x ? '1' : '0';
  if (typeof x === 'number') { if (b === 2 || b === 8 || b === 16) return Math.trunc(x).toString(b).toUpperCase(); if (Number.isInteger(x)) return String(x); return x.toFixed(b === undefined ? 2 : b); }
  return String(x === undefined ? '' : x);
}
function makeRuntime(e, sim) {
  const c = e.c, s = e.s, d = e.d, isA = e.isA, self = !!(d.self || d.ard);
  const kind = isA || d.ard ? 'uno' : c.p.chip === 'esp32' ? 'esp32' : 'pic';
  const lang = c.p.lang || (kind === 'pic' ? 'c' : 'arduino');
  const code = c.p.code && c.p.code.trim() ? c.p.code : DEFAULT_CODE[lang === 'asm' ? (isA || d.ard ? 'uno_asm' : c.p.chip === 'pic18f4550' ? 'pic18_asm' : 'pic_asm') : lang === 'python' ? 'esp32_py' : kind];
  const rt = { wait:0, gen:null, err:null, halt:false, started:false, phase:'', ticks:0, t0:sim.time, adcCh:0, warned:{} };
  s.io = []; s.serial = s.serial || []; s.line = ''; s.rx = s.rx || []; s.tx = '';
  const io = k => s.io[k] || (s.io[k] = { m:'in', v:0, pw:0 });
  const VL = () => d.self ? d.vlogic : (s.vs || 5);
  const volt = k => { const i = e.ix[k]; return (i === undefined || i < 0 ? 0 : sim.v[i]) - (s.vlo || 0); };
  const idx = p => { p = Math.trunc(+p); if (isA) return p >= 0 && p < 20 ? p : -1; if (self) { const ph = d.gpio[p]; return ph ? ph - 1 : -1; } return p >= 1 && p <= d.pins ? p - 1 : -1; };
  const where = {};
  if (!self) Object.keys(d.port).forEach(L => Object.keys(d.port[L]).forEach(b => { where[d.port[L][b] - 1] = [L, +b]; }));
  const ports = {};
  Object.keys(d.port || {}).forEach(L => { ports[L] = { tris:0xff, lat:0 }; });
  const applyPort = L => { const P = ports[L]; Object.keys(d.port[L]).forEach(b => { const o = io(d.port[L][b] - 1); if ((P.tris >> b) & 1) { if (o.m === 'out') o.m = 'in'; } else { o.m = 'out'; o.v = (P.lat >> b) & 1; o.pw = 0; } }); };
  const rd = k => { if (k < 0) return 0; const o = io(k); if (o.m === 'out') return o.v > 0.5 ? 1 : 0; return volt(k) > VL() / 2 ? 1 : 0; };
  const readPort = L => { let v = 0; Object.keys(d.port[L] || {}).forEach(b => { if (rd(d.port[L][b] - 1)) v |= 1 << b; }); return v; };
  const warn = msg => { if (!rt.warned[msg]) { rt.warned[msg] = 1; out('⚠ ' + msg + '\n'); } };
  const out = txt => { s.tx = (s.tx + txt).slice(-4096); s.line += txt; const parts = s.line.split('\n'); s.line = parts.pop(); parts.forEach(l => s.serial.push(l)); if (s.serial.length > 200) s.serial.splice(0, s.serial.length - 200); s.serialRev = (s.serialRev || 0) + 1; };
  const setMode = (k, m) => { if (k < 0) return; const o = io(k); if (o.dead) return; o.m = m; if (where[k]) { const P = ports[where[k][0]]; if (m === 'out') P.tris &= ~(1 << where[k][1]); else P.tris |= 1 << where[k][1]; } };
  const setOut = (k, v, pw) => {
    if (k < 0) return; const o = io(k); if (o.dead) return;
    if (where[k]) { const [L, b] = where[k], P = ports[L]; P.tris &= ~(1 << b); if (v >= 0.5) P.lat |= 1 << b; else P.lat &= ~(1 << b); }
    o.m = 'out'; o.v = Math.max(0, Math.min(1, v)); o.pw = pw || 0; o.freq = 0; o.toneEnd = 0;
  };
  function* __delay(ms) { rt.wait = sim.time + Math.max(0, +ms || 0) / 1000; yield 1; }
  const stepYield = function* () { rt.wait = sim.time + 1e-9; yield 1; };
  function pinMode(p, m) { const k = idx(p); if (k < 0) { warn('El pin ' + p + ' no existe en ' + (isA ? 'Arduino Uno' : d.mark)); return; } setMode(k, m === 1 ? 'out' : m === 2 ? 'pu' : 'in'); }
  function digitalWrite(p, v) { const k = idx(p); if (k < 0) { warn('El pin ' + p + ' no existe'); return; } const o = io(k); if (!v && o.m === 'out' && o.v > 0.5) rt.fall[k] = sim.time; if (o.m !== 'out' && kind !== 'pic') { o.m = v ? 'pu' : 'in'; return; } setOut(k, v ? 1 : 0); }
  function digitalRead(p) { return rd(idx(p)); }
  function analogRead(p) {
    let k;
    if (isA || d.ard) k = idx(p < 14 ? p + 14 : p); else if (self) k = idx(p); else k = d.an[p] !== undefined ? d.an[p] - 1 : idx(p);
    if (k < 0 || !d.adc) { warn('analogRead: el pin ' + p + ' no tiene entrada analógica'); return 0; }
    return Math.round(Math.max(0, Math.min(1, volt(k) / VL())) * d.adc);
  }
  function analogWrite(p, v) { const k = idx(p); if (k < 0) return; setOut(k, Math.max(0, Math.min(255, +v || 0)) / 255); }
  function tone(p, f, dur) { const k = idx(p); if (k < 0) { warn('tone: el pin ' + p + ' no existe'); return; } setOut(k, 0.5); const o = io(k); o.freq = Math.max(31, +f || 0); o.toneEnd = dur ? sim.time + dur / 1000 : 1e12; }
  function noTone(p) { const k = idx(p); if (k < 0) return; setOut(k, 0); }
  const ledc = {};
  class Servo {
    attach(p, mn, mx) { this.k = idx(p); this.mn = mn || 544; this.mx = mx || 2400; this.a = 90; this.write(90); return 1; }
    write(a) { if (a > 180) return this.writeMicroseconds(a); this.a = Math.max(0, Math.min(180, +a || 0)); this.writeMicroseconds(this.mn + (this.mx - this.mn) * this.a / 180); }
    writeMicroseconds(us) { if (this.k === undefined) return; setOut(this.k, us / 20000, us * 1e-6); }
    read() { return Math.round(this.a || 0); }
    attached() { return this.k !== undefined; }
    detach() { if (this.k !== undefined) setOut(this.k, 0); this.k = undefined; }
  }
  const ROWB = [0x00, 0x40, 0x14, 0x54];
  class LiquidCrystal {
    constructor() { const a = Array.from(arguments).map(idx); if (a.length === 6) { this.rs = a[0]; this.en = a[1]; this.d = a.slice(2); } else if (a.length === 7) { this.rs = a[0]; this.rw = a[1]; this.en = a[2]; this.d = a.slice(3); } else { this.rs = a[0]; this.en = a[a.length === 11 ? 2 : 1]; this.d = a.slice(-4); } }
    * nib(v, rs) { setOut(this.rs, rs); if (this.rw !== undefined) setOut(this.rw, 0); for (let q = 0; q < 4; q++) setOut(this.d[q], (v >> q) & 1); setOut(this.en, 1); yield* stepYield(); setOut(this.en, 0); yield* stepYield(); }
    * send(b, rs) { yield* this.nib(b >> 4, rs); yield* this.nib(b & 15, rs); }
    * command(b) { yield* this.send(b, 0); if (b < 4) yield* __delay(2); }
    * begin(cols, rows) { this.cols = cols || 16; yield* __delay(50); for (let q = 0; q < 3; q++) { yield* this.nib(3, 0); yield* __delay(5); } yield* this.nib(2, 0); yield* this.command(0x28); yield* this.command(0x0c); yield* this.command(0x01); yield* this.command(0x06); }
    * clear() { yield* this.command(0x01); }
    * home() { yield* this.command(0x02); }
    * setCursor(col, row) { yield* this.command(0x80 | ((ROWB[row] || 0) + col)); }
    * print(x, b) { const t = fmtSerial(x, b); for (const ch of t) yield* this.send(ch === '°' ? 0xdf : ch.charCodeAt(0) & 0xff, 1); }
    * write(ch) { yield* this.send(typeof ch === 'number' ? ch : String(ch).charCodeAt(0), 1); }
    * display() { yield* this.command(0x0c); }
    * noDisplay() { yield* this.command(0x08); }
    * cursor() {} * noCursor() {} * blink() {} * noBlink() {} * scrollDisplayLeft() {} * scrollDisplayRight() {}
  }
  /* pines I2C del micro que corre el programa */
  const i2cPins = () => ({ sda:isA ? 18 : self ? (d.gpio[d.sda] - 1) : (d.port.C && d.port.C[4] && kind === 'pic' && c.p.chip !== 'pic18f4550' ? d.port.C[4] - 1 : d.port.B ? d.port.B[0] - 1 : -1),
    scl:isA ? 19 : self ? (d.gpio[d.scl] - 1) : (d.port.C && d.port.C[3] && c.p.chip !== 'pic18f4550' ? d.port.C[3] - 1 : d.port.B ? d.port.B[1] - 1 : -1) });
  class Adafruit_SSD1306 {
    constructor(w, h) { this.w = +w || 128; this.h = +h || 64; this.buf = new Uint8Array(this.w * this.h); this.txt = []; this.cx = 0; this.cy = 0; this.ts = 1; this.col = 1; this.wrapOn = true; this.inv = false; }
    target() {
      const { sda, scl } = i2cPins();
      const el = sim.els.find(q => q.type === 'OLED' && q.s.pw && sda >= 0 && scl >= 0 && sim.netOf(q.ix[3]) === sim.netOf(e.ix[sda]) && sim.netOf(q.ix[2]) === sim.netOf(e.ix[scl]) && q.ix[3] >= 0);
      if (!el) warn('No hay una pantalla OLED alimentada en SDA/SCL (' + (isA ? 'A4/A5' : self ? 'pines I2C del micro' : 'pines I2C del PIC') + ')');
      return el;
    }
    px(x, y, cc) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; this.buf[i] = cc === 2 ? 1 - this.buf[i] : cc ? 1 : 0; }
    * begin(vcs, addr) { yield* __delay(20); this.addr = addr || 0x3C; return this.target() ? 1 : 0; }
    * display() { const el = this.target(); if (el) { el.s.fb = this.buf.slice(); el.s.txt = this.txt.map(t => Object.assign({}, t)); el.s.inv = this.inv; el.s.w = this.w; el.s.h = this.h; el.s.rev = (el.s.rev || 0) + 1; } yield* __delay(this.w * this.h / 8 * 9 / 400); }
    * clearDisplay() { this.buf.fill(0); this.txt = []; }
    * fillScreen(cc) { this.buf.fill(cc ? 1 : 0); this.txt = []; }
    * invertDisplay(i) { this.inv = !!i; }
    * dim() {} * setRotation() {} * startscrollright() {} * startscrollleft() {} * stopscroll() {} * cp437() {}
    * setTextSize(sz) { this.ts = Math.max(1, Math.round(+sz || 1)); }
    * setTextColor(cc) { this.col = +cc; }
    * setTextWrap(w) { this.wrapOn = !!w; }
    * setCursor(x, y) { this.cx = +x || 0; this.cy = +y || 0; }
    * getCursorX() { return this.cx; } * getCursorY() { return this.cy; }
    * width() { return this.w; } * height() { return this.h; }
    * drawPixel(x, y, cc) { this.px(x, y, cc); }
    * drawLine(x0, y0, x1, y1, cc) { const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), n = Math.max(dx, dy, 1); for (let i = 0; i <= n; i++) this.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, cc); }
    * drawFastHLine(x, y, w, cc) { for (let i = 0; i < w; i++) this.px(x + i, y, cc); }
    * drawFastVLine(x, y, h, cc) { for (let i = 0; i < h; i++) this.px(x, y + i, cc); }
    * drawRect(x, y, w, h, cc) { for (let i = 0; i < w; i++) { this.px(x + i, y, cc); this.px(x + i, y + h - 1, cc); } for (let i = 0; i < h; i++) { this.px(x, y + i, cc); this.px(x + w - 1, y + i, cc); } }
    * fillRect(x, y, w, h, cc) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, cc); }
    * drawRoundRect(x, y, w, h, r, cc) { yield* this.drawRect(x, y, w, h, cc); }
    * fillRoundRect(x, y, w, h, r, cc) { yield* this.fillRect(x, y, w, h, cc); }
    * drawCircle(x0, y0, r, cc) { for (let a = 0; a < 360; a += 2) this.px(x0 + r * Math.cos(a * Math.PI / 180), y0 + r * Math.sin(a * Math.PI / 180), cc); }
    * fillCircle(x0, y0, r, cc) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) this.px(x0 + x, y0 + y, cc); }
    * drawTriangle(x0, y0, x1, y1, x2, y2, cc) { yield* this.drawLine(x0, y0, x1, y1, cc); yield* this.drawLine(x1, y1, x2, y2, cc); yield* this.drawLine(x2, y2, x0, y0, cc); }
    put(ch) {
      if (ch === '\n') { this.cx = 0; this.cy += 8 * this.ts; return; }
      if (ch === '\r') return;
      if (this.wrapOn && this.cx + 6 * this.ts > this.w) { this.cx = 0; this.cy += 8 * this.ts; }
      this.txt.push({ x:this.cx, y:this.cy, s:this.ts, c:this.col, ch });
      this.cx += 6 * this.ts;
    }
    * print(x, b) { for (const ch of fmtSerial(x, b)) this.put(ch); }
    * println(x, b) { if (x !== undefined) for (const ch of fmtSerial(x, b)) this.put(ch); this.put('\n'); }
    * write(ch) { this.put(typeof ch === 'number' ? String.fromCharCode(ch) : String(ch)); }
  }
  /* teclado matricial: barre las filas en bajo y lee las columnas con pull-up */
  class Keypad {
    constructor(map, rows, cols, nr, nc) { this.map = map; this.rows = rows; this.cols = cols; this.nr = nr || rows.length; this.nc = nc || cols.length; this.held = 0; }
    * scan() {
      for (let k = 0; k < this.nc; k++) pinMode(this.cols[k], 2);
      let found = 0;
      for (let r = 0; r < this.nr; r++) {
        for (let q = 0; q < this.nr; q++) pinMode(this.rows[q], 0);
        pinMode(this.rows[r], 1); digitalWrite(this.rows[r], 0);
        yield* stepYield(); yield* stepYield();
        for (let k = 0; k < this.nc; k++) if (!digitalRead(this.cols[k])) found = this.map[r][k];
        pinMode(this.rows[r], 0);
      }
      return found;
    }
    * getKey() { const k = yield* this.scan(); if (k && k !== this.held) { this.held = k; return k; } if (!k) this.held = 0; return 0; }
    * waitForKey() { for (;;) { const k = yield* this.getKey(); if (k) return k; yield* __delay(10); } }
    * getState() { return this.held ? 1 : 0; }
    * setDebounceTime() {} * setHoldTime() {}
  }
  class LiquidCrystal_I2C {
    constructor(addr, cols, rows) { this.addr = addr; this.cols = cols; this.rows = rows; }
    target() {
      const sda = isA ? 18 : self ? (d.gpio[d.sda] - 1) : (d.port.C && d.port.C[4] && kind === 'pic' && c.p.chip !== 'pic18f4550' ? d.port.C[4] - 1 : d.port.B ? d.port.B[0] - 1 : -1);
      const scl = isA ? 19 : self ? (d.gpio[d.scl] - 1) : (d.port.C && d.port.C[3] && c.p.chip !== 'pic18f4550' ? d.port.C[3] - 1 : d.port.B ? d.port.B[1] - 1 : -1);
      const lcd = sim.els.find(q => q.type === 'LCD' && q.i2c && q.s.lcd && sim.netOf(q.ix[2]) === sim.netOf(e.ix[sda]) && sim.netOf(q.ix[3]) === sim.netOf(e.ix[scl]) && q.ix[2] >= 0);
      if (!lcd) warn('No hay una pantalla I2C alimentada en SDA/SCL (' + (isA ? 'A4/A5' : self ? 'GPIO 21/22' : 'pines I2C del PIC') + ')');
      return lcd ? lcd.s.lcd : null;
    }
    * cmd(b, rs) { const L = this.target(); if (L) lcdExec(L, rs, b); yield* stepYield(); }
    * init() { yield* __delay(50); yield* this.cmd(0x0c, 0); yield* this.cmd(0x01, 0); }
    * begin() { yield* this.init(); }
    * backlight() { const L = this.target(); if (L) L.blOff = false; }
    * noBacklight() { const L = this.target(); if (L) L.blOff = true; }
    * clear() { yield* this.cmd(0x01, 0); yield* __delay(2); }
    * home() { yield* this.cmd(0x02, 0); }
    * setCursor(col, row) { yield* this.cmd(0x80 | ((ROWB[row] || 0) + col), 0); }
    * print(x, b) { const t = fmtSerial(x, b); for (const ch of t) yield* this.cmd(ch === '°' ? 0xdf : ch.charCodeAt(0) & 0xff, 1); }
    * write(ch) { yield* this.cmd(typeof ch === 'number' ? ch : String(ch).charCodeAt(0), 1); }
    * display() { yield* this.cmd(0x0c, 0); } * noDisplay() { yield* this.cmd(0x08, 0); }
    * cursor() {} * noCursor() {} * blink() {} * noBlink() {}
  }
  const SEQ4 = [[1, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 1], [1, 0, 0, 1]];
  class Stepper {
    constructor(steps, a, b, c2, d2) { this.n = steps; this.p = [a, b, c2, d2].filter(x => x !== undefined).map(idx); this.i = 0; this.rpm = 10; }
    * setSpeed(rpm) { this.rpm = Math.max(0.1, +rpm || 1); }
    * step(nn) {
      const dir = nn > 0 ? 1 : -1, dl = 60000 / this.n / this.rpm;
      for (let q = 0; q < Math.abs(nn); q++) {
        this.i = ((this.i + dir) % 4 + 4) % 4; const sq = SEQ4[this.i];
        this.p.forEach((k, j) => setOut(k, this.p.length === 2 ? sq[j * 2] : sq[j]));
        yield* __delay(dl);
      }
    }
  }
  const i2cPinsRt = () => {
    const sda = isA ? 18 : self ? (d.gpio[d.sda] - 1) : (d.port.C && d.port.C[4] && kind === 'pic' && c.p.chip !== 'pic18f4550' ? d.port.C[4] - 1 : d.port.B ? d.port.B[0] - 1 : -1);
    const scl = isA ? 19 : self ? (d.gpio[d.scl] - 1) : (d.port.C && d.port.C[3] && c.p.chip !== 'pic18f4550' ? d.port.C[3] - 1 : d.port.B ? d.port.B[1] - 1 : -1);
    return [sda, scl];
  };
  const i2cDev = addr => {
    const [sda, scl] = i2cPinsRt();
    if (sda < 0 || e.ix[sda] === undefined || e.ix[sda] < 0) return null;
    return sim.els.find(q => q.type === 'MPU' && q.s.pw && (addr === 0x68) && sim.netOf(q.ix[3]) === sim.netOf(e.ix[sda]) && sim.netOf(q.ix[2]) === sim.netOf(e.ix[scl])) || null;
  };
  const Wire = { tx:0, buf:[], rx:[],
    begin() {}, setClock() {}, end() {},
    beginTransmission(a) { this.tx = a; this.buf = []; },
    write(b) { if (Array.isArray(b)) b.forEach(q => this.buf.push(q & 255)); else this.buf.push((+b || 0) & 255); return 1; },
    endTransmission() { const dv = i2cDev(this.tx); if (!dv) { warn('I2C: nadie responde en la dirección 0x' + (this.tx || 0).toString(16) + '. Revisa SDA (' + (isA ? 'A4' : 'GPIO 21') + '), SCL (' + (isA ? 'A5' : 'GPIO 22') + '), VCC y GND del módulo.'); return 2; } mpuWrite(dv.s, this.buf); return 0; },
    requestFrom(a, n) { const dv = i2cDev(a); this.rx = dv ? mpuBytes(dv.s, +n || 1) : []; return this.rx.length; },
    available() { return this.rx.length; }, read() { return this.rx.length ? this.rx.shift() : -1; }
  };
  rt.fall = {};
  function* pulseIn(p, val, tmo) {
    const k = idx(p), lim = (tmo || 1000000) / 1e6;
    const hs = k < 0 ? null : sim.els.find(q => q.type === 'HCSR' && q.ix[2] >= 0 && sim.netOf(q.ix[2]) === sim.netOf(e.ix[k]));
    if (!hs || !hs.s.pw) { if (!hs) warn('pulseIn: el pin ' + p + ' no está conectado al ECHO de un HC-SR04'); else warn('El HC-SR04 no tiene alimentación (VCC/GND)'); yield* __delay(Math.min(lim, 0.05) * 1000); return 0; }
    let trigOk = false;
    Object.keys(rt.fall).forEach(kk => { if (sim.time - rt.fall[kk] < 0.05 && e.ix[kk] >= 0 && sim.netOf(e.ix[kk]) === sim.netOf(hs.ix[1])) trigOk = true; });
    if (!trigOk) { warn('pulseIn: el HC-SR04 no recibió el pulso de TRIG (HIGH 10 µs y luego LOW)'); yield* __delay(Math.min(lim, 0.05) * 1000); return 0; }
    const dur = hcsrDur(hs.s.dist || 50) * (1 + (Math.random() - 0.5) * 0.004);
    hs.s.e0 = sim.time + 4e-4; hs.s.e1 = hs.s.e0 + dur * 1e-6;
    if (dur / 1e6 > lim) { yield* __delay(lim * 1000); return 0; }
    yield* __delay(0.4 + dur / 1000);
    return Math.round(dur);
  }
  const rxNum = isF => { while (s.rx.length && !/[-\d.]/.test(String.fromCharCode(s.rx[0]))) s.rx.shift(); let t = ''; while (s.rx.length && /[-\d.]/.test(String.fromCharCode(s.rx[0])) && (isF || String.fromCharCode(s.rx[0]) !== '.')) t += String.fromCharCode(s.rx.shift()); return isF ? (parseFloat(t) || 0) : (parseInt(t, 10) || 0); };
  const Serial = { begin() {}, end() {}, available() { return s.rx.length; }, read() { return s.rx.length ? s.rx.shift() : -1; }, peek() { return s.rx.length ? s.rx[0] : -1; }, flush() {},
    readString() { const t = String.fromCharCode.apply(null, s.rx); s.rx.length = 0; return t; },
    readStringUntil(ch) { const c0 = typeof ch === 'number' ? ch : String(ch).charCodeAt(0); let t = ''; while (s.rx.length) { const b = s.rx.shift(); if (b === c0) break; t += String.fromCharCode(b); } return t; },
    parseInt() { return rxNum(false); }, parseFloat() { return rxNum(true); }, setTimeout() {},
    print(x, b) { out(fmtSerial(x, b)); }, println(x, b) { out(fmtSerial(x, b) + '\n'); }, write(x) { out(typeof x === 'number' ? String.fromCharCode(x) : String(x)); } };
  const ctx = {
    HIGH:1, LOW:0, INPUT:0, OUTPUT:1, INPUT_PULLUP:2, TRUE:1, FALSE:0, NULL:null, DEC:10, HEX:16, BIN:2, OCT:8, PI:Math.PI,
    LED_BUILTIN: isA ? 13 : self ? d.led : -1, A0:14, A1:15, A2:16, A3:17, A4:18, A5:19,
    pinMode, digitalWrite, digitalRead, analogRead, analogWrite, Serial, Servo, LiquidCrystal, LiquidCrystal_I2C, Stepper, Wire, pulseIn, Adafruit_SSD1306, Keypad, makeKeymap:x => x, NO_KEY:0,
    SSD1306_SWITCHCAPVCC:2, SSD1306_EXTERNALVCC:1, SSD1306_WHITE:1, SSD1306_BLACK:0, SSD1306_INVERSE:2, WHITE:1, BLACK:0, INVERSE:2,
    atan2:Math.atan2, atan:Math.atan, asin:Math.asin, acos:Math.acos, exp:Math.exp, log:Math.log, log10:Math.log10, fabs:Math.abs, isnan:isNaN, __i16:x => (((Math.trunc(x) & 0xffff) ^ 0x8000) - 0x8000),
    millis:() => Math.floor((sim.time - rt.t0) * 1000), micros:() => Math.floor((sim.time - rt.t0) * 1e6),
    delay:__delay, delayMicroseconds:function* (us) { yield* __delay(us / 1000); },
    delay_ms:__delay, __delay_ms:__delay, delay_us:function* (us) { yield* __delay(us / 1000); }, __delay_us:function* (us) { yield* __delay(us / 1000); },
    map:(x, a, b, c2, d2) => Math.trunc((x - a) * (d2 - c2) / (b - a) + c2), constrain:(x, a, b) => Math.min(b, Math.max(a, x)),
    min:Math.min, max:Math.max, abs:Math.abs, pow:Math.pow, sqrt:Math.sqrt, sq:x => x * x, sin:Math.sin, cos:Math.cos, tan:Math.tan,
    floor:Math.floor, ceil:Math.ceil, round:Math.round, random:(a, b) => b === undefined ? Math.floor(Math.random() * a) : Math.floor(a + Math.random() * (b - a)),
    randomSeed() {}, sizeof:x => Array.isArray(x) ? x.length : typeof x === 'string' ? x.length + 1 : 1, tone, noTone, bitRead:(x, b) => (x >> b) & 1,
    ledcSetup:(ch, f, bits) => { ledc[ch] = Object.assign(ledc[ch] || {}, { bits:bits || 8 }); }, ledcAttachPin:(p, ch) => { ledc[ch] = Object.assign(ledc[ch] || { bits:8 }, { pin:p }); },
    ledcWrite:(ch, v) => { const L = ledc[ch]; if (L && L.pin !== undefined) setOut(idx(L.pin), v / ((1 << L.bits) - 1)); },
    __tick:() => (++rt.ticks & 127) === 0, String:x => fmtSerial(x), __int:x => typeof x === 'number' ? Math.trunc(x) : x
  };
  if (kind === 'pic') {
    Object.keys(d.port).forEach(L => {
      Object.keys(d.port[L]).forEach(b => { ctx['PIN_' + L + b] = d.port[L][b]; });
      const P = ports[L], l = L.toLowerCase();
      Object.defineProperty(ctx, 'TRIS' + L, { get:() => P.tris, set:v => { P.tris = v & 0xff; applyPort(L); } });
      Object.defineProperty(ctx, 'PORT' + L, { get:() => readPort(L), set:v => { P.lat = v & 0xff; applyPort(L); } });
      Object.defineProperty(ctx, 'LAT' + L, { get:() => P.lat, set:v => { P.lat = v & 0xff; applyPort(L); } });
      const bits = (reg, re) => new Proxy({}, {
        get:(o, k) => { const m = re.exec(String(k)); if (!m) return 0; const b = +m[1]; return reg === 'PORT' ? (readPort(L) >> b) & 1 : reg === 'LAT' ? (P.lat >> b) & 1 : (P.tris >> b) & 1; },
        set:(o, k, v) => { const m = re.exec(String(k)); if (!m) return true; const b = +m[1], key = reg === 'TRIS' ? 'tris' : 'lat'; if (v) P[key] |= 1 << b; else P[key] &= ~(1 << b); applyPort(L); return true; } });
      ctx['PORT' + L + 'bits'] = bits('PORT', new RegExp('^R' + L + '(\\d)$'));
      ctx['LAT' + L + 'bits'] = bits('LAT', new RegExp('^LAT' + L + '(\\d)$'));
      ctx['TRIS' + L + 'bits'] = bits('TRIS', new RegExp('^TRIS' + L + '(\\d)$'));
      ctx['output_' + l] = v => { P.tris = 0; P.lat = v & 0xff; applyPort(L); };
      ctx['input_' + l] = () => { P.tris = 0xff; applyPort(L); return readPort(L); };
      ctx['set_tris_' + l] = v => { P.tris = v & 0xff; applyPort(L); };
    });
    Object.assign(ctx, {
      output_high:p => setOut(idx(p), 1), output_low:p => setOut(idx(p), 0), output_bit:(p, v) => setOut(idx(p), v ? 1 : 0),
      output_toggle:p => { const k = idx(p); setOut(k, rd(k) ? 0 : 1); }, input:p => { const k = idx(p); setMode(k, 'in'); if (where[k]) applyPort(where[k][0]); return rd(k); },
      output_float:p => { setMode(idx(p), 'in'); }, setup_adc_ports() {}, setup_adc() {}, set_adc_channel:ch => { rt.adcCh = ch; },
      ALL_ANALOG:0, ADC_CLOCK_INTERNAL:0, AN0:0, AN0_TO_AN1:0, AN0_TO_AN3:0, NO_ANALOGS:0,
      read_adc:() => analogRead(rt.adcCh), port_b_pullups() {}, setup_oscillator() {}, enable_interrupts() {}, disable_interrupts() {}
    });
  }
  if (lang === 'python') {
    const kwOf = a => { const o = {}; a.forEach(x => { if (x && x.__kw) o[x.k] = x.v; }); return o; };
    const pos = a => a.filter(x => !(x && x.__kw));
    class PinC {
      constructor(p, mode, pull) { this.p = p; this.k = idx(p); if (this.k < 0) warn('El GPIO ' + p + ' no existe en el ESP32'); if (mode !== undefined) this.init(mode, pull); }
      init(mode, pull) { if (mode === 1) setMode(this.k, 'out'); else setMode(this.k, pull === 2 ? 'pu' : 'in'); }
      value(v) { if (v === undefined) return rd(this.k); setOut(this.k, v ? 1 : 0); }
      on() { setOut(this.k, 1); } off() { setOut(this.k, 0); } toggle() { setOut(this.k, rd(this.k) ? 0 : 1); }
    }
    const Pin = (...a) => { const p = pos(a), k = kwOf(a); return new PinC(p[0], p[1], p[2] !== undefined ? p[2] : k.pull); };
    Object.assign(Pin, { OUT:1, IN:0, PULL_UP:2, PULL_DOWN:3, OPEN_DRAIN:1 });
    class PWMC {
      constructor(pin, k) { this.k = pin.k; this.f = k.freq || 5000; this.d = k.duty !== undefined ? k.duty : k.duty_u16 !== undefined ? k.duty_u16 / 64 : 512; this.ap(); }
      ap() { const fr = Math.max(0, Math.min(1, this.d / 1023)); setOut(this.k, fr, this.f <= 400 ? fr / this.f : 0); }
      freq(f) { if (f === undefined) return this.f; this.f = f; this.ap(); }
      duty(d) { if (d === undefined) return Math.round(this.d); this.d = d; this.ap(); }
      duty_u16(d) { if (d === undefined) return Math.round(this.d * 64); this.d = d / 64; this.ap(); }
      duty_ns(ns) { this.d = ns * 1e-9 * this.f * 1023; this.ap(); }
      deinit() { setOut(this.k, 0); }
    }
    const PWM = (...a) => new PWMC(pos(a)[0], kwOf(a));
    class ADCC { constructor(pin) { this.k = pin.k; } read() { return this.k < 0 ? 0 : Math.round(Math.max(0, Math.min(1, volt(this.k) / VL())) * 4095); } read_u16() { return Math.round(this.read() / 4095 * 65535); } read_uv() { return Math.round(volt(this.k) * 1e6); } atten() {} width() {} }
    const ADC = (...a) => new ADCC(pos(a)[0]);
    Object.assign(ADC, { ATTN_0DB:0, ATTN_2_5DB:1, ATTN_6DB:2, ATTN_11DB:3, WIDTH_12BIT:3 });
    const I2C = (...a) => { const k = kwOf(a); return { sda:k.sda, scl:k.scl, scan:() => [0x27] }; };
    class I2cLcdC {
      constructor(i2c, addr, rows, cols) { this.l = new LiquidCrystal_I2C(addr, cols, rows); this.cols = cols; this.rows = rows; this.c = 0; this.r = 0; }
      * putstr(t) { for (const ch of String(t)) { if (ch === '\n') { this.r = (this.r + 1) % this.rows; this.c = 0; yield* this.l.setCursor(0, this.r); } else { yield* this.l.print(ch); this.c++; } } }
      * move_to(c, r) { this.c = c; this.r = r; yield* this.l.setCursor(c, r); }
      * clear() { this.c = 0; this.r = 0; yield* this.l.clear(); }
      * backlight_on() { yield* this.l.backlight(); } * backlight_off() { yield* this.l.noBacklight(); }
      * hide_cursor() {} * show_cursor() {} * blink_cursor_on() {} * blink_cursor_off() {}
    }
    const time = {
      sleep:function* (s) { yield* __delay(s * 1000); }, sleep_ms:function* (ms) { yield* __delay(ms); }, sleep_us:function* (us) { yield* __delay(us / 1000); },
      ticks_ms:function* () { return Math.floor((sim.time - rt.t0) * 1000); }, ticks_us:function* () { return Math.floor((sim.time - rt.t0) * 1e6); },
      ticks_diff:function* (a, b) { return a - b; }, time:function* () { return Math.floor(sim.time - rt.t0); }
    };
    const pyStr = x => x === true ? 'True' : x === false ? 'False' : x === null || x === undefined ? 'None' : Array.isArray(x) ? '[' + x.map(pyStr).join(', ') + ']' : String(x);
    Object.assign(ctx, {
      Pin, PWM, ADC, I2C, SoftI2C:I2C, I2cLcd:(...a) => new I2cLcdC(...a), time, utime:time,
      machine:{ Pin, PWM, ADC, I2C, SoftI2C:I2C, reset() {}, freq() { return 240000000; } },
      __kw:(k, v) => ({ __kw:true, k, v }), __py:pyStr, __iter:x => typeof x === 'string' ? Array.from(x) : x,
      print:(...a) => out(pos(a).map(pyStr).join(' ') + '\n'),
      range:(a, b, st) => { if (b === undefined) { b = a; a = 0; } st = st || 1; const r = []; for (let v = a; st > 0 ? v < b : v > b; v += st) r.push(v); return r; },
      len:x => x.length, str:pyStr, int:x => Math.trunc(Number(x)), float:x => Number(x), bool:x => !!x, round:(x, n) => n ? +x.toFixed(n) : Math.round(x),
      sum:a => a.reduce((p, q) => p + q, 0), list:x => Array.from(x || [])
    });
  }
  const avrH = { setOut:(k, v, pw) => setOut(idx(k), v, pw), setMode:(k, m) => setMode(idx(k), m), rd:k => rd(idx(k)), analogRead, out, rx:s.rx };
  if (lang === 'hex' && (isA || d.ard)) return makeAvrRuntime(rt, code, sim, avrH, true);
  if (lang === 'hex' && kind === 'pic') { rt.fosc = (c.p.fosc || 4) * 1e6; return makeAsmRuntime(rt, code, c.p.chip, sim, { ports, applyPort, readPort, analogRead, out }); }
  if (lang === 'hex') { rt.err = 'El ESP32 no ejecuta .HEX: carga el programa en MicroPython o Arduino.'; rt.run = () => {}; return rt; }
  if (lang === 'asm' && (isA || d.ard)) return makeAvrRuntime(rt, code, sim, avrH);
  if (lang === 'asm') { rt.fosc = (c.p.fosc || 4) * 1e6; return makeAsmRuntime(rt, code, c.p.chip, sim, { ports, applyPort, readPort, analogRead, out }); }
  try {
    const js = lang === 'python' ? transpilePy(code) : transpileC(code);
    rt.js = js;
    const fn = new Function('__c', 'with (__c) {\n' + js + '\n;__c.__setup = typeof setup === "function" ? setup : null; __c.__loop = typeof loop === "function" ? loop : null; __c.__main = typeof main === "function" ? main : null;\n}');
    fn(ctx);
    if (!ctx.__setup && !ctx.__loop && !ctx.__main) rt.err = 'El programa necesita las funciones setup() y loop(), o main().';
  } catch (err) { rt.err = 'Error de compilación: ' + err.message; }
  rt.ctx = ctx;
  rt.run = () => {
    if (rt.err || rt.halt || sim.time < rt.wait) return;
    for (let budget = 0; budget < 4000; budget++) {
      if (!rt.gen) {
        if (!rt.started) { rt.started = true; rt.phase = ctx.__main ? 'main' : 'setup'; rt.gen = ctx.__main ? ctx.__main() : ctx.__setup ? ctx.__setup() : null; if (!rt.gen) continue; }
        else if (rt.phase === 'main') { rt.halt = true; return; }
        else if (ctx.__loop) { rt.phase = 'loop'; rt.gen = ctx.__loop(); }
        else { rt.halt = true; return; }
      }
      let r;
      try { r = rt.gen.next(); } catch (err) { rt.err = 'Error al ejecutar: ' + err.message; out('✖ ' + rt.err + '\n'); return; }
      if (r.done) { rt.gen = null; continue; }
      if (rt.wait <= sim.time) rt.wait = sim.time + 1e-9;
      return;
    }
  };
  return rt;
}

/* ---------- ensamblador PIC (sintaxis MPASM) ---------- */
const PIC16_SFR = { INDF:0x00, TMR0:0x01, PCL:0x02, STATUS:0x03, FSR:0x04, PORTA:0x05, PORTB:0x06, PORTC:0x07, PORTD:0x08, PORTE:0x09, PCLATH:0x0A, INTCON:0x0B,
  ADRESH:0x1E, ADCON0:0x1F, OPTION_REG:0x81, TRISA:0x85, TRISB:0x86, TRISC:0x87, TRISD:0x88, TRISE:0x89, ADRESL:0x9E, ADCON1:0x9F, CMCON:0x9C };
const PIC18_SFR = { PORTA:0xF80, PORTB:0xF81, PORTC:0xF82, PORTD:0xF83, PORTE:0xF84, LATA:0xF89, LATB:0xF8A, LATC:0xF8B, LATD:0xF8C, LATE:0xF8D,
  TRISA:0xF92, TRISB:0xF93, TRISC:0xF94, TRISD:0xF95, TRISE:0xF96, CMCON:0xFB4, ADCON2:0xFC0, ADCON1:0xFC1, ADCON0:0xFC2, ADRESL:0xFC3, ADRESH:0xFC4,
  STATUS:0xFD8, FSR2L:0xFD9, FSR2H:0xFDA, T0CON:0xFD5, TMR0L:0xFD6, TMR0H:0xFD7, OSCCON:0xFD3, BSR:0xFE0, FSR1L:0xFE1, FSR1H:0xFE2, WREG:0xFE8,
  FSR0L:0xFE9, FSR0H:0xFEA, INDF0:0xFEF, INTCON:0xFF2, PRODL:0xFF3, PRODH:0xFF4, PCL:0xFF9, PCLATH:0xFFA };
const ASM_OPS = 'ADDWF ADDWFC ANDWF CLRF CLRW COMF CPFSEQ CPFSGT CPFSLT DECF DECFSZ DCFSNZ INCF INCFSZ INFSNZ IORWF MOVF MOVFF MOVWF MULWF NEGF RLF RRF RLCF RRCF RLNCF RRNCF SETF SUBWF SUBWFB SUBFWB SWAPF TSTFSZ XORWF BCF BSF BTFSC BTFSS BTG ADDLW ANDLW IORLW MOVLW SUBLW XORLW MULLW MOVLB LFSR RETLW CALL RCALL GOTO BRA BZ BNZ BC BNC BN BNN BOV BNOV RETURN RETFIE NOP CLRWDT SLEEP TRIS OPTION BANKSEL DAW'.split(' ');
const ASM_FD = new Set('ADDWF ADDWFC ANDWF COMF DECF DECFSZ DCFSNZ INCF INCFSZ INFSNZ IORWF MOVF RLF RRF RLCF RRCF RLNCF RRNCF SUBWF SUBWFB SUBFWB SWAPF XORWF'.split(' '));
function asmSymbols(chip) {
  const p18 = chip === 'pic18f4550', s = { W:0, F:1, ACCESS:0, A:0, BANKED:1, C:0, DC:1, Z:2, OV:3, N:4, RP0:5, RP1:6, IRP:7, T0IF:2, TMR0IF:2, T0IE:5, TMR0IE:5, GIE:7,
    PSA:3, T0CS:5, TMR0ON:7, T08BIT:6, ADON:0, ADFM:7 };
  Object.assign(s, p18 ? PIC18_SFR : PIC16_SFR);
  s.GO = s.GO_DONE = s.NOT_DONE = s.DONE = p18 ? 1 : 2;
  'ABCDE'.split('').forEach(L => { for (let b = 0; b < 8; b++) { s['R' + L + b] = b; s['TRIS' + L + b] = b; s['LAT' + L + b] = b; } });
  return s;
}
function asmEval(str, sym, radix, here) {
  let out = '', i = 0; const s = String(str).trim();
  if (!s) throw new Error('falta un operando');
  const tok = () => {
    const rest = s.slice(i); let m;
    if ((m = /^([HhBbDdOoAa])'([^']*)'/.exec(rest))) { i += m[0].length; const t = m[1].toLowerCase(); return t === 'h' ? parseInt(m[2], 16) : t === 'b' ? parseInt(m[2], 2) : t === 'd' ? parseInt(m[2], 10) : t === 'o' ? parseInt(m[2], 8) : m[2].charCodeAt(0); }
    if ((m = /^'(.)'/.exec(rest))) { i += m[0].length; return m[1].charCodeAt(0); }
    if ((m = /^0[xX]([0-9A-Fa-f]+)/.exec(rest))) { i += m[0].length; return parseInt(m[1], 16); }
    if ((m = /^0[bB]([01]+)/.exec(rest))) { i += m[0].length; return parseInt(m[1], 2); }
    if ((m = /^\.(\d+)/.exec(rest))) { i += m[0].length; return parseInt(m[1], 10); }
    if ((m = /^(\d[0-9A-Fa-f]*)[hH](?![\w])/.exec(rest))) { i += m[0].length; return parseInt(m[1], 16); }
    if ((m = /^\d[0-9A-Fa-f]*/.exec(rest))) { i += m[0].length; const v = parseInt(m[0], radix); if (isNaN(v)) throw new Error('número no válido ' + m[0]); return v; }
    if (rest[0] === '$') { i++; return here; }
    if ((m = /^[A-Za-z_]\w*/.exec(rest))) {
      i += m[0].length; const k = m[0].toUpperCase();
      if (k === 'HIGH' || k === 'LOW' || k === 'UPPER') { while (s[i] === ' ' || s[i] === '\t') i++; let v; if (s[i] === '(') { const j = s.indexOf(')', i); v = asmEval(s.slice(i + 1, j), sym, radix, here); i = j + 1; } else v = tok(); return k === 'HIGH' ? (v >> 8) & 255 : k === 'LOW' ? v & 255 : (v >> 16) & 255; }
      if (sym[k] === undefined) throw new Error('símbolo desconocido «' + m[0] + '»');
      return sym[k];
    }
    return null;
  };
  while (i < s.length) { const v = tok(); if (v !== null) out += '(' + v + ')'; else { out += s[i]; i++; } }
  if (/[^\d()+\-*/%&|^~<> ]/.test(out)) throw new Error('expresión no válida «' + s + '»');
  return Function('return (' + out + ')')() | 0;
}
function asmSplit(a) { const out = []; let dep = 0, cur = ''; for (const ch of a) { if (ch === '(') dep++; if (ch === ')') dep--; if (ch === ',' && !dep) { out.push(cur); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur); return out.map(x => x.trim()); }
function asmBuild(src, chip) {
  const p18 = chip === 'pic18f4550', sym = asmSymbols(chip), defs = {}, prog = [];
  let pc = 0, radix = 16, cblock = null, ended = false;
  const isOp = w => ASM_OPS.includes(w.toUpperCase());
  const subst = t => t.replace(/[A-Za-z_]\w*/g, w => defs[w.toUpperCase()] !== undefined ? defs[w.toUpperCase()] : w);
  const E = (t, here) => asmEval(subst(t), sym, radix, here === undefined ? pc : here);
  String(src || '').replace(/\r/g, '').split('\n').forEach((raw, ln) => {
    if (ended) return;
    const line = raw.replace(/;.*$/, '');
    if (!line.trim()) return;
    try {
      if (cblock !== null) {
        if (/^\s*endc\b/i.test(line)) { cblock = null; return; }
        line.split(',').forEach(part => { const m = /^\s*(\w+)\s*(?::\s*(.+))?$/.exec(part); if (m) { sym[m[1].toUpperCase()] = cblock; cblock += m[2] ? E(m[2]) : 1; } });
        return;
      }
      let label = null, rest = line;
      if (/^[A-Za-z_]/.test(line)) { const m = /^(\w+)(:?)\s*(.*)$/.exec(line); if (m && (m[2] || !isOp(m[1]) && !/^(list|processor|include|org|end|cblock|radix|errorlevel|config|__config|banksel|pagesel|equ)$/i.test(m[1]))) { label = m[1]; rest = m[3]; } }
      const m2 = /^\s*(#?[\w.]+|=)\s*(.*)$/.exec(rest), op = m2 ? m2[1].toUpperCase() : '', args = m2 ? m2[2].trim() : '';
      if (op === 'EQU' || op === 'SET' || op === '=') { if (!label) throw new Error('EQU sin nombre'); sym[label.toUpperCase()] = E(args); return; }
      if (label) sym[label.toUpperCase()] = pc;
      if (!op) return;
      switch (op) {
        case 'LIST': case 'PROCESSOR': case '#INCLUDE': case 'INCLUDE': case '__CONFIG': case 'CONFIG': case 'ERRORLEVEL': case 'PAGESEL': case '__IDLOCS': case 'TITLE': case 'NOLIST': case '#PRAGMA': return;
        case 'RADIX': radix = /dec/i.test(args) ? 10 : /oct/i.test(args) ? 8 : 16; return;
        case '#DEFINE': { const m = /^(\w+)\s*(.*)$/.exec(args); if (m) defs[m[1].toUpperCase()] = m[2] || '1'; return; }
        case 'CBLOCK': cblock = args ? E(args) : 0x20; return;
        case 'ORG': pc = E(args); if (p18) pc >>= 1; return;
        case 'END': ended = true; return;
      }
      if (!isOp(op)) throw new Error('instrucción desconocida «' + m2[1] + '»');
      prog[pc] = { op, args:subst(args), ln:ln + 1, at:pc }; pc++;
    } catch (err) { throw new Error('línea ' + (ln + 1) + ': ' + err.message); }
  });
  prog.forEach(ins => { if (!ins) return; try { ins.o = ins.args ? asmSplit(ins.args).map(a => asmEval(a, sym, radix, ins.at)) : []; } catch (err) { throw new Error('línea ' + ins.ln + ': ' + err.message); } });
  if (!prog.length) throw new Error('el programa está vacío');
  return { prog, p18 };
}
/* ---------- firmware compilado (MPLAB / XC8) para PIC16 (palabras de 14 bits) y PIC18 (palabras de 16 bits) ---------- */
const PIC_FLASH_W = { pic16f84a:1024, pic16f877a:8192, pic18f4550:16384 };
function isIntelHex(t) { return /^\s*:[0-9A-Fa-f]{10,}/.test(String(t || '')); }
const PIC16_FD = [null, null, 'SUBWF', 'DECF', 'IORWF', 'ANDWF', 'XORWF', 'ADDWF', 'MOVF', 'COMF', 'INCF', 'DECFSZ', 'RRF', 'RLF', 'SWAPF', 'INCFSZ'];
function picDecode16(x) {
  const f = x & 0x7f, d = (x >> 7) & 1, b = (x >> 7) & 7;
  switch (x >> 12) {
    case 0: {
      const o4 = (x >> 8) & 15;
      if (o4 === 0) {
        if (x & 0x80) return { op:'MOVWF', o:[f] };
        const sp = { 0x08:'RETURN', 0x09:'RETFIE', 0x62:'OPTION', 0x63:'SLEEP', 0x64:'CLRWDT' }[x];
        if (sp) return { op:sp, o:[] };
        if (x >= 0x65 && x <= 0x67) return { op:'TRIS', o:[x & 7] };
        if ((x & 0x9f) === 0) return { op:'NOP', o:[] };
        return null;
      }
      if (o4 === 1) return d ? { op:'CLRF', o:[f] } : { op:'CLRW', o:[] };
      return { op:PIC16_FD[o4], o:[f, d] };
    }
    case 1: return { op:['BCF', 'BSF', 'BTFSC', 'BTFSS'][(x >> 10) & 3], o:[f, b] };
    case 2: return { op:(x & 0x800) ? 'GOTO' : 'CALL', o:[x & 0x7ff], pg:true };
    default: {
      const k = x & 0xff, t = (x >> 8) & 15;
      if (t < 4) return { op:'MOVLW', o:[k] };
      if (t < 8) return { op:'RETLW', o:[k] };
      if (t === 8) return { op:'IORLW', o:[k] };
      if (t === 9) return { op:'ANDLW', o:[k] };
      if (t === 10) return { op:'XORLW', o:[k] };
      if (t === 12 || t === 13) return { op:'SUBLW', o:[k] };
      if (t >= 14) return { op:'ADDLW', o:[k] };
      return null;
    }
  }
}
const PIC18_FD = { 1:'DECF', 4:'IORWF', 5:'ANDWF', 6:'XORWF', 7:'COMF', 8:'ADDWFC', 9:'ADDWF', 10:'INCF', 11:'DECFSZ', 12:'RRCF', 13:'RLCF', 14:'SWAPF', 15:'INCFSZ',
  16:'RRNCF', 17:'RLNCF', 18:'INFSNZ', 19:'DCFSNZ', 20:'MOVF', 21:'SUBFWB', 22:'SUBWFB', 23:'SUBWF' };
/* devuelve [instrucción, palabras que ocupa] */
function picDecode18(w, a, wd) {
  const f = w & 0xff, acc = (w >> 8) & 1, d = (w >> 9) & 1, b = (w >> 9) & 7, k = w & 0xff, hi = w >> 8, sx = (v, bits) => (v & (1 << (bits - 1))) ? v - (1 << bits) : v;
  if (hi === 0) {
    const sp = { 0x00:'NOP', 0x03:'SLEEP', 0x04:'CLRWDT', 0x05:'PUSH', 0x06:'POP', 0x07:'DAW', 0x10:'RETFIE', 0x11:'RETFIE', 0x12:'RETURN', 0x13:'RETURN', 0xff:'RESET' }[w];
    if (sp) return [{ op:sp, o:[] }, 1];
    if (w >= 0x08 && w <= 0x0b) return [{ op:'TBLRD', o:[], mode:w - 8 }, 1];
    if (w >= 0x0c && w <= 0x0f) return [{ op:'NOP', o:[] }, 1];
    return [null, 1];
  }
  if (hi === 0x01) return [{ op:'MOVLB', o:[w & 15] }, 1];
  if ((w >> 9) === 1) return [{ op:'MULWF', o:[f, acc] }, 1];
  if (hi >= 0x08 && hi <= 0x0f) return [{ op:['SUBLW', 'IORLW', 'XORLW', 'ANDLW', 'RETLW', 'MULLW', 'MOVLW', 'ADDLW'][hi - 8], o:[k] }, 1];
  const o6 = w >> 10, o4 = w >> 12;
  if (PIC18_FD[o6]) return [{ op:PIC18_FD[o6], o:[f, d, acc] }, 1];
  if (o4 === 6) return [{ op:['CPFSLT', 'CPFSEQ', 'CPFSGT', 'TSTFSZ', 'SETF', 'CLRF', 'NEGF', 'MOVWF'][(w >> 9) & 7], o:[f, acc] }, 1];
  if (o4 >= 7 && o4 <= 11) return [{ op:{ 7:'BTG', 8:'BSF', 9:'BCF', 10:'BTFSS', 11:'BTFSC' }[o4], o:[f, b, acc] }, 1];
  if (o4 === 12) return [{ op:'MOVFF', o:[w & 0xfff, wd(a + 1) & 0xfff] }, 2];
  if (o4 === 13) return [{ op:(w & 0x800) ? 'RCALL' : 'BRA', o:[a + 1 + sx(w & 0x7ff, 11)] }, 1];
  if (hi >= 0xe0 && hi <= 0xe7) return [{ op:['BZ', 'BNZ', 'BC', 'BNC', 'BOV', 'BNOV', 'BN', 'BNN'][hi - 0xe0], o:[a + 1 + sx(k, 8)] }, 1];
  if (hi === 0xec || hi === 0xed || hi === 0xef) return [{ op:hi === 0xef ? 'GOTO' : 'CALL', o:[k | ((wd(a + 1) & 0xfff) << 8)] }, 2];
  if (hi === 0xee && (w & 0xc0) === 0) return [{ op:'LFSR', o:[(w >> 4) & 3, ((w & 15) << 8) | (wd(a + 1) & 0xff)] }, 2];
  if (o4 === 15) return [{ op:'NOP', o:[] }, 1];
  return [null, 1];
}
function picFromHex(txt, chip) {
  const h = parseIntelHex(txt), p18 = chip === 'pic18f4550', maxW = PIC_FLASH_W[chip] || 8192;
  const nW = Math.min(maxW, Math.ceil(h.size / 2)), wd = a => h.bytes[a * 2] | (h.bytes[a * 2 + 1] << 8), prog = [], unsup = {};
  if (!nW) throw new Error('el firmware no tiene código dentro de la memoria del ' + chip.toUpperCase());
  for (let a = 0; a < nW;) {
    const w = wd(a); let I, n = 1;
    if (p18) [I, n] = picDecode18(w, a, wd); else I = picDecode16(w & 0x3fff);
    if (!I) { const key = '0x' + w.toString(16).padStart(4, '0'); unsup[key] = (unsup[key] || 0) + 1; I = { op:'NOP', o:[] }; }
    I.at = a; I.ln = 0; prog[a] = I;
    if (n === 2) prog[a + 1] = { op:'NOP', o:[], at:a + 1, ln:0, fill:true };
    a += n;
  }
  const flash = new Uint8Array(65536); flash.set(h.bytes.subarray(0, 65536));
  return { prog, p18, flash, unsup, size:h.size, words:nW };
}
function makeAsmRuntime(rt, code, chip, sim, H) {
  let A; const hex = isIntelHex(code);
  try { A = hex ? picFromHex(code, chip) : asmBuild(code, chip); } catch (err) { rt.err = (hex ? 'Firmware HEX no válido: ' : 'Error de ensamblado: ') + err.message; rt.run = () => {}; return rt; }
  if (hex && Object.keys(A.unsup).length) H.out('⚠ El firmware usa ' + Object.keys(A.unsup).length + ' códigos de instrucción no emulados (se tratan como NOP): ' + Object.keys(A.unsup).slice(0, 6).join(', ') + '\n');
  if (hex) H.out('Firmware HEX cargado: ' + A.words + ' palabras de programa (' + (A.p18 ? 'PIC18, 16 bits' : 'PIC16, 14 bits') + ').\n');
  const p18 = A.p18, prog = A.prog, ram = new Uint8Array(4096), stack = [], LET = 'ABCDE', flashB = A.flash || null;
  let icount = 0, indCache = null, intPrev = 0;
  const ST = p18 ? 0xFD8 : 0x03; let W = 0, pc = 0, tmrAcc = 0;
  if (!p18) ram[ST] = 0x18;
  rt.fosc = rt.fosc || 4e6; rt.cyc = 0; rt.lastT = sim.time; rt.phase = 'asm';
  const port = L => H.ports[L];
  const norm16 = a => {
    const lo = a & 0x7f;
    if ([0, 2, 3, 4, 0x0a, 0x0b].includes(lo)) return lo;
    if (chip === 'pic16f84a' && a >= 0x80 && lo >= 0x0c) return lo;
    if (chip === 'pic16f877a' && lo >= 0x70) return lo;
    return a & 0x1ff;
  };
  const addr = (f, a) => {
    if (p18) { const lo = f & 0xff, acc = a === undefined ? (f >= 0xf60 || f < 0x60) : a === 0; return acc ? (lo < 0x60 ? lo : 0xf00 | lo) : ((ram[0xfe0] & 15) << 8) | lo; }
    return norm16((((ram[ST] >> 5) & 3) << 7) | (f & 0x7f));
  };
  const indAddr = () => p18 ? (((ram[0xfea] & 15) << 8) | ram[0xfe9]) : ((((ram[ST] >> 7) & 1) << 8) | ram[0x04]);
  const IND18 = {};
  [[0xfef, 0xfe9], [0xfe7, 0xfe1], [0xfdf, 0xfd9]].forEach(([ind, fl]) => { IND18[ind] = [fl, 'ind']; IND18[ind - 1] = [fl, 'postinc']; IND18[ind - 2] = [fl, 'postdec']; IND18[ind - 3] = [fl, 'preinc']; IND18[ind - 4] = [fl, 'plusw']; });
  const indEff = ad => {
    if (indCache && indCache.n === icount && indCache.ad === ad) return indCache.eff;
    const [fl, mode] = IND18[ad], get = () => ((ram[fl + 1] & 15) << 8) | ram[fl], put = v => { ram[fl] = v & 255; ram[fl + 1] = (v >> 8) & 15; };
    let p = get(), eff = p;
    if (mode === 'postinc') put(p + 1); else if (mode === 'postdec') put(p - 1); else if (mode === 'preinc') { p = (p + 1) & 0xfff; put(p); eff = p; }
    else if (mode === 'plusw') eff = (p + (W > 127 ? W - 256 : W)) & 0xfff;
    indCache = { n:icount, ad, eff }; return eff;
  };
  const rd = ad => {
    if (p18) {
      if (ad >= 0xf80 && ad <= 0xf84) { const L = LET[ad - 0xf80]; return port(L) ? H.readPort(L) : 0; }
      if (ad >= 0xf89 && ad <= 0xf8d) { const P = port(LET[ad - 0xf89]); return P ? P.lat : 0; }
      if (ad >= 0xf92 && ad <= 0xf96) { const P = port(LET[ad - 0xf92]); return P ? P.tris : 0xff; }
      if (ad === 0xfe8) return W;
      if (IND18[ad]) { const ea = indEff(ad); return IND18[ea] ? 0 : rd(ea); }
      if (ad === 0xff9) return (pc * 2) & 255;
    } else {
      if (ad >= 0x05 && ad <= 0x09) { const L = LET[ad - 5]; return port(L) ? H.readPort(L) : 0; }
      if (ad >= 0x85 && ad <= 0x89) { const P = port(LET[ad - 0x85]); return P ? P.tris : 0xff; }
      if (ad === 0x00) { const ia = indAddr(); return ia === 0 ? 0 : rd(norm16(ia)); }
      if (ad === 0x02) return pc & 255;
    }
    return ram[ad];
  };
  const adc = v => {
    const go = p18 ? 2 : 4, on = v & 1;
    if (!(v & go) || !on) return v;
    const ch = p18 ? (v >> 2) & 15 : (v >> 3) & 7, val = H.analogRead(ch), rj = ram[p18 ? 0xfc0 : 0x9f] & 0x80;
    ram[p18 ? 0xfc4 : 0x1e] = rj ? val >> 8 : val >> 2; ram[p18 ? 0xfc3 : 0x9e] = rj ? val & 255 : (val & 3) << 6;
    return v & ~go;
  };
  const wr = (ad, v) => {
    v &= 255;
    if (p18) {
      if (ad >= 0xf80 && ad <= 0xf84 || ad >= 0xf89 && ad <= 0xf8d) { const L = LET[ad >= 0xf89 ? ad - 0xf89 : ad - 0xf80], P = port(L); if (P) { P.lat = v; H.applyPort(L); } return; }
      if (ad >= 0xf92 && ad <= 0xf96) { const L = LET[ad - 0xf92], P = port(L); if (P) { P.tris = v; H.applyPort(L); } return; }
      if (ad === 0xfe8) { W = v; return; }
      if (IND18[ad]) { const ea = indEff(ad); if (!IND18[ea]) wr(ea, v); return; }
      if (ad === 0xff9) { pc = (((ram[0xffa] << 8) | v) >> 1); return; }
      if (ad === 0xfc2) v = adc(v);
    } else {
      if (ad >= 0x05 && ad <= 0x09) { const L = LET[ad - 5], P = port(L); if (P) { P.lat = v; H.applyPort(L); } return; }
      if (ad >= 0x85 && ad <= 0x89) { const L = LET[ad - 0x85], P = port(L); if (P) { P.tris = v; H.applyPort(L); } return; }
      if (ad === 0x00) { const ia = indAddr(); if (ia) wr(norm16(ia), v); return; }
      if (ad === 0x02) { pc = (ram[0x0a] << 8) | v; return; }
      if (ad === 0x1f) v = adc(v);
    }
    ram[ad] = v;
  };
  const C = () => ram[ST] & 1;
  const flag = (bit, on) => { if (on) ram[ST] |= 1 << bit; else ram[ST] &= ~(1 << bit); };
  const Zf = r => flag(2, (r & 255) === 0);
  const NZ = r => { Zf(r); if (p18) flag(4, r & 0x80); };
  const tmr = cyc => {
    if (p18) {
      const t = ram[0xfd5]; if (!(t & 0x80) || (t & 0x20)) return;
      const pre = t & 8 ? 1 : 2 << (t & 7); tmrAcc += cyc;
      while (tmrAcc >= pre) { tmrAcc -= pre; ram[0xfd6] = (ram[0xfd6] + 1) & 255; if (!ram[0xfd6]) ram[0xff2] |= 4; }
    } else {
      const o = ram[0x81]; if (o & 0x20) return;
      const pre = o & 8 ? 1 : 2 << (o & 7); tmrAcc += cyc;
      while (tmrAcc >= pre) { tmrAcc -= pre; ram[0x01] = (ram[0x01] + 1) & 255; if (!ram[0x01]) ram[0x0b] |= 4; }
    }
  };
  const exec = () => {
    const ins = prog[pc]; icount++;
    if (!ins) {
      if (pc >= prog.length) { rt.halt = true; H.out('⚠ El programa llegó al final de la memoria: falta un GOTO al bucle principal.\n'); return 1; }
      pc++; return 1;
    }
    pc++;
    const o = ins.o, op = ins.op;
    if (ASM_FD.has(op)) {
      const ad = addr(o[0], o[2]), fv = rd(ad); let r, skip = false;
      switch (op) {
        case 'ADDWF': r = fv + W; flag(0, r > 255); flag(1, (fv & 15) + (W & 15) > 15); NZ(r); break;
        case 'ADDWFC': r = fv + W + C(); flag(0, r > 255); NZ(r); break;
        case 'ANDWF': r = fv & W; NZ(r); break;
        case 'IORWF': r = fv | W; NZ(r); break;
        case 'XORWF': r = fv ^ W; NZ(r); break;
        case 'COMF': r = ~fv & 255; NZ(r); break;
        case 'DECF': r = (fv - 1) & 255; NZ(r); if (p18) flag(0, fv !== 0); break;
        case 'INCF': r = (fv + 1) & 255; NZ(r); if (p18) flag(0, fv === 255); break;
        case 'DECFSZ': r = (fv - 1) & 255; skip = r === 0; break;
        case 'INCFSZ': r = (fv + 1) & 255; skip = r === 0; break;
        case 'DCFSNZ': r = (fv - 1) & 255; skip = r !== 0; break;
        case 'INFSNZ': r = (fv + 1) & 255; skip = r !== 0; break;
        case 'MOVF': r = fv; NZ(r); break;
        case 'RLF': case 'RLCF': r = ((fv << 1) | C()) & 255; flag(0, fv & 0x80); if (p18) NZ(r); break;
        case 'RRF': case 'RRCF': r = (fv >> 1) | (C() << 7); flag(0, fv & 1); if (p18) NZ(r); break;
        case 'RLNCF': r = ((fv << 1) | (fv >> 7)) & 255; NZ(r); break;
        case 'RRNCF': r = ((fv >> 1) | (fv << 7)) & 255; NZ(r); break;
        case 'SUBWF': r = fv - W; flag(0, r >= 0); flag(1, (fv & 15) >= (W & 15)); NZ(r); break;
        case 'SUBWFB': r = fv - W - (1 - C()); flag(0, r >= 0); NZ(r); break;
        case 'SUBFWB': r = W - fv - (1 - C()); flag(0, r >= 0); NZ(r); break;
        case 'SWAPF': r = ((fv << 4) | (fv >> 4)) & 255; break;
      }
      r &= 255;
      if ((o[1] === undefined ? 1 : o[1]) === 0) W = r; else wr(ad, r);
      if (skip) { pc++; return 2; }
      return 1;
    }
    switch (op) {
      case 'NOP': case 'CLRWDT': case 'DAW': return 1;
      case 'MOVLW': W = o[0] & 255; return 1;
      case 'MOVWF': wr(addr(o[0], o[1]), W); return 1;
      case 'CLRF': wr(addr(o[0], o[1]), 0); flag(2, 1); return 1;
      case 'SETF': wr(addr(o[0], o[1]), 255); return 1;
      case 'CLRW': W = 0; flag(2, 1); return 1;
      case 'NEGF': { const ad = addr(o[0], o[1]), r = (-rd(ad)) & 255; wr(ad, r); NZ(r); return 1; }
      case 'MOVFF': wr(o[1] & 0xfff, rd(o[0] & 0xfff)); return 2;
      case 'MULWF': case 'MULLW': { const p = W * (op === 'MULLW' ? o[0] & 255 : rd(addr(o[0], o[1]))); ram[0xff3] = p & 255; ram[0xff4] = p >> 8; return 1; }
      case 'BCF': { const ad = addr(o[0], o[2]); wr(ad, rd(ad) & ~(1 << o[1])); return 1; }
      case 'BSF': { const ad = addr(o[0], o[2]); wr(ad, rd(ad) | (1 << o[1])); return 1; }
      case 'BTG': { const ad = addr(o[0], o[2]); wr(ad, rd(ad) ^ (1 << o[1])); return 1; }
      case 'BTFSC': if (!((rd(addr(o[0], o[2])) >> o[1]) & 1)) { pc++; return 2; } return 1;
      case 'BTFSS': if ((rd(addr(o[0], o[2])) >> o[1]) & 1) { pc++; return 2; } return 1;
      case 'CPFSEQ': if (rd(addr(o[0], o[1])) === W) { pc++; return 2; } return 1;
      case 'CPFSGT': if (rd(addr(o[0], o[1])) > W) { pc++; return 2; } return 1;
      case 'CPFSLT': if (rd(addr(o[0], o[1])) < W) { pc++; return 2; } return 1;
      case 'TSTFSZ': if (rd(addr(o[0], o[1])) === 0) { pc++; return 2; } return 1;
      case 'ADDLW': { const r = W + (o[0] & 255); flag(0, r > 255); flag(1, (W & 15) + (o[0] & 15) > 15); W = r & 255; NZ(r); return 1; }
      case 'SUBLW': { const r = (o[0] & 255) - W; flag(0, r >= 0); flag(1, (o[0] & 15) >= (W & 15)); W = r & 255; NZ(r); return 1; }
      case 'ANDLW': W &= o[0] & 255; NZ(W); return 1;
      case 'IORLW': W = (W | o[0]) & 255; NZ(W); return 1;
      case 'XORLW': W = (W ^ o[0]) & 255; NZ(W); return 1;
      case 'MOVLB': ram[0xfe0] = o[0] & 15; return 1;
      case 'LFSR': { const k = o[1] & 0xfff, fl = [0xfe9, 0xfe1, 0xfd9][o[0]] || 0xfe9; ram[fl] = k & 255; ram[fl + 1] = k >> 8; return 2; }
      case 'BANKSEL': if (p18) ram[0xfe0] = (o[0] >> 8) & 15; else { flag(5, (o[0] >> 7) & 1); flag(6, (o[0] >> 8) & 1); } return 1;
      case 'GOTO': case 'BRA': pc = ins.pg ? (((ram[0x0a] & 0x18) << 8) | (o[0] & 0x7ff)) : o[0]; return 2;
      case 'CALL': case 'RCALL': stack.push(pc); if (stack.length > (p18 ? 31 : 8)) stack.shift(); pc = ins.pg ? (((ram[0x0a] & 0x18) << 8) | (o[0] & 0x7ff)) : o[0]; return 2;
      case 'RETURN': pc = stack.length ? stack.pop() : 0; return 2;
      case 'RETFIE': pc = stack.length ? stack.pop() : 0; ram[p18 ? 0xff2 : 0x0b] |= 0x80; return 2;
      case 'TBLRD': {
        let p = ram[0xff6] | (ram[0xff7] << 8) | (ram[0xff8] << 16);
        if (ins.mode === 3) p++;
        ram[0xff5] = flashB && p < flashB.length ? flashB[p] : 0;
        if (ins.mode === 1) p++; else if (ins.mode === 2) p--;
        p &= 0x1fffff; ram[0xff6] = p & 255; ram[0xff7] = (p >> 8) & 255; ram[0xff8] = (p >> 16) & 255;
        return 2;
      }
      case 'PUSH': stack.push(pc); return 1;
      case 'POP': stack.pop(); return 1;
      case 'RESET': pc = 0; stack.length = 0; return 1;
      case 'RETLW': W = o[0] & 255; pc = stack.length ? stack.pop() : 0; return 2;
      case 'BZ': if (ram[ST] & 4) { pc = o[0]; return 2; } return 1;
      case 'BNZ': if (!(ram[ST] & 4)) { pc = o[0]; return 2; } return 1;
      case 'BC': if (ram[ST] & 1) { pc = o[0]; return 2; } return 1;
      case 'BNC': if (!(ram[ST] & 1)) { pc = o[0]; return 2; } return 1;
      case 'BN': if (ram[ST] & 16) { pc = o[0]; return 2; } return 1;
      case 'BNN': if (!(ram[ST] & 16)) { pc = o[0]; return 2; } return 1;
      case 'BOV': if (ram[ST] & 8) { pc = o[0]; return 2; } return 1;
      case 'BNOV': if (!(ram[ST] & 8)) { pc = o[0]; return 2; } return 1;
      case 'TRIS': { const L = LET[(o[0] & 0x7f) - 5], P = L && port(L); if (P) { P.tris = W; H.applyPort(L); } return 1; }
      case 'OPTION': ram[0x81] = W; return 1;
      case 'SLEEP': rt.halt = true; H.out('El PIC entró en modo SLEEP.\n'); return 1;
    }
    return 1;
  };
  const INTCON = p18 ? 0xff2 : 0x0b;
  const irq = () => {
    const ic = ram[INTCON];
    if (!(ic & 0x80)) return 0;
    if (((ic & 0x20) && (ic & 0x04)) || ((ic & 0x10) && (ic & 0x02))) { stack.push(pc); if (stack.length > (p18 ? 31 : 8)) stack.shift(); ram[INTCON] &= ~0x80; pc = p18 ? 4 : 4; return 2; }
    return 0;
  };
  const sampleInt = () => {
    if (!H.ports.B) return;
    const lv = H.readPort('B') & 1, rising = ((p18 ? ram[0xff1] : ram[0x81]) >> 6) & 1;
    if (lv !== intPrev && (rising ? lv : !lv)) ram[INTCON] |= 0x02;
    intPrev = lv;
  };
  rt.run = () => {
    if (rt.err || rt.halt) return;
    rt.cyc += (sim.time - rt.lastT) * rt.fosc / 4; rt.lastT = sim.time;
    sampleInt();
    let n = 0;
    while (rt.cyc >= 1 && !rt.halt) { const c = irq() || exec(); rt.cyc -= c; tmr(c); if (++n > 400000) { rt.cyc = 0; break; } }
  };
  rt.regs = () => ({ W, pc, STATUS:ram[ST] });
  return rt;
}

/* ---------- MicroPython: traductor de un subconjunto de Python ---------- */
function pyKwargs(line) {
  let out = '', dep = 0, closeAt = [], i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch === '\u0001') { const j = line.indexOf('\u0001', i + 1); out += line.slice(i, j + 1); i = j + 1; continue; }
    if (dep > 0) { const m = /^(\w+)\s*=(?!=)/.exec(line.slice(i)); const prev = out.replace(/\s+$/, '').slice(-1); if (m && (prev === '(' || prev === ',')) { out += '__kw("' + m[1] + '", '; closeAt.push(dep); i += m[0].length; continue; } }
    if (ch === '(' || ch === '[' || ch === '{') dep++;
    if ((ch === ',' || ch === ')' || ch === ']' || ch === '}') && closeAt.length && closeAt[closeAt.length - 1] === dep) { out += ')'; closeAt.pop(); }
    if (ch === ')' || ch === ']' || ch === '}') dep--;
    out += ch; i++;
  }
  return out;
}
function pyExpr(e) {
  return pyKwargs(e).replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null')
    .replace(/\s+is\s+not\s+/g, ' !== ').replace(/\s+is\s+/g, ' === ').replace(/\s+and\s+/g, ' && ').replace(/\s+or\s+/g, ' || ').replace(/\bnot\s+/g, '!')
    .replace(/([\w.\)\]]+)\s*\/\/\s*([\w.\(]+)/g, 'Math.floor($1 / $2)').replace(/\.append\(/g, '.push(');
}
function transpilePy(src) {
  const strs = [];
  let s = String(src || '').replace(/\r/g, '').replace(/\t/g, '    ');
  s = s.replace(/([fF]?)("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, (m, f, q) => {
    let js;
    if (q.startsWith('"""') || q.startsWith("'''")) js = JSON.stringify(q.slice(3, -3));
    else if (f) js = '\x60' + q.slice(1, -1).replace(/\x60/g, '\\\x60').replace(/\{([^}]*)\}/g, (x, ex) => '\x24{__py(' + pyExpr(ex.replace(/:[^:]*$/, '')) + ')}') + '\x60';
    else js = q;
    strs.push(js); return '\u0001' + (strs.length - 1) + '\u0001';
  });
  s = s.replace(/#[^\n]*/g, '');
  const out = [], stack = [], fnames = [], objs = ['time', 'utime'];
  const top = { assigned:new Set(), globals:new Set(), at:-1 };
  let scope = top, pending = null;
  const closeTo = ind => {
    while (stack.length && ind < stack[stack.length - 1].indent) {
      const b = stack.pop(); out.push('}');
      if (b.def) { const names = Array.from(b.def.assigned).filter(n => !b.def.globals.has(n) && !b.def.params.includes(n)); if (names.length) out[b.def.at] += ' let ' + names.join(', ') + ';'; scope = b.parent; }
    }
  };
  s.split('\n').forEach((raw, ln) => {
    if (!raw.trim()) return;
    const ind = raw.match(/^ */)[0].length; let line = raw.trim();
    if (pending) { if (ind <= pending.parentIndent) throw new Error('línea ' + (ln + 1) + ': se esperaba un bloque con sangría'); pending.indent = ind; stack.push(pending); pending = null; }
    else closeTo(ind);
    let m;
    const opener = (head, def, inline) => {
      if (inline) { out.push(head + ' { ' + stmt(inline) + ' }'); return; }
      out.push(head + ' {'); pending = { indent:0, parentIndent:ind, def, parent:scope }; if (def) scope = def;
    };
    const split = l => { let dep = 0, inStr = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (ch === '\u0001') inStr = !inStr; else if (!inStr) { if ('([{'.includes(ch)) dep++; else if (')]}'.includes(ch)) dep--; else if (ch === ':' && dep === 0) return [l.slice(0, i), l.slice(i + 1).trim()]; } } return [l, null]; };
    const stmt = l => {
      if (/^pass$/.test(l)) return ';';
      if (/^(import|from)\s/.test(l)) { const a = /^import\s+(\w+)\s+as\s+(\w+)/.exec(l); return a ? 'var ' + a[2] + ' = ' + a[1] + ';' : ';'; }
      if ((m = /^global\s+(.+)$/.exec(l))) { m[1].split(',').forEach(n => scope.globals.add(n.trim())); return ';'; }
      if (/^del\s/.test(l)) return ';';
      if ((m = /^(\w+(?:\s*,\s*\w+)+)\s*=(?!=)\s*(.+)$/.exec(l))) { m[1].split(',').forEach(n => scope.assigned.add(n.trim())); return '[' + m[1] + '] = [' + pyExpr(m[2]) + '];'; }
      if ((m = /^(\w+)\s*(=|\+=|-=|\*=|\/=|%=|\|=|&=|\^=|<<=|>>=)(?!=)\s*(.+)$/.exec(l))) {
        scope.assigned.add(m[1]);
        if (/^(I2cLcd|LiquidCrystal_I2C)\s*\(/.test(m[3])) objs.push(m[1]);
        return m[1] + ' ' + m[2] + ' ' + pyExpr(m[3]) + ';';
      }
      return pyExpr(l) + ';';
    };
    if ((m = /^def\s+(\w+)\s*\(([^)]*)\)\s*:\s*(.*)$/.exec(line))) {
      fnames.push(m[1]);
      const params = m[2].split(',').map(p => p.trim().split('=')[0].trim()).filter(Boolean);
      const def = { assigned:new Set(), globals:new Set(), params, at:out.length };
      opener('function* ' + m[1] + '(' + pyExpr(m[2]) + ')', def, m[3] || null); return;
    }
    if (/^class\s/.test(line)) throw new Error('línea ' + (ln + 1) + ': las clases no están soportadas en este simulador');
    const sp = split(line);
    if (sp[1] !== null && /^(if|elif|else|while|for|try|except|finally|with)\b/.test(sp[0])) {
      const h = sp[0].trim(), inline = sp[1] || null;
      if ((m = /^if\s+(.+)$/.exec(h))) return opener('if (' + pyExpr(m[1]) + ')', null, inline);
      if ((m = /^elif\s+(.+)$/.exec(h))) return opener('else if (' + pyExpr(m[1]) + ')', null, inline);
      if (/^else$/.test(h)) return opener('else', null, inline);
      if ((m = /^while\s+(.+)$/.exec(h))) return opener('while (' + pyExpr(m[1]) + ')', null, inline ? 'if (__tick()) yield 0; ' + inline : null), pending && out.push(' if (__tick()) yield 0;');
      if ((m = /^for\s+(\w+(?:\s*,\s*\w+)*)\s+in\s+(.+)$/.exec(h))) { const v = m[1].includes(',') ? '[' + m[1] + ']' : m[1]; opener('for (let ' + v + ' of __iter(' + pyExpr(m[2]) + '))', null, inline); if (pending) out.push(' if (__tick()) yield 0;'); return; }
      if (/^try$/.test(h)) return opener('try', null, inline);
      if (/^except\b/.test(h)) return opener('catch (__e)', null, inline);
      if (/^finally$/.test(h)) return opener('finally', null, inline);
      if (/^with\b/.test(h)) return opener('', null, inline);
    }
    out.push(stmt(line));
  });
  closeTo(-1);
  if (pending) throw new Error('falta el bloque al final del programa');
  const glob = Array.from(top.assigned);
  let js = 'function* main() {\n' + (glob.length ? 'var ' + glob.join(', ') + ';\n' : '') + out.join('\n') + '\n}';
  js = wrapCalls(js, fnames.concat(['__nada__']), objs);
  return js.replace(/\u0001(\d+)\u0001/g, (x, i) => strs[+i]);
}

/* ---------- ensamblador AVR (ATmega328P, sintaxis AVRASM2) ---------- */
const AVR_SYM = (function () {
  const s = { RAMEND:0x8ff, FLASHEND:0x3fff, PINB:0x03, DDRB:0x04, PORTB:0x05, PINC:0x06, DDRC:0x07, PORTC:0x08, PIND:0x09, DDRD:0x0a, PORTD:0x0b,
    TIFR0:0x15, TCCR0A:0x24, TCCR0B:0x25, TCNT0:0x26, SPL:0x3d, SPH:0x3e, SREG:0x3f,
    TIFR1:0x16, TIFR2:0x17, EIFR:0x1c, EIMSK:0x1d, GPIOR0:0x1e, OCR0A:0x27, OCR0B:0x28, EICRA:0x69, TIMSK0:0x6e, TIMSK1:0x6f, TIMSK2:0x70,
    TCCR1A:0x80, TCCR1B:0x81, TCCR1C:0x82, TCNT1L:0x84, TCNT1H:0x85, ICR1L:0x86, ICR1H:0x87, OCR1AL:0x88, OCR1AH:0x89, OCR1BL:0x8a, OCR1BH:0x8b,
    TCCR2A:0xb0, TCCR2B:0xb1, TCNT2:0xb2, OCR2A:0xb3, OCR2B:0xb4,
    INT0ADDR:0x02, INT1ADDR:0x04, OC2AADDR:0x0e, OC2BADDR:0x10, OVF2ADDR:0x12, OC1AADDR:0x16, OC1BADDR:0x18, OVF1ADDR:0x1a, OC0AADDR:0x1c, OC0BADDR:0x1e, OVF0ADDR:0x20, URXCADDR:0x24, UDREADDR:0x26, UTXCADDR:0x28,
    COM0A1:7, COM0A0:6, COM0B1:5, COM0B0:4, COM1A1:7, COM1A0:6, COM1B1:5, COM1B0:4, COM2A1:7, COM2A0:6, COM2B1:5, COM2B0:4, WGM00:0, WGM01:1, WGM02:3, WGM10:0, WGM11:1, WGM12:3, WGM13:4, WGM20:0, WGM21:1, WGM22:3,
    CS10:0, CS11:1, CS12:2, CS20:0, CS21:1, CS22:2, TOIE0:0, OCIE0A:1, OCIE0B:2, TOIE1:0, OCIE1A:1, OCIE1B:2, TOIE2:0, OCIE2A:1, OCIE2B:2, OCF0A:1, OCF0B:2, TOV1:0, OCF1A:1, OCF1B:2, TOV2:0, OCF2A:1, OCF2B:2,
    INT0:0, INT1:1, INTF0:0, INTF1:1, ISC00:0, ISC01:1, ISC10:2, ISC11:3, RXCIE0:7, TXCIE0:6, UDRIE0:5,
    ADCL:0x78, ADCH:0x79, ADCSRA:0x7a, ADCSRB:0x7b, ADMUX:0x7c, DIDR0:0x7e, UCSR0A:0xc0, UCSR0B:0xc1, UCSR0C:0xc2, UBRR0L:0xc4, UBRR0H:0xc5, UDR0:0xc6,
    ADEN:7, ADSC:6, ADATE:5, ADIF:4, ADIE:3, ADPS2:2, ADPS1:1, ADPS0:0, REFS1:7, REFS0:6, ADLAR:5, MUX3:3, MUX2:2, MUX1:1, MUX0:0,
    RXC0:7, TXC0:6, UDRE0:5, RXEN0:4, TXEN0:3, UCSZ01:2, UCSZ00:1, TOV0:0, CS02:2, CS01:1, CS00:0,
    SREG_C:0, SREG_Z:1, SREG_N:2, SREG_V:3, SREG_S:4, SREG_H:5, SREG_T:6, SREG_I:7 };
  ['B', 'C', 'D'].forEach(L => { for (let b = 0; b < 8; b++) { s['P' + L + b] = b; s['DD' + L + b] = b; s['PORT' + L + b] = b; s['PIN' + L + b] = b; } });
  return s;
})();
const AVR_OPS = ('ADD ADC ADIW SUB SUBI SBC SBCI SBIW AND ANDI OR ORI EOR COM NEG SBR CBR INC DEC TST CLR SER MUL MOV MOVW LDI LDS STS LD LDD ST STD LPM IN OUT PUSH POP ' +
  'RJMP JMP IJMP RCALL CALL ICALL RET RETI CPSE CP CPC CPI SBRC SBRS SBIC SBIS SBI CBI LSL LSR ROL ROR ASR SWAP BSET BCLR BST BLD ' +
  'BREQ BRNE BRCS BRCC BRSH BRLO BRMI BRPL BRGE BRLT BRHS BRHC BRTS BRTC BRVS BRVC BRIE BRID ' +
  'SEC CLC SEN CLN SEZ CLZ SEI CLI SES CLS SEV CLV SET CLT SEH CLH NOP SLEEP WDR BREAK').split(' ');
function avrEval(str, sym, here) {
  const s = String(str).trim(); let out = '', i = 0;
  if (!s) throw new Error('falta un operando');
  while (i < s.length) {
    const rest = s.slice(i); let m;
    if ((m = /^0[xX]([0-9A-Fa-f]+)/.exec(rest)) || (m = /^\$([0-9A-Fa-f]+)/.exec(rest))) { out += '(' + parseInt(m[1], 16) + ')'; i += m[0].length; continue; }
    if ((m = /^0[bB]([01]+)/.exec(rest))) { out += '(' + parseInt(m[1], 2) + ')'; i += m[0].length; continue; }
    if ((m = /^\d+/.exec(rest))) { out += '(' + parseInt(m[0], 10) + ')'; i += m[0].length; continue; }
    if ((m = /^'(.)'/.exec(rest))) { out += '(' + m[1].charCodeAt(0) + ')'; i += m[0].length; continue; }
    if ((m = /^([A-Za-z_][\w]*)\s*\(/.exec(rest)) && /^(low|high|lo8|hi8|byte1|byte2|byte3)$/i.test(m[1])) {
      const f = m[1].toLowerCase(); out += f === 'low' || f === 'lo8' || f === 'byte1' ? '__lo(' : f === 'byte3' ? '__b3(' : '__hi('; i += m[0].length; continue;
    }
    if ((m = /^[A-Za-z_][\w]*/.exec(rest))) {
      const k = m[0].toUpperCase();
      if (k === 'PC') { out += '(' + here + ')'; i += m[0].length; continue; }
      if (sym[k] === undefined) throw new Error('símbolo desconocido «' + m[0] + '»');
      out += '(' + sym[k] + ')'; i += m[0].length; continue;
    }
    out += s[i]; i++;
  }
  if (/[^\d()+\-*/%&|^~<>!_lohib3 ]/.test(out.replace(/__lo|__hi|__b3/g, ''))) throw new Error('expresión no válida «' + s + '»');
  return Function('__lo', '__hi', '__b3', 'return (' + out + ')')(v => v & 255, v => (v >> 8) & 255, v => (v >> 16) & 255) | 0;
}
function avrBuild(src) {
  const sym = Object.assign({}, AVR_SYM), regs = {}, prog = [], flash = new Uint8Array(65536);
  for (let r = 0; r < 32; r++) regs['R' + r] = r;
  Object.assign(regs, { XL:26, XH:27, YL:28, YH:29, ZL:30, ZH:31 });
  let pc = 0, seg = 'c', dptr = 0x100, ended = false;
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  const pend = [];
  lines.forEach((raw, ln) => {
    if (ended) return;
    let line = raw.replace(/\/\/.*$/, '').replace(/;.*$/, '').trim();
    if (!line) return;
    try {
      let m;
      while ((m = /^([A-Za-z_]\w*)\s*:\s*(.*)$/.exec(line))) { sym[m[1].toUpperCase()] = seg === 'd' ? dptr : pc; line = m[2].trim(); }
      if (!line) return;
      const d = /^[.#]\s*(\w+)\s*(.*)$/.exec(line);
      if (d) {
        const dir = d[1].toLowerCase(), args = d[2].trim();
        switch (dir) {
          case 'include': case 'device': case 'list': case 'nolist': case 'listmac': case 'message': case 'warning': case 'eseg': return;
          case 'exit': ended = true; return;
          case 'cseg': seg = 'c'; return;
          case 'dseg': seg = 'd'; return;
          case 'org': if (seg === 'd') dptr = avrEval(args, sym, pc); else pc = avrEval(args, sym, pc); return;
          case 'def': { const mm = /^(\w+)\s*=\s*[rR](\d+)$/.exec(args); if (!mm) throw new Error('.def necesita la forma nombre = rN'); regs[mm[1].toUpperCase()] = +mm[2]; return; }
          case 'equ': case 'set': { const mm = /^(\w+)\s*=\s*(.+)$/.exec(args); if (!mm) throw new Error('.' + dir + ' necesita la forma nombre = valor'); sym[mm[1].toUpperCase()] = avrEval(mm[2], Object.assign({}, sym, regs), pc); return; }
          case 'byte': dptr += avrEval(args, sym, pc); return;
          case 'db': case 'dw': {
            const bytes = [];
            args.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).forEach(a => { a = a.trim(); if (/^".*"$/.test(a)) { for (const ch of a.slice(1, -1)) bytes.push(ch.charCodeAt(0) & 255); } else pend.push(() => {}), (dir === 'dw' ? (v => { bytes.push(v & 255, (v >> 8) & 255); }) : (v => bytes.push(v & 255)))(avrEval(a, sym, pc)); });
            if (bytes.length % 2) bytes.push(0);
            bytes.forEach((b, i) => { flash[pc * 2 + i] = b; });
            for (let w = 0; w < bytes.length / 2; w++) prog[pc + w] = { op:'.DATA', ln:ln + 1 };
            pc += bytes.length / 2; return;
          }
          default: throw new Error('directiva no soportada «.' + d[1] + '»');
        }
      }
      const im = /^(\w+)\s*(.*)$/.exec(line), op = im[1].toUpperCase();
      if (!AVR_OPS.includes(op)) throw new Error('instrucción desconocida «' + im[1] + '»');
      prog[pc] = { op, args:im[2].trim(), ln:ln + 1, at:pc }; pc++;
    } catch (err) { throw new Error('línea ' + (ln + 1) + ': ' + err.message); }
  });
  const regOf = a => { const k = a.trim().toUpperCase(); if (regs[k] === undefined) throw new Error('se esperaba un registro y llegó «' + a + '»'); return regs[k]; };
  prog.forEach(ins => {
    if (!ins || ins.op === '.DATA') return;
    try {
      const a = ins.args ? ins.args.split(',').map(x => x.trim()) : [], op = ins.op, E = x => avrEval(x, Object.assign({}, sym, regs), ins.at);
      const ptr = x => { const m = /^(-?)\s*([XYZ])\s*(\+?)\s*(.*)$/i.exec(x.replace(/\s+/g, '')); if (!m) throw new Error('puntero no válido «' + x + '»'); return { pre:m[1] === '-', p:m[2].toUpperCase(), post:m[3] === '+' && !m[4], q:m[4] ? E(m[4]) : 0 }; };
      switch (op) {
        case 'LD': ins.d = regOf(a[0]); ins.ptr = ptr(a[1]); break;
        case 'LDD': { ins.d = regOf(a[0]); const m = /^([YZ])\s*\+\s*(.+)$/i.exec(a[1]); ins.ptr = { p:m[1].toUpperCase(), q:E(m[2]) }; break; }
        case 'ST': ins.ptr = ptr(a[0]); ins.r = regOf(a[1]); break;
        case 'STD': { const m = /^([YZ])\s*\+\s*(.+)$/i.exec(a[0]); ins.ptr = { p:m[1].toUpperCase(), q:E(m[2]) }; ins.r = regOf(a[1]); break; }
        case 'LPM': if (a.length) { ins.d = regOf(a[0]); ins.post = /\+/.test(a[1] || ''); } else { ins.d = 0; ins.post = false; } break;
        case 'STS': ins.k = E(a[0]); ins.r = regOf(a[1]); break;
        case 'LDS': ins.d = regOf(a[0]); ins.k = E(a[1]); break;
        case 'OUT': ins.k = E(a[0]); ins.r = regOf(a[1]); break;
        case 'IN': ins.d = regOf(a[0]); ins.k = E(a[1]); break;
        case 'SBI': case 'CBI': case 'SBIC': case 'SBIS': ins.k = E(a[0]); ins.b = E(a[1]); break;
        case 'BST': case 'BLD': case 'SBRC': case 'SBRS': ins.d = regOf(a[0]); ins.b = E(a[1]); break;
        case 'BSET': case 'BCLR': ins.b = E(a[0]); break;
        case 'ADIW': case 'SBIW': { const k = a[0].toUpperCase(); ins.d = regs[k] !== undefined ? regs[k] : { X:26, Y:28, Z:30 }[k.split(':').pop()] || regOf(a[0].split(':').pop()); ins.k = E(a[1]); break; }
        case 'MOVW': ins.d = regOf(a[0].split(':').pop()); ins.r = regOf(a[1].split(':').pop()); break;
        default:
          if (/^(RJMP|JMP|RCALL|CALL|BR\w\w)$/.test(op)) { ins.k = E(a[0]); break; }
          if (/^(LDI|SUBI|SBCI|ANDI|ORI|CPI|SBR|CBR)$/.test(op)) { ins.d = regOf(a[0]); ins.k = E(a[1]) & 255; break; }
          if (a.length >= 1) ins.d = regOf(a[0]);
          if (a.length >= 2) ins.r = regOf(a[1]);
      }
    } catch (err) { throw new Error('línea ' + ins.ln + ': ' + err.message); }
  });
  if (!prog.some(x => x && x.op !== '.DATA')) throw new Error('el programa está vacío');
  return { prog, flash };
}
/* Intel HEX: registros ":LLAAAATT..CC" con tipos 00 (datos), 01 (fin), 02/04 (dirección extendida) */
function parseIntelHex(txt) {
  const bytes = new Uint8Array(65536); let base = 0, max = 0, n = 0;
  String(txt || '').split(/\r?\n/).forEach((raw, ln) => {
    const line = raw.trim(); if (!line) return;
    if (line[0] !== ':') throw new Error('línea ' + (ln + 1) + ': no empieza con «:» (no es Intel HEX)');
    const b = []; for (let i = 1; i + 1 < line.length; i += 2) b.push(parseInt(line.substr(i, 2), 16));
    if (b.some(isNaN) || b.length < 5) throw new Error('línea ' + (ln + 1) + ': caracteres no hexadecimales');
    const len = b[0], addr = (b[1] << 8) | b[2], type = b[3];
    if ((b.reduce((p, q) => p + q, 0) & 255) !== 0) throw new Error('línea ' + (ln + 1) + ': suma de verificación incorrecta');
    if (type === 0) { for (let k = 0; k < len; k++) { const a = base + addr + k; if (a < bytes.length) { bytes[a] = b[4 + k]; max = Math.max(max, a + 1); } } n++; }
    else if (type === 2) base = ((b[4] << 8) | b[5]) * 16;
    else if (type === 4) base = ((b[4] << 8) | b[5]) * 65536;
  });
  if (!n) throw new Error('el archivo HEX no tiene datos');
  return { bytes, size:max };
}
/* decodifica las palabras de 16 bits al formato de instrucción que ejecuta el emulador; las de 2 palabras dejan un NOP de relleno */
function avrDecode(flash, size) {
  const nW = Math.ceil(size / 2), wd = a => flash[a * 2] | (flash[a * 2 + 1] << 8), prog = [], unsup = {};
  const BRS = ['BRCS', 'BREQ', 'BRMI', 'BRVS', 'BRLT', 'BRHS', 'BRTS', 'BRIE'], BRC = ['BRCC', 'BRNE', 'BRPL', 'BRVC', 'BRGE', 'BRHC', 'BRTC', 'BRID'];
  const sx = (v, bits) => (v & (1 << (bits - 1))) ? v - (1 << bits) : v;
  for (let a = 0; a < nW;) {
    const w = wd(a), d5 = (w >> 4) & 31, r5 = (w & 15) | ((w >> 5) & 16), d4 = 16 + ((w >> 4) & 15), K8 = (w & 15) | ((w >> 4) & 0xf0);
    let I = null, two = false;
    const R2 = op => ({ op, d:d5, r:r5 }), IM = op => ({ op, d:d4, k:K8 });
    if (w === 0) I = { op:'NOP' };
    else if ((w & 0xff00) === 0x0100) I = { op:'MOVW', d:((w >> 4) & 15) * 2, r:(w & 15) * 2 };
    else if ((w & 0xfc00) === 0x0400) I = R2('CPC');
    else if ((w & 0xfc00) === 0x0800) I = R2('SBC');
    else if ((w & 0xfc00) === 0x0c00) I = R2('ADD');
    else if ((w & 0xfc00) === 0x1000) I = R2('CPSE');
    else if ((w & 0xfc00) === 0x1400) I = R2('CP');
    else if ((w & 0xfc00) === 0x1800) I = R2('SUB');
    else if ((w & 0xfc00) === 0x1c00) I = R2('ADC');
    else if ((w & 0xfc00) === 0x2000) I = R2('AND');
    else if ((w & 0xfc00) === 0x2400) I = R2('EOR');
    else if ((w & 0xfc00) === 0x2800) I = R2('OR');
    else if ((w & 0xfc00) === 0x2c00) I = R2('MOV');
    else if ((w & 0xf000) === 0x3000) I = IM('CPI');
    else if ((w & 0xf000) === 0x4000) I = IM('SBCI');
    else if ((w & 0xf000) === 0x5000) I = IM('SUBI');
    else if ((w & 0xf000) === 0x6000) I = IM('ORI');
    else if ((w & 0xf000) === 0x7000) I = IM('ANDI');
    else if ((w & 0xf000) === 0xe000) I = IM('LDI');
    else if ((w & 0xd000) === 0x8000) {
      const q = (w & 7) | ((w >> 7) & 0x18) | ((w >> 8) & 0x20), P = { p:(w & 8) ? 'Y' : 'Z', q };
      I = (w & 0x0200) ? { op:'STD', ptr:P, r:d5 } : { op:'LDD', d:d5, ptr:P };
    }
    else if ((w & 0xfe00) === 0x9000 || (w & 0xfe00) === 0x9200) {
      const st = (w & 0x0200) !== 0, lo = w & 15;
      const PT = { 1:['Z', 0, 1], 2:['Z', 1, 0], 9:['Y', 0, 1], 10:['Y', 1, 0], 12:['X', 0, 0], 13:['X', 0, 1], 14:['X', 1, 0] }[lo];
      if (lo === 0) { I = st ? { op:'STS', r:d5, k:wd(a + 1) } : { op:'LDS', d:d5, k:wd(a + 1) }; two = true; }
      else if (PT) { const P = { p:PT[0], pre:!!PT[1], post:!!PT[2] }; I = st ? { op:'ST', ptr:P, r:d5 } : { op:'LD', d:d5, ptr:P }; }
      else if (!st && (lo === 4 || lo === 5)) I = { op:'LPM', d:d5, post:lo === 5 };
      else if (lo === 15) I = st ? { op:'PUSH', d:d5 } : { op:'POP', d:d5 };
    }
    else if ((w & 0xfe0e) === 0x940c || (w & 0xfe0e) === 0x940e) { I = { op:(w & 2) ? 'CALL' : 'JMP', k:((((w >> 3) & 0x3e) | (w & 1)) << 16) | wd(a + 1) }; two = true; }
    else if ((w & 0xff8f) === 0x9408) I = { op:'BSET', b:(w >> 4) & 7 };
    else if ((w & 0xff8f) === 0x9488) I = { op:'BCLR', b:(w >> 4) & 7 };
    else if (w === 0x9508) I = { op:'RET' }; else if (w === 0x9518) I = { op:'RETI' }; else if (w === 0x9588) I = { op:'SLEEP' }; else if (w === 0x9598) I = { op:'BREAK' };
    else if (w === 0x95a8) I = { op:'WDR' }; else if (w === 0x95c8) I = { op:'LPM', d:0, post:false }; else if (w === 0x9409) I = { op:'IJMP' }; else if (w === 0x9509) I = { op:'ICALL' };
    else if ((w & 0xfe00) === 0x9400) { const op = { 0:'COM', 1:'NEG', 2:'SWAP', 3:'INC', 5:'ASR', 6:'LSR', 7:'ROR', 10:'DEC' }[w & 15]; if (op) I = { op, d:d5 }; }
    else if ((w & 0xff00) === 0x9600 || (w & 0xff00) === 0x9700) I = { op:(w & 0x0100) ? 'SBIW' : 'ADIW', d:24 + ((w >> 4) & 3) * 2, k:(w & 15) | ((w >> 2) & 0x30) };
    else if ((w & 0xfc00) === 0x9800) I = { op:['CBI', 'SBIC', 'SBI', 'SBIS'][(w >> 8) & 3], k:(w >> 3) & 31, b:w & 7 };
    else if ((w & 0xfc00) === 0x9c00) I = R2('MUL');
    else if ((w & 0xf800) === 0xb000) I = { op:'IN', d:d5, k:(w & 15) | ((w >> 5) & 0x30) };
    else if ((w & 0xf800) === 0xb800) I = { op:'OUT', r:d5, k:(w & 15) | ((w >> 5) & 0x30) };
    else if ((w & 0xf000) === 0xc000) I = { op:'RJMP', k:(a + 1 + sx(w & 0xfff, 12)) & 0xffff };
    else if ((w & 0xf000) === 0xd000) I = { op:'RCALL', k:(a + 1 + sx(w & 0xfff, 12)) & 0xffff };
    else if ((w & 0xf800) === 0xf000) I = { op:((w & 0x0400) ? BRC : BRS)[w & 7], k:(a + 1 + sx((w >> 3) & 0x7f, 7)) & 0xffff };
    else if ((w & 0xfe08) === 0xf800) I = { op:'BLD', d:d5, b:w & 7 };
    else if ((w & 0xfe08) === 0xfa00) I = { op:'BST', d:d5, b:w & 7 };
    else if ((w & 0xfe08) === 0xfc00) I = { op:'SBRC', d:d5, b:w & 7 };
    else if ((w & 0xfe08) === 0xfe00) I = { op:'SBRS', d:d5, b:w & 7 };
    if (!I) { I = { op:'NOP' }; const key = '0x' + w.toString(16).padStart(4, '0'); unsup[key] = (unsup[key] || 0) + 1; }
    I.ln = 0; I.at = a; prog[a] = I;
    if (two) prog[a + 1] = { op:'NOP', ln:0, at:a + 1, fill:true };
    a += two ? 2 : 1;
  }
  return { prog, unsup };
}
function avrFromHex(txt) {
  const h = parseIntelHex(txt);
  if (h.size > 32768) throw new Error('el firmware ocupa ' + h.size + ' bytes: el ATmega328P tiene 32 KB de flash');
  const d = avrDecode(h.bytes, h.size);
  const flash = new Uint8Array(65536); flash.set(h.bytes.subarray(0, 65536));
  return { prog:d.prog, flash, unsup:d.unsup, size:h.size };
}
function makeAvrRuntime(rt, code, sim, H, isHex) {
  let A;
  try { A = isHex ? avrFromHex(code) : avrBuild(code); } catch (err) { rt.err = (isHex ? 'Firmware HEX no válido: ' : 'Error de ensamblado: ') + err.message; rt.run = () => {}; return rt; }
  if (isHex && A.unsup && Object.keys(A.unsup).length) H.out('⚠ El firmware usa ' + Object.keys(A.unsup).length + ' códigos de instrucción no emulados (se tratan como NOP): ' + Object.keys(A.unsup).slice(0, 6).join(', ') + '\n');
  const prog = A.prog, flash = A.flash, mem = new Uint8Array(0x900), RXQ = H.rx || [];
  let pc = 0, tacc = 0, t1acc = 0, t2acc = 0, t1dir = 1, t0dir = 1, t2dir = 1, intPrev = [1, 1];
  mem[0x5d] = 0xff; mem[0x5e] = 0x08;
  rt.cyc = 0; rt.lastT = sim.time; rt.phase = 'asm';
  const PORTS = { B:{ pin:0x23, ddr:0x24, port:0x25, base:8, n:6 }, C:{ pin:0x26, ddr:0x27, port:0x28, base:14, n:6 }, D:{ pin:0x29, ddr:0x2a, port:0x2b, base:0, n:8 } };
  /* salidas PWM por hardware: OC0A=D6, OC0B=D5, OC1A=D9, OC1B=D10, OC2A=D11, OC2B=D3 */
  const OCPIN = [[0x44, 7, 0x47, 6, 0], [0x44, 5, 0x48, 5, 0], [0x80, 7, 0x88, 9, 1], [0x80, 5, 0x8a, 10, 1], [0xb0, 7, 0xb3, 11, 2], [0xb0, 5, 0xb4, 3, 2]];
  const t1top = () => { const wgm = (mem[0x80] & 3) | ((mem[0x81] >> 1) & 12); return [0xffff, 0xff, 0x1ff, 0x3ff, (mem[0x88] | (mem[0x89] << 8)) || 0xffff, 0xff, 0x1ff, 0x3ff, (mem[0x86] | (mem[0x87] << 8)) || 0xffff, (mem[0x88] | (mem[0x89] << 8)) || 0xffff, (mem[0x86] | (mem[0x87] << 8)) || 0xffff, (mem[0x88] | (mem[0x89] << 8)) || 0xffff, (mem[0x86] | (mem[0x87] << 8)) || 0xffff, 0xffff, (mem[0x86] | (mem[0x87] << 8)) || 0xffff, (mem[0x88] | (mem[0x89] << 8)) || 0xffff][wgm]; };
  const pwmPin = k => OCPIN.find(q => q[3] === k && (mem[q[0]] >> (q[1] - 1)) & 2);
  const pwmDuty = q => { const ocr = q[4] === 1 ? mem[q[2]] | (mem[q[2] + 1] << 8) : mem[q[2]], top = q[4] === 1 ? t1top() : 255, inv = (mem[q[0]] >> (q[1] - 1)) & 1; const dd = Math.max(0, Math.min(1, ocr / top)); return inv ? 1 - dd : dd; };
  const updPwm = () => OCPIN.forEach(q => { const k = q[3], L = k < 8 ? 'D' : 'B', b = k < 8 ? k : k - 8, P = PORTS[L]; if (((mem[q[0]] >> (q[1] - 1)) & 2) && ((mem[P.ddr] >> b) & 1)) H.setOut(k, pwmDuty(q)); });
  const apply = L => {
    const P = PORTS[L], ddr = mem[P.ddr], prt = mem[P.port];
    for (let b = 0; b < P.n; b++) { const k = P.base + b; if ((ddr >> b) & 1) { if (!pwmPin(k)) H.setOut(k, (prt >> b) & 1); } else H.setMode(k, (prt >> b) & 1 ? 'pu' : 'in'); }
    updPwm();
  };
  const readPin = L => { const P = PORTS[L]; let v = 0; for (let b = 0; b < P.n; b++) if (H.rd(P.base + b)) v |= 1 << b; return v; };
  const rdm = a => {
    a &= 0xfff;
    for (const L in PORTS) if (a === PORTS[L].pin) return readPin(L);
    if (a === 0xc0) return mem[a] | 0x60 | (RXQ.length ? 0x80 : 0);
    if (a === 0xc6) return RXQ.length ? RXQ.shift() & 255 : 0;
    return a < mem.length ? mem[a] : 0;
  };
  const wrm = (a, v) => {
    a &= 0xfff; v &= 255;
    for (const L in PORTS) { const P = PORTS[L]; if (a === P.pin) { mem[P.port] ^= v; apply(L); return; } if (a === P.ddr || a === P.port) { mem[a] = v; apply(L); return; } }
    if (a === 0x7a && (v & 0xc0) === 0xc0) {
      const val = H.analogRead(mem[0x7c] & 0x0f), left = mem[0x7c] & 0x20;
      if (left) { mem[0x79] = val >> 2; mem[0x78] = (val & 3) << 6; } else { mem[0x78] = val & 255; mem[0x79] = val >> 8; }
      v = (v & ~0x40) | 0x10;
    }
    if (a === 0x35 || a === 0x36 || a === 0x37 || a === 0x3c) { mem[a] &= ~v; return; }
    if (a === 0xc6) { H.out(String.fromCharCode(v)); mem[0xc0] |= 0x40; return; }
    if (a < mem.length) mem[a] = v;
    if (a === 0x44 || a === 0x47 || a === 0x48 || (a >= 0x80 && a <= 0x8b) || (a >= 0xb0 && a <= 0xb4)) updPwm();
    if (a === 0x44 || a === 0x80 || a === 0xb0) { apply('B'); apply('D'); }
  };
  const R = i => mem[i], setR = (i, v) => { mem[i] = v & 255; };
  const SR = () => mem[0x5f], fl = b => (mem[0x5f] >> b) & 1, setF = (b, on) => { if (on) mem[0x5f] |= 1 << b; else mem[0x5f] &= ~(1 << b); };
  const sp = () => mem[0x5d] | (mem[0x5e] << 8), setSp = v => { mem[0x5d] = v & 255; mem[0x5e] = (v >> 8) & 255; };
  const push = v => { const s = sp(); mem[s & 0x8ff] = v & 255; setSp(s - 1); };
  const pop = () => { const s = sp() + 1; setSp(s); return mem[s & 0x8ff]; };
  const nzs = (r, v) => { setF(1, (r & 255) === 0); setF(2, r & 0x80); setF(3, v); setF(4, ((r >> 7) & 1) ^ (v ? 1 : 0)); };
  const add = (d, r, c) => { const res = d + r + c; setF(5, ((d & 15) + (r & 15) + c) > 15); const v = ((d & r & ~res) | (~d & ~r & res)) & 0x80; setF(0, res > 255); nzs(res & 255, v); return res & 255; };
  const sub = (d, r, c, keepZ) => { const res = d - r - c; setF(5, ((d & 15) - (r & 15) - c) < 0); const v = ((d & ~r & ~res) | (~d & r & res)) & 0x80; setF(0, res < 0); const z = fl(1); nzs(res & 255, v); if (keepZ) setF(1, z && (res & 255) === 0); return res & 255; };
  const logic = r => { setF(3, 0); nzs(r, 0); return r; };
  const ptrv = p => { const i = { X:26, Y:28, Z:30 }[p]; return mem[i] | (mem[i + 1] << 8); };
  const setPtr = (p, v) => { const i = { X:26, Y:28, Z:30 }[p]; mem[i] = v & 255; mem[i + 1] = (v >> 8) & 255; };
  const skipLen = () => 1, isPin = a => a === 0x23 || a === 0x26 || a === 0x29;
  const BR = { BREQ:() => fl(1), BRNE:() => !fl(1), BRCS:() => fl(0), BRLO:() => fl(0), BRCC:() => !fl(0), BRSH:() => !fl(0), BRMI:() => fl(2), BRPL:() => !fl(2),
    BRGE:() => !fl(4), BRLT:() => fl(4), BRHS:() => fl(5), BRHC:() => !fl(5), BRTS:() => fl(6), BRTC:() => !fl(6), BRVS:() => fl(3), BRVC:() => !fl(3), BRIE:() => fl(7), BRID:() => !fl(7) };
  const FLAGOPS = { SEC:[0, 1], CLC:[0, 0], SEZ:[1, 1], CLZ:[1, 0], SEN:[2, 1], CLN:[2, 0], SEV:[3, 1], CLV:[3, 0], SES:[4, 1], CLS:[4, 0], SEH:[5, 1], CLH:[5, 0], SET:[6, 1], CLT:[6, 0], SEI:[7, 1], CLI:[7, 0] };
  const exec = () => {
    const ins = prog[pc];
    if (!ins || ins.op === '.DATA') {
      if (pc >= prog.length || ins) { rt.halt = true; H.out('⚠ El programa se salió del código (llegó a datos o al final): falta un RJMP al bucle principal.\n'); return 1; }
      pc++; return 1;
    }
    pc++;
    const op = ins.op, d = ins.d, r = ins.r, k = ins.k;
    if (BR[op]) { if (BR[op]()) { pc = k; return 2; } return 1; }
    if (FLAGOPS[op]) { setF(FLAGOPS[op][0], FLAGOPS[op][1]); return 1; }
    switch (op) {
      case 'NOP': case 'WDR': case 'BREAK': return 1;
      case 'SLEEP': return 1;
      case 'LDI': setR(d, k); return 1;
      case 'MOV': setR(d, R(r)); return 1;
      case 'MOVW': setR(d, R(r)); setR(d + 1, R(r + 1)); return 1;
      case 'ADD': setR(d, add(R(d), R(r), 0)); return 1;
      case 'ADC': setR(d, add(R(d), R(r), fl(0))); return 1;
      case 'LSL': setR(d, add(R(d), R(d), 0)); return 1;
      case 'ROL': setR(d, add(R(d), R(d), fl(0))); return 1;
      case 'SUB': setR(d, sub(R(d), R(r), 0)); return 1;
      case 'SUBI': setR(d, sub(R(d), k, 0)); return 1;
      case 'SBC': setR(d, sub(R(d), R(r), fl(0), true)); return 1;
      case 'SBCI': setR(d, sub(R(d), k, fl(0), true)); return 1;
      case 'CP': sub(R(d), R(r), 0); return 1;
      case 'CPC': sub(R(d), R(r), fl(0), true); return 1;
      case 'CPI': sub(R(d), k, 0); return 1;
      case 'AND': setR(d, logic(R(d) & R(r))); return 1;
      case 'ANDI': case 'CBR': setR(d, logic(R(d) & (op === 'CBR' ? ~k & 255 : k))); return 1;
      case 'OR': setR(d, logic(R(d) | R(r))); return 1;
      case 'ORI': case 'SBR': setR(d, logic(R(d) | k)); return 1;
      case 'EOR': setR(d, logic(R(d) ^ R(r))); return 1;
      case 'CLR': setR(d, logic(0)); return 1;
      case 'SER': setR(d, 255); return 1;
      case 'TST': logic(R(d)); return 1;
      case 'COM': { const v = ~R(d) & 255; setR(d, v); logic(v); setF(0, 1); return 1; }
      case 'NEG': { const v = sub(0, R(d), 0); setR(d, v); return 1; }
      case 'INC': { const v = (R(d) + 1) & 255; setR(d, v); nzs(v, v === 0x80); return 1; }
      case 'DEC': { const v = (R(d) - 1) & 255; setR(d, v); nzs(v, v === 0x7f); return 1; }
      case 'LSR': { const o = R(d), v = o >> 1; setF(0, o & 1); setR(d, v); nzs(v, (o & 1)); return 1; }
      case 'ROR': { const o = R(d), v = (o >> 1) | (fl(0) << 7); setF(0, o & 1); setR(d, v); nzs(v, ((v >> 7) ^ (o & 1)) & 1); return 1; }
      case 'ASR': { const o = R(d), v = (o >> 1) | (o & 0x80); setF(0, o & 1); setR(d, v); nzs(v, ((v >> 7) ^ (o & 1)) & 1); return 1; }
      case 'SWAP': setR(d, ((R(d) << 4) | (R(d) >> 4)) & 255); return 1;
      case 'MUL': { const v = R(d) * R(r); setR(0, v & 255); setR(1, v >> 8); setF(0, v & 0x8000); setF(1, v === 0); return 2; }
      case 'ADIW': case 'SBIW': { const w = R(d) | (R(d + 1) << 8), v = op === 'ADIW' ? w + k : w - k; setR(d, v); setR(d + 1, v >> 8); setF(0, op === 'ADIW' ? v > 0xffff : v < 0); setF(1, (v & 0xffff) === 0); setF(2, v & 0x8000); return 2; }
      case 'IN': setR(d, rdm(k + 0x20)); return 1;
      case 'OUT': wrm(k + 0x20, R(r)); return 1;
      case 'SBI': { const a = k + 0x20; wrm(a, isPin(a) ? 1 << ins.b : rdm(a) | (1 << ins.b)); return 2; }
      case 'CBI': { const a = k + 0x20; if (!isPin(a)) wrm(a, rdm(a) & ~(1 << ins.b)); return 2; }
      case 'SBIC': if (!((rdm(k + 0x20) >> ins.b) & 1)) { pc += skipLen(); return 2; } return 1;
      case 'SBIS': if ((rdm(k + 0x20) >> ins.b) & 1) { pc += skipLen(); return 2; } return 1;
      case 'SBRC': if (!((R(d) >> ins.b) & 1)) { pc += skipLen(); return 2; } return 1;
      case 'SBRS': if ((R(d) >> ins.b) & 1) { pc += skipLen(); return 2; } return 1;
      case 'CPSE': if (R(d) === R(r)) { pc += skipLen(); return 2; } return 1;
      case 'BST': setF(6, (R(d) >> ins.b) & 1); return 1;
      case 'BLD': setR(d, fl(6) ? R(d) | (1 << ins.b) : R(d) & ~(1 << ins.b)); return 1;
      case 'BSET': setF(ins.b, 1); return 1;
      case 'BCLR': setF(ins.b, 0); return 1;
      case 'LDS': setR(d, rdm(k)); return 2;
      case 'STS': wrm(k, R(r)); return 2;
      case 'LD': case 'LDD': case 'ST': case 'STD': {
        const P = ins.ptr; let a = ptrv(P.p);
        if (P.pre) { a = (a - 1) & 0xffff; setPtr(P.p, a); }
        const ea = (a + (P.q || 0)) & 0xffff;
        if (op === 'LD' || op === 'LDD') setR(d, rdm(ea)); else wrm(ea, R(r));
        if (P.post) setPtr(P.p, a + 1);
        return 2;
      }
      case 'LPM': { const z = ptrv('Z'); setR(d, flash[z]); if (ins.post) setPtr('Z', z + 1); return 3; }
      case 'PUSH': push(R(d)); return 2;
      case 'POP': setR(d, pop()); return 2;
      case 'RJMP': pc = k; return 2;
      case 'JMP': pc = k; return 3;
      case 'IJMP': pc = ptrv('Z'); return 2;
      case 'RCALL': case 'CALL': case 'ICALL': push(pc & 255); push(pc >> 8); pc = op === 'ICALL' ? ptrv('Z') : k; return op === 'CALL' ? 4 : 3;
      case 'RET': case 'RETI': { const hi = pop(), lo = pop(); pc = (hi << 8) | lo; if (op === 'RETI') setF(7, 1); return 4; }
    }
    return 1;
  };
  const PRE01 = [0, 1, 8, 64, 256, 1024, 0, 0], PRE2 = [0, 1, 8, 32, 64, 128, 256, 1024];
  /* temporizador de 8 bits: Timer0 (TCNT0 0x46, TIFR0 0x35) o Timer2 (TCNT2 0xB2, TIFR2 0x37) */
  const tick8 = (cnt, ocrA, ocrB, tifr, wgm, dir) => {
    const top = wgm === 2 || wgm === 7 || wgm === 5 ? mem[ocrA] || 255 : 255, pc8 = wgm === 1 || wgm === 5;
    let v = mem[cnt];
    if (pc8) { v += dir; if (v >= top) { v = top; dir = -1; } else if (v <= 0) { v = 0; dir = 1; mem[tifr] |= 1; } }
    else if (v >= top) { v = 0; if (top === 255 || wgm === 7) mem[tifr] |= 1; } else v++;
    mem[cnt] = v & 255;
    if (v === mem[ocrA]) mem[tifr] |= 2;
    if (v === mem[ocrB]) mem[tifr] |= 4;
    return dir;
  };
  const timer = c => {
    const pre0 = PRE01[mem[0x45] & 7];
    if (pre0) { tacc += c; while (tacc >= pre0) { tacc -= pre0; t0dir = tick8(0x46, 0x47, 0x48, 0x35, (mem[0x44] & 3) | ((mem[0x45] >> 1) & 4), t0dir); } }
    const pre2 = PRE2[mem[0xb1] & 7];
    if (pre2) { t2acc += c; while (t2acc >= pre2) { t2acc -= pre2; t2dir = tick8(0xb2, 0xb3, 0xb4, 0x37, (mem[0xb0] & 3) | ((mem[0xb1] >> 1) & 4), t2dir); } }
    const pre1 = PRE01[mem[0x81] & 7];
    if (pre1) {
      t1acc += c;
      while (t1acc >= pre1) {
        t1acc -= pre1;
        const wgm = (mem[0x80] & 3) | ((mem[0x81] >> 1) & 12), top = t1top(), pcm = [1, 2, 3, 8, 9, 10, 11].includes(wgm), ctc = wgm === 4 || wgm === 12;
        let v = mem[0x84] | (mem[0x85] << 8);
        if (pcm) { v += t1dir; if (v >= top) { v = top; t1dir = -1; } else if (v <= 0) { v = 0; t1dir = 1; mem[0x36] |= 1; } }
        else if (v >= top) { v = 0; if (!ctc) mem[0x36] |= 1; } else v++;
        if (ctc && v === 0xffff) mem[0x36] |= 1;
        mem[0x84] = v & 255; mem[0x85] = (v >> 8) & 255;
        if (v === (mem[0x88] | (mem[0x89] << 8))) mem[0x36] |= 2;
        if (v === (mem[0x8a] | (mem[0x8b] << 8))) mem[0x36] |= 4;
      }
    }
  };
  /* tabla de vectores del ATmega328P (palabras), en orden de prioridad: [registro de banderas, bit, registro de máscara, bit de máscara, vector, se borra al atender] */
  const VEC = [[0x3c, 0, 0x3d, 0, 0x02, 1], [0x3c, 1, 0x3d, 1, 0x04, 1], [0x37, 1, 0x70, 1, 0x0e, 1], [0x37, 2, 0x70, 2, 0x10, 1], [0x37, 0, 0x70, 0, 0x12, 1],
    [0x36, 1, 0x6f, 1, 0x16, 1], [0x36, 2, 0x6f, 2, 0x18, 1], [0x36, 0, 0x6f, 0, 0x1a, 1], [0x35, 1, 0x6e, 1, 0x1c, 1], [0x35, 2, 0x6e, 2, 0x1e, 1], [0x35, 0, 0x6e, 0, 0x20, 1]];
  const irq = () => {
    if (!(mem[0x5f] & 0x80)) return 0;
    let vec = -1;
    for (const q of VEC) if (((mem[q[0]] >> q[1]) & 1) && ((mem[q[2]] >> q[3]) & 1)) { if (q[5]) mem[q[0]] &= ~(1 << q[1]); vec = q[4]; break; }
    if (vec < 0 && RXQ.length && (mem[0xc1] & 0x80)) vec = 0x24;
    if (vec < 0 && (mem[0xc1] & 0x20)) vec = 0x26;
    if (vec < 0 && (mem[0xc0] & 0x40) && (mem[0xc1] & 0x40)) { mem[0xc0] &= ~0x40; vec = 0x28; }
    if (vec < 0) return 0;
    mem[0x5f] &= ~0x80; push(pc & 255); push(pc >> 8); pc = vec; return 4;
  };
  /* INT0 (D2) e INT1 (D3): EICRA elige nivel bajo, cualquier cambio, flanco de bajada o de subida */
  const sampleInt = () => {
    [2, 3].forEach((k, i) => {
      const lv = H.rd(k) ? 1 : 0, isc = (mem[0x69] >> (i * 2)) & 3, pv = intPrev[i];
      if ((isc === 0 && !lv) || (isc === 1 && lv !== pv) || (isc === 2 && pv && !lv) || (isc === 3 && !pv && lv)) mem[0x3c] |= 1 << i;
      intPrev[i] = lv;
    });
  };
  rt.run = () => {
    if (rt.err || rt.halt) return;
    rt.cyc += (sim.time - rt.lastT) * 16e6; rt.lastT = sim.time;
    if (mem[0x3d] & 3) sampleInt();
    let n = 0;
    while (rt.cyc >= 1 && !rt.halt) { const c = irq() || exec(); rt.cyc -= c; timer(c); if (++n > 600000) { rt.cyc = 0; break; } }
  };
  return rt;
}

/* ---------- motor ---------- */
/* Orden de Cuthill-McKee inverso: numera los nodos para que la matriz quede en banda y la eliminación genere poco relleno. */
function rcmOrder(els) {
  const adj = new Map(), add = (a, b) => { if (a === b || a === GND || b === GND) return; adj.get(a).add(b); adj.get(b).add(a); };
  els.forEach(e => e.ks.forEach(key => { if (key !== GND && !adj.has(key)) adj.set(key, new Set()); }));
  els.forEach(e => {
    const ks = e.ks.filter(q => q !== undefined);
    if (ks.length <= 6) { for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) add(ks[i], ks[j]); }
    else {
      const d = e.d, hub = [];
      if (d && d.vcc) hub.push(ks[d.vcc - 1]); if (d && d.gnd) hub.push(ks[d.gnd - 1]);
      if (!hub.length) hub.push(ks[0]);
      ks.forEach((q, i) => { hub.forEach(h => add(q, h)); if (i) add(q, ks[i - 1]); });
    }
  });
  const keys = Array.from(adj.keys()), seen = new Set(), order = [];
  const deg = q => adj.get(q).size;
  keys.sort((a, b) => deg(a) - deg(b));
  for (const start of keys) {
    if (seen.has(start)) continue;
    seen.add(start); const queue = [start];
    for (let h = 0; h < queue.length; h++) {
      const v = queue[h]; order.push(v);
      Array.from(adj.get(v)).filter(w => !seen.has(w)).sort((a, b) => deg(a) - deg(b)).forEach(w => { seen.add(w); queue.push(w); });
    }
  }
  return order.reverse();
}

/* ---------- robótica: pistas, arena y física (lazo cerrado con el circuito) ---------- */
const ROBO = { r:0.0325, L:0.13, sensF:0.075, sensY:0.014, lineW:0.018, box:[0.72, 0.31] };
function trackPts(kind) {
  const pts = [];
  if (kind === 'ocho') {
    const R = 0.2, N = 90;
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; pts.push([-R + R * Math.cos(a), R * Math.sin(a)]); }
    for (let i = 0; i < N; i++) { const a = Math.PI - i / N * Math.PI * 2; pts.push([R + R * Math.cos(a), R * Math.sin(a)]); }
    return pts;
  }
  const S = 0.34, R = kind === 'curvas' ? 0.17 : 0.19, N = 160;
  const per = 4 * S + 2 * Math.PI * R;
  for (let i = 0; i < N; i++) {
    let u = i / N * per, x, y;
    if (u < 2 * S) { x = -S + u; y = -R; }
    else if ((u -= 2 * S) < Math.PI * R) { const a = -Math.PI / 2 + u / R; x = S + R * Math.cos(a); y = R * Math.sin(a); }
    else if ((u -= Math.PI * R) < 2 * S) { x = S - u; y = R; }
    else { u -= 2 * S; const a = Math.PI / 2 + u / R; x = -S + R * Math.cos(a); y = R * Math.sin(a); }
    if (kind === 'curvas' && Math.abs(x) < S) y += Math.sign(y) * -0.055 * Math.sin((x + S) / (2 * S) * Math.PI * 2);
    pts.push([x, y]);
  }
  return pts;
}
const TRACKS = { ovalo:trackPts('ovalo'), ocho:trackPts('ocho'), curvas:trackPts('curvas') };
function distToPath(pts, x, y) {
  let best = 1e9;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    let u = l2 ? ((x - a[0]) * dx + (y - a[1]) * dy) / l2 : 0; u = Math.max(0, Math.min(1, u));
    const px = a[0] + u * dx - x, py = a[1] + u * dy - y, d = px * px + py * py;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
function roboDefaults(mode) {
  if (mode === 'bal') return { mode, th:0.05, om:0, x:0, v:0, a:0, fallen:false };
  if (mode === 'arm') return { mode, obj:{ x:0.17, y:-0.06, z:0, held:false }, goal:{ x:0.08, y:0.15 }, ok:false, prevGrip:90 };
  if (mode === 'avoid') return { mode, x:-0.55, y:0, h:0, obs:[{ x:0.0, y:0.08, r:0.055 }, { x:0.4, y:-0.1, r:0.055 }], dist:4, bump:false };
  const pts = TRACKS.ovalo, a = pts[0], b = pts[1];
  return { mode:'line', track:'ovalo', x:a[0], y:a[1], h:Math.atan2(b[1] - a[1], b[0] - a[0]), sens:[0, 0] };
}
function rayCircle(ox, oy, dx, dy, c) { const fx = ox - c.x, fy = oy - c.y, b = fx * dx + fy * dy, cc = fx * fx + fy * fy - c.r * c.r, disc = b * b - cc; if (disc < 0) return 1e9; const t = -b - Math.sqrt(disc); return t >= 0 ? t : (cc < 0 ? 0 : 1e9); }
function rayBox(ox, oy, dx, dy) { const [bx, by] = ROBO.box; let t = 1e9; if (dx > 1e-9) t = Math.min(t, (bx - ox) / dx); if (dx < -1e-9) t = Math.min(t, (-bx - ox) / dx); if (dy > 1e-9) t = Math.min(t, (by - oy) / dy); if (dy < -1e-9) t = Math.min(t, (-by - oy) / dy); return Math.max(0, t); }

function hcsrDur(cm) { return cm > 400 ? 38000 : Math.max(2, cm) * 58.3; }
function mpuBytes(s, n) {
  const out = [], th = (s.pitch || 0) * Math.PI / 180, nz = () => (Math.random() - 0.5) * 60;
  const ax = s.sleep ? 0 : Math.round(Math.sin(th) * 16384 + nz()), az = s.sleep ? 0 : Math.round(Math.cos(th) * 16384 + nz()), ay = s.sleep ? 0 : Math.round(nz());
  const gy = s.sleep ? 0 : Math.round((s.rate || 0) * 131 + nz() / 4), gx = s.sleep ? 0 : Math.round(nz() / 4), gz = s.sleep ? 0 : Math.round(nz() / 4), tmp = s.sleep ? 0 : Math.round((25 - 36.53) * 340);
  const w = v => [(v >> 8) & 255, v & 255];
  const map = {}; [[0x3b, ax], [0x3d, ay], [0x3f, az], [0x41, tmp], [0x43, gx], [0x45, gy], [0x47, gz]].forEach(q => { const b = w(q[1]); map[q[0]] = b[0]; map[q[0] + 1] = b[1]; });
  map[0x75] = 0x68; map[0x6b] = s.sleep ? 0x40 : 0;
  for (let k = 0; k < n; k++) { const r = (s.ptr || 0) + k; out.push(map[r] !== undefined ? map[r] : (s.reg && s.reg[r]) || 0); }
  s.ptr = ((s.ptr || 0) + n) & 255;
  return out;
}
function mpuWrite(s, bytes) {
  if (!bytes.length) return;
  s.ptr = bytes[0]; s.reg = s.reg || {};
  for (let k = 1; k < bytes.length; k++) { s.reg[s.ptr] = bytes[k]; if (s.ptr === 0x6b) s.sleep = (bytes[k] & 0x40) !== 0; s.ptr = (s.ptr + 1) & 255; }
}
class Sim {
  constructor() {
    this.project = null; this.st = {}; this.res = {}; this.els = []; this.nl = []; this.scopes = {};
    this.nodeIdx = new Map(); this.n = 0; this.noSource = true; this.error = null;
    this.time = 0; this.acc = 0; this.tacc = 0; this.behind = false; this.onFail = null;
    this.H = 1e-3; this.budget = 9; this.nrIters = 0;
  }
  getSt(id) {
    return this.st[id] || (this.st[id] = { T:AMB, damage:0, failed:false, tipo:'', vprev:0, vd:0.5, over:0, rev:0, pAcc:0, i2Acc:0 });
  }
  setProject(p) { this.project = p; setLayout(p.board); this.compile(); }
  resetAll() { this.rb = null; this.st = {}; this.res = {}; this.scopes = {}; this.time = 0; this.acc = 0; this.tacc = 0; this.error = null; this.compile(); }
  repair(id) {
    Object.keys(this.st).forEach(k => { if (k === id || k.indexOf(id + '/') === 0) { delete this.st[k]; delete this.res[k]; } });
    this.error = null; this.compile();
  }
  compile() {
    const p = this.project, byId = {};
    p.components.forEach(c => { byId[c.id] = c; });
    const termKey = (id, pin) => {
      const c = byId[id];
      if (!c) return 'T:?';
      if (pin === 'gnd' || (PARTS[c.type].earth && /^GND/.test(pin))) return GND;
      if (c.type === 'supply' && pin === '-' && c.p.link !== false && !c.p.dual) return GND;
      return 'T:' + id + ':' + pin;
    };
    const keyOf = ep => ep.k === 'h' ? stripOf(ep.bd || 0, ep.row, ep.col) : termKey(ep.comp, ep.pin);
    const els = [];
    let hasSrc = false;
    p.components.forEach(c => {
      const pk = {};
      if (PARTS[c.type].kind === 'board') compPins(c).forEach(h => { pk[h.pin] = stripOf(h.bd, h.row, h.col); });
      const add = o => { o.c = c; els.push(o); return o; };
      switch (c.type) {
        case 'resistor': add({ id:c.id, type:'R', ks:[pk.A, pk.B] }); break;
        case 'rpower': add({ id:c.id, type:'R', ks:[pk.A, pk.B], spec:SPEC.RP }); break;
        case 'diode': { const dt = DIODES[c.p.model] || DIODE; add({ id:c.id, type:'D', ks:[pk.A, pk.K], dt, spec:SPEC[dt.spec] }); break; }
        case 'zener': add({ id:c.id, type:'D', ks:[pk.A, pk.K], dt:zenerType(c.p.vz || 5.1), spec:SPEC.Z }); break;
        case 'lm336': add({ id:c.id, type:'D', ks:[pk['-'], pk['+']], dt:zenerType(2.49, 0.3), spec:SPEC.Z }); break;
        case 'inductor': add({ id:c.id, type:'L', ks:[pk['1'], pk['2']] }); break;
        case 'led': add({ id:c.id, type:'D', ks:[pk.A, pk.K], led:true, spec:SPEC.LED }); break;
        case 'capacitor': add({ id:c.id, type:'C', ks:[pk['+'], pk['-']], polar:true }); break;
        case 'ceramic': add({ id:c.id, type:'C', ks:[pk['1'], pk['2']] }); break;
        case 'pot': add({ id:c.id + '/a', type:'RP', ks:[pk['1'], pk.W], half:0 }); add({ id:c.id + '/b', type:'RP', ks:[pk.W, pk['3']], half:1 }); break;
        case 'button': add({ id:c.id, type:'SW', ks:[pk['1'], pk['2']] }); break;
        case 'dipsw': for (let k = 1; k <= c.p.n; k++) add({ id:c.id + '/' + k, type:'SW', sw:k - 1, ks:[pk[String(k)], pk[String(2 * c.p.n + 1 - k)]] }); break;
        case 'seg7': {
          const d = SEG7[c.p.model];
          for (let gI = 0; gI < d.digits; gI++) Object.keys(d.seg).forEach(sn => { const sp = pk[String(d.seg[sn])], cp = pk[String(d.com[gI][0])]; add({ id:c.id + '/' + gI + sn, type:'D', led:true, spec:SPEC.LED, ks:d.cc ? [sp, cp] : [cp, sp] }); });
          if (d.com[0].length > 1) add({ id:c.id + '/cl', type:'LINK', ks:[pk[String(d.com[0][0])], pk[String(d.com[0][1])]] });
          break;
        }
        case 'stepkit':
          add({ id:c.id + '/drv', type:'ULNM', ks:['IN1', 'IN2', 'IN3', 'IN4', '-', '+', 'A', 'B', 'C', 'D', 'COM'].map(q => termKey(c.id, q)) });
          add({ id:c.id, type:'STEP', ks:['A', 'B', 'C', 'D', 'COM'].map(q => termKey(c.id, q)) });
          break;
        case 'reg': add({ id:c.id, type:'REG', vr:{ '7809':9, '7812':12 }[c.p.model] || 5, ks:[pk.IN, pk.GND, pk.OUT] }); break;
        case 'regneg': add({ id:c.id, type:'REG', sg:-1, vr:c.p.model === '7912' ? -12 : -5, ks:[pk.IN, pk.GND, pk.OUT] }); break;
        case 'lm317': add({ id:c.id, type:'REG', vr:1.25, noIq:true, ks:[pk.IN, pk.ADJ, pk.OUT] }); break;
        case 'irfz44n': case 'irf540n': case 'mos2n7000': {
          const m = MOSM[c.type];
          add({ id:c.id, type:'MOS', m, spec:m, ks:[pk.D, pk.G, pk.S] });
          if (m.body) add({ id:c.id + '/d', type:'D', spec:SPEC.D, ks:[pk.S, pk.D] });
          break;
        }
        case 'lm35': { const el = add({ id:c.id, type:'V', vset:0, vfun:() => (+c.p.T || 0) * 0.01, ilim:0.02, sense:true, cond:() => !!(el.s && el.s.pwOk), ks:[pk.VOUT, pk.GND, pk.VCC] }); break; }
        case 'ntc': { const T = (+c.p.T || 25) + 273.15; c.p.R = (+c.p.R25 || 10000) * Math.exp((+c.p.B || 3950) * (1 / T - 1 / 298.15)); add({ id:c.id, type:'R', ks:[pk['1'], pk['2']] }); break; }
        case 'rgbled': [['R', 'rojo'], ['G', 'verde'], ['B', 'azul']].forEach(q => add({ id:c.id + '/' + q[0], type:'D', led:true, spec:SPEC.LED, dt:LED_TYPES[q[1]], ks:[pk[q[0]], pk.K] })); break;
        case 'bridge': { const dt = DIODES['1N4007'], bsp = c.p.model === 'KBP206' ? Object.assign({}, SPEC.D, { Rth:38 }) : c.p.model === '2W10' ? Object.assign({}, SPEC.D, { Rth:50 }) : SPEC.D; [['~1', '+'], ['~2', '+'], ['-', '~1'], ['-', '~2']].forEach((q, i) => add({ id:c.id + '/d' + i, type:'D', dt, spec:bsp, ks:[pk[q[0]], pk[q[1]]] })); break; }
        case 'spdt': add({ id:c.id + '/a', type:'SW', sw:0, ks:[pk.C, pk['1']] }); add({ id:c.id + '/b', type:'SW', sw:1, ks:[pk.C, pk['2']] }); break;
        case 'bargraph': for (let k = 1; k <= 10; k++) add({ id:c.id + '/' + k, type:'D', led:true, spec:SPEC.LED, ks:[pk[String(k)], pk[String(21 - k)]] }); break;
        case 'keypad': for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) add({ id:c.id + '/' + r + k, type:'SW', sw:r * 4 + k, ks:[termKey(c.id, 'R' + (r + 1)), termKey(c.id, 'C' + (k + 1))] }); break;
        case 'dmm': hasSrc = true; add({ id:c.id, type:'DMM', ks:['COM', 'VOHM', 'MA', 'A'].map(q => termKey(c.id, q)) }); break;
        case 'lprobe': {
          add({ id:c.id, type:'LPROBE', ks:['TIP', 'VCC', 'GND'].map(q => termKey(c.id, q)) });
          /* alimentación rápida desde los rieles de la primera protoboard (+ arriba, − arriba) */
          if (c.p.rails) { add({ id:c.id + '/rv', type:'LINK', ks:[termKey(c.id, 'VCC'), 'R:0:P1'] }); add({ id:c.id + '/rg', type:'LINK', ks:[termKey(c.id, 'GND'), 'R:0:N1'] }); }
          break;
        }
        case 'oled': add({ id:c.id, type:'OLED', ks:['GND', 'VCC', 'SCL', 'SDA'].map(q => termKey(c.id, q)) }); break;
        case 'crystal': case 'stub2': case 'stub3': case 'customDip': break;
        case 'ic': {
          const d = IC[c.p.part], ks = [];
          for (let k = 1; k <= d.pins; k++) ks.push(pk[String(k)]);
          const e = add({ id:c.id, type:'IC', ks, d });
          (d.amps || []).forEach((a, i) => add({ id:c.id + '/' + i, type:'OA', ks:[pk[a.p], pk[a.n], pk[a.o], pk[d.vcc], pk[d.gnd]], parent:e, d }));
          if (d.kind === 'tl494') [[1, 2], [16, 15]].forEach((q, i) => {
            const nd = 'I:' + c.id + ':ea' + i;
            add({ id:c.id + '/ea' + i, type:'OA', ks:[pk[q[0]], pk[q[1]], nd, pk[12], pk[7]], parent:e, d:{ fam:'tlea' } });
            add({ id:c.id + '/eo' + i, type:'D', ks:[nd, pk[3]], dt:DIODES['1N4148'], spec:SPEC.DS, inner:true });
          });
          break;
        }
        case 'supply':
          hasSrc = true;
          if (c.p.dual) { add({ id:c.id, type:'V', ks:[termKey(c.id, '+'), GND] }); add({ id:c.id + '/n', type:'V', ks:[GND, termKey(c.id, '-')] }); }
          else add({ id:c.id, type:'V', ks:[termKey(c.id, '+'), termKey(c.id, '-')] });
          break;
        case 'mcu': case 'arduino': if (this.compileMcu(c, pk, add, termKey)) hasSrc = true; break;
        case 'lcd': add({ id:c.id, type:'LCD', ks:PARTS.lcd.pins.map(q => pk[q]) }); break;
        case 'lcdi2c': add({ id:c.id, type:'LCD', i2c:true, ks:PARTS.lcdi2c.pins.map(q => pk[q]) }); break;
        case 'lcdi2c16': case 'lcdi2c20': add({ id:c.id, type:'LCD', i2c:true, ks:['GND', 'VCC', 'SDA', 'SCL'].map(q => termKey(c.id, q)) }); break;
        case 'bjt2222': case 'tip120': case 'bjt3904': case 'pnp3906': case 'tip42': case 'bc547': case 'bc548': case 'bc557': case 'tip31': case 'tip32': {
          const m = BJT[c.type];
          add({ id:c.id, type:'Q', m, spec:m, pol:m.pnp ? -1 : 1, ks:[pk.C, pk.B, pk.E] });
          if (c.type === 'tip120') add({ id:c.id + '/d', type:'D', spec:SPEC.D, ks:[pk.E, pk.C] });
          break;
        }
        case 'motor': case 'gearmotor': add({ id:c.id, type:'MOT', m:MOTOR[c.type], ks:[termKey(c.id, '+'), termKey(c.id, '-')] }); break;
        case 'stepper': add({ id:c.id, type:'STEP', ks:['A', 'B', 'C', 'D', 'COM'].map(q => termKey(c.id, q)) }); break;
        case 'nema17': add({ id:c.id, type:'STEP', bip:true, ks:['A+', 'A-', 'B+', 'B-'].map(q => termKey(c.id, q)) }); break;
        case 'servo': add({ id:c.id, type:'SERVO', ks:['GND', 'VCC', 'SIG'].map(q => termKey(c.id, q)) }); break;
        case 'uln_mod': add({ id:c.id, type:'ULNM', ks:PARTS.uln_mod.pins.map(q => termKey(c.id, q)) }); break;
        case 'l298n': {
          const e = add({ id:c.id, type:'L298', ks:PARTS.l298n.pins.map(q => termKey(c.id, q)) });
          add({ id:c.id + '/5V', type:'V', vset:5, ilim:0.5, cond:() => c.p.reg5 !== false && (e.s.v12 || 0) > 7, ks:[termKey(c.id, '5V'), termKey(c.id, 'GND')] });
          break;
        }
        case 'fgen': hasSrc = true; add({ id:c.id, type:'G', ks:[termKey(c.id, 'out'), GND] }); break;
        case 'chasis2wd': case 'chasisbal':
          if (c.p.mot !== false) [['motorL', 'M_IZQ+', 'M_IZQ-', '/mL'], ['motorR', 'M_DER+', 'M_DER-', '/mR']].forEach(q => {
            if (p.components.some(o => o.mount === c.id && o.slot === q[0] && (o.type === 'gearmotor' || o.type === 'motor'))) return;
            add({ id:c.id + q[3], type:'MOT', m:MOTOR.gearmotor, side:q[0], ks:[termKey(c.id, q[1]), termKey(c.id, q[2])] });
          });
          break;
        case 'brazo3d':
          if (c.p.servos !== false) for (let k = 1; k <= 4; k++) add({ id:c.id + '/s' + k, type:'SERVO', armIdx:k - 1, ks:['GND', 'VCC', 'S' + k].map(q => termKey(c.id, q)) });
          break;
        case 'buzzer': add({ id:c.id, type:'R', buz:true, ks:[pk['+'], pk['-']], spec:SPEC.RP }); break;
        case 'ldr': c.p.R = ldrR(c.p.lux); add({ id:c.id, type:'R', ks:[pk['1'], pk['2']] }); break;
        case 'batteryPack': hasSrc = true; add({ id:c.id, type:'V', vset:+c.p.V || 7.4, ilim:3, cond:() => c.p.on !== false, ks:[termKey(c.id, '+'), termKey(c.id, '-')] }); break;
        case 'joystick': {
          const G = termKey(c.id, 'GND'), Vp = termKey(c.id, '+5V');
          add({ id:c.id + '/xa', type:'RP', posKey:'x', half:0, ks:[G, termKey(c.id, 'VRx')] }); add({ id:c.id + '/xb', type:'RP', posKey:'x', half:1, ks:[termKey(c.id, 'VRx'), Vp] });
          add({ id:c.id + '/ya', type:'RP', posKey:'y', half:0, ks:[G, termKey(c.id, 'VRy')] }); add({ id:c.id + '/yb', type:'RP', posKey:'y', half:1, ks:[termKey(c.id, 'VRy'), Vp] });
          add({ id:c.id + '/sw', type:'SW', ks:[termKey(c.id, 'SW'), G] });
          break;
        }
        case 'relay': {
          const r = add({ id:c.id, type:'RLY', ks:['VCC', 'GND', 'IN'].map(q => termKey(c.id, q)) });
          add({ id:c.id + '/no', type:'SW', rlyOf:r, nc:false, ks:[termKey(c.id, 'COM'), termKey(c.id, 'NO')] });
          add({ id:c.id + '/nc', type:'SW', rlyOf:r, nc:true, ks:[termKey(c.id, 'COM'), termKey(c.id, 'NC')] });
          break;
        }
        case 'portapilas': hasSrc = true; add({ id:c.id, type:'V', vset:1.5 * (c.p.celdas || 4), ilim:3, cond:() => c.p.on !== false, ks:[termKey(c.id, '+'), termKey(c.id, '-')] }); break;
        case 'tcrt': add({ id:c.id, type:'TCRT', ks:PARTS.tcrt.pins.map(q => termKey(c.id, q)) }); break;
        case 'hcsr04': add({ id:c.id, type:'HCSR', ks:PARTS.hcsr04.pins.map(q => termKey(c.id, q)) }); break;
        case 'mpu6050': add({ id:c.id, type:'MPU', ks:PARTS.mpu6050.pins.map(q => termKey(c.id, q)) }); break;
        case 'scope': add({ id:c.id, type:'SCOPE', ks:[termKey(c.id, 'ch1'), termKey(c.id, 'ch2')] }); break;
        case 'trafo': hasSrc = true; ['a', 'b'].forEach((k, i) => add({ id:c.id + '/' + k, type:'XF', ph:i ? Math.PI : 0, ks:[termKey(c.id, i ? 'B' : 'A'), termKey(c.id, 'CT')] })); break;
        case 'scope4': add({ id:c.id, type:'SCOPE', ks:['ch1', 'ch2', 'ch3', 'ch4'].map(q => termKey(c.id, q)) }); break;
      }
    });
    p.wires.forEach(w => els.push({ id:w.id, type:'W', ks:[keyOf(w.a), keyOf(w.b)], w }));
    const alive = new Set(els.map(e => e.id));
    Object.keys(this.st).forEach(id => { if (!alive.has(id)) { delete this.st[id]; delete this.res[id]; } });
    Object.keys(this.scopes).forEach(id => { if (!alive.has(id)) delete this.scopes[id]; });
    this.noSource = !hasSrc;
    this.nodeIdx = new Map([[GND, -1]]);
    let k = 0;
    rcmOrder(els).forEach(key => this.nodeIdx.set(key, k++));
    els.forEach(e => e.ks.forEach(key => { if (!this.nodeIdx.has(key)) this.nodeIdx.set(key, k++); }));
    this.n = k;
    els.forEach(e => { e.ix = e.ks.map(key => this.nodeIdx.get(key)); e.ia = e.ix[0]; e.ib = e.ix[1]; e.s = this.getSt(e.id); });
    const par = new Int32Array(k).map((_, i) => i), root = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
    els.forEach(e => { if ((e.type === 'W' || e.type === 'LINK') && e.ia >= 0 && e.ib >= 0) par[root(e.ia)] = root(e.ib); });
    this.net = new Int32Array(k); for (let i = 0; i < k; i++) this.net[i] = root(i);
    this.els = els;
    const n = this.n;
    this.G0 = new Float64Array(n * n); this.B0 = new Float64Array(n);
    this.G = new Float64Array(n * n); this.B = new Float64Array(n); this.X = new Float64Array(n);
    this.v = new Float64Array(n);
    this.error = null;
  }
  voltageOfKey(key) {
    if (this.noSource) return null;
    const i = this.nodeIdx.get(key);
    if (i === undefined) return null;
    return i < 0 ? 0 : this.v[i];
  }
  netOf(i) { return i === undefined || i < 0 ? -1 : this.net[i]; }
  voltageAtHole(bd, row, col) { return this.voltageOfKey(stripOf(bd, row, col)); }
  scopeBuf(id) {
    return this.scopes[id] || (this.scopes[id] = { N:16384, t:new Float64Array(16384), a:new Float32Array(16384), b:new Float32Array(16384), c:new Float32Array(16384), d:new Float32Array(16384), head:0, count:0, k:1, kc:0, lastTT:null });
  }
  computeH() {
    let h = 1e-3;
    for (const e of this.els) {
      if (e.type === 'G' && e.c.p.on !== false) h = Math.min(h, 1 / (e.c.p.f * 64));
      if (e.type === 'XF' && e.c.p.on !== false) h = Math.min(h, 1 / ((+e.c.p.f || 60) * 96));
      if (e.type === 'SCOPE') h = Math.min(h, e.c.p.tb / 20);
      if (e.type === 'IC' && e.d.kind === 'tl494' && e.s.pw) h = Math.min(h, 1 / ((e.s.fest || 40000) * 40));
      if (e.type === 'IC' && e.d.kind === '555' && e.s.fest) h = Math.min(h, 1 / (e.s.fest * 60));
      if (e.type === 'IC' && e.d.kind === 'adc' && e.s.busy) h = Math.min(h, 2.5e-5);
    }
    this.H = Math.max(h, 5e-7);
    for (const e of this.els) if (e.type === 'SCOPE') { const b = this.scopeBuf(e.id); b.k = Math.max(1, Math.floor(e.c.p.tb * 10 / 1600 / this.H)); }
  }

  stampNL(e, G, B, n, h) {
    const s = e.s, c = e.c;
    switch (e.type) {
      case 'D': {
        const t = e.dt || (e.led ? (LED_TYPES[c.p.color] || LED_TYPES.rojo) : DIODE), nvt = t.n * VT;
        const vd = s.vd, arg = Math.min(vd / nvt, 60), ex = Math.exp(arg);
        let id = t.is * (ex - 1), gd = t.is * ex / nvt + 1e-12;
        if (t.vz) { const nz = t.nz * VT, ez = t.isz * Math.exp(Math.min((-vd - t.vz) / nz, 60)); id -= ez; gd += ez / nz; }
        e.gd = gd; e.ieq = id - gd * vd;
        sG(G, n, e.ia, e.ib, gd); sI(B, e.ia, e.ib, e.ieq);
        break;
      }
      case 'V': {
        const q = srcP(e);
        if (q.on === false) { sG(G, n, e.ia, e.ib, 1e-6); break; }
        if (s.mode === 'CC') { sG(G, n, e.ia, e.ib, 1e-4); sI(B, e.ib, e.ia, q.I); }
        else { const g = 1 / SPEC.V.Rint; sG(G, n, e.ia, e.ib, g); sI(B, e.ib, e.ia, q.V * g); }
        break;
      }
      case 'Q': {
        const m = e.m, nvt = m.n * VT, iC = e.ix[0], iB = e.ix[1], iE = e.ix[2], vbe = s.vbe || 0, vbc = s.vbc || 0, pol = e.pol || 1;
        const ef = Math.exp(Math.min(vbe / nvt, 60)), er = Math.exp(Math.min(vbc / nvt, 60)), Is = m.Is;
        const Ic = Is * (ef - er) - Is / m.br * (er - 1), Ib = Is / m.bf * (ef - 1) + Is / m.br * (er - 1);
        const gcbe = Is * ef / nvt, gcbc = -Is * er / nvt - Is / m.br * er / nvt, gbbe = Is / m.bf * ef / nvt, gbbc = Is / m.br * er / nvt;
        const IcEq = pol * (Ic - gcbe * vbe - gcbc * vbc), IbEq = pol * (Ib - gbbe * vbe - gbbc * vbc);
        gE(G, n, iC, iB, gcbe + gcbc); gE(G, n, iC, iE, -gcbe); gE(G, n, iC, iC, -gcbc); if (iC >= 0) B[iC] -= IcEq;
        gE(G, n, iB, iB, gbbe + gbbc); gE(G, n, iB, iE, -gbbe); gE(G, n, iB, iC, -gbbc); if (iB >= 0) B[iB] -= IbEq;
        gE(G, n, iE, iB, -(gcbe + gcbc + gbbe + gbbc)); gE(G, n, iE, iE, gcbe + gbbe); gE(G, n, iE, iC, gcbc + gbbc); if (iE >= 0) B[iE] += IcEq + IbEq;
        sG(G, n, iB, iE, 1e-12); sG(G, n, iB, iC, 1e-12); sG(G, n, iC, iE, 1e-10);
        break;
      }
      case 'MOS': {
        const m = e.m; let d = e.ix[0], sN = e.ix[2], vgs = s.vgs || 0, vds = s.vds || 0;
        const gI = e.ix[1];
        if (vds < 0) { const t = d; d = sN; sN = t; vgs -= vds; vds = -vds; }
        const r = mosId(m, vgs, vds), gds = r.gds + 1e-9, ieq = r.id - r.gm * vgs - gds * vds;
        gE(G, n, d, d, gds); gE(G, n, d, sN, -gds - r.gm); gE(G, n, d, gI, r.gm); if (d >= 0) B[d] -= ieq;
        gE(G, n, sN, d, -gds); gE(G, n, sN, sN, gds + r.gm); gE(G, n, sN, gI, -r.gm); if (sN >= 0) B[sN] += ieq;
        sG(G, n, gI, e.ix[2], 1e-12);
        break;
      }
      case 'OA': {
        if (e.parent.s.failed) break;
        const f = FAM[e.d.fam], g = 1 / f.rout, A = 1e5, ip = e.ix[0], inn = e.ix[1], io = e.ix[2], iv = e.ix[3], ig = e.ix[4];
        const reg = s.reg || 'lo';
        if (reg === 'hi') { sG(G, n, io, iv, g); sI(B, io, iv, g * f.dhi); }
        else if (reg === 'lo') { sG(G, n, io, ig, g); sI(B, io, ig, -g * f.dlo); }
        else {
          gE(G, n, io, io, g); gE(G, n, io, ig, -g); gE(G, n, io, ip, -g * A); gE(G, n, io, inn, g * A);
          gE(G, n, ig, io, -g); gE(G, n, ig, ig, g); gE(G, n, ig, ip, g * A); gE(G, n, ig, inn, -g * A);
          sI(B, ig, io, g * A * OA_VOS);
        }
        break;
      }
      case 'REG': {
        const iin = e.ix[0], ig = e.ix[1], io = e.ix[2], g = 1 / SPEC.REG.Rout;
        if (!e.noIq) sG(G, n, iin, ig, 1 / 2400);
        const reg = s.tsd || s.failed ? 'off' : (s.reg || 'reg'), sg = e.sg || 1, vr = e.vr === undefined ? 5 : e.vr;
        if (reg === 'off') break;
        const ref = reg === 'reg' ? ig : iin, V0 = reg === 'reg' ? vr : -sg * 2;
        gE(G, n, iin, ref, g); gE(G, n, iin, io, -g); if (iin >= 0) B[iin] -= g * V0;
        gE(G, n, io, ref, -g); gE(G, n, io, io, g); if (io >= 0) B[io] += g * V0;
        break;
      }
    }
  }
  updateNL(e, X) {
    const s = e.s, c = e.c, V = i => i < 0 ? 0 : X[i];
    switch (e.type) {
      case 'D': {
        const t = e.dt || (e.led ? (LED_TYPES[c.p.color] || LED_TYPES.rojo) : DIODE);
        const vnew = V(e.ia) - V(e.ib);
        let lim;
        if (t.vz && vnew < 0) lim = -pnjlim(-vnew - t.vz, -s.vd - t.vz, t.nz * VT, t.vcritz) - t.vz;
        else lim = pnjlim(vnew, s.vd, t.n * VT, t.vcrit);
        const conv = Math.abs(vnew - s.vd) <= 1e-6 + 1e-4 * Math.abs(vnew);
        s.vd = lim;
        return conv;
      }
      case 'V': {
        const q = srcP(e);
        if (q.on === false || e.swc > 4) return true;
        const vab = V(e.ia) - V(e.ib);
        if (s.mode === 'CC') { if (vab > q.V + 1e-6) { s.mode = 'CV'; e.swc++; return false; } }
        else if ((q.V - vab) / SPEC.V.Rint > q.I * 1.0005 + 1e-9) { s.mode = 'CC'; e.swc++; return false; }
        return true;
      }
      case 'Q': {
        const m = e.m, nvt = m.n * VT, vcrit = nvt * Math.log(nvt / (Math.SQRT2 * m.Is));
        const pol = e.pol || 1, vbe = pol * (V(e.ix[1]) - V(e.ix[2])), vbc = pol * (V(e.ix[1]) - V(e.ix[0]));
        const conv = Math.abs(vbe - (s.vbe || 0)) <= 1e-6 + 1e-4 * Math.abs(vbe) && Math.abs(vbc - (s.vbc || 0)) <= 1e-6 + 1e-4 * Math.abs(vbc);
        s.vbe = pnjlim(vbe, s.vbe || 0, nvt, vcrit); s.vbc = pnjlim(vbc, s.vbc || 0, nvt, vcrit);
        return conv;
      }
      case 'MOS': {
        const vgs = V(e.ix[1]) - V(e.ix[2]), vds = V(e.ix[0]) - V(e.ix[2]);
        const conv = Math.abs(vgs - (s.vgs || 0)) <= 1e-6 + 1e-4 * Math.abs(vgs) && Math.abs(vds - (s.vds || 0)) <= 1e-6 + 1e-4 * Math.abs(vds);
        const lim = (v, o, mx) => Math.max(o - mx, Math.min(o + mx, v));
        s.vgs = lim(vgs, s.vgs || 0, 3); s.vds = lim(vds, s.vds || 0, 10);
        return conv;
      }
      case 'OA': {
        if (e.swc > 10) return true;
        const f = FAM[e.d.fam], vg = V(e.ix[4]);
        const vt = vg + 1e5 * (V(e.ix[0]) - V(e.ix[1]) + OA_VOS), hi = V(e.ix[3]) - f.dhi, lo = vg + f.dlo;
        // desde saturación se prueba la zona lineal; si la solución lineal contradice el sentido (realimentación positiva), salta al otro riel
        const cur = s.reg || 'lo';
        let nr;
        if (hi <= lo) nr = 'lo';
        else if (cur === 'hi') { nr = vt < hi ? 'lin' : 'hi'; if (nr === 'lin') s.from = 'hi'; }
        else if (cur === 'lo') { nr = vt > lo ? 'lin' : 'lo'; if (nr === 'lin') s.from = 'lo'; }
        else nr = vt > hi ? (s.from === 'hi' ? 'lo' : 'hi') : vt < lo ? (s.from === 'lo' ? 'hi' : 'lo') : 'lin';
        if (nr !== cur) { s.reg = nr; e.swc++; return false; }
        return true;
      }
      case 'REG': {
        if (s.tsd || s.failed || e.swc > 6) return true;
        const g = 1 / SPEC.REG.Rout, vin = V(e.ix[0]), vg = V(e.ix[1]), vo = V(e.ix[2]);
        const sg = e.sg || 1, vr = e.vr === undefined ? 5 : e.vr, ir = sg * g * (vg + vr - vo), idr = sg * g * (vin - sg * 2 - vo);
        const nr = Math.min(ir, idr) < 0 ? 'off' : ir <= idr ? 'reg' : 'drop';
        if (nr !== (s.reg || 'reg')) { s.reg = nr; e.swc++; return false; }
        return true;
      }
    }
    return true;
  }
  stampIC(e, G, n, B) {
    const d = e.d, s = e.s, P = k => e.ix[k - 1], vcc = P(d.vcc), gn = P(d.gnd);
    sG(G, n, vcc, gn, 1e-5);
    if (d.kind === 'adc') { sG(G, n, P(9), vcc, 1 / 8000); sG(G, n, P(9), gn, 1 / 8000); sG(G, n, P(6), gn, 1e-8); sG(G, n, P(7), gn, 1e-8); }
    if (d.kind === 'dac') {
      if (s.pw) {
        const g = 1, fr = s.frac || 0, i14 = P(14), i15 = P(15), i4 = P(4);
        gE(G, n, i14, i14, g); gE(G, n, i14, i15, -g);
        gE(G, n, i4, i14, fr * g); gE(G, n, i4, i15, -fr * g);
      }
      sG(G, n, P(3), gn, 1e-5); sG(G, n, P(15), gn, 1e-9);
      for (const pl of d.pulls) sG(G, n, P(pl[0]), gn, 1e-7);
      return;
    }
    if (d.kind === 'tl494') {
      sG(G, n, P(3), gn, 1 / 4700);
      if (!s.pw) return;
      sG(G, n, P(14), gn, 2); sI(B, gn, P(14), 10);
      sG(G, n, P(6), gn, 1); sI(B, gn, P(6), 3.6);
      if (s.dis) sG(G, n, P(5), gn, 1 / 20); else sI(B, gn, P(5), s.ict || 0);
      sG(G, n, P(8), P(9), s.q1 ? 1 / 3 : 1e-8); sG(G, n, P(11), P(10), s.q2 ? 1 / 3 : 1e-8);
      return;
    }
    if (d.gndx) d.gndx.forEach(x => sG(G, n, P(x), gn, 100));
    if (d.kind === 'op') return;
    if (d.kind === 'opto') {
      const a = P(d.led.a), k = P(d.led.k), gl = 1 / 25;
      if (s.ledOn) { sG(G, n, a, k, gl); sI(B, k, a, gl * 1.15); } else sG(G, n, a, k, 1e-9);
      sG(G, n, P(d.ph.c), P(d.ph.e), s.gce || 1e-9);
      return;
    }
    for (const pl of d.pulls) sG(G, n, P(pl[0]), pl[1] === 'up' ? vcc : gn, pl[2]);
    if (d.kind === '555') d.timers.forEach((tm, i) => {
      sG(G, n, vcc, P(tm.ctrl), 1 / 5000); sG(G, n, P(tm.ctrl), gn, 1 / 10000);
      const q = s.qs ? s.qs[i] : s.q;
      if (s.pw && !q) sG(G, n, P(tm.dis), gn, 1 / 10);
    });
    if (d.kind === 'mux8' && s.pw && s.sel !== null && s.sel !== undefined) sG(G, n, P(d.com), P(d.chan[s.sel]), 1 / 125);
    if (!s.out) return;
    const g = 1 / FAM[d.fam].rout;
    const rail = d.vmot ? P(d.vmot) : vcc;
    for (const k of d.outs) {
      const o = s.out[k];
      if (o === null || o === undefined) continue;
      const wh = Array.isArray(o) ? o[0] : o, wl = Array.isArray(o) ? o[1] : 1 - o;
      if (!d.oc && wh + wl > 0.999) { sAvg(G, n, P(k), rail, gn, g, wh); continue; }
      if (wh > 0 && !d.oc) sG(G, n, P(k), rail, g * wh);
      if (wl > 0) sG(G, n, P(k), gn, g * wl);
    }
  }
  icPost(e, h) {
    const d = e.d, s = e.s, X = this.v, f = FAM[d.fam];
    const V = k => { const i = e.ix[k - 1]; return i < 0 ? 0 : X[i]; };
    const vg = V(d.gnd), vcc = V(d.vcc), vs = vcc - vg;
    let icc = vs * 1e-5;
    if (s.out && !s.failed) { const g = 1 / f.rout; for (const k of d.outs) if (s.out[k] === 1) icc += Math.max(0, (vcc - V(k)) * g); }
    if (d.kind === '555') icc += vs / 15000;
    if (d.amps) d.amps.forEach((a, i) => { const r = this.res[e.id + '/' + i]; if (r) icc += Math.max(0, r.i); });
    this.res[e.id] = { v:vs, i:icc, p:vs * icc };
    if (s.failed) { s.out = null; s.pw = false; return; }
    if (vs > f.vabs) s.over += h; else s.over = Math.max(0, s.over - h);
    if (vs < -0.6 && d.kind !== 'opto') s.rev += h; else s.rev = Math.max(0, s.rev - h);
    s.damage = Math.min(1, Math.max(s.over, s.rev) / 0.25);
    s.vs = vs;
    if (s.damage >= 1) { this.fail(e, 'quemado', { vs }); s.out = null; s.pw = false; return; }
    s.pw = f.always || vs > f.vmin * 0.6;
    s.t = (s.t || 0) + h;
    if (!s.pw) { s.out = null; s.q = 0; return; }
    if (d.kind === 'op') return;
    if (d.kind === 'opto') {
      const vak = V(d.led.a) - V(d.led.k), If = s.ledOn ? (vak - 1.15) / 25 : 0;
      s.ledOn = s.ledOn ? If > 0 : vak > 1.2;
      s.iled = Math.max(0, If);
      const ic = d.ctr * s.iled, vce = V(d.ph.c) - V(d.ph.e);
      s.gce = Math.max(1e-9, Math.min(ic / Math.max(vce, 0.15), 20));
      this.res[e.id] = { v:vce, i:ic, p:Math.max(0, vce * ic) + vak * s.iled, iled:s.iled };
      return;
    }
    if (d.kind === 'dac') {
      const vee = V(3);
      let fr = 0;
      if (vee < vg - 3) for (let b = 0; b < 8; b++) if (V(5 + b) - vg > 1.4) fr += Math.pow(2, -(b + 1));
      s.frac = fr; s.code = Math.round(fr * 256);
      const i14 = e.ix[13], i15 = e.ix[14], v14 = i14 < 0 ? 0 : X[i14], v15 = i15 < 0 ? 0 : X[i15];
      s.iref = v14 - v15; s.io = s.iref * fr;
      return;
    }
    if (d.kind === 'tl494') {
      const v = k => V(k) - vg, irt = Math.max(0, 3.6 - v(6));
      s.ict = irt * 3.3 / 3.6;
      const v5 = v(5);
      if (!s.dis && v5 >= 3.0) { s.dis = true; if (s.tlast !== undefined) { const T = s.t - s.tlast; if (T > 0) s.fest = 1 / T; } s.tlast = s.t; }
      else if (s.dis && v5 <= 0.08) { s.dis = false; s.ff = s.ff ? 0 : 1; }
      const on = !s.dis && v5 > v(3) - 0.7 && v5 > v(4) + 0.12, pp = v(13) > 2.5;
      s.q1 = on && (!pp || !s.ff) ? 1 : 0; s.q2 = on && (!pp || s.ff) ? 1 : 0;
      s.duty = (s.duty || 0) * 0.995 + 0.005 * (on ? 1 : 0); s.vref = v(14); s.vfb = v(3);
      return;
    }
    if (d.kind === 'adc') {
      if (!s.out) { s.out = {}; s.lin = {}; s.intr = 0; s.code = 0; }
      const th = vs * 0.5, lv = k => V(k) - vg > th ? 1 : 0;
      const cs = !lv(1), rd = !lv(2), wr = lv(3);
      if (cs && !wr) { s.busy = false; s.intr = 1; s.armed = true; }
      if (cs && wr && s.pwr === 0 && s.armed) { s.busy = true; s.tc = 0; s.armed = false; }
      s.pwr = wr;
      if (s.busy) {
        s.tc += h;
        if (s.tc >= 1e-4) {
          const v9 = V(9) - vg, span = v9 > 0.25 ? 2 * v9 : vs, vin = V(6) - V(7);
          s.code = Math.max(0, Math.min(255, Math.floor(vin / span * 256 + 0.5))); s.vin = vin; s.span = span;
          s.busy = false; s.intr = 0; s.conv = (s.conv || 0) + 1;
        }
      }
      const en = cs && rd;
      for (let b = 0; b < 8; b++) s.out[18 - b] = en ? (s.code >> b) & 1 : null;
      s.out[5] = s.intr;
      return;
    }
    if (!s.out) { s.out = {}; s.lin = {}; }
    const hy = vs * (d.hyst || f.hyst || 0.06), th = d.fam === 'ttl' ? 1.4 : vs * 0.5;
    const Lg = k => { const v = V(k) - vg, prev = s.lin[k] || 0, r = v > th + hy ? 1 : v < th - hy ? 0 : prev; s.lin[k] = r; return r; };
    if (d.kind === 'drv') {
      const fr = k => { const m = this.pwmNode[this.netOf(e.ix[k - 1])]; return m ? m.duty : (V(k) - vg > f.thr ? 1 : 0); };
      d.chans.forEach(ch => { const a = fr(ch[0]); if (d.oc) s.out[ch[1]] = [0, a]; else { const en = fr(ch[2]); s.out[ch[1]] = [en * a, 1 - en * a]; } });
      return;
    }
    icLogic(d, Lg, s, k => V(k) - vg);
  }

  step(h) {
    const n = this.n, els = this.els, t = this.time + h;
    if (this.noSource || this.error) { this.time += h; return; }
    const G0 = this.G0, B0 = this.B0, nl = this.nl;
    G0.fill(0); B0.fill(0); nl.length = 0; this.pwmNode = {};
    for (let k = 0; k < els.length; k++) {
      const e = els[k], s = e.s, c = e.c;
      switch (e.type) {
        case 'R': if (!s.failed) sG(G0, n, e.ia, e.ib, 1 / Math.max(c.p.R, 1e-3)); break;
        case 'RP': sG(G0, n, e.ia, e.ib, 1 / this.potR(e)); break;
        case 'W': if (!s.failed && e.ia !== e.ib) sG(G0, n, e.ia, e.ib, 1 / SPEC.W.Rw); break;
        case 'SW': if (swOn(e)) sG(G0, n, e.ia, e.ib, 1 / 0.05); break;
        case 'RLY': { const x = e.ix; if (c.p.low) sG(G0, n, x[2], x[0], 1 / 10000); else sG(G0, n, x[2], x[1], 1 / 10000); sG(G0, n, x[0], x[1], s.on ? 1 / (c.p.coil == 12 ? 400 : 70) : 1 / 20000); break; }
        case 'C': if (!s.failed) { const geq = c.p.C / h; e.geq = geq; sG(G0, n, e.ia, e.ib, geq); sI(B0, e.ia, e.ib, -geq * s.vprev); } break;
        case 'SCOPE': for (const q of e.ix) sG(G0, n, q, -1, 1e-7); break;
        case 'L': { const kl = c.p.L / h, geq = 1 / (Math.max(c.p.R, 1e-3) + kl); e.geq = geq; e.ieq = kl * (s.iL || 0) * geq; if (!s.failed) { sG(G0, n, e.ia, e.ib, geq); sI(B0, e.ia, e.ib, e.ieq); } break; }
        case 'G': {
          const vs = genValue(c.p, t); e.vs = vs;
          if (c.p.on !== false) { const g = 1 / SPEC.G.Rout; sG(G0, n, e.ia, e.ib, g); sI(B0, e.ib, e.ia, vs * g); }
          else sG(G0, n, e.ia, e.ib, 1e-6);
          break;
        }
        case 'IC': if (!s.failed) this.stampIC(e, G0, n, B0); break;
        case 'LINK': sG(G0, n, e.ia, e.ib, 100); break;
        case 'XF': { const on = c.p.on !== false, vs = on ? Math.SQRT2 * (+c.p.V || 12) * Math.sin(2 * Math.PI * (+c.p.f || 60) * t + e.ph) : 0; e.vs = vs; const g = 1 / 0.6; sG(G0, n, e.ia, e.ib, g); sI(B0, e.ib, e.ia, vs * g); sG(G0, n, e.ib, -1, 1e-9); break; }
        case 'MOT': { const m = e.m, g = 1 / m.R; e.emf = m.ke * (s.w || 0); if (!s.failed) { sG(G0, n, e.ia, e.ib, g); sI(B0, e.ib, e.ia, e.emf * g); } break; }
        case 'STEP':
          if (e.bip) { sG(G0, n, e.ix[0], e.ix[1], 1 / 30); sG(G0, n, e.ix[2], e.ix[3], 1 / 30); }
          else for (let q = 0; q < 4; q++) sG(G0, n, e.ix[q], e.ix[4], 1 / 50);
          break;
        case 'ULNM': {
          const x = e.ix, dd = s.d || [0, 0, 0, 0];
          sG(G0, n, x[10], x[5], 100);
          for (let q = 0; q < 4; q++) { sG(G0, n, x[q], x[4], 1 / 2700); if (dd[q] > 0) sG(G0, n, x[6 + q], x[4], dd[q] / 6); sG(G0, n, x[10], x[6 + q], 1 / 1500); }
          break;
        }
        case 'L298': {
          const x = e.ix, g = 1 / 1.5, w = s.w4 || [[0, 0], [0, 0], [0, 0], [0, 0]];
          for (let q = 0; q < 6; q++) sG(G0, n, x[q], x[11], 1e-4);
          sG(G0, n, x[10], x[11], 1 / 20000);
          if (s.pw) for (let q = 0; q < 4; q++) sAvg(G0, n, x[6 + q], x[10], x[11], g, w[q][0]);
          break;
        }
        case 'SERVO': if (!s.failed) { sG(G0, n, e.ix[1], e.ix[0], s.moving ? 1 / 33 : 1 / 400); sG(G0, n, e.ix[2], e.ix[0], 1e-5); } break;
        case 'LCD': {
          const x = e.ix;
          if (e.i2c) { sG(G0, n, x[1], x[0], 1 / 220); sG(G0, n, x[2], x[1], 1e-4); sG(G0, n, x[3], x[1], 1e-4); }
          else { sG(G0, n, x[1], x[0], 1 / 5000); sG(G0, n, x[2], x[0], 1e-5); for (let q = 3; q <= 13; q++) sG(G0, n, x[q], x[0], 1e-7); sG(G0, n, x[14], x[15], 1 / 150); }
          break;
        }
        case 'MCU': this.stampMcu(e, G0, B0, n, t); break;
        case 'TCRT': {
          const x = e.ix; sG(G0, n, x[0], x[1], 1 / 250);
          for (let q = 0; q < 2; q++) {
            const blk = s.pw && s.blk && s.blk[q];
            if (s.pw && blk) sG(G0, n, x[2 + q], x[0], 1 / 10000); else if (s.pw) sG(G0, n, x[2 + q], x[1], 1 / 30); else sG(G0, n, x[2 + q], x[1], 1e-6);
            const fr = s.pw ? (blk ? 0.85 : 0.18) : 0; sG(G0, n, x[4 + q], x[1], 1 / 1000); sI(B0, x[1], x[4 + q], fr * (s.vs || 0) / 1000);
          }
          break;
        }
        case 'DMM': {
          const x = e.ix, p = c.p, on = p.on !== false, mode = on ? p.mode || 'vdc' : 'off';
          /* el borne de 10 A siempre está unido a COM por el shunt (como en el UT53 real); el de mA solo en la escala mA */
          sG(G0, n, x[3], x[0], s.fuseA ? 1e-12 : 1 / 0.01);
          sG(G0, n, x[2], x[0], mode === 'ma' && !s.fuseMA ? 1 / 1 : 1e-12);
          if (mode === 'vdc' || mode === 'vac') sG(G0, n, x[1], x[0], 1e-7);
          else if (mode === 'ohm' || mode === 'cont' || mode === 'diode' || mode === 'cap') {
            const Rs = mode === 'diode' ? 3000 : mode === 'cap' ? (s.capRs || 10000) : 10000, Vs = mode === 'cap' && s.capPh === 'dis' ? 0 : 3;
            if (mode === 'cap' && s.capPh === 'dis') sG(G0, n, x[1], x[0], 1 / 10);
            else { sG(G0, n, x[1], x[0], 1 / Rs); sI(B0, x[0], x[1], Vs / Rs); }
          } else sG(G0, n, x[1], x[0], 1e-12);
          break;
        }
        case 'LPROBE': {
          /* la punta se polariza a un nivel intermedio (1,4 V en TTL, VDD/2 en CMOS) por 1 MΩ: si queda al aire no enciende HI ni LO */
          const x = e.ix, vs = s.vs || 0, pw = vs > 4.0, vb = !pw ? 0 : c.p.fam === 'cmos' ? vs / 2 : 1.4;
          sG(G0, n, x[0], x[2], 1e-6); if (vb) sI(B0, x[2], x[0], vb * 1e-6);
          sG(G0, n, x[1], x[2], 1 / 600);
          break;
        }
        case 'OLED': { const x = e.ix; sG(G0, n, x[1], x[0], 1 / 2000); sG(G0, n, x[2], x[1], 1 / 10000); sG(G0, n, x[3], x[1], 1 / 10000); break; }
        case 'HCSR': { const x = e.ix; sG(G0, n, x[0], x[3], 1 / 330); sG(G0, n, x[1], x[3], 1e-6); sG(G0, n, x[2], s.echo ? x[0] : x[3], s.pw ? 1 / 100 : 1e-6); break; }
        case 'MPU': { const x = e.ix; sG(G0, n, x[0], x[1], 1 / 1300); sG(G0, n, x[2], x[0], 1 / 4700); sG(G0, n, x[3], x[0], 1 / 4700); break; }
        case 'D': case 'Q': case 'MOS': if (!s.failed) nl.push(e); break;
        case 'V': case 'OA': case 'REG': e.swc = 0; nl.push(e); break;
      }
    }
    for (let i = 0; i < n; i++) G0[i * n + i] += 1e-9;
    const G = this.G, B = this.B, X = this.X;
    let iters = 0, ok = true;
    const maxIt = nl.length ? 60 : 1;
    for (let it = 0; it < maxIt; it++) {
      G.set(G0); B.set(B0);
      for (let k = 0; k < nl.length; k++) this.stampNL(nl[k], G, B, n, h);
      ok = solveDense(G, B, n, X);
      iters++;
      if (!ok || !nl.length) break;
      let conv = true;
      for (let k = 0; k < nl.length; k++) if (!this.updateNL(nl[k], X)) conv = false;
      if (conv) break;
    }
    this.nrIters = iters;
    if (!ok) { this.error = 'matriz singular'; return; }
    for (let i = 0; i < n; i++) { if (!isFinite(X[i])) { this.error = 'resultado no numérico'; return; } this.v[i] = X[i]; }
    const V = i => i < 0 ? 0 : X[i];
    for (let k = 0; k < els.length; k++) {
      const e = els[k], s = e.s, c = e.c;
      if (e.type === 'IC') continue;
      const vab = V(e.ia) - V(e.ib);
      let i = 0, pw = 0;
      switch (e.type) {
        case 'R': if (!s.failed) { i = vab / Math.max(c.p.R, 1e-3); pw = vab * i; } break;
        case 'RP': i = vab / this.potR(e); pw = vab * i; break;
        case 'W': if (!s.failed) { i = e.ia === e.ib ? 0 : vab / SPEC.W.Rw; pw = i * i * SPEC.W.Rw; } break;
        case 'SW': i = swOn(e) ? vab / 0.05 : 0; pw = i * vab; break;
        case 'C': if (!s.failed) { i = e.geq * vab - e.geq * s.vprev; pw = vab * i; s.vprev = vab; if (e.polar) this.checkCap(e, vab, h); } break;
        case 'V': {
          const q = srcP(e);
          if (q.on !== false) i = s.mode === 'CC' ? q.I - vab * 1e-4 : (q.V - vab) / SPEC.V.Rint;
          pw = vab * i; break;
        }
        case 'LINK': case 'STEP': case 'SERVO': case 'LCD': case 'MCU': case 'TCRT': case 'HCSR': case 'MPU': case 'RLY': case 'OLED': case 'DMM': case 'LPROBE': continue;
        case 'L': if (!s.failed) { i = e.geq * vab + e.ieq; s.iL = i; pw = i * i * Math.max(c.p.R, 1e-3); } break;
        case 'MOT': {
          const m = e.m; i = s.failed ? 0 : (vab - e.emf) / m.R; e.icur = i;
          this.res[e.id] = { v:vab, i, p:vab * i, rpm:(s.w || 0) * 60 / (2 * Math.PI) };
          s.pAcc += i * i * m.R * h;
          continue;
        }
        case 'G': i = c.p.on !== false ? (e.vs - vab) / SPEC.G.Rout : 0; pw = vab * i; break;
        case 'XF': i = ((e.vs || 0) - vab) / 0.6; pw = vab * i; break;
        case 'MOS': {
          const vgs = V(e.ix[1]) - V(e.ix[2]), vds = V(e.ix[0]) - V(e.ix[2]), sw = vds < 0, r = s.failed ? { id:0 } : mosId(e.m, sw ? vgs - vds : vgs, Math.abs(vds)), id = sw ? -r.id : r.id, P = Math.max(0, vds * id);
          this.res[e.id] = { v:vds, i:id, vgs, p:P }; s.pAcc += P * h;
          continue;
        }
        case 'Q': {
          const m = e.m, nvt = m.n * VT, pol = e.pol || 1, vbe = pol * (V(e.ix[1]) - V(e.ix[2])), vbc = pol * (V(e.ix[1]) - V(e.ix[0]));
          const ef = Math.exp(Math.min(vbe / nvt, 60)), er = Math.exp(Math.min(vbc / nvt, 60));
          const Ic = s.failed ? 0 : m.Is * (ef - er) - m.Is / m.br * (er - 1), Ib = s.failed ? 0 : m.Is / m.bf * (ef - 1) + m.Is / m.br * (er - 1);
          const vce = pol * (V(e.ix[0]) - V(e.ix[2])), P = Math.max(0, vce * Ic + vbe * Ib);
          this.res[e.id] = { v:vce, i:Ic, ib:Ib, vbe, p:P }; s.pAcc += P * h;
          continue;
        }
        case 'D':
          if (!s.failed) {
            i = e.gd * vab + e.ieq; pw = Math.max(0, vab * i);
            if (e.led) { if (vab < -5) { s.rev += h; if (s.rev > 0.3) this.fail(e, 'quemado'); } else s.rev = Math.max(0, s.rev - h); }
          }
          break;
        case 'OA': {
          const f = FAM[e.d.fam], g = 1 / f.rout, vo = V(e.ix[2]), vg = V(e.ix[4]);
          const reg = s.reg || 'lo'; s.from = null;
          const tgt = reg === 'hi' ? V(e.ix[3]) - f.dhi : reg === 'lo' ? vg + f.dlo : vg + 1e5 * (V(e.ix[0]) - V(e.ix[1]) + OA_VOS);
          i = e.parent.s.failed ? 0 : g * (tgt - vo);
          this.res[e.id] = { v:vo - vg, i, p:0 };
          continue;
        }
        case 'REG': {
          const g = 1 / SPEC.REG.Rout, vin = V(e.ix[0]), vg = V(e.ix[1]), vo = V(e.ix[2]);
          const reg = s.tsd || s.failed ? 'off' : (s.reg || 'reg');
          const sg = e.sg || 1, vr = e.vr === undefined ? 5 : e.vr, I = reg === 'off' ? 0 : reg === 'reg' ? g * (vg + vr - vo) : g * (vin - sg * 2 - vo);
          pw = Math.max(0, (vin - vo) * I);
          this.res[e.id] = { v:vo - vg, vin:vin - vg, i:I, p:pw };
          s.pAcc += pw * h;
          continue;
        }
        case 'SCOPE': this.res[e.id] = { v:V(e.ia), v2:V(e.ib), v3:e.ix.length > 2 ? V(e.ix[2]) : 0, v4:e.ix.length > 3 ? V(e.ix[3]) : 0, i:0, p:0 }; continue;
      }
      this.res[e.id] = { v:vab, i, p:pw };
      s.pAcc += Math.max(pw, 0) * h; s.i2Acc += i * i * h;
    }
    for (let k = 0; k < els.length; k++) if (els[k].type === 'IC') this.icPost(els[k], h);
    for (let k = 0; k < els.length; k++) {
      const e = els[k];
      switch (e.type) {
        case 'MOT': this.motPost(e, h); break;
        case 'STEP': this.stepPost(e, h); break;
        case 'SERVO': this.servoPost(e, h, t); break;
        case 'RLY': this.rlyPost(e); break;
        case 'DMM': this.dmmPost(e, h, t); break;
        case 'LPROBE': this.lprobePost(e, h, t); break;
        case 'OLED': { const x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i], vs = V(x[1]) - V(x[0]); e.s.pw = vs > 2.8; if (!e.s.pw) { e.s.fb = null; e.s.txt = null; } this.res[e.id] = { v:vs, i:vs / 2000, p:vs * vs / 2000 }; break; }
        case 'V': if (e.sense) { const x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i]; e.s.pwOk = V(x[2]) - V(x[1]) > 3.5; } break;
        case 'REG': this.regCheck(e, h); break;
        case 'LCD': this.lcdPost(e); break;
        case 'ULNM': {
          const s = e.s, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i], vg = V(x[4]);
          s.d = [0, 1, 2, 3].map(q => { const m = this.pwmNode[this.netOf(x[q])]; return m ? m.duty : (V(x[q]) - vg > 1.6 ? 1 : 0); });
          this.res[e.id] = { v:V(x[5]) - vg, i:0, p:0 };
          break;
        }
        case 'L298': {
          const s = e.s, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i], vg = V(x[11]), p = e.c.p;
          s.v12 = V(x[10]) - vg; s.v5 = V(x[12]) - vg; s.pw = s.v5 > 4.5 || (p.reg5 !== false && s.v12 > 7);
          const fr = q => { const m = this.pwmNode[this.netOf(x[q])]; return m ? m.duty : (V(x[q]) - vg > 2.3 ? 1 : 0); };
          const ea = p.ena !== false ? 1 : fr(4), eb = p.enb !== false ? 1 : fr(5);
          s.w4 = [0, 1, 2, 3].map(q => { const a = fr(q), en = q < 2 ? ea : eb; return [en * a, 1 - en * a]; });
          this.res[e.id] = { v:s.v12, i:0, p:0 };
          break;
        }
      }
    }
    this.roboStep(h);
    for (let k = 0; k < els.length; k++) { const ty = els[k].type; if (ty === 'TCRT' || ty === 'HCSR' || ty === 'MPU') this.sensPost(els[k], h, t); }
    for (let k = 0; k < els.length; k++) if (els[k].type === 'MCU') this.mcuPost(els[k], h, t);
    for (let k = 0; k < els.length; k++) {
      const e = els[k];
      if (e.type !== 'SCOPE' || e.c.p.run === false) continue;
      const b = this.scopeBuf(e.id);
      if (++b.kc < b.k) continue;
      b.kc = 0;
      b.t[b.head] = t; b.a[b.head] = V(e.ia); b.b[b.head] = V(e.ib); if (e.ix.length > 2) { b.c[b.head] = V(e.ix[2]); b.d[b.head] = V(e.ix[3]); }
      b.head = (b.head + 1) % b.N; if (b.count < b.N) b.count++;
    }
    this.time += h;
  }
  compileMcu(c, pk, add, termKey) {
    const isA = c.type === 'arduino', d = isA ? UNO : MCU[c.p.chip];
    const ks = isA ? UNO_IO.map(p => termKey(c.id, p)) : d.names.map((_, i) => pk[String(i + 1)]);
    add({ id:c.id, type:'MCU', ks, isA, d });
    if (isA) {
      add({ id:c.id + '/5V', type:'V', vset:5, ilim:0.5, ks:[termKey(c.id, '5V'), GND] });
      add({ id:c.id + '/3V3', type:'V', vset:3.3, ilim:0.15, ks:[termKey(c.id, '3V3'), GND] });
      return true;
    }
    if (d.self) {
      d.gnds.forEach(g => add({ id:c.id + '/g' + g, type:'LINK', ks:[pk[String(g)], GND] }));
      add({ id:c.id + '/3V3', type:'V', vset:3.3, ilim:0.5, ks:[pk[String(d.p3v3)], GND] });
      add({ id:c.id + '/VIN', type:'V', vset:5, ilim:0.5, ks:[pk[String(d.pvin)], GND] });
      return true;
    }
    d.vdd.slice(1).forEach(p => add({ id:c.id + '/dd' + p, type:'LINK', ks:[pk[String(d.vdd[0])], pk[String(p)]] }));
    d.vss.slice(1).forEach(p => add({ id:c.id + '/ss' + p, type:'LINK', ks:[pk[String(d.vss[0])], pk[String(p)]] }));
    return false;
  }
  stampMcu(e, G, B, n) {
    const s = e.s, d = e.d, io = s.io || [], x = e.ix;
    if (s.failed) return;
    if (d.self) {
      const VL = d.vlogic;
      if (d.en) { sG(G, n, x[d.en - 1], -1, 1e-5); sI(B, -1, x[d.en - 1], 1e-5 * VL); }
      for (let k = 0; k < x.length; k++) {
        const o = io[k]; if (!o || o.dead || x[k] === undefined) continue;
        if (o.m === 'out') { const g = 1 / d.rout; sG(G, n, x[k], -1, g); sI(B, -1, x[k], g * o.v * VL); this.pwmNode[this.netOf(x[k])] = { duty:o.v, pw:o.pw, freq:o.freq || 0, tEnd:o.toneEnd || 0 }; }
        else if (o.m === 'pu') { const g = 1 / d.pullup; sG(G, n, x[k], -1, g); sI(B, -1, x[k], g * VL); }
      }
      return;
    }
    const vdd = x[d.vdd[0] - 1], vss = x[d.vss[0] - 1];
    sG(G, n, vdd, vss, 1 / 5000);
    if (d.mclr) sG(G, n, x[d.mclr - 1], vdd, 1e-6);
    if (!s.on) return;
    for (let k = 0; k < x.length; k++) {
      const o = io[k]; if (!o || o.dead) continue;
      if (o.m === 'out') { const g = 1 / d.rout; sAvg(G, n, x[k], vdd, vss, g, o.v); this.pwmNode[this.netOf(x[k])] = { duty:o.v, pw:o.pw, freq:o.freq || 0, tEnd:o.toneEnd || 0 }; }
      else if (o.m === 'pu') sG(G, n, x[k], vdd, 1 / d.pullup);
    }
  }
  mcuPost(e, h) {
    const s = e.s, d = e.d, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i];
    if (s.failed) return;
    let on, vlo = 0, vs;
    if (d.self) { vs = d.vlogic; on = !d.en || V(x[d.en - 1]) > 1.5; }
    else {
      vlo = V(x[d.vss[0] - 1]); vs = V(x[d.vdd[0] - 1]) - vlo;
      if (vs > d.vabs) s.over += h; else s.over = Math.max(0, s.over - h);
      if (vs < -0.6) s.rev += h; else s.rev = Math.max(0, s.rev - h);
      s.damage = Math.min(1, Math.max(s.over, s.rev) / 0.25);
      if (s.damage >= 1) { this.fail(e, 'quemado', { vs }); return; }
      on = vs > d.vmin * 0.9 && (!d.mclr || V(x[d.mclr - 1]) - vlo > vs * 0.7);
    }
    s.vlo = vlo; s.vs = vs;
    if (!on) { if (s.on !== false) { s.rt = null; s.io = []; } s.on = false; return; }
    if (!s.on) { s.on = true; s.rt = null; }
    const io = s.io || (s.io = []), g = 1 / d.rout, lim = d.vabsPin || (vs + 0.6);
    s.pd = s.pd || {};
    for (let k = 0; k < x.length; k++) {
      const o = io[k]; if (!o || o.dead || x[k] === undefined) continue;
      const vp = V(x[k]) - vlo;
      let bad = '', amount = 0;
      if (o.m === 'out') { const i = g * o.v * (vs - vp) - g * (1 - o.v) * vp; if (Math.abs(i) > d.imax * 1.6) { bad = 'corriente'; amount = i; } }
      else if (vp > lim || vp < -0.7) { bad = 'voltaje'; amount = vp; }
      if (bad) s.pd[k] = (s.pd[k] || 0) + h; else if (s.pd[k]) s.pd[k] = Math.max(0, s.pd[k] - h);
      if (s.pd[k] > 0.4) {
        o.dead = true; o.m = 'in';
        const nm = e.isA ? UNO_IO[k] : d.names[k];
        if (this.onFail) this.onFail({ id:e.id, kind:'PIN', pin:nm, why:bad, amount, imax:d.imax, lim });
      }
    }
    if (!s.rt) s.rt = makeRuntime(e, this);
    s.rt.run();
  }
  roboStep(h) {
    const cfg = this.project && this.project.robo;
    if (!cfg || !cfg.mode) { this.rb = null; return; }
    if (!this.rb || this.rb.mode !== cfg.mode || (cfg.mode === 'line' && this.rb.track !== (cfg.track || 'ovalo'))) {
      this.rb = roboDefaults(cfg.mode);
      if (cfg.mode === 'line' && cfg.track && TRACKS[cfg.track]) { const pts = TRACKS[cfg.track], a = pts[0], b = pts[1]; Object.assign(this.rb, { track:cfg.track, x:a[0], y:a[1], h:Math.atan2(b[1] - a[1], b[0] - a[0]) }); }
    }
    const rb = this.rb, mots = this.els.filter(e => e.type === 'MOT').sort((a, b) => a.c.name.localeCompare(b.c.name, 'es', { numeric:true }));
    const sideOf = e => e.side || e.c.slot;
    const mL = mots.find(e => sideOf(e) === 'motorL') || mots[0], mR = mots.find(e => sideOf(e) === 'motorR') || mots.find(e => e !== mL);
    const wl = mL ? mL.s.w || 0 : 0, wr = mR ? mR.s.w || 0 : wl;
    if (rb.mode === 'line' || rb.mode === 'avoid') {
      if (rb.drag) return;
      const v = ROBO.r * (wl + wr) / 2, om = ROBO.r * (wr - wl) / ROBO.L;
      let nx = rb.x + v * Math.cos(rb.h) * h, ny = rb.y + v * Math.sin(rb.h) * h;
      const nh = rb.h + om * h;
      if (rb.mode === 'avoid') {
        const [bx, by] = ROBO.box, R = 0.07;
        const free = (x, y) => !(Math.abs(x) > bx - R || Math.abs(y) > by - R || rb.obs.some(o => Math.hypot(x - o.x, y - o.y) < o.r + R));
        rb.bump = !free(nx, ny);
        if (rb.bump) { if (free(nx, rb.y)) ny = rb.y; else if (free(rb.x, ny)) nx = rb.x; else { nx = rb.x; ny = rb.y; } }
        const sx = nx + 0.07 * Math.cos(nh), sy = ny + 0.07 * Math.sin(nh);
        let d = 4;
        [-0.35, -0.18, 0, 0.18, 0.35].forEach(da => { const dx = Math.cos(nh + da), dy = Math.sin(nh + da); d = Math.min(d, rayBox(sx, sy, dx, dy)); rb.obs.forEach(o => { d = Math.min(d, rayCircle(sx, sy, dx, dy, o)); }); });
        rb.dist = Math.max(0.02, d);
      } else {
        const pts = TRACKS[rb.track] || TRACKS.ovalo, c = Math.cos(nh), s = Math.sin(nh);
        rb.sens = [1, -1].map(k => { const sx = nx + ROBO.sensF * c - k * ROBO.sensY * s, sy = ny + ROBO.sensF * s + k * ROBO.sensY * c; return distToPath(pts, sx, sy) < ROBO.lineW / 2 ? 1 : 0; });
        rb.off = distToPath(pts, nx, ny) > 0.25;
      }
      rb.x = nx; rb.y = ny; rb.h = nh; rb.v = v;
      if (Math.abs(rb.x) > 0.74 || Math.abs(rb.y) > 0.32) { rb.x = Math.max(-0.74, Math.min(0.74, rb.x)); rb.y = Math.max(-0.32, Math.min(0.32, rb.y)); rb.bump = true; }
    } else if (rb.mode === 'bal') {
      const v = ROBO.r * (wl + wr) / 2, aRaw = (v - rb.v) / Math.max(h, 1e-6);
      rb.a = rb.a + (aRaw - rb.a) * Math.min(1, h / 0.004);
      rb.v = v; rb.x += v * h;
      if (!rb.fallen) {
        const l = 0.16, g = 9.81;
        const al = (g * Math.sin(rb.th) - rb.a * Math.cos(rb.th)) / l - 0.6 * rb.om;
        rb.om += al * h; rb.th += rb.om * h;
        if (Math.abs(rb.th) > 0.8) { rb.fallen = true; rb.th = Math.sign(rb.th) * 0.8; rb.om = 0; }
      }
    } else if (rb.mode === 'arm') {
      const allSv = this.els.filter(e => e.type === 'SERVO'), own = allSv.filter(e => e.armIdx !== undefined).sort((a, b) => a.armIdx - b.armIdx);
      const ownLive = own.some(e => (this.res[e.id] || {}).v > 3 || e.s.pw);
      const sv = ownLive || allSv.length === own.length ? own : allSv.filter(e => e.armIdx === undefined).sort((a, b) => a.c.name.localeCompare(b.c.name, 'es', { numeric:true }));
      const ang = k => sv[k] && sv[k].s.ang !== undefined ? sv[k].s.ang : 90;
      const yaw = (ang(0) - 90) * Math.PI / 180, sh = ang(1) * Math.PI / 180, el = sh + (ang(2) - 180) * Math.PI / 180, grip = sv[3] ? ang(3) : 90;
      const L1 = 0.11, L2 = 0.11, H0 = 0.07, rr = L1 * Math.cos(sh) + L2 * Math.cos(el), zz = H0 + L1 * Math.sin(sh) + L2 * Math.sin(el);
      rb.tip = { x:rr * Math.cos(yaw), y:rr * Math.sin(yaw), z:zz, r:rr, yaw, sh, el, grip };
      const o = rb.obj;
      if (!o.held && grip < 40 && rb.prevGrip >= 40 && Math.hypot(rb.tip.x - o.x, rb.tip.y - o.y) < 0.035 && rb.tip.z < 0.05) o.held = true;
      if (o.held && grip > 60) { o.held = false; o.z = 0; rb.ok = Math.hypot(o.x - rb.goal.x, o.y - rb.goal.y) < 0.04; }
      if (o.held) { o.x = rb.tip.x; o.y = rb.tip.y; o.z = Math.max(0, rb.tip.z - 0.02); }
      rb.prevGrip = grip;
    }
  }
  sensPost(e, h, t) {
    const s = e.s, c = e.c, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i];
    const rb = this.rb;
    if (e.type === 'TCRT') {
      s.vs = V(x[0]) - V(x[1]); s.pw = s.vs > 3;
      if (c.p.auto !== false && rb && rb.mode === 'line') s.blk = rb.sens.slice();
      else { const ln = c.p.line; s.blk = [-14, 14].map(px => ln === null || ln === undefined || ln === '' ? 0 : Math.abs(ln - px) < 9 ? 1 : 0); }
    } else if (e.type === 'HCSR') {
      s.vs = V(x[0]) - V(x[3]); s.pw = s.vs > 4;
      s.dist = c.p.auto !== false && rb && rb.mode === 'avoid' ? rb.dist * 100 : (c.p.dist || 50);
      const trig = V(x[1]) - V(x[3]) > 2.5;
      if (s.tH && !trig && s.pw) { s.e0 = t + 4e-4; s.e1 = s.e0 + hcsrDur(s.dist) * 1e-6; }
      s.tH = trig; s.echo = s.pw && s.e0 !== undefined && t >= s.e0 && t < s.e1;
    } else if (e.type === 'MPU') {
      s.vs = V(x[0]) - V(x[1]);
      if (!s.pw && s.vs > 2.4) { s.sleep = true; s.reg = {}; s.ptr = 0; }
      s.pw = s.vs > 2.4;
      const auto = c.p.auto !== false && rb && rb.mode === 'bal';
      const p = auto ? rb.th * 180 / Math.PI : (+c.p.pitch || 0);
      s.rate = auto ? rb.om * 180 / Math.PI : (p - (s.pitch || 0)) / Math.max(h, 1e-6) * 0 ;
      s.pitch = p;
    }
  }
  motPost(e, h) {
    const s = e.s, m = e.m, i = s.failed ? 0 : (e.icur || 0), w = s.w || 0;
    if (s.ext !== undefined && !s.failed) { const wt = s.ext * m.ke * m.rated / (m.R * m.b + m.ke * m.ke); s.w = w + (wt - w) * Math.min(1, h * 25); s.ang = ((s.ang || 0) + s.w * h) % 6283.185307179586; return; }
    s.w = w + h * (m.ke * i - m.b * w) / m.j;
    if (!isFinite(s.w)) s.w = 0;
    s.ang = ((s.ang || 0) + s.w * h) % 6283.185307179586;
  }
  stepPost(e, h) {
    const s = e.s, x = e.ix, V = i => i < 0 ? 0 : this.v[i];
    let cx, cy, tot, rated;
    if (e.bip) { const a = (V(x[0]) - V(x[1])) / 30, b = (V(x[2]) - V(x[3])) / 30; cx = a; cy = b; tot = Math.abs(a) + Math.abs(b); rated = 0.4; }
    else {
      const cm = V(x[4]), ia = (cm - V(x[0])) / 50, ib = (cm - V(x[1])) / 50, ic = (cm - V(x[2])) / 50, id = (cm - V(x[3])) / 50;
      cx = ia - ic; cy = ib - id; tot = Math.abs(ia) + Math.abs(ib) + Math.abs(ic) + Math.abs(id); rated = 0.1;
    }
    const mag = Math.hypot(cx, cy);
    s.th = s.th || 0;
    if (mag > rated * 0.3) {
      let dl = Math.atan2(cy, cx) - s.th;
      dl = ((dl + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      if (Math.abs(dl) < 2.6) { const vm = (e.bip ? 1000 : 600) * Math.PI / 2 * h; s.th += Math.max(-vm, Math.min(vm, dl)); }
    }
    s.deg = s.th * 180 / Math.PI / (e.bip ? 50 : 512);
    this.res[e.id] = { v:mag, i:tot, p:0, deg:s.deg };
  }
  servoPost(e, h, t) {
    const s = e.s, x = e.ix, V = i => i < 0 ? 0 : this.v[i], ig = x[0], iv = x[1], isg = x[2];
    const vs = V(iv) - V(ig);
    if (s.ang === undefined) s.ang = 90;
    if (vs > 7.5) { s.over += h; if (s.over > 0.3) this.fail(e, 'quemado', { vs }); } else s.over = Math.max(0, s.over - h);
    if (s.failed) { s.moving = false; this.res[e.id] = { v:vs, i:0, p:0, ang:s.ang }; return; }
    const meta = this.pwmNode[this.netOf(isg)];
    if (meta && meta.pw) { s.pw = meta.pw; s.lastP = t; }
    else {
      const v = V(isg) - V(ig), th = 1.4, pv = s.pv === undefined ? v : s.pv;
      if (pv < th && v >= th) s.tr = t - h + h * (th - pv) / ((v - pv) || 1);
      else if (pv >= th && v < th && s.tr !== undefined) { const w = t - h + h * (pv - th) / ((pv - v) || 1) - s.tr; if (w > 3e-4 && w < 3e-3) { s.pw = w; s.lastP = t; } }
      s.pv = v;
    }
    let tgt = s.ang;
    if (vs > 3.5 && s.pw && t - (s.lastP || 0) < 0.06) tgt = Math.max(0, Math.min(180, (s.pw - 5e-4) / 1.9e-3 * 180));
    if (s.ext !== undefined && vs > 3.5) tgt = s.ext;
    const dl = tgt - s.ang, mx = 600 * h * Math.min(1, Math.max(0, vs) / 4.8);
    s.ang += Math.max(-mx, Math.min(mx, dl));
    s.moving = Math.abs(dl) > 0.5 && vs > 3.5;
    this.res[e.id] = { v:vs, i:vs * (s.moving ? 1 / 33 : 1 / 400), p:0, ang:s.ang, pw:s.pw };
  }
  lcdPost(e) {
    const s = e.s, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i];
    if (e.i2c) {
      const vcc = V(x[1]) - V(x[0]);
      if (vcc < 3.5) { s.lcd = null; s.bl = 0; s.vcc = vcc; return; }
      if (!s.lcd) { s.lcd = lcdNew(); s.lcd.mode8 = false; }
      s.bl = s.lcd.blOff ? 0 : 1; s.contrast = 1; s.vcc = vcc;
      return;
    }
    const vss = V(x[0]), vdd = V(x[1]) - vss;
    s.vcc = vdd;
    s.bl = Math.max(0, Math.min(1, (V(x[14]) - V(x[15])) / 150 / 0.02));
    if (vdd < 3.5) { s.lcd = null; return; }
    if (!s.lcd) s.lcd = lcdNew();
    const L = s.lcd, hi = q => V(x[q]) - vss > vdd / 2;
    s.contrast = Math.max(0, Math.min(1, (vdd - (V(x[2]) - vss) - 2) / 1.5));
    const en = hi(5);
    if (L.pe && !en) {
      const rs = hi(3) ? 1 : 0; let hn = 0, ln = 0;
      for (let q = 0; q < 4; q++) { if (hi(10 + q)) hn |= 1 << q; if (hi(6 + q)) ln |= 1 << q; }
      if (L.mode8) lcdExec(L, rs, (hn << 4) | ln);
      else if (L.nib === null) L.nib = hn;
      else { const b = (L.nib << 4) | hn; L.nib = null; lcdExec(L, rs, b); }
    }
    L.pe = en ? 1 : 0;
  }
  resetMcu(id) { const s = this.st[id]; if (s) { s.rt = null; s.io = []; s.serial = []; s.line = ''; s.rx = []; s.tx = ''; s.serialRev = (s.serialRev || 0) + 1; } }
  potR(e) { const c = e.c, pos = e.posKey ? c.p[e.posKey] : c.p.pos, a = e.half ? 1 - pos : pos; return Math.max(c.p.R * a, 0.5); }
  /* relé: la bobina se energiza con VCC presente y la entrada activa (alto o bajo según el módulo) */
  rlyPost(e) {
    const s = e.s, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i], vg = V(x[1]), vcc = V(x[0]) - vg, vin = V(x[2]) - vg;
    const act = e.c.p.low ? vin < 1.5 : vin > 2.5, k12 = e.c.p.coil == 12, on = vcc > (k12 ? 8.4 : 3.5) && act, rc = k12 ? 400 : 70;
    if (on !== !!s.on) { s.on = on; s.clicks = (s.clicks || 0) + 1; }
    this.res[e.id] = { v:vcc, i:on ? vcc / rc : vcc / 20000, p:on ? vcc * vcc / rc : 0, on, vin, coil:k12 ? 12 : 5 };
  }
  /* LM7805: entrada invertida o por encima de 35 V lo destruye */
  regCheck(e, h) {
    const s = e.s; if (s.failed) return;
    const V = i => i === undefined || i < 0 ? 0 : this.v[i], vin = (e.sg || 1) * (V(e.ix[0]) - V(e.ix[1]));
    if (vin < -0.8 || vin > 35) { s.bad = (s.bad || 0) + h; if (s.bad > 0.25) this.fail(e, 'quemado', { vs:vin }); } else s.bad = Math.max(0, (s.bad || 0) - h);
  }
  checkCap(e, v, h) {
    const s = e.s, S = SPEC.C, vmax = e.c.p.Vmax;
    if (v > vmax * S.overFactor) s.over += h; else s.over = Math.max(0, s.over - h * 0.5);
    if (v < S.revV) s.rev += h; else s.rev = Math.max(0, s.rev - h * 0.5);
    s.damage = Math.min(1, Math.max(s.over / S.overTime, s.rev / S.revTime));
    if (s.damage >= 1) this.fail(e, 'explotó');
  }
  fail(e, tipo, extra) {
    const s = e.s;
    if (s.failed) return;
    if (this.project && this.project.protect) { if (s.protWarn) return; s.protWarn = true; const r0 = this.res[e.id]; if (this.onFail) this.onFail(Object.assign({ id:e.id, kind:e.type, led:!!e.led, tipo, i:r0 ? r0.i : 0, protegido:true }, extra || {})); return; }
    s.failed = true; s.damage = 1; s.tipo = tipo;
    if (e.type === 'C') s.vprev = 0;
    const r = this.res[e.id];
    if (this.onFail) this.onFail(Object.assign({ id:e.id, kind:e.type, led:!!e.led, tipo, i:r ? r.i : 0 }, extra || {}));
  }
  thermal(dt) {
    const els = this.els;
    for (let k = 0; k < els.length; k++) {
      const e = els[k], s = e.s;
      if (e.type === 'MOT') {
        const m = e.m, P = s.pAcc / dt; s.pAcc = 0; s.i2Acc = 0;
        const Tf = AMB + P * m.Rth;
        s.T = Tf + (s.T - Tf) * Math.exp(-dt / m.tau);
        if (!s.failed) { s.damage = Math.max(0, Math.min(1, (s.T - 90) / (m.Tmax - 90))); if (s.T >= m.Tmax) this.fail(e, 'quemado'); }
        continue;
      }
      if (e.type === 'REG') {
        const sp = SPEC.REG, P = s.pAcc / dt; s.pAcc = 0; s.i2Acc = 0;
        const Tf = AMB + P * sp.Rth;
        s.T = Tf + (s.T - Tf) * Math.exp(-dt / (sp.Rth * sp.Cth));
        if (!s.tsd && s.T >= sp.Ttrip) s.tsd = true; else if (s.tsd && s.T < sp.Treset) s.tsd = false;
        s.damage = Math.max(0, Math.min(1, (s.T - 90) / 60));
        continue;
      }
      if (e.type !== 'R' && e.type !== 'D' && e.type !== 'W' && e.type !== 'Q' && e.type !== 'MOS' && e.type !== 'L') { s.pAcc = 0; s.i2Acc = 0; continue; }
      const P = s.pAcc / dt, I2 = s.i2Acc / dt;
      s.pAcc = 0; s.i2Acc = 0;
      let Tf, tau, sp;
      if (e.type === 'W') { sp = SPEC.W; Tf = AMB + sp.dTr * I2 / (sp.Irated * sp.Irated); tau = sp.tau; }
      else { sp = e.type === 'D' || e.type === 'Q' || e.type === 'MOS' ? e.spec : e.type === 'L' ? SPEC.L : (e.spec || SPEC.R); Tf = AMB + P * sp.Rth; tau = sp.Rth * sp.Cth; }
      s.T = Tf + (s.T - Tf) * Math.exp(-dt / tau);
      if (!s.failed) {
        s.damage = Math.max(0, Math.min(1, (s.T - sp.Twarn) / (sp.Tmax - sp.Twarn)));
        if (s.T >= sp.Tmax) this.fail(e, e.type === 'R' ? 'quemada' : e.type === 'W' ? 'fundido' : 'quemado');
      }
    }
  }
  run(simDt) {
    this.computeH();
    this.acc += simDt;
    const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
    const t0 = now();
    let steps = 0;
    this.behind = false;
    while (this.acc >= this.H) {
      if ((steps & 15) === 0 && steps && now() - t0 > this.budget) { this.acc = 0; this.behind = true; break; }
      this.step(this.H); this.acc -= this.H; this.tacc += this.H; steps++;
      if (this.tacc >= 0.02) { this.thermal(this.tacc); this.tacc = 0; }
    }
    return steps;
  }
  dmmPost(e, h, t) {
    const s = e.s, c = e.c, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i], p = c.p, on = p.on !== false, mode = on ? p.mode || 'vdc' : 'off';
    const vV = V(x[1]) - V(x[0]), iA = s.fuseA ? 0 : (V(x[3]) - V(x[0])) / 0.01, iMA = mode === 'ma' && !s.fuseMA ? (V(x[2]) - V(x[0])) / 1 : 0;
    /* fusibles: 10 A del borne A (lento) y 200 mA del borne mA (rápido) */
    if (Math.abs(iA) > 10) { s.hotA = (s.hotA || 0) + h * (Math.abs(iA) > 20 ? 10 : 1); if (s.hotA > 0.5 && !s.fuseA) { s.fuseA = true; if (this.onFail) this.onFail({ id:e.id, kind:'DMM', tipo:'fusible', i:iA, why:'fusible de 10 A fundido' }); } } else s.hotA = Math.max(0, (s.hotA || 0) - h);
    if (Math.abs(iMA) > 0.25 && !s.fuseMA) { s.fuseMA = true; if (this.onFail) this.onFail({ id:e.id, kind:'DMM', tipo:'fusible', i:iMA, why:'fusible de 200 mA fundido' }); }
    if (s.mode !== mode) { s.mode = mode; s.n = 0; s.sum = 0; s.sq = 0; s.win = 0; s.capPh = 'dis'; s.capT = 0; s.read = null; s.disp = mode === 'off' ? '' : '----'; s.unit = ''; }
    const sig = mode === 'a' ? iA : mode === 'ma' ? iMA : vV;
    s.sum = (s.sum || 0) + sig * h; s.sq = (s.sq || 0) + sig * sig * h; s.win = (s.win || 0) + h;
    s.beep = false;
    if (mode === 'cont') s.beep = vV < 3 * 50 / 10050 && vV > -0.1;
    if (mode === 'cap') {
      /* capacímetro: descarga 50 ms, carga con 3 V por Rs y mide el tiempo hasta 63,2 % (τ = R·C) */
      s.capT = (s.capT || 0) + h;
      if (s.capPh === 'dis') { if (s.capT > 0.05 && Math.abs(vV) < 0.01) { s.capPh = 'chg'; s.capT = 0; } else if (s.capT > 0.6) { s.capPh = 'chg'; s.capT = 0; } }
      else if (vV >= 3 * 0.632) {
        const Rs = s.capRs || 10000, C = s.capT / Rs;
        if (s.capT < 0.002 && Rs < 1e6) s.capRs = 1e6; else if (s.capT > 1.5 && Rs > 10000) s.capRs = 10000;
        else { s.read = C; s.disp = fmtDmm(C, 'F'); s.unit = 'F'; }
        s.capPh = 'dis'; s.capT = 0;
      } else if (s.capT > 4) { s.read = null; s.disp = 'OL'; s.unit = 'F'; s.capPh = 'dis'; s.capT = 0; }
    }
    if (s.win >= 0.3 && mode !== 'cap') {
      const mean = s.sum / s.win, rms = Math.sqrt(Math.max(0, s.sq / s.win - mean * mean));
      if (mode === 'off') { s.read = null; s.disp = ''; }
      else if (mode === 'vdc') { s.read = mean; s.disp = Math.abs(mean) > 1000 ? 'OL' : fmtDmm(mean, 'V'); s.unit = 'V'; }
      else if (mode === 'vac') { s.read = rms; s.disp = rms > 750 ? 'OL' : fmtDmm(rms, 'V'); s.unit = 'V~'; }
      else if (mode === 'a') { s.read = mean; s.disp = s.fuseA ? 'FUSE' : Math.abs(mean) > 10 ? 'OL' : fmtDmm(mean, 'A'); s.unit = 'A'; }
      else if (mode === 'ma') { s.read = mean; s.disp = s.fuseMA ? 'FUSE' : Math.abs(mean) > 0.2 ? 'OL' : fmtDmm(mean, 'A'); s.unit = 'mA'; }
      else if (mode === 'ohm' || mode === 'cont') {
        const I = (3 - mean) / 10000, R = I > 1e-9 ? mean / I : Infinity;
        s.read = R > 2e7 || mean > 2.98 ? Infinity : Math.max(0, R); s.disp = s.read === Infinity ? 'OL' : fmtDmm(s.read, 'Ω'); s.unit = 'Ω';
      } else if (mode === 'diode') { s.read = mean; s.disp = mean > 2 ? 'OL' : fmtDmm(mean, 'V'); s.unit = 'V'; }
      s.sum = 0; s.sq = 0; s.win = 0;
    }
    this.res[e.id] = { v:vV, i:mode === 'a' ? iA : iMA, p:0, read:s.read, disp:s.disp, beep:s.beep };
  }
  lprobePost(e, h, t) {
    const s = e.s, c = e.c, x = e.ix, V = i => i === undefined || i < 0 ? 0 : this.v[i];
    const vg = V(x[2]), vs = V(x[1]) - vg; s.vs = vs; s.pw = vs > 4.0 && vs < 19;
    /* sondeo en vivo: la interfaz elige un nodo (agujero de la protoboard o borne) con s.probeKey */
    let vt;
    if (s.probeKey) { const i = this.nodeIdx.get(s.probeKey); vt = i === undefined ? null : (i < 0 ? 0 : this.v[i]) - vg; } else vt = V(x[0]) - vg;
    const cm = c.p.fam === 'cmos', hiT = cm ? 0.7 * vs : 2.0, loT = cm ? 0.3 * vs : 0.8;
    const lvl = !s.pw || vt === null ? -1 : vt >= hiT ? 1 : vt <= loT ? 0 : -1;
    s.v = vt; s.lvl = lvl;
    if (lvl >= 0) {
      if (s.prev !== undefined && s.prev >= 0 && lvl !== s.prev) {
        s.edges = (s.edges || 0) + 1; s.lastEdge = t;
        if (lvl === 1) { if (s.lastRise !== undefined) { const T = t - s.lastRise; if (T > 0) { const f = 1 / T; s.freq = s.freq ? s.freq * 0.6 + f * 0.4 : f; if (s.highT !== undefined) s.duty = Math.max(0, Math.min(1, s.highT / T)); } } s.lastRise = t; }
        else if (s.lastRise !== undefined) s.highT = t - s.lastRise;
        if (c.p.mem) s.memHit = true;
      }
      s.prev = lvl;
    }
    if (s.lastEdge === undefined || t - s.lastEdge > 0.6) { s.freq = 0; s.duty = undefined; }
    s.pulse = s.pw && (c.p.mem ? !!s.memHit : s.lastEdge !== undefined && t - s.lastEdge < 0.06);
    this.res[e.id] = { v:vt === null ? 0 : vt, i:vs / 600, p:vs * vs / 600, lvl, freq:s.freq || 0, duty:s.duty };
  }
  /* Una línea ASCII recibida por el puerto COM virtual (COMPIM de Proteus) → acción en el banco 3D. Devuelve la respuesta. */
  compim(line) {
    const t = String(line || '').trim().split(/\s+/), cmd = (t[0] || '').toUpperCase(), els = this.els || [], N = i => parseFloat(t[i]);
    if (!cmd) return '';
    switch (cmd) {
      case 'PING': return 'PONG VECTRALAB3D';
      case 'SERVO': case 'SERVOREL': {
        const list = els.filter(e => e.type === 'SERVO'), i = Math.max(1, parseInt(t[1], 10) || 1) - 1, e = list[i];
        if (!e) return 'ERR NO HAY SERVO ' + (i + 1);
        if (cmd === 'SERVOREL') { delete e.s.ext; return 'OK SERVOREL ' + (i + 1); }
        if (!isFinite(N(2))) return 'ERR ANGULO';
        e.s.ext = Math.max(0, Math.min(180, N(2))); return 'OK SERVO ' + (i + 1) + ' ' + Math.round(e.s.ext);
      }
      case 'MOT': case 'MOTREL': {
        const mots = els.filter(e => e.type === 'MOT');
        const L = mots.find(e => e.side === 'motorL') || mots[0], R = mots.find(e => e.side === 'motorR') || mots.find(e => e !== L);
        if (!L) return 'ERR NO HAY MOTORES';
        if (cmd === 'MOTREL') { mots.forEach(e => delete e.s.ext); return 'OK MOTREL'; }
        const a = Math.max(-255, Math.min(255, N(1) || 0)) / 255, b = Math.max(-255, Math.min(255, isFinite(N(2)) ? N(2) : N(1) || 0)) / 255;
        L.s.ext = a; if (R) R.s.ext = b; return 'OK MOT ' + Math.round(a * 255) + ' ' + Math.round(b * 255);
      }
      case 'LCD': case 'LCDCLR': {
        const lcd = els.find(e => e.type === 'LCD' && e.s.lcd);
        if (!lcd) return 'ERR NO HAY LCD ALIMENTADO';
        const L = lcd.s.lcd;
        if (cmd === 'LCDCLR') { lcdExec(L, 0, 0x01); return 'OK LCDCLR'; }
        const row = Math.max(0, parseInt(t[1], 10) || 0), col = Math.max(0, parseInt(t[2], 10) || 0), txt = String(line).trim().split(/\s+/).slice(3).join(' ');
        lcdExec(L, 0, 0x80 | ([0x00, 0x40, 0x14, 0x54][row & 3] + col));
        for (const ch of txt) lcdExec(L, 1, ch.charCodeAt(0) & 0xff);
        return 'OK LCD ' + row + ' ' + col;
      }
      case 'SENS': return this.sensorFrame().join('\n');
    }
    return 'ERR COMANDO ' + cmd;
  }
  /* lecturas de los sensores 3D para enviar a Proteus: distancia, línea, inclinación y teclado */
  sensorFrame() {
    const out = [], comps = this.project ? this.project.components : [];
    comps.forEach(c => {
      const s = this.st[c.id]; if (!s) return;
      if (c.type === 'hcsr04') out.push('HC ' + c.name + ' ' + Math.round((s.dist !== undefined ? s.dist : c.p.dist) || 0));
      if (c.type === 'tcrt') out.push('TCRT ' + c.name + ' ' + (s.blk ? (s.blk[0] ? 1 : 0) + ' ' + (s.blk[1] ? 1 : 0) : '0 0'));
      if (c.type === 'mpu6050') out.push('MPU ' + c.name + ' ' + (s.pitch !== undefined ? s.pitch : c.p.pitch || 0).toFixed(1));
      if (c.type === 'keypad') { const i = (c.p.on || []).findIndex(Boolean); out.push('KEY ' + c.name + ' ' + (i < 0 ? '-' : '123A456B789C*0#D'[i])); }
      if (c.type === 'lm35') out.push('TEMP ' + c.name + ' ' + (+c.p.T || 0).toFixed(1));
      if (c.type === 'joystick') out.push('JOY ' + c.name + ' ' + Math.round(c.p.x * 1023) + ' ' + Math.round(c.p.y * 1023) + ' ' + (c.p.pressed ? 1 : 0));
    });
    return out;
  }
  status(id) {
    const s = this.st[id];
    if (!s) return 'normal';
    if (s.failed) return s.tipo;
    if (s.tsd) return 'protección';
    if (s.damage > 0.5) return 'peligro';
    if (s.damage > 0.02) return 'caliente';
    return 'normal';
  }
}

const api = {
  PITCH, ROWS, ROW_Z, BOARD_D, BOARD_SIZES, TABLE_Y, TABLE, AMB, GND, L, LED_TYPES, DIODE, DIODES, ZENER_V, SPEC, FAM, IC, PARTS, TERMS,
  TB_LIST, VD_LIST, WAVES, BENCH_HOME, avrBuild, BJT, SEG7, DIPSW, transpilePy, asmBuild, MCU, UNO, UNO_IO, LCD_SIZES, MOTOR, DEFAULT_CODE, dipDef, lcdRows, transpileC,
  setLayout, boardZ, holeXZ, stripOf, isBoardRow, epKey, holeKey, compPins, compSpan, bodyCells, pinLabel, terminalXYZ, epXYZ,
  occupiedHoles, canPlaceOnBoard, canPlaceBench, canPlace, holeFree, findBenchSpot,
  newProject, makeComp, uncount, ldrR, parseIntelHex, avrFromHex, fmtDmm, benchRotXZ, benchHalf, picFromHex, isIntelHex, MOSM, SEG7_BCD, BARGRAPH, stubDipDef, defaultParams, addWire, autoWireColor, formatR, formatC, genValue, montaje, TRACKS, ROBO, roboDefaults, MAT,
  scenarios:{ base:() => scenarioBase(), short:scenarioShort, ledNoR:scenarioLedNoR, cap:scenarioCap, res:scenarioRes,
    rc:scenarioRC, astable:scenarioAstable, nand:() => scenarioNand(5), icOver:() => scenarioNand(12),
    rcLow:() => scenarioRCLow('sine', 1000, 1000, 100e-9, 2e-4), rcHigh:() => scenarioRCHigh('sine', 1000, 1000, 100e-9, 2e-4),
    rcCharge:() => scenarioRCLow('square', 50, 10000, 100e-9, 2e-3), rcInt:() => scenarioRCLow('square', 1000, 10000, 100e-9, 2e-4),
    rcDiff:() => scenarioRCHigh('square', 100, 10000, 100e-9, 1e-3), rc2:scenarioRC2,
    p2lim:scenarioP2Lim, p2dz:scenarioP2Dz, p3bi:scenarioP3Bi, p3bidz:scenarioP3BiDz, p3mono:() => scenarioP3Mono(false), p3casc:() => scenarioP3Mono(true),
    p4ast:scenarioP4Ast, p4barr:() => scenarioP4Barr('barrido'), p4mod:() => scenarioP4Barr('mod'), p5adc:() => scenarioP5(false), p5alias:() => scenarioP5(true),
    p6tl:scenarioP6Tl, p6buck:scenarioP6Buck,
    roboLine:scenarioRoboLine, roboLineAn:scenarioRoboLineAn, roboBal:scenarioRoboBal, roboArm:scenarioRoboArm, roboAvoid:scenarioRoboAvoid, digChase:scenarioDigChase, digAdder:scenarioDigAdder,
    ardBlink:scenarioArdBlink, ardServo:scenarioArdServo, ardLcd:scenarioArdLcd, ardSeg:scenarioArdSeg, bjt:scenarioBjt, tipMotor:scenarioTipMotor, espLcd:scenarioEspLcd, stepper:scenarioStepper, l293:scenarioL293, l298:scenarioL298, pic:scenarioPic },
  Sim
};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Lab = api;
})(typeof window !== 'undefined' ? window : globalThis);

const Lab = globalThis.Lab;
export default Lab;
