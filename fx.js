/* ============================================================
   RedeCORR · "organismo CORE5®"
   Uma única nuvem de partículas em WebGL vive atrás do deck
   inteiro e muda de forma conforme a narrativa:

     chaos       o corretor sozinho, sem estrutura
     pentagon    a metodologia CORE5® travada em formação
     grid        os dados de mercado
     constellation  o ecossistema, aberto
     burst       o convite final

   Nos slides de pilar, o nó correspondente do pentágono acende
   e a formação gira para apresentá-lo.

   Degradação: sem WebGL o canvas não é criado e o diagrama SVG
   do slide CORE5 continua aparecendo. Com prefers-reduced-motion
   a cena congela num estado estático (sem loop de render).
   ============================================================ */

import * as THREE from "./vendor/three.module.min.js";

const COUNT = 2000;
const R = 15; // raio do pentágono, em unidades de mundo

/* ---------- utilidades ---------- */

// PRNG determinístico: a mesma formação em toda sessão e em todo deploy
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260805);

// Vértices do pentágono (mesma orientação do diagrama SVG: nó 1 no topo)
const NODES = [];
for (let i = 0; i < 5; i++) {
  const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
  NODES.push(new THREE.Vector3(Math.cos(a) * R, -Math.sin(a) * R, 0));
}

// Grafo completo K5: as dez arestas do diagrama
const EDGES = [];
for (let i = 0; i < 5; i++) {
  for (let j = i + 1; j < 5; j++) EDGES.push([i, j]);
}

/* ---------- formações ---------- */

// Cada formação devolve {pos: Float32Array, node: Float32Array}
// `node` marca a qual vértice do pentágono a partícula pertence (-1 = nenhum),
// para o realce do pilar em foco.

function fmtPentagon() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT);
  const clusterCount = Math.floor(COUNT * 0.55);

  for (let i = 0; i < COUNT; i++) {
    let x, y, z, n;
    if (i < clusterCount) {
      // aglomerados nos cinco vértices
      n = i % 5;
      const c = NODES[n];
      const r = 2.6 * Math.cbrt(rnd());
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      x = c.x + r * Math.sin(ph) * Math.cos(th);
      y = c.y + r * Math.sin(ph) * Math.sin(th);
      z = c.z + r * Math.cos(ph) * 0.7;
    } else {
      // partículas distribuídas ao longo das arestas
      const e = EDGES[(i - clusterCount) % EDGES.length];
      const a = NODES[e[0]];
      const b = NODES[e[1]];
      const t = rnd();
      x = a.x + (b.x - a.x) * t + (rnd() - 0.5) * 0.7;
      y = a.y + (b.y - a.y) * t + (rnd() - 0.5) * 0.7;
      z = (rnd() - 0.5) * 1.2;
      n = -1;
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    node[i] = n;
  }
  return { pos, node };
}

function fmtChaos() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT).fill(-1);
  // aglomerados irregulares, sem centro nem simetria: desordem legível
  const clumps = [];
  for (let c = 0; c < 9; c++) {
    clumps.push({
      x: (rnd() - 0.5) * 40,
      y: (rnd() - 0.5) * 34,
      z: (rnd() - 0.5) * 26,
      s: 3 + rnd() * 6,
    });
  }
  for (let i = 0; i < COUNT; i++) {
    const c = clumps[Math.floor(rnd() * clumps.length)];
    pos[i * 3] = c.x + (rnd() - 0.5) * c.s * 2;
    pos[i * 3 + 1] = c.y + (rnd() - 0.5) * c.s * 2;
    pos[i * 3 + 2] = c.z + (rnd() - 0.5) * c.s;
  }
  return { pos, node };
}

function fmtConstellation() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT).fill(-1);
  for (let i = 0; i < COUNT; i++) {
    // casca esférica irregular
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const r = 17 + (rnd() - 0.5) * 9;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.75;
    pos[i * 3 + 2] = r * Math.cos(ph) * 0.6;
  }
  return { pos, node };
}

