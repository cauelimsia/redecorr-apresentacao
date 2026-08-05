/* ============================================================
   RedeCORR · "organismo CORE5®"

   Uma cena WebGL contínua atrás do deck inteiro. Três camadas:

     campo distante   poeira lenta que dá paralaxe e profundidade
     organismo        2.800 partículas que mudam de forma com a narrativa
     núcleos          brilho aditivo nos cinco vértices do CORE5®

   Formações: chaos · pentagon · grid · constellation · burst
   A câmera voa entre enquadramentos por capítulo, as arestas do
   pentágono se energizam como circuito e o nó do pilar em foco acende.

   Degradação: sem WebGL o canvas não sobe e os diagramas SVG originais
   continuam no lugar. Com prefers-reduced-motion a cena congela num
   estado estático e só redesenha na troca de slide.
   ============================================================ */

import * as THREE from "./vendor/three.module.min.js";

const COUNT = 2800;
const FAR_COUNT = 900;
const R = 15;

/* ---------- utilidades ---------- */

// PRNG determinístico: mesma composição em toda sessão e todo deploy
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

// Vértices do pentágono, nó 1 no topo (mesma orientação do diagrama original)
const NODES = [];
for (let i = 0; i < 5; i++) {
  const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
  NODES.push(new THREE.Vector3(Math.cos(a) * R, -Math.sin(a) * R, 0));
}

// Grafo completo K5: as dez arestas
const EDGES = [];
for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) EDGES.push([i, j]);

/* ---------- formações ---------- */

