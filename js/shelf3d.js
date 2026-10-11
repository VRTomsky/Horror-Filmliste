// 3D-Videothekenregal im Kopf der Seite (Three.js)
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const hero = document.querySelector(".hero");
const canvas = document.getElementById("shelf");
const frontLabel = document.getElementById("shelf-front");
const films = window.FILMS || [];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fail() { hero.classList.add("no-webgl"); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) { fail(); }

if (renderer) init();

function spineTexture(f) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 840;
  const g = c.getContext("2d");
  g.fillStyle = "#121012"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = f.accent; g.fillRect(0, 0, c.width, 120);
  g.fillStyle = "#121012"; g.font = "64px VT323, monospace"; g.textAlign = "center";
  g.fillText("VHS", 64, 84);
  g.save();
  g.translate(64, 160); g.rotate(Math.PI / 2);
  g.fillStyle = "#f3ece8";
  let size = 64;
  g.font = `900 ${size}px Archivo, Impact, sans-serif`;
  const title = f.title.toUpperCase();
  while (g.measureText(title).width > 560 && size > 30) { size -= 2; g.font = `900 ${size}px Archivo, Impact, sans-serif`; }
  g.textAlign = "left"; g.textBaseline = "middle";
  g.fillText(title, 0, 0);
  g.restore();
  g.fillStyle = f.accent; g.font = "54px VT323, monospace"; g.textAlign = "center";
  g.fillText(String(f.year), 64, 800);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function plainTexture(color) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = color; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

async function init() {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) { /* weiter */ } }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0708, 10, 24);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xfff2ea, 1.6); key.position.set(2, 5, 9); scene.add(key);
  const red = new THREE.PointLight(0xff2a3a, 60, 26, 1.6); red.position.set(-7, 2.5, 4); scene.add(red);
  const cyan = new THREE.PointLight(0x4fd6dd, 40, 26, 1.6); cyan.position.set(7, -1.5, 3); scene.add(cyan);

  // Boden mit Spiegelschimmer
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x140e10, roughness: 0.35, metalness: 0.4 })
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.85;
  scene.add(floor);

  const carousel = new THREE.Group();
  scene.add(carousel);

  const loader = new THREE.TextureLoader();
  const geo = new THREE.BoxGeometry(1.9, 2.72, 0.42);
  const darkTex = plainTexture("#151113");
  const R = 6.1;
  const boxes = [];

  films.forEach((f, i) => {
    const poster = loader.load(`assets/posters/${f.id}.webp`);
    poster.colorSpace = THREE.SRGBColorSpace;
    poster.anisotropy = 8;
    const spine = spineTexture(f);
    const mFront = new THREE.MeshStandardMaterial({ map: poster, roughness: 0.38, metalness: 0.05 });
    const mSpine = new THREE.MeshStandardMaterial({ map: spine, roughness: 0.5 });
    const mDark = new THREE.MeshStandardMaterial({ map: darkTex, roughness: 0.6 });
    // Reihenfolge: +x, -x, +y, -y, +z (vorne), -z (hinten)
    const mesh = new THREE.Mesh(geo, [mDark, mSpine, mDark, mDark, mFront, mDark]);
    const a = (i / films.length) * Math.PI * 2;
    mesh.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    mesh.rotation.y = a;
    mesh.userData = { film: f, angle: a, phase: i * 0.7, hover: 0 };
    carousel.add(mesh);
    boxes.push(mesh);
  });

  // Größe
  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = camera.aspect < 0.9;
    // Breite Bildschirme: Regal rechts neben den Text schieben
    const shift = narrow ? 0 : Math.min(2.4, (camera.aspect - 1) * 2.2);
    camera.fov = narrow ? 50 : 36;
    // Handy: Regal in die obere Hälfte heben, damit der Text darunter Platz hat
    camera.position.set(-shift, narrow ? 1.4 : 0.9, narrow ? 16 : 13.2);
    camera.lookAt(-shift, narrow ? -4.6 : -0.2, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(hero);
  resize();

  // Drehen mit Maus/Finger
  let rot = 0, vel = 0, dragging = false, lastX = 0, moved = 0;
  const auto = reduceMotion ? 0 : 0.09;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    pointer.x = (e.offsetX / canvas.clientWidth) * 2 - 1;
    pointer.y = -(e.offsetY / canvas.clientHeight) * 2 + 1;
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    moved += Math.abs(dx);
    vel = dx * 0.0042;
    rot += vel;
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", (e) => {
    endDrag();
    if (moved < 6 && hovered) {
      const el = document.getElementById(hovered.userData.film.id);
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  });
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { pointer.x = 9; pointer.y = 9; });

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  let hovered = null;

  // Nur rendern, wenn sichtbar
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) loop(); });

  const clock = new THREE.Clock();
  let running = false;
  let lastFront = "";

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!dragging) {
      vel *= 0.94;
      rot += vel + auto * dt;
    }
    carousel.rotation.y = rot;

    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(boxes, false)[0];
    hovered = hit ? hit.object : null;
    canvas.style.cursor = dragging ? "grabbing" : hovered ? "pointer" : "grab";

    let best = null, bestZ = -Infinity;
    const wp = new THREE.Vector3();
    boxes.forEach((b) => {
      const u = b.userData;
      u.hover += ((b === hovered ? 1 : 0) - u.hover) * 0.15;
      b.position.y = (reduceMotion ? 0 : Math.sin(t * 0.9 + u.phase) * 0.09) + u.hover * 0.25;
      b.rotation.z = reduceMotion ? 0 : Math.sin(t * 0.6 + u.phase) * 0.02;
      const s = 1 + u.hover * 0.06;
      b.scale.set(s, s, s);
      b.getWorldPosition(wp);
      if (wp.z > bestZ) { bestZ = wp.z; best = b; }
    });
    if (best && frontLabel) {
      const f = best.userData.film;
      const label = `Vorne: ${f.title} (${f.year})`;
      if (label !== lastFront) { frontLabel.textContent = label; lastFront = label; }
    }
    red.position.x = -7 + Math.sin(t * 0.4) * 1.5;
    renderer.render(scene, camera);
  }

  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    const step = () => {
      if (!visible || document.hidden) { running = false; return; }
      frame();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  hero.classList.add("webgl-ready");
  loop();
}
