// SOUND ENGINE — The Architecture of Sound.
// 홈 히어로의 3D 시그니처 오브젝트. 5개 레이어:
// 01 Outer Frame · 02 Mechanical Ring · 03 Resonance Chamber · 04 Energy Core · 05 Particles
// 소리는 나중에 붙인다: window.SoundEngine.setLevels({ low, mid, high, volume }) 와
// "engine:ignite" 이벤트로 연결하면 된다.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const stage = document.querySelector("[data-engine]");
const canvas = stage && stage.querySelector(".engine-canvas");
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

if (stage && canvas) {
  if (supportsGL()) {
    try { init(); } catch (e) { console.error(e); stage.classList.add("no-webgl"); }
  } else {
    stage.classList.add("no-webgl");
  }
}

function init() {
  /* ---------------- palette ---------------- */
  const C = {
    void: 0x080b09,
    blackTi: 0x111513,
    silver: 0x8d9891,
    green: 0x00e676,
    dark: 0x26332b,
    glass: 0xb8dcc4,
  };
  const glow = (k) => new THREE.Color(C.green).multiplyScalar(k);

  /* ---------------- renderer / scene ---------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(C.void, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // 톤매핑 후 CSS 배경(#080B09)과 맞도록 보정한 배경색
  scene.background = new THREE.Color(C.void).multiplyScalar(3.8);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.08));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7dffc0, 1.1);
  rim.position.set(-5, -2, -4);
  scene.add(rim);
  const coreLight = new THREE.PointLight(C.green, 10, 6, 2);
  scene.add(coreLight);

  /* ---------------- materials ---------------- */
  const M = {
    titanium: new THREE.MeshStandardMaterial({ color: C.silver, metalness: 1, roughness: 0.26 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd4dbd6, metalness: 1, roughness: 0.1 }),
    blackTi: new THREE.MeshStandardMaterial({ color: C.blackTi, metalness: 0.9, roughness: 0.32 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: C.dark, metalness: 1, roughness: 0.36 }),
    brushed: new THREE.MeshStandardMaterial({ color: C.silver, metalness: 1, roughness: 0.42 }),
    neon: new THREE.MeshBasicMaterial({ color: glow(2.4), toneMapped: false }),
    neonDim: new THREE.MeshBasicMaterial({ color: glow(1.1), toneMapped: false }),
  };

  /* ---------------- rig ---------------- */
  const root = new THREE.Group(); // scroll / layout
  const engine = new THREE.Group(); // tilt
  root.add(engine);
  scene.add(root);

  const layer = {}; // animated parts

  /* ===== 01. OUTER FRAME — 티타늄 짐벌 링 + 베젤 ===== */
  const gimbal = new THREE.Group();
  engine.add(gimbal);

  const frameA = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.022, 16, 320), M.titanium);
  const frameB = new THREE.Mesh(new THREE.TorusGeometry(2.74, 0.013, 12, 320), M.titanium);
  frameB.rotation.x = Math.PI / 2;
  gimbal.add(frameA, frameB);

  // 프레임 위의 노드
  const nodeGeo = new THREE.SphereGeometry(0.055, 24, 16);
  [0, Math.PI].forEach((a) => {
    const n = new THREE.Mesh(nodeGeo, M.chrome);
    n.position.set(Math.cos(a) * 2.62, Math.sin(a) * 2.62, 0);
    frameA.add(n);
  });
  const nodeG = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), M.neon);
  nodeG.position.set(0, 2.62, 0);
  frameA.add(nodeG);
  const nodeG2 = nodeG.clone();
  nodeG2.position.set(0, -2.74, 0);
  frameB.add(nodeG2);

  // 베젤: 시계처럼 촘촘한 눈금
  const bezel = new THREE.Group();
  engine.add(bezel);
  bezel.add(new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.012, 10, 300), M.chrome));
  bezel.add(new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.006, 8, 300), M.brushed));
  {
    const TICKS = 180;
    const tickGeo = new THREE.BoxGeometry(0.009, 1, 0.02);
    const ticks = new THREE.InstancedMesh(tickGeo, M.brushed, TICKS);
    const gTicks = new THREE.InstancedMesh(tickGeo, M.neon, 12);
    const d = new THREE.Object3D();
    let gi = 0;
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * Math.PI * 2;
      const major = i % 15 === 0;
      const len = major ? 0.12 : i % 5 === 0 ? 0.075 : 0.045;
      const r = 2.33 + len / 2;
      d.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
      d.rotation.set(0, 0, a - Math.PI / 2);
      d.scale.set(major ? 1.6 : 1, len, 1);
      d.updateMatrix();
      if (major) gTicks.setMatrixAt(gi++, d.matrix);
      else ticks.setMatrixAt(i, d.matrix);
    }
    bezel.add(ticks, gTicks);
  }
  layer.gimbal = gimbal;
  layer.frameA = frameA;
  layer.frameB = frameB;
  layer.bezel = bezel;

  /* ===== 02. MECHANICAL RING — 서로 반대로 도는 기어 ===== */
  function gearGeometry(rOuter, rRoot, teeth, rHole, depth) {
    const s = new THREE.Shape();
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      const pts = [
        [rRoot, a],
        [rOuter, a + step * 0.18],
        [rOuter, a + step * 0.48],
        [rRoot, a + step * 0.66],
      ];
      pts.forEach(([r, t], k) => {
        const x = Math.cos(t) * r;
        const y = Math.sin(t) * r;
        if (i === 0 && k === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      });
    }
    s.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, rHole, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 96,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  }

  const gear1 = new THREE.Group();
  gear1.add(new THREE.Mesh(gearGeometry(2.08, 1.99, 84, 1.72, 0.12), M.darkMetal));
  gear1.add(new THREE.Mesh(new THREE.TorusGeometry(1.74, 0.007, 8, 256), M.neon));
  {
    const boltGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.05, 16);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const b = new THREE.Mesh(boltGeo, M.chrome);
      b.rotation.x = Math.PI / 2;
      b.position.set(Math.cos(a) * 1.86, Math.sin(a) * 1.86, 0.08);
      gear1.add(b);
    }
  }
  engine.add(gear1);

  const gear2 = new THREE.Group();
  gear2.add(new THREE.Mesh(gearGeometry(1.56, 1.49, 44, 1.32, 0.1), M.brushed));
  {
    // 스포크
    const spokeGeo = new THREE.BoxGeometry(0.74, 0.03, 0.045);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sp = new THREE.Mesh(spokeGeo, M.blackTi);
      sp.position.set(Math.cos(a) * 0.98, Math.sin(a) * 0.98, -0.1);
      sp.rotation.z = a;
      gear2.add(sp);
    }
    // 창(슬롯) 느낌의 짧은 바
    const slotGeo = new THREE.BoxGeometry(0.11, 0.02, 0.03);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const sl = new THREE.Mesh(slotGeo, i % 6 === 0 ? M.neonDim : M.chrome);
      sl.position.set(Math.cos(a) * 1.41, Math.sin(a) * 1.41, 0.07);
      sl.rotation.z = a;
      gear2.add(sl);
    }
  }
  engine.add(gear2);
  layer.gear1 = gear1;
  layer.gear2 = gear2;

  /* ===== 03. RESONANCE CHAMBER — 동심원 진동판 ===== */
  const res = new THREE.Group();
  engine.add(res);

  const membraneMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmp: { value: 0.025 }, uGlow: { value: 0.3 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uAmp;
      varying float vR;
      void main() {
        vec3 p = position;
        float r = length(p.xy);
        vR = r;
        float env = smoothstep(1.4, 0.95, r) * smoothstep(0.55, 0.72, r);
        p.z += sin(r * 18.0 - uTime * 3.2) * uAmp * env;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uGlow;
      varying float vR;
      void main() {
        float band = fract(vR * 14.0 - uTime * 0.55);
        float line = smoothstep(0.0, 0.05, band) * smoothstep(0.14, 0.05, band);
        float edge = smoothstep(0.55, 0.7, vR) * smoothstep(1.4, 1.22, vR);
        vec3 base = vec3(0.035, 0.05, 0.042);
        vec3 g = vec3(0.0, 1.0, 0.5);
        vec3 col = base + g * line * (0.25 + uGlow) * 1.8;
        gl_FragColor = vec4(col, (0.6 + line * 0.4) * edge);
      }`,
  });
  const membrane = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.4, 220, 36), membraneMat);
  res.add(membrane);

  const resRings = [];
  for (let i = 0; i < 7; i++) {
    const r = 0.68 + i * 0.1;
    const mat = i === 3 ? M.neonDim : i % 2 ? M.chrome : M.brushed;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, i === 3 ? 0.005 : 0.008, 8, 220), mat);
    res.add(ring);
    resRings.push(ring);
  }
  layer.res = res;

  /* ===== 04. ENERGY CORE — 유리 안에서 맥동하는 녹색 에너지 ===== */
  const core = new THREE.Group();
  engine.add(core);

  const coreMat = new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vO;
      void main() {
        vO = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uIntensity;
      varying vec3 vN; varying vec3 vV; varying vec3 vO;
      void main() {
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
        vec3 o = vO * 1.0;
        float n = sin(o.x * 9.0 + uTime * 2.1) * sin(o.y * 11.0 - uTime * 1.7) * sin(o.z * 8.0 + uTime * 1.3);
        float n2 = sin(o.x * 23.0 - uTime * 3.0 + o.y * 17.0) * 0.5 + 0.5;
        float pulse = 0.5 + 0.5 * sin(uTime * 2.4);
        vec3 deep = vec3(0.0, 0.18, 0.09);
        vec3 hot = vec3(0.45, 1.0, 0.68);
        vec3 col = mix(deep, hot, clamp(fres * 0.7 + (n * 0.5 + 0.5) * 0.45 + n2 * 0.15, 0.0, 1.0));
        col *= (1.1 + pulse * 0.7) * uIntensity;
        gl_FragColor = vec4(col * 1.6, 1.0);
      }`,
  });
  const coreSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 6), coreMat);
  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 3.2, 1.9), toneMapped: false })
  );
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 48),
    new THREE.MeshPhysicalMaterial({
      color: C.glass,
      metalness: 0,
      roughness: 0.06,
      transmission: 1,
      thickness: 0.6,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 1,
    })
  );
  const cage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.62, 1)),
    new THREE.LineBasicMaterial({ color: 0xc8d1cb, transparent: true, opacity: 0.4 })
  );
  const cage2 = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.78, 0)),
    new THREE.LineBasicMaterial({ color: glow(1.4), transparent: true, opacity: 0.45, toneMapped: false })
  );
  core.add(coreSphere, heart, glass, cage, cage2);
  layer.core = core;
  layer.cage = cage;
  layer.cage2 = cage2;

  // 클릭 시 퍼지는 충격파 링
  const waves = [0, 1].map(() => {
    const w = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.012, 8, 200),
      new THREE.MeshBasicMaterial({
        color: glow(2.2),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    w.visible = false;
    engine.add(w);
    return w;
  });

  /* ===== 05. PARTICLES — 빛 입자 + 금속 파편 ===== */
  const N = 2400;
  const pPos = new Float32Array(N * 3);
  const pSize = new Float32Array(N);
  const pRand = new Float32Array(N);
  const pGreen = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const disc = Math.random() < 0.65;
    const r = 2.9 + Math.pow(Math.random(), 1.6) * (disc ? 4.2 : 6.5);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    let x = r * Math.sin(ph) * Math.cos(th);
    let y = r * Math.cos(ph);
    let z = r * Math.sin(ph) * Math.sin(th);
    if (disc) y *= 0.22;
    pPos.set([x, y, z], i * 3);
    pSize[i] = 0.6 + Math.random() * 1.8;
    pRand[i] = Math.random();
    pGreen[i] = Math.random() < 0.2 ? 1 : 0;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
  pGeo.setAttribute("aRand", new THREE.BufferAttribute(pRand, 1));
  pGeo.setAttribute("aGreen", new THREE.BufferAttribute(pGreen, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uBurst: { value: 0 },
      uHigh: { value: 0 },
      uPR: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uBurst, uHigh, uPR;
      attribute float aSize, aRand, aGreen;
      varying float vGreen, vA;
      void main() {
        vec3 p = position;
        float a = uTime * (0.03 + aRand * 0.05);
        float c = cos(a), s = sin(a);
        p.xz = mat2(c, -s, s, c) * p.xz;
        p.y += sin(uTime * 0.5 + aRand * 6.2831) * 0.08;
        p *= 1.0 + uBurst * (0.25 + aRand * 0.55);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(aSize * uPR * (1.0 + uHigh * 1.5 + uBurst * 1.2) * (9.0 / -mv.z), 4.5 * uPR);
        vGreen = aGreen;
        vA = (0.3 + 0.7 * fract(aRand * 7.31)) * (0.55 + 0.45 * sin(uTime * 2.0 + aRand * 40.0));
      }`,
    fragmentShader: /* glsl */ `
      varying float vGreen, vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        vec3 col = mix(vec3(0.32, 0.36, 0.34), vec3(0.0, 1.0, 0.5) * 1.8, vGreen);
        gl_FragColor = vec4(col * a * vA, a * vA);
      }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // 금속 파편 벨트
  const SH = 110;
  const shardMat = new THREE.MeshStandardMaterial({ color: 0x9aa59e, metalness: 1, roughness: 0.32, envMapIntensity: 0.55 });
  const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.05), shardMat, SH);
  const shardData = Array.from({ length: SH }, () => ({
    r: 2.95 + Math.random() * 1.1,
    a: Math.random() * Math.PI * 2,
    y: (Math.random() - 0.5) * 0.35,
    sp: 0.08 + Math.random() * 0.12,
    rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0),
    spin: 0.5 + Math.random() * 2,
    s: 0.5 + Math.random() * 1.3,
    k: 0.3 + Math.random() * 0.9,
  }));
  const belt = new THREE.Group();
  belt.rotation.x = 0.32;
  belt.add(shards);
  engine.add(belt);
  const dummy = new THREE.Object3D();

  /* ---------------- post ---------------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.75, 0.38, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------------- sizing ---------------- */
  let W = 1, H = 1, PR = 1;
  function resize() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    PR = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(PR);
    renderer.setSize(W, H, false);
    composer.setPixelRatio(PR);
    composer.setSize(W, H);
    const aspect = W / H;
    camera.aspect = aspect;
    const fit = 4.0 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, aspect * 0.95));
    camera.position.set(0, 0, fit);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    // 넓은 화면에서는 엔진을 오른쪽으로 비켜 좌하단 카피와 겹치지 않게
    root.position.x = aspect > 1.15 ? Math.min(1.9, (aspect - 1.0) * 2.6) : 0;
    const halfH = fit * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // 세로 화면에서는 엔진을 위로 올려 아래쪽 카피 영역을 비운다
    root.position.y = aspect > 1.15 ? 0.15 : halfH * 0.34;
    pMat.uniforms.uPR.value = PR;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* ---------------- input ---------------- */
  const pointer = new THREE.Vector2(0, 0);
  const pointerS = new THREE.Vector2(0, 0);
  let pointerIn = false;
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    pointerIn = true;
  });
  stage.addEventListener("pointerleave", () => {
    pointerIn = false;
    pointer.set(0, 0);
  });

  const levels = { low: 0, mid: 0, high: 0, volume: 0 };
  const lv = { low: 0, mid: 0, high: 0, volume: 0 };

  let igniteAt = -1e9;
  function ignite() {
    igniteAt = clock();
    waves.forEach((w) => (w.visible = true));
    stage.classList.add("is-ignited");
    clearTimeout(ignite._t);
    ignite._t = setTimeout(() => stage.classList.remove("is-ignited"), 900);
    stage.dispatchEvent(new CustomEvent("engine:ignite", { bubbles: true }));
  }
  stage.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    ignite();
  });

  // 나중에 소리를 붙일 자리
  window.SoundEngine = {
    setLevels(o) { Object.assign(levels, o); },
    ignite,
    get state() { return state; },
  };

  /* ---------------- visibility ---------------- */
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 }).observe(stage);

  /* ---------------- HUD ---------------- */
  const hud = {
    state: stage.querySelector("[data-hud-state]"),
    rpm: stage.querySelector("[data-hud-rpm]"),
    core: stage.querySelector("[data-hud-core]"),
    bars: stage.querySelectorAll("[data-hud-bar]"),
  };
  let hudT = 0;
  let state = "BOOT";

  /* ---------------- easing ---------------- */
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
  const easeInOut = (x) => {
    x = clamp01(x);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

  const t0 = performance.now();
  const clock = () => (performance.now() - t0) / 1000;

  // 레이어마다 다른 관성: 마우스·클릭에 서로 다른 속도로 반응
  const spin = {
    frameA: { base: 0.24, k: 1.2, m: 1, ang: 0.4 },
    frameB: { base: -0.17, k: 0.8, m: 1, ang: 0.9 },
    bezel: { base: 0.035, k: 2.5, m: 1, ang: 0 },
    gear1: { base: -0.11, k: 3.5, m: 1, ang: 0 },
    gear2: { base: 0.2, k: 5, m: 1, ang: 0 },
    res: { base: 0.05, k: 4, m: 1, ang: 0 },
    cage: { base: 0.32, k: 6, m: 1, ang: 0 },
    cage2: { base: -0.22, k: 6, m: 1, ang: 0 },
  };

  let last = clock();
  const tilt = { x: 0, y: 0 };
  let coreI = 1;

  function frame() {
    requestAnimationFrame(frame);
    const now = clock();
    const dt = Math.min(0.05, now - last);
    last = now;
    if (!visible || document.hidden) return;

    const T = REDUCED ? now * 0.15 : now;

    // 오디오 레벨 스무딩 (지금은 0, 나중에 소리가 들어오면 반응)
    for (const k in lv) lv[k] = damp(lv[k], levels[k] || 0, 12, dt);

    // 인트로: 분해된 상태에서 조립
    const intro = REDUCED ? 0 : 1 - easeInOut((now - 0.15) / 2.4);

    // 클릭 타임라인
    const ti = now - igniteAt;
    let sep = 0;
    if (ti >= 0 && ti < 3) {
      sep = ti < 0.32 ? easeOut(ti / 0.32) : ti < 0.85 ? 1 : 1 - easeInOut((ti - 0.85) / 1.4);
    }
    const boost = ti >= 0 ? 7 * Math.exp(-ti * 1.5) : 0;
    const flash = ti >= 0 ? Math.exp(-ti * 2.6) : 0;
    const S = Math.max(sep, intro);

    // 마우스
    pointerS.x = damp(pointerS.x, pointer.x, 4, dt);
    pointerS.y = damp(pointerS.y, pointer.y, 4, dt);
    const cxN = root.position.x / (camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const hover = pointerIn ? 1 - clamp01(Math.hypot(pointer.x - cxN, pointer.y * 0.8) / 0.5) : 0;

    tilt.x = damp(tilt.x, 0.2 - pointerS.y * 0.28 + S * 0.12, 3, dt);
    tilt.y = damp(tilt.y, -0.42 + pointerS.x * 0.4 - S * 0.25, 3, dt);
    engine.rotation.x = tilt.x + Math.sin(T * 0.4) * 0.03;
    engine.rotation.y = tilt.y + Math.cos(T * 0.33) * 0.04;

    // 스크롤
    const sp = clamp01(window.scrollY / Math.max(1, stage.offsetHeight));
    root.rotation.z = sp * 0.5;
    root.scale.setScalar(1 - sp * 0.18);

    // 회전
    const target = 1 + boost + hover * 0.9 + lv.low * 2.5;
    const tm = REDUCED ? 0.15 : 1;
    for (const key in spin) {
      const s = spin[key];
      s.m = damp(s.m, target, s.k, dt);
      s.ang += s.base * s.m * dt * tm;
    }
    layer.frameA.rotation.y = spin.frameA.ang;
    layer.frameB.rotation.y = spin.frameB.ang;
    layer.gimbal.rotation.z = spin.frameB.ang * 0.3;
    layer.bezel.rotation.z = spin.bezel.ang;
    layer.gear1.rotation.z = spin.gear1.ang;
    layer.gear2.rotation.z = spin.gear2.ang;
    layer.res.rotation.z = spin.res.ang;
    layer.cage.rotation.set(spin.cage.ang * 0.7, spin.cage.ang, 0);
    layer.cage2.rotation.set(0, spin.cage2.ang, spin.cage2.ang * 0.5);

    // 분해(exploded view): 레이어가 z축으로 갈라진다
    layer.bezel.position.z = S * 1.1;
    layer.gear1.position.z = -S * 0.9;
    layer.gear2.position.z = S * 0.5;
    layer.res.position.z = -S * 0.15;
    layer.gimbal.scale.setScalar(1 + S * 0.16);
    layer.gear1.scale.setScalar(1 + S * 0.08);
    resRings.forEach((r, i) => {
      r.position.z = (i - 3) * S * 0.13 + Math.sin(T * 3 - i * 0.7) * (0.012 + lv.mid * 0.06);
    });
    layer.core.scale.setScalar(1 + S * 0.22 + Math.sin(T * 2.4) * 0.015 + lv.volume * 0.15);
    layer.cage.scale.setScalar(1 + S * 0.7);
    layer.cage2.scale.setScalar(1 + S * 0.5);

    // 진동판
    membraneMat.uniforms.uTime.value = T;
    membraneMat.uniforms.uAmp.value = 0.02 + lv.mid * 0.12 + flash * 0.08;
    membraneMat.uniforms.uGlow.value = 0.25 + hover * 0.3 + flash * 1.2 + lv.mid;

    // 코어 밝기
    const coreTarget = 1 + hover * 0.55 + flash * 2.4 + lv.volume * 1.6;
    coreI = damp(coreI, coreTarget, 8, dt);
    coreMat.uniforms.uTime.value = T;
    coreMat.uniforms.uIntensity.value = coreI;
    coreLight.intensity = 4 + coreI * 3.5;
    heart.scale.setScalar(0.85 + Math.sin(T * 2.4) * 0.12 + flash * 0.8);

    // 충격파
    waves.forEach((w, i) => {
      const tt = ti - i * 0.18;
      if (tt < 0 || tt > 1.6) {
        w.visible = false;
        return;
      }
      w.visible = true;
      const p = easeOut(tt / 1.6);
      w.scale.setScalar(0.6 + p * 4.2);
      w.material.opacity = (1 - p) * 0.9;
    });

    // 입자
    pMat.uniforms.uTime.value = T;
    pMat.uniforms.uBurst.value = Math.max(sep * 0.9, intro * 1.4);
    pMat.uniforms.uHigh.value = lv.high + flash * 0.5;
    points.rotation.y = -tilt.y * 0.3;

    // 파편
    for (let i = 0; i < SH; i++) {
      const d = shardData[i];
      d.a += d.sp * dt * (1 + boost * 0.6) * tm;
      const rr = d.r * (1 + S * d.k * 0.45);
      dummy.position.set(Math.cos(d.a) * rr, d.y * (1 + S * 3), Math.sin(d.a) * rr);
      dummy.rotation.set(d.rot.x + T * d.spin, d.rot.y + T * d.spin * 0.7, 0);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;

    // 블룸
    bloom.strength = 0.7 + flash * 1.1 + hover * 0.15 + lv.volume * 0.6;

    composer.render(dt);

    // HUD
    state = intro > 0.02 ? "BOOT" : ti >= 0 && ti < 0.85 ? "IGNITION" : ti >= 0 && ti < 2.3 ? "STABILIZING" : hover > 0.15 ? "ENGAGED" : "IDLE";
    hudT -= dt;
    if (hudT <= 0) {
      hudT = 0.09;
      if (hud.state) hud.state.textContent = state;
      if (hud.rpm) hud.rpm.textContent = String(Math.round(1240 * spin.gear2.m + Math.random() * 6)).padStart(4, "0");
      if (hud.core) hud.core.textContent = Math.min(99.9, 62 + coreI * 18 + Math.random() * 0.6).toFixed(1) + "%";
      const bars = [lv.low, lv.mid, lv.high];
      hud.bars.forEach((b, i) => {
        const idle = 0.12 + 0.1 * Math.sin(now * (2 + i) + i);
        b.style.setProperty("--v", Math.min(1, idle + bars[i] + flash * (0.9 - i * 0.15) + hover * 0.15).toFixed(3));
      });
    }
  }

  stage.classList.add("is-ready");
  requestAnimationFrame(frame);
}