function fmtGrid() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT).fill(-1);
  const cols = 50;
  const rows = Math.ceil(COUNT / cols);
  for (let i = 0; i < COUNT; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const x = (cx / (cols - 1) - 0.5) * 62;
    const z = (cy / (rows - 1) - 0.5) * 44;
    // ondulação suave, posicionada baixa: vira chão de dados sob o conteúdo
    const y = Math.sin(x * 0.16) * 1.8 + Math.cos(z * 0.2) * 1.4 - 14;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  }
  return { pos, node };
}

function fmtBurst() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT).fill(-1);
  for (let i = 0; i < COUNT; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const r = 26 + Math.pow(rnd(), 0.4) * 16;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8;
    pos[i * 3 + 2] = r * Math.cos(ph) * 0.7;
  }
  return { pos, node };
}

const FORMS = {
  pentagon: fmtPentagon(),
  chaos: fmtChaos(),
  constellation: fmtConstellation(),
  grid: fmtGrid(),
  burst: fmtBurst(),
};

/* ---------- shaders ---------- */

const VERT = `
uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uFocus;
uniform float uDrift;
attribute vec3 aPosA;
attribute vec3 aPosB;
attribute float aSeed;
attribute float aNodeA;
attribute float aNodeB;
varying float vAlpha;
varying float vHi;

void main() {
  vec3 p = mix(aPosA, aPosB, uMorph);

  float s = aSeed * 6.2831853;
  p.x += sin(uTime * 0.34 + s) * uDrift;
  p.y += cos(uTime * 0.28 + s * 1.7) * uDrift;
  p.z += sin(uTime * 0.22 + s * 2.3) * uDrift;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;

  // realce do pilar em foco: só vale quando a formação-alvo é o pentágono
  float nodeNow = mix(aNodeA, aNodeB, step(0.5, uMorph));
  float hi = (uFocus >= 0.0 && abs(nodeNow - uFocus) < 0.5) ? 1.0 : 0.0;
  vHi = hi;

  float tw = 0.72 + 0.28 * sin(uTime * 1.5 + s * 3.1);
  gl_PointSize = uSize * (1.0 + hi * 1.6) * tw * (260.0 / max(dist, 1.0));
  vAlpha = smoothstep(170.0, 35.0, dist) * (0.55 + 0.45 * tw) * (1.0 + hi * 0.8);

  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = `
