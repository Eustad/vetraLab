# Arquitectura modular de VectraLab 3D

Estado: **propuesta aceptada y prototipo funcional en `app/`** · Fecha: 2026-10-19

## 1. Contexto

`index.html` (v21.1, 15,6 MB) es un monolito:

| Pieza | Tamaño | Acoplamiento |
|---|---|---|
| Bloque `<style>` | 737 líneas, 19 secciones | Global, selectores por `#id` |
| Motor `Lab` (MNA, térmico, microcontroladores) | 302 KB | **Ya aislado**: no toca el DOM, tiene 12 suites de prueba en Node |
| Interfaz (escena 3D, paneles, importador, editor) | 795 KB en un solo IIFE | Alto: cientos de funciones comparten variables por clausura y se modifican el DOM entre sí |
| Constructores CAD (`banco.js` + 3 módulos) | ~400 KB | Medio: se comunican por `window.VL_CAD` y eventos |
| Modelos GLB en base64 | ~13 MB | Ninguno (datos) |

El problema real no es el tamaño sino el **acoplamiento de la interfaz**: el inspector, el osciloscopio o el tutor leen y escriben variables globales (`S`, `compObjs`, `PX`…) y el DOM de los demás.

## 2. Decisión

**Web Components nativos + un store propio con slices + un controlador de simulación**, sin framework ni paso de compilación.

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| React + react-three-fiber | Ecosistema, devtools | Obliga a reescribir los 795 KB de golpe (R3F reemplaza el bucle de render imperativo); compilación obligatoria; reconciliación de React en un bucle de 60 FPS con 1000+ mallas | ✗ |
| Vue 3 + Pinia | Reactividad fina, SFC | Igual que React: la escena imperativa queda fuera de la reactividad; necesita build | ✗ |
| **Web Components + store** | Se migra panel por panel dentro del monolito (*strangler fig*); Shadow DOM aísla CSS; cero dependencias; el motor y Three.js ya son vanilla | Hay que escribir la plantilla y la suscripción a mano (resuelto en `VlElement`, 40 líneas) | ✓ |

Lit es compatible con esta decisión: si los componentes crecen, `VlElement` puede pasar a extender `LitElement` sin cambiar el store ni los contratos.

## 3. Estructura

```
app/
├── index.html                  contenedor: layout + importmap (three@0.160, three-mesh-bvh@0.7.8)
├── styles/
│   ├── tokens.css              variables de diseño (tema claro/oscuro); atraviesan el Shadow DOM
│   ├── app.css                 layout del contenedor
│   └── legacy/                 los 19 módulos del CSS del monolito + index.css (@import en orden)
├── tools/extract.mjs           regenera engine/lab-core.js y styles/legacy/ desde el monolito y verifica el CSS byte a byte
└── src/
    ├── engine/lab-core.js      motor Lab como módulo ES (código idéntico, generado)
    ├── state/store.js          createStore: dispatch, select (con selector), on (efectos)
    ├── state/slices.js         estado inicial + reductores puros + selectores
    ├── sim/sim-controller.js   ÚNICO módulo que habla con el motor
    ├── viewport/
    │   ├── scene-model.js      adaptador puro proyecto → descriptores de escena
    │   └── vl-viewport.js      <vl-viewport>: Three.js + three-mesh-bvh; props in, eventos out
    ├── ui/vl-element.js        base de componentes (Shadow DOM, hojas propias, suscripciones)
    ├── components/             cada uno con su .js y su .css
    │   ├── vl-scope-hud/       osciloscopio (#scopehud), 2 o 4 canales
    │   ├── vl-tutor/           tutor de laboratorio (#tutor)
    │   ├── vl-code-editor/     editor de código (#editor)
    │   ├── vl-serial-console/  monitor serie (#pxs-live)
    │   ├── vl-inspector/       inspector de la pieza seleccionada
    │   └── vl-status-bar/      LED de estado, tiempo y fallas
    └── app.js                  composición: el único archivo que conoce a todos
```

## 4. Flujo de datos

```
            acciones-comando (sim/repairRequested, editor/uploadRequested, serial/sendRequested…)
  ┌──────────────┐  dispatch   ┌─────────┐  efectos   ┌────────────────┐  API   ┌───────────┐
  │ Componentes  │ ──────────▶ │  Store  │ ─────────▶ │ SimController  │ ─────▶ │ Motor Lab │
  │ (Shadow DOM) │ ◀────────── │ (slices)│ ◀───────── │                │ ◀───── │   (MNA)   │
  └──────────────┘   select    └─────────┘  acciones- └────────────────┘ onFail └───────────┘
         ▲                          │      evento (sim/failed, sim/ticked a 10 Hz, serial/received)
         │ props: scene, state,     │
         │ selected                 ▼
  ┌──────────────┐  vl-select   app.js (contenedor)
  │ <vl-viewport>│ ───────────▶ dispatch(project/selected)
  └──────────────┘
```

Reglas:

1. **Los componentes nunca tocan el motor ni el DOM de otro componente.** Leen con `select()` y escriben con `dispatch()`.
2. **El viewport no conoce el store ni el motor.** Recibe descriptores (`scene`), estado visual (`state`) y selección (`selected`) como propiedades; emite `vl-select` y `vl-hover`.
3. **Acciones de dos tipos**:
   - **Eventos** (pasado, los emite el controlador): `sim/failed`, `sim/ticked`, `serial/received`.
   - **Comandos** (intención, los emite la UI): `sim/repairRequested`, `editor/uploadRequested`, `scope/configRequested`.

   Solo los efectos del controlador ejecutan comandos.
