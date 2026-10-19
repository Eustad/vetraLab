/* <vl-viewport>: escena 3D de VectraLab aislada en un Web Component.
   Entradas (propiedades): scene  → descriptores de describeScene()   (se reconstruye la escena)
                           state  → { [id]: { glow, hot, failed } }     (solo cambia materiales: barato)
                           selected → id de la pieza seleccionada
   Salidas (eventos):      vl-select { id|null }, vl-hover { id|null }
   No importa el motor ni el store. Renderiza bajo demanda (solo cuando algo cambia), se pausa con la pestaña oculta
   y libera geometrías, materiales y texturas al reconstruir o desmontarse. Raycasting acelerado con three-mesh-bvh. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const css = `:host{display:block;position:relative;min-height:240px;overflow:hidden;background:var(--scene,#15181b)}canvas{display:block;width:100%;height:100%;touch-action:none}
.tip{position:absolute;pointer-events:none;padding:3px 7px;border-radius:5px;font:12px var(--mono,monospace);background:rgba(0,0,0,.72);color:#fff;transform:translate(10px,10px)}`;

export function disposeDeep(root) {
  const seen = new Set();
  root.traverse(o => {
    if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.disposeBoundsTree?.(); o.geometry.dispose(); }
    [].concat(o.material || []).forEach(m => { if (seen.has(m)) return; seen.add(m); Object.values(m).forEach(v => { if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } }); m.dispose(); });
  });
}

export class VlViewport extends HTMLElement {
  #scene = null; #state = {}; #selected = null; #objs = new Map(); #dirty = true; #raf = 0; #anim = false;
  constructor() {
    super();
    const sh = this.attachShadow({ mode:'open' }), st = document.createElement('style'); st.textContent = css;
    this.canvas = document.createElement('canvas'); this.tip = Object.assign(document.createElement('div'), { className:'tip', hidden:true });
    sh.append(st, this.canvas, this.tip);
  }
  set scene(v) { this.#scene = v; this.#rebuild(); }
  get scene() { return this.#scene; }
  set state(v) { this.#state = v || {}; this.#applyState(); }
  set selected(v) { if (v === this.#selected) return; this.#selected = v; this.#applyState(); }

  connectedCallback() {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias:true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.shadowMap.enabled = true;
    this.s3 = new THREE.Scene(); this.s3.background = new THREE.Color(getComputedStyle(this).getPropertyValue('--scene').trim() || '#15181b');
    this.camera = new THREE.PerspectiveCamera(40, 1, 1, 6000); this.camera.position.set(40, 150, 170);
    this.controls = new OrbitControls(this.camera, this.canvas); this.controls.enableDamping = true; this.controls.target.set(0, 0, 0);
    this.controls.addEventListener('change', () => this.invalidate());
    this.s3.add(new THREE.HemisphereLight(0xeef2f5, 0x202426, 0.9));
    const sun = new THREE.DirectionalLight(0xfff4e6, 1.6); sun.position.set(120, 260, 160); sun.castShadow = true; Object.assign(sun.shadow.camera, { left:-300, right:300, top:300, bottom:-300 }); sun.shadow.mapSize.set(2048, 2048); this.s3.add(sun);
    this.root = new THREE.Group(); this.s3.add(this.root);
    this.ray = new THREE.Raycaster(); this.ptr = new THREE.Vector2();
    this.ro = new ResizeObserver(() => this.#resize()); this.ro.observe(this);
    this.canvas.addEventListener('pointermove', e => this.#hover(e));
    this.canvas.addEventListener('pointerleave', () => { this.tip.hidden = true; });
    let down = null;
    this.canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    this.canvas.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) this.dispatchEvent(new CustomEvent('vl-select', { detail:{ id:this.#pick(e) }, bubbles:true, composed:true })); down = null; });
    this.onVis = () => { if (!document.hidden) this.invalidate(); }; document.addEventListener('visibilitychange', this.onVis);
    this.#rebuild(); this.#resize();
  }
  disconnectedCallback() {
    cancelAnimationFrame(this.#raf); this.ro.disconnect(); document.removeEventListener('visibilitychange', this.onVis);
    disposeDeep(this.s3); this.controls.dispose(); this.renderer.dispose(); this.renderer.forceContextLoss();
  }
  /* render bajo demanda: un cuadro por cambio, o continuo solo mientras haya animaciones (amortiguación, piezas dañadas) */
  invalidate() { this.#dirty = true; if (!this.#raf && !document.hidden) this.#raf = requestAnimationFrame(this.#frame); }
  #frame = t => {
    this.#raf = 0; if (!this.renderer) return;
    const moving = this.controls.update();
    if (this.#anim) this.#objs.forEach(o => { if (o.failed) o.body.material.emissiveIntensity = 0.35 + 0.35 * Math.sin(t / 180); });
    this.renderer.render(this.s3, this.camera); this.#dirty = false;
    if (moving || this.#anim) this.invalidate();
  };
  #resize() { const w = this.clientWidth || 1, h = this.clientHeight || 1; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.invalidate(); }

  /* ---------- construcción de la escena desde los descriptores ---------- */
  #rebuild() {
    if (!this.root) return;
    this.root.children.slice().forEach(ch => { this.root.remove(ch); disposeDeep(ch); }); this.#objs.clear();
    const d = this.#scene; if (!d) { this.invalidate(); return; }
    const table = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1000), new THREE.MeshStandardMaterial({ color:0x2a3134, roughness:0.95 }));
    table.rotation.x = -Math.PI / 2; table.position.y = -8; table.receiveShadow = true; this.root.add(table);
    if (d.board) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(d.board.w, 8, d.board.d), new THREE.MeshStandardMaterial({ color:0xf1efe8, roughness:0.75 }));
      b.position.y = -4; b.receiveShadow = true; this.root.add(b);
      const n = d.board.holes.length / 2, holes = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ color:0x2a2b2e }), n), m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      for (let i = 0; i < n; i++) holes.setMatrixAt(i, m.compose(new THREE.Vector3(d.board.holes[2 * i], 0.02, d.board.holes[2 * i + 1]), q, new THREE.Vector3(1, 1, 1)));
      this.root.add(holes);
    }
    d.parts.forEach(p => {
      const g = new THREE.Group(); g.position.set(...p.pos); g.rotation.y = p.rotY || 0;
      const mat = new THREE.MeshStandardMaterial({ color:p.color, roughness:p.shape === 'led' ? 0.25 : 0.55, emissive:new THREE.Color(p.shape === 'led' ? p.color : 0x000000), emissiveIntensity:0, transparent:p.shape === 'led', opacity:p.shape === 'led' ? 0.9 : 1 });
      const geo = p.shape === 'led' ? new THREE.CylinderGeometry(2.5, 2.5, p.size[1], 20) : new THREE.BoxGeometry(...p.size);
      geo.computeBoundsTree();
      const body = new THREE.Mesh(geo, mat); body.castShadow = true; body.position.y = p.bench ? p.size[1] / 2 : p.size[1] / 2 + 1.2; body.userData.id = p.id; g.add(body);
      if (p.pins) p.pins.forEach(([x, z]) => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 6), new THREE.MeshStandardMaterial({ color:0xc9ccd1, metalness:0.9, roughness:0.3 })); leg.position.set(x - p.pos[0], 0.6, z - p.pos[2]); g.add(leg); });
      this.root.add(g); this.#objs.set(p.id, { g, body, base:new THREE.Color(p.color), led:p.shape === 'led' });
    });
    d.wires.forEach(w => {
      const a = new THREE.Vector3(...w.a), b = new THREE.Vector3(...w.b), mid = a.clone().lerp(b, 0.5); mid.y = Math.max(a.y, b.y) + 6 + a.distanceTo(b) * 0.18;
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 24, 0.55, 6), new THREE.MeshStandardMaterial({ color:w.color, roughness:0.5 }));
      tube.castShadow = true; this.root.add(tube);
    });
    this.#applyState(); this.invalidate();
  }
  /* ---------- estado visual: brillo, calor, daño y selección (sin reconstruir geometría) ---------- */
  #applyState() {
    let anim = false;
    this.#objs.forEach((o, id) => {
      const s = this.#state[id] || {}, m = o.body.material;
      o.failed = !!s.failed && !s.protected;
      if (o.failed) { m.color.set(0x2a1a14); m.emissive.set(0xff3b1f); anim = true; }
      else { m.color.copy(o.base); m.emissive.copy(o.led ? o.base : new THREE.Color(0xff5a1a)); m.emissiveIntensity = o.led ? 2.2 * (s.glow || 0) : 0.8 * (s.hot || 0); }
      if (id === this.#selected && !o.failed) { m.emissive.set(0xff8a3d); m.emissiveIntensity = Math.max(m.emissiveIntensity, 0.35); }
    });
    this.#anim = anim; this.invalidate();
  }
  #pick(e) {
    const r = this.canvas.getBoundingClientRect(); this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera); this.ray.firstHitOnly = true;
    const hit = this.ray.intersectObjects([...this.#objs.values()].map(o => o.body), false)[0];
    return hit ? hit.object.userData.id : null;
  }
  #hover(e) {
    if (e.buttons) return; const id = this.#pick(e), p = id && this.#scene.parts.find(q => q.id === id);
    this.tip.hidden = !p; if (p) { const r = this.getBoundingClientRect(); this.tip.textContent = p.name; this.tip.style.left = (e.clientX - r.left) + 'px'; this.tip.style.top = (e.clientY - r.top) + 'px'; }
    if (id !== this.hoverId) { this.hoverId = id; this.dispatchEvent(new CustomEvent('vl-hover', { detail:{ id }, bubbles:true, composed:true })); }
  }
}
customElements.define('vl-viewport', VlViewport);