precision mediump float;
uniform vec3 uColor;
uniform vec3 uColorHi;
uniform float uOpacity;
varying float vAlpha;
varying float vHi;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.02, d);
  vec3 col = mix(uColor, uColorHi, vHi);
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`;

/* ---------- cena ---------- */

function boot() {
  const canvas = document.getElementById("fx");
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch (e) {
    return null; // sem WebGL: o SVG do slide CORE5 assume
  }
  if (!renderer.getContext()) return null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 400);
  camera.position.set(0, 0, 62);

  const group = new THREE.Group();
  group.rotation.x = -0.22;
  scene.add(group);

  // --- pontos ---
  const geo = new THREE.BufferGeometry();
  const start = FORMS.constellation;
  const posA = new Float32Array(start.pos);
  const posB = new Float32Array(start.pos);
  const nodeA = new Float32Array(start.node);
  const nodeB = new Float32Array(start.node);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) seed[i] = rnd();

  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute("aPosA", new THREE.BufferAttribute(posA, 3));
  geo.setAttribute("aPosB", new THREE.BufferAttribute(posB, 3));
  geo.setAttribute("aNodeA", new THREE.BufferAttribute(nodeA, 1));
  geo.setAttribute("aNodeB", new THREE.BufferAttribute(nodeB, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 90);

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 1 },
    uSize: { value: 2.5 },
    uFocus: { value: -1 },
    uDrift: { value: 0.55 },
    uColor: { value: new THREE.Color("#6ea8ff") },
    uColorHi: { value: new THREE.Color("#ffffff") },
    uOpacity: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  // --- arestas do pentágono ---
  const linePos = new Float32Array(EDGES.length * 6);
  EDGES.forEach((e, i) => {
    const a = NODES[e[0]];
    const b = NODES[e[1]];
    linePos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color("#6ea8ff"),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  /* ---------- estado ---------- */

  const state = {
    form: "constellation",
    focus: -1,
    offsetX: 0,
    rotY: 0,
    lineOpacity: 0,
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
  };

  const G = window.gsap;

  // Em tela estreita a formação encolhe para não invadir o texto empilhado
  function narrowScale() {
    return window.innerWidth < 960 ? 0.6 : 1;
  }

  function tween(target, vars) {
    if (G && !reduced) return G.to(target, vars);
    // sem GSAP ou com movimento reduzido: aplica o estado final direto
    Object.keys(vars).forEach((k) => {
      if (["duration", "ease", "delay", "onUpdate", "onComplete", "overwrite"].includes(k)) return;
      target[k] = vars[k];
    });
    if (vars.onUpdate) vars.onUpdate();
    if (vars.onComplete) vars.onComplete();
    return null;
  }

  // Morph encadeável: congela a posição interpolada atual em A e anima até B
  function morphTo(formName) {
    const next = FORMS[formName];
    if (!next || formName === state.form) return;

    const m = uniforms.uMorph.value;
    const a = geo.attributes.aPosA.array;
    const b = geo.attributes.aPosB.array;
    const na = geo.attributes.aNodeA.array;
    const nb = geo.attributes.aNodeB.array;

    for (let i = 0; i < COUNT * 3; i++) a[i] = a[i] + (b[i] - a[i]) * m;
    for (let i = 0; i < COUNT; i++) na[i] = m > 0.5 ? nb[i] : na[i];

    b.set(next.pos);
    nb.set(next.node);

    geo.attributes.aPosA.needsUpdate = true;
    geo.attributes.aPosB.needsUpdate = true;
    geo.attributes.aNodeA.needsUpdate = true;
    geo.attributes.aNodeB.needsUpdate = true;

    uniforms.uMorph.value = 0;
    state.form = formName;

    tween(uniforms.uMorph, {
      value: 1,
      duration: 1.5,
      ease: "power2.inOut",
      overwrite: true,
    });
  }

  /* ---------- API por slide ---------- */

  // Cada slide declara: formação, foco no pilar, intensidade e lado da tela.
  function setSlide(el) {
    if (!el) return;
    const form = el.dataset.fx || "constellation";
    const focus = el.dataset.fxFocus ? parseInt(el.dataset.fxFocus, 10) - 1 : -1;
    const light = el.classList.contains("slide--light");
    const dim = el.dataset.fxDim === "1";
    // Onde a formação se posiciona. Padrão: coluna direita, longe do texto.
    // "center" só quando a cena É o assunto do slide.
    // Em tela estreita não existe coluna direita: tudo volta ao centro.
    const narrow = window.innerWidth < 960;
    const place = narrow ? "center" : el.dataset.fxX || "right";

    morphTo(form);

    // Foco só faz sentido no pentágono; troca sem tween (é seleção, não transição)
    uniforms.uFocus.value = form === "pentagon" ? focus : -1;

    // Em slide claro as partículas viram azul da marca sobre papel;
    // em slide escuro, azul-céu luminoso sobre navy.
    const col = light ? "#2563eb" : "#6ea8ff";
    const colHi = light ? "#1d4ed8" : "#ffffff";
    tween(uniforms.uColor.value, { ...new THREE.Color(col), duration: 0.8, ease: "power2.out" });
    tween(uniforms.uColorHi.value, { ...new THREE.Color(colHi), duration: 0.8, ease: "power2.out" });
    lineMat.color.set(col);

    // Opacidade: forte quando a cena é o assunto, discreta sob texto denso
    let op = light ? 0.55 : 0.9;
    if (dim) op *= form === "pentagon" ? 0.3 : 0.4;
    if (form === "pentagon" && !dim) op = light ? 0.8 : 1;
    if (place === "center" && !dim) op *= 0.48; // atrás de texto centralizado, recua
    tween(uniforms.uOpacity, { value: op, duration: 0.9, ease: "power2.out" });

    // Arestas do pentágono só depois que a formação assenta
    tween(lineMat, {
      opacity: form === "pentagon" ? (light ? 0.16 : 0.28) : 0,
      duration: 0.9,
      delay: form === "pentagon" ? 0.9 : 0,
      ease: "power2.out",
    });

    tween(group.position, {
      x: place === "center" ? 0 : 21,
      duration: 1.2,
      ease: "power3.out",
      overwrite: true,
    });

    // Nos slides de pilar o mockup do produto é o herói: o pentágono encolhe
    // e recua para trás dele, mantendo só o nó em foco como sinal.
    const s = (form === "pentagon" && dim ? 0.82 : 1) * narrowScale();
    tween(group.scale, { x: s, y: s, z: s, duration: 1.3, ease: "power3.out", overwrite: true });

    // Gira o pentágono para apresentar o nó em foco
    let ry = 0;
    if (form === "pentagon" && focus >= 0) ry = -0.22 + focus * 0.11;
    if (form === "grid") ry = 0.1;
    tween(state, { rotY: ry, duration: 1.4, ease: "power2.inOut", overwrite: true });

    tween(uniforms.uDrift, {
      value: form === "chaos" ? 1.5 : form === "pentagon" ? 0.22 : 0.55,
      duration: 1.2,
      ease: "power2.out",
    });

    // Rótulos exigem espaço em volta do pentágono: só na coluna direita, em tela larga
    setLabels(form === "pentagon" && !dim && !narrow && place !== "center");

    // Sem loop de animação, cada troca de slide precisa de um desenho manual
    if (reduced) requestAnimationFrame(render);
  }

  /* ---------- rótulos ancorados nos nós 3D ---------- */

  const labelEls = Array.from(document.querySelectorAll("[data-fx-labels] .fx-label"));
  const projected = new THREE.Vector3();
  let labelsVisible = false;

  function setLabels(on) {
    labelsVisible = on;
    const wrap = document.querySelector("[data-fx-labels]");
    if (wrap) wrap.classList.toggle("is-on", on);
  }

  function updateLabels() {
    if (!labelsVisible) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < labelEls.length; i++) {
      // posição do nó no mundo, já com rotação e deslocamento do grupo
      projected.copy(NODES[i]).applyMatrix4(group.matrixWorld).project(camera);
      const x = (projected.x * 0.5 + 0.5) * w;
      const y = (-projected.y * 0.5 + 0.5) * h;
      // empurra o rótulo para fora do centro do pentágono
      const dx = NODES[i].x === 0 ? 0 : Math.sign(NODES[i].x);
      const dy = Math.sign(NODES[i].y);
      labelEls[i].style.transform = `translate(-50%, -50%) translate(${
        x + dx * 58
      }px, ${y - dy * 34}px)`;
      labelEls[i].classList.toggle("is-focus", uniforms.uFocus.value === i);
    }
  }

  /* ---------- interação e loop ---------- */

  window.addEventListener(
    "pointermove",
    (e) => {
      state.targetPointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      state.targetPointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    group.scale.setScalar(narrowScale());
    const active = document.querySelector(".slide.is-active");
    if (active) setSlide(active);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  let running = true;
  // Aba escondida não desenha: nada de gastar GPU em segundo plano
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(loop);
  });

  // Índice aberto: a cena para, o painel é o foco
  const indexEl = document.querySelector("[data-index]");
  if (indexEl && "MutationObserver" in window) {
    new MutationObserver(() => {
      running = indexEl.hidden && !document.hidden;
      if (running && !reduced) requestAnimationFrame(loop);
    }).observe(indexEl, { attributes: true, attributeFilter: ["hidden"] });
  }

  const clock = new THREE.Clock();

  function render() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    state.pointerX += (state.targetPointerX - state.pointerX) * 0.045;
    state.pointerY += (state.targetPointerY - state.pointerY) * 0.045;

    // respiração lenta + parallax do ponteiro
    group.rotation.y = state.rotY + Math.sin(t * 0.13) * 0.16 + state.pointerX * 0.2;
    group.rotation.x = -0.22 + Math.sin(t * 0.09) * 0.05 - state.pointerY * 0.12;

    group.updateMatrixWorld();
    updateLabels();

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    render();
    requestAnimationFrame(loop);
  }

  if (reduced) {
    // estado estático: nada anima, mas a cena continua bonita
    uniforms.uDrift.value = 0;
    render();
  } else {
    requestAnimationFrame(loop);
  }

  document.documentElement.classList.add("fx-on");

  return { setSlide, redraw: render, reduced };
}

const fx = boot();
if (fx) {
  window.RCFX = fx;
  // pega o slide ativo assim que a cena sobe
  const active = document.querySelector(".slide.is-active");
  if (active) fx.setSlide(active);
  if (fx.reduced) fx.redraw();
}
