# VectraLab 3D

Simulador de circuitos electrónicos en 3D en un solo archivo HTML (three.js + motor MNA): protoboard, instrumentos de mesa y modelos CAD a escala 1:1 en milímetros.

## Abrir
Abre `index.html` en Chrome o Edge (necesita internet la primera vez para cargar three.js y las bibliotecas CAD desde CDN).

## Versión 21.1
- Pulsador momentáneo real: queda presionado mientras mantienes el clic o el dedo (antes hacía un pulso de 220 ms o se soltaba al mover el puntero); el cuerpo y las patas siguen sirviendo para moverlo.
- Transformador 120 V → 12-0-12 V con toma central (6 a 24 V por mitad, 50/60 Hz): onda completa con 2 diodos, puente o fuente simétrica ±12 V.
- Puentes rectificadores 2W10 (redondo, 2 A) y KBP206 (en línea, 2 A) además del DB107; mapeo desde Proteus.
- Módulo relé con bobina de 12 V (SRD-12VDC-SL-C, 400 Ω, actúa sobre 8,4 V) además del de 5 V.
- Ya existían y están en el catálogo: LM317, 7812, 7912, LM741, TL081/TL082, LM358, LM386, 74HC595/138/151, PC817 y 4N25.

## Versión 21
- Memoria de la GPU: limpieza profunda de geometrías, materiales y todas las texturas (mapas de color, relieve, emisivo…) al borrar piezas, cambiar de práctica, crear un proyecto nuevo o importar.
- Bucle de render: se detiene con la pestaña oculta (sin render ni solver MNA) y baja a ≈18 FPS cuando el editor de código está maximizado (la simulación sigue igual).
- Autoguardado en localStorage (clave vectralab_autosave_v21): 1,5 s después de cada cambio, cada 20 s, al ocultar la pestaña y al cerrarla; indicador «💾 Guardado» en la barra de estado.
- Importador de Proteus: validación previa (alimentación auto-enlazada, capacitores reorientados, entradas flotantes con pull-down/pull-up virtual de 10 kΩ, nodos de una sola conexión) y resaltado en 3D de cada pin flotante tras importar.
- Firmware .hex: validación Intel HEX línea por línea (longitud, tipo de registro, checksum) con la línea exacta del error.
- Cámara: giros de 45°/90° ([ ] y Shift), zoom (+ −) y modo trackpad / táctil (T) desde la barra de vista.
- Tooltips con la acción y su atajo entre corchetes en la barra superior, el rail y el inspector.

## Versión 20.1
- Capacitores «CAP» de Proteus (sin polaridad) que quedan como electrolíticos se orientan con el + hacia el lado positivo: ya no explotan al iniciar.
- SIGNAL GENERATOR: lee FREQV×FREQR, AMPLV×AMPLR, forma de onda y modo unipolar; sus entradas AM/FM ya no le quitan la salida.
- Diodos 1N914/1N4448, conmutador SW-SPDT (COM/NC/NO), red «VCC/VDD» y configuración del osciloscopio (base de tiempo, V/div, posición).
- Protección de componentes (activa al importar desde Proteus): los excesos avisan en vez de quemar. Se cambia en Ajustes → Simulación.

## Versión 20
- Importador de Proteus (SDF / NET / PDSPRJ):
  - Integrados multibloque (`U1:A`, `U1:B`…: LM324, LM358, 74HCxx, CD40xx) juntados en su encapsulado, con los pines `+IP/-IP/OP/V+/V-/A/B/Y` traducidos a las patas físicas.
  - Nombres de pin de Proteus del NE555 (TR, TH, DC, Q, R, CV) y del CD4017.
  - Instrumentos `$I…` (DC VOLTMETER, OSCILLOSCOPE…), generadores (SIGNAL GENERATOR, SG1, VGEN, VSINE, VPULSE, CLOCK, DC, SINE, PULSE, DCLOCK…).
  - Alimentación automática de integrados: VCC/V+ sin fuente → fuente principal (o una de 5 V); GND/V− aislado → tierra.
  - Generador automático en entradas que quedan con un solo extremo (Proteus no exporta sus generadores).
  - Netlists Physical + Logical combinadas al cargarlas juntas.
- Osciloscopio Rigol DS1054Z de 4 canales, multímetro UNI-T UT53, punta lógica TESTECH EM4610.
- Cámara 360°, giro de equipos de mesa, cables en abanico y elección automática de 1, 2 o 3 protoboards.

## Documentación
- [`docs/pinouts.md`](docs/pinouts.md): pinouts de integrados, microcontroladores y módulos, generados desde las definiciones del simulador (son las patas que VectraLab usa al conectar).