4. **El estado grande y mutable del motor no se copia.** El store guarda la referencia al proyecto y un contador `rev`. El osciloscopio lee el búfer circular de 16 384 muestras por una propiedad de solo lectura (`source`) y se redibuja cuando cambia `scope.rev`.
5. **Ritmos separados.** El solver corre en cada cuadro; el store recibe `sim/ticked` a 10 Hz; el viewport renderiza solo cuando algo cambia (*render on demand*).

### Ejemplo: una pieza que se quema

1. El motor detecta el exceso y llama a `sim.onFail(ev)`.
2. `SimController` despacha `sim/failed { id, kind, i, at }` y `tutor/said { tone:'bad', compId }`.
3. Cada parte reacciona a su slice:
   - `vl-status-bar` (selector: número de fallas) pone el LED rojo con «1 pieza dañada».
   - `app.js` (selector: lecturas + fallas) pasa `vp.state = describeState(…)`, y el viewport ennegrece la pieza con un pulso rojo.
   - `vl-tutor` muestra el aviso con «Ver pieza», que despacha `project/selected`.
   - `vl-inspector` muestra «Dañada» y el botón «Reparar».
4. «Reparar» despacha `sim/repairRequested`. El efecto llama a `sim.repair(id)` y despacha `sim/repaired`, y todo vuelve a verde.

Ningún paso usa `querySelector` sobre otro componente.

## 5. Estilos

- `tools/extract.mjs` divide el `<style>` del monolito en 20 módulos (`styles/legacy/NN-seccion.css`). Verifica que la concatenación sea **idéntica byte a byte** al original, así que el monolito puede enlazar `styles/legacy/index.css` sin cambiar el aspecto.
- Los componentes nuevos traen su propio `.css` y se cargan con `adoptedStyleSheets`, de modo que **no hay fugas de selectores**.
- Los colores salen de `tokens.css`, cuyas variables atraviesan el Shadow DOM: el tema claro/oscuro funciona sin duplicar valores.
- Se eligió CSS nativo modular frente a SASS o Styled Components: las variables CSS y el Shadow DOM ya dan alcance y temas sin compilación ni dependencias.

## 6. Plan de migración del monolito (*strangler fig*)

Cada fase deja el simulador funcionando y pasa las pruebas `t*.js`.

| Fase | Trabajo | Riesgo |
|---|---|---|
| 0 ✔ | Motor como módulo ES, CSS en módulos, store, controlador, viewport y 4 paneles en `app/` | — |
| 1 | En el monolito, `<link>` a `styles/legacy/index.css` en lugar del `<style>` incrustado | Bajo |
| 2 | **Puente de estado en el monolito**: `S.sim.onFail`, `commit()`, `selectItem()` y la publicación de lecturas despachan acciones a este mismo store, sin quitar todavía el código viejo | Bajo |
| 3 | Reemplazar `#scopehud`, `#tutor`, `#editor` y `#pxs-live` del monolito por los componentes de `app/`, alimentados por el puente, y borrar sus funciones de render (`drawScope`, `pxsLog`…) | Medio |
| 4 | Extraer los constructores `build*()` del IIFE a `viewport/builders/*.js` (uno por familia: pasivos, integrados, instrumentos, robótica) que reciban `(THREE, desc)` y devuelvan `{ group, update }`; `vl-viewport` los usa en lugar de las cajas del prototipo | Alto (≈ 300 KB) |
| 5 | Mover la interacción (arrastre, cables, perillas) a `viewport/interaction.js`, con emisión de eventos `vl-drag`, `vl-wire`, `vl-ctl` | Alto |
| 6 | Importador de Proteus a `src/importers/proteus/*.js` (funciones puras: SDF → proyecto). Es el código más fácil de probar en Node | Medio |
| 7 | Motor en un **Web Worker** (el controlador ya es la única frontera) y `OffscreenCanvas` para el viewport | Medio |

Para cada fase, la prueba de aceptación es la misma:

- las suites `t.js`, `t6`, `t8`, `t9`, `tsim`, `tdig`, `thex`, `t58`, `t59`, `t61`, `t62`, `t66` y `t68` dan resultados idénticos;
- no hay errores de consola;
- el recorrido manual «LED sin resistor → Ver pieza → Reparar» funciona.

## 7. Cómo ejecutar el prototipo

Los módulos ES necesitan un servidor HTTP (no funcionan con `file://`):

```bash
cd VectraLab-3D && python -m http.server 8080
```

Abrir `http://localhost:8080/app/`:

- `?p=ledNoR` arranca en una práctica concreta;
- `?debug` registra cada acción del store en la consola.

## 8. Lo que el prototipo todavía no hace

- **El viewport dibuja las piezas como volúmenes simples** (cajas, cilindros, cables). Los modelos CAD/GLB detallados llegan en la fase 4.
- **No hay arrastre de piezas ni tendido de cables.** Llega en la fase 5.
- **El tutor responde con reglas** sobre el estado real del circuito: fallas, pieza seleccionada y sus lecturas. No hay IA conectada.
- **La versión de uso diario sigue siendo `index.html`.** `app/` es la base hacia la que migra.