function fmtPentagon() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT);
  const clusterCount = Math.floor(COUNT * 0.55);
  for (let i = 0; i < COUNT; i++) {
    let x, y, z, n;
    if (i < clusterCount) {
      n = i % 5;
      const c = NODES[n];
      const r = 2.6 * Math.cbrt(rnd());
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      x = c.x + r * Math.sin(ph) * Math.cos(th);
      y = c.y + r * Math.sin(ph) * Math.sin(th);
      z = c.z + r * Math.cos(ph) * 0.7;
    } else {
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
  const cols = 60;
  const rows = Math.ceil(COUNT / cols);
  for (let i = 0; i < COUNT; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    const x = (cx / (cols - 1) - 0.5) * 66;
    const z = (cy / (rows - 1) - 0.5) * 48;
    const y = Math.sin(x * 0.16) * 1.9 + Math.cos(z * 0.2) * 1.5 - 14;
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
    const r = 26 + Math.pow(rnd(), 0.4) * 18;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8;
    pos[i * 3 + 2] = r * Math.cos(ph) * 0.7;
  }
  return { pos, node };
}

// Estado inicial da abertura: tudo longe, antes de convergir
function fmtSeed() {
  const pos = new Float32Array(COUNT * 3);
  const node = new Float32Array(COUNT).fill(-1);
  for (let i = 0; i < COUNT; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const r = 70 + rnd() * 60;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph) - 40;
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
const SEED = fmtSeed();

/* ---------- enquadramentos de câmera ---------- */

// Enquadramentos calibrados para o pentágono (raio 15, deslocado 21 à
// direita) caber inteiro com folga para os rótulos.
const CAMS = {
  wide: { pos: [0, 0, 62], look: [0, 0, 0] },
  close: { pos: [0, 1, 58], look: [0, 0, 0] },
  low: { pos: [0, -8, 60], look: [0, 3, 0] },
  hover: { pos: [0, 7, 62], look: [0, -7, 0] },
  inside: { pos: [0, 0, 15], look: [0, 0, 0] },
};

function camFor(form, dim, explicit) {
  if (explicit && CAMS[explicit]) return explicit;
  if (form === "grid") return "hover";
  if (form === "burst") return "inside";
  if (form === "pentagon" && !dim) return "close";
  if (form === "chaos") return "low";
  return "wide";
}

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

  float nodeNow = mix(aNodeA, aNodeB, step(0.5, uMorph));
  float hi = (uFocus >= 0.0 && abs(nodeNow - uFocus) < 0.5) ? 1.0 : 0.0;
  vHi = hi;

  float tw = 0.72 + 0.28 * sin(uTime * 1.5 + s * 3.1);
  // Realce contido: em slide claro um nó muito forte vira mancha escura
  gl_PointSize = uSize * (1.0 + hi * 0.85) * tw * (260.0 / max(dist, 1.0));
  vAlpha = smoothstep(190.0, 25.0, dist) * (0.55 + 0.45 * tw) * (1.0 + hi * 0.45);

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

// Arestas que se energizam: cada uma se desenha da origem ao destino,
// escalonadas, como um circuito ligando.
const LINE_VERT = `
attribute float aT;
attribute float aEdge;
varying float vT;
varying float vEdge;
void main() {
  vT = aT;
  vEdge = aEdge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const LINE_FRAG = `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uProgress;
uniform float uCount;
varying float vT;
varying float vEdge;

void main() {
  float start = (vEdge / uCount) * 0.55;
  float local = clamp((uProgress - start) / 0.45, 0.0, 1.0);
  if (vT > local) discard;
  // ponta da linha mais brilhante enquanto desenha
  float head = smoothstep(local - 0.12, local, vT) * (1.0 - step(0.999, local));
  gl_FragColor = vec4(uColor, uOpacity * (0.55 + head * 0.9));
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
    if (!renderer.getContext()) return null;
  } catch (e) {
    return null;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(0, 0, 62);
  const camLook = new THREE.Vector3(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  /* --- camada 1: campo distante (paralaxe) --- */
  const farGeo = new THREE.BufferGeometry();
  const farPos = new Float32Array(FAR_COUNT * 3);
  const farSeed = new Float32Array(FAR_COUNT);
  for (let i = 0; i < FAR_COUNT; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(2 * rnd() - 1);
    const r = 120 + rnd() * 90;
    farPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    farPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
    farPos[i * 3 + 2] = r * Math.cos(ph) * 0.5 - 60;
    farSeed[i] = rnd();
  }
  farGeo.setAttribute("position", new THREE.BufferAttribute(farPos, 3));
  farGeo.setAttribute("aPosA", new THREE.BufferAttribute(farPos, 3));
  farGeo.setAttribute("aPosB", new THREE.BufferAttribute(farPos, 3));
  farGeo.setAttribute("aNodeA", new THREE.BufferAttribute(new Float32Array(FAR_COUNT).fill(-1), 1));
  farGeo.setAttribute("aNodeB", new THREE.BufferAttribute(new Float32Array(FAR_COUNT).fill(-1), 1));
  farGeo.setAttribute("aSeed", new THREE.BufferAttribute(farSeed, 1));
  farGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 300);

  const farUniforms = {
    uTime: { value: 0 },
    uMorph: { value: 1 },
    uSize: { value: 1.5 },
    uFocus: { value: -1 },
    uDrift: { value: 0 },
    uColor: { value: new THREE.Color("#6ea8ff") },
    uColorHi: { value: new THREE.Color("#6ea8ff") },
    uOpacity: { value: 0 },
  };
  const farField = new THREE.Points(
    farGeo,
    new THREE.ShaderMaterial({
      uniforms: farUniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
    })
  );
  scene.add(farField);

  /* --- camada 2: o organismo --- */
  const geo = new THREE.BufferGeometry();
  const posA = new Float32Array(SEED.pos);
  const posB = new Float32Array(FORMS.constellation.pos);
  const nodeA = new Float32Array(SEED.node);
  const nodeB = new Float32Array(FORMS.constellation.node);
  const seed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) seed[i] = rnd();

  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute("aPosA", new THREE.BufferAttribute(posA, 3));
  geo.setAttribute("aPosB", new THREE.BufferAttribute(posB, 3));
  geo.setAttribute("aNodeA", new THREE.BufferAttribute(nodeA, 1));
  geo.setAttribute("aNodeB", new THREE.BufferAttribute(nodeB, 1));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 160);

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uSize: { value: 2.5 },
    uFocus: { value: -1 },
    uDrift: { value: 0.55 },
    uColor: { value: new THREE.Color("#6ea8ff") },
    uColorHi: { value: new THREE.Color("#ffffff") },
    uOpacity: { value: 0 },
  };
  const points = new THREE.Points(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
    })
  );
  group.add(points);

  /* --- camada 3: núcleos com brilho aditivo --- */
  const coreGeo = new THREE.BufferGeometry();
  const corePos = new Float32Array(15);
  const coreNode = new Float32Array(5);
  NODES.forEach((n, i) => {
    corePos.set([n.x, n.y, n.z], i * 3);
    coreNode[i] = i;
  });
  coreGeo.setAttribute("position", new THREE.BufferAttribute(corePos, 3));
  coreGeo.setAttribute("aPosA", new THREE.BufferAttribute(corePos, 3));
  coreGeo.setAttribute("aPosB", new THREE.BufferAttribute(corePos, 3));
  coreGeo.setAttribute("aNodeA", new THREE.BufferAttribute(coreNode, 1));
  coreGeo.setAttribute("aNodeB", new THREE.BufferAttribute(coreNode, 1));
  coreGeo.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array([0.1, 0.3, 0.5, 0.7, 0.9]), 1));
  coreGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

  const coreUniforms = {
    uTime: { value: 0 },
    uMorph: { value: 1 },
    uSize: { value: 34 },
    uFocus: { value: -1 },
    uDrift: { value: 0 },
    uColor: { value: new THREE.Color("#2f6be0") },
    uColorHi: { value: new THREE.Color("#a9c8ff") },
    uOpacity: { value: 0 },
  };
  const cores = new THREE.Points(
    coreGeo,
    new THREE.ShaderMaterial({
      uniforms: coreUniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(cores);

  /* --- arestas do pentágono --- */
  const linePos = new Float32Array(EDGES.length * 6);
  const lineT = new Float32Array(EDGES.length * 2);
  const lineE = new Float32Array(EDGES.length * 2);
  EDGES.forEach((e, i) => {
    const a = NODES[e[0]];
    const b = NODES[e[1]];
    linePos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    lineT.set([0, 1], i * 2);
    lineE.set([i, i], i * 2);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute("aT", new THREE.BufferAttribute(lineT, 1));
  lineGeo.setAttribute("aEdge", new THREE.BufferAttribute(lineE, 1));

  const lineUniforms = {
    uColor: { value: new THREE.Color("#6ea8ff") },
    uOpacity: { value: 0 },
    uProgress: { value: 0 },
    uCount: { value: EDGES.length },
  };
  const lines = new THREE.LineSegments(
    lineGeo,
    new THREE.ShaderMaterial({
      uniforms: lineUniforms,
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      depthWrite: false,
    })
  );
  group.add(lines);

  /* ---------- estado ---------- */

  const state = { form: null, rotY: 0, pointerX: 0, pointerY: 0, tgtX: 0, tgtY: 0 };
  const G = window.gsap;

  function narrowScale() {
    return window.innerWidth < 960 ? 0.6 : 1;
  }

  function tween(target, vars) {
    if (G && !reduced) return G.to(target, vars);
    Object.keys(vars).forEach((k) => {
      if (["duration", "ease", "delay", "onUpdate", "onComplete", "overwrite"].includes(k)) return;
      target[k] = vars[k];
    });
    if (vars.onUpdate) vars.onUpdate();
    if (vars.onComplete) vars.onComplete();
    return null;
  }

  // Morph encadeável: congela a interpolação atual em A e anima até B
  function morphTo(formName, duration) {
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
      duration: duration || 1.5,
      ease: "power2.inOut",
      overwrite: true,
    });
  }

  function flyCamera(name) {
    const c = CAMS[name] || CAMS.wide;
    tween(camera.position, {
      x: c.pos[0],
      y: c.pos[1],
      z: c.pos[2],
      duration: 1.6,
      ease: "power2.inOut",
      overwrite: true,
    });
    tween(camLook, {
      x: c.look[0],
      y: c.look[1],
      z: c.look[2],
      duration: 1.6,
      ease: "power2.inOut",
      overwrite: true,
    });
  }

  /* ---------- rótulos ancorados nos nós 3D ---------- */

  const labelEls = Array.from(document.querySelectorAll("[data-fx-labels] .fx-label"));
  const labelWrap = document.querySelector("[data-fx-labels]");
  const proj = new THREE.Vector3();
  let labelsVisible = false;

  function setLabels(on) {
    labelsVisible = on;
    if (labelWrap) labelWrap.classList.toggle("is-on", on);
  }

  function updateLabels() {
    if (!labelsVisible) return;
    // projeta na caixa do canvas (o painel do apresentador reduz a altura)
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    for (let i = 0; i < labelEls.length; i++) {
      proj.copy(NODES[i]).applyMatrix4(group.matrixWorld).project(camera);
      const x = (proj.x * 0.5 + 0.5) * w;
      const y = (-proj.y * 0.5 + 0.5) * h;
      const dx = NODES[i].x === 0 ? 0 : Math.sign(NODES[i].x);
      const dy = Math.sign(NODES[i].y);
      // trava dentro da tela: rótulo nunca sai pela borda
      const half = labelEls[i].offsetWidth / 2 + 12;
      const lx = Math.min(Math.max(x + dx * 58, half), w - half);
      labelEls[i].style.transform = `translate(-50%, -50%) translate(${lx}px, ${y - dy * 34}px)`;
      labelEls[i].classList.toggle("is-focus", uniforms.uFocus.value === i);
    }
  }

  /* ---------- API por slide ---------- */

  function setSlide(el) {
    if (!el) return;
    const form = el.dataset.fx || "constellation";
    const focus = el.dataset.fxFocus ? parseInt(el.dataset.fxFocus, 10) - 1 : -1;
    const light = el.classList.contains("slide--light");
    const dim = el.dataset.fxDim === "1";
    const narrow = window.innerWidth < 960;
    const place = narrow ? "center" : el.dataset.fxX || "right";

    morphTo(form);
    flyCamera(camFor(form, dim, el.dataset.cam));

    uniforms.uFocus.value = form === "pentagon" ? focus : -1;
    coreUniforms.uFocus.value = uniforms.uFocus.value;

    const col = light ? "#2563eb" : "#6ea8ff";
    const colHi = light ? "#1d4ed8" : "#ffffff";
    tween(uniforms.uColor.value, { ...new THREE.Color(col), duration: 0.8, ease: "power2.out" });
    tween(uniforms.uColorHi.value, { ...new THREE.Color(colHi), duration: 0.8, ease: "power2.out" });
    lineUniforms.uColor.value.set(col);
    tween(farUniforms.uColor.value, {
      ...new THREE.Color(light ? "#9db4d8" : "#6ea8ff"),
      duration: 0.8,
    });

    let op = light ? 0.55 : 0.9;
    if (dim) op *= form === "pentagon" ? 0.3 : 0.4;
    if (form === "pentagon" && !dim) op = light ? 0.8 : 1;
    if (place === "center" && !dim) op *= 0.48;
    tween(uniforms.uOpacity, { value: op, duration: 0.9, ease: "power2.out" });

    // campo distante: só respira nos slides escuros, some no papel
    tween(farUniforms.uOpacity, {
      value: light ? 0.12 : 0.5,
      duration: 1.1,
      ease: "power2.out",
    });

    // núcleos aditivos só rendem sobre fundo escuro
    const showCores = form === "pentagon" && !light;
    tween(coreUniforms.uOpacity, {
      value: showCores ? (dim ? 0.18 : 0.55) : 0,
      duration: 0.9,
      delay: showCores ? 0.7 : 0,
      ease: "power2.out",
    });

    // arestas energizam como circuito depois que a formação assenta
    if (form === "pentagon") {
      lineUniforms.uProgress.value = 0;
      tween(lineUniforms.uOpacity, {
        value: dim ? 0.12 : light ? 0.3 : 0.5,
        duration: 0.5,
        delay: 0.85,
      });
      tween(lineUniforms.uProgress, {
        value: 1,
        duration: 1.5,
        delay: 0.85,
        ease: "power2.inOut",
        overwrite: true,
      });
    } else {
      tween(lineUniforms.uOpacity, { value: 0, duration: 0.5, ease: "power2.out" });
    }

    // Deslocamento derivado do campo de visão da câmera atual: assim o
    // pentágono ocupa a coluna direita sem estourar a borda em nenhum
    // enquadramento nem em nenhuma proporção de tela.
    const cam = CAMS[camFor(form, dim, el.dataset.cam)] || CAMS.wide;
    const halfH = Math.tan((45 * Math.PI) / 360) * cam.pos[2];
    const halfW = halfH * camera.aspect;

    tween(group.position, {
      x: place === "center" ? 0 : halfW * 0.42,
      duration: 1.4,
      ease: "power3.out",
      overwrite: true,
    });

    const s = (form === "pentagon" && dim ? 0.82 : 1) * narrowScale();
    tween(group.scale, { x: s, y: s, z: s, duration: 1.4, ease: "power3.out", overwrite: true });

    let ry = 0;
    if (form === "pentagon" && focus >= 0) ry = -0.24 + focus * 0.12;
    if (form === "grid") ry = 0.1;
    tween(state, { rotY: ry, duration: 1.6, ease: "power2.inOut", overwrite: true });

    tween(uniforms.uDrift, {
      value: form === "chaos" ? 1.5 : form === "pentagon" ? 0.22 : 0.55,
      duration: 1.2,
      ease: "power2.out",
    });

    setLabels(form === "pentagon" && !dim && !narrow && place !== "center");

    if (reduced) requestAnimationFrame(render);
  }

  /* ---------- interação, loop, ciclo de vida ---------- */

  window.addEventListener(
    "pointermove",
    (e) => {
      state.tgtX = (e.clientX / window.innerWidth - 0.5) * 2;
      state.tgtY = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  // O canvas encolhe quando o painel do apresentador abre, então a cena
  // é dimensionada pela caixa do elemento, não pela janela.
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const active = document.querySelector(".slide.is-active");
    if (active) setSlide(active);
  }
  window.addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  resize();

  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(loop);
  });

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
    farUniforms.uTime.value = t;
    coreUniforms.uTime.value = t;

    state.pointerX += (state.tgtX - state.pointerX) * 0.045;
    state.pointerY += (state.tgtY - state.pointerY) * 0.045;

    group.rotation.y = state.rotY + Math.sin(t * 0.13) * 0.16 + state.pointerX * 0.2;
    group.rotation.x = -0.22 + Math.sin(t * 0.09) * 0.05 - state.pointerY * 0.12;

    // campo distante gira ao contrário: reforça a sensação de profundidade
    farField.rotation.y = -t * 0.008 - state.pointerX * 0.06;
    farField.rotation.x = state.pointerY * 0.03;

    camera.lookAt(camLook);
    group.updateMatrixWorld();
    updateLabels();

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    render();
    requestAnimationFrame(loop);
  }

  document.documentElement.classList.add("fx-on");

  // Abertura: as partículas convergem do longe para a primeira formação
  function intro() {
    const active = document.querySelector(".slide.is-active");
    state.form = "constellation";
    if (reduced) {
      uniforms.uMorph.value = 1;
      if (active) setSlide(active);
      render();
      return;
    }
    tween(uniforms.uMorph, { value: 1, duration: 2.4, ease: "power2.out" });
    if (active) setSlide(active);
    requestAnimationFrame(loop);
  }

  intro();

  return { setSlide, redraw: render, reduced };
}

const fx = boot();
if (fx) window.RCFX = fx;
