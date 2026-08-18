import * as THREE from 'three';
import { EYE_HEIGHT, CAMERA_FAR } from './config.js';
import { LookControls } from './scene/lookControls.js';
import { createSkydome } from './scene/skydome.js';
import { createGround } from './scene/ground.js';
import { altAzToXYZ, compassLabel } from './astro/coords.js';

const canvas = document.getElementById('scene');
const hud = document.getElementById('hud');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, CAMERA_FAR);
camera.position.set(0, EYE_HEIGHT, 0);

const controls = new LookControls(camera, canvas, { minPitch: -10, maxPitch: 90 });
controls.lookAtAzimuth(180, 25); // basta guneye bak

const skydome = createSkydome();
scene.add(skydome.mesh);

const ground = createGround();
scene.add(ground.group);

// M1: gercek efemeris henuz bagli degil; gokyuzu gradyanini gorebilmek icin
// Gunes'i saatte bir tur atacak sekilde dolastiriyoruz. M2'de gercek
// astronomy-engine hesabiyla degistirilecek.
const sunDirection = new THREE.Vector3();
function placeholderSun(elapsed) {
  const azimuth = (elapsed * 12) % 360;
  const altitude = 55 * Math.sin((elapsed * 12) * Math.PI / 180) - 5;
  const p = altAzToXYZ(azimuth, altitude, 1);
  sunDirection.set(p.x, p.y, p.z);
  return altitude;
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const hazeColor = new THREE.Color();
let lastFrame = performance.now();
const startedAt = lastFrame;

function animate(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  const elapsed = (now - startedAt) / 1000;

  const sunAltitude = placeholderSun(elapsed);
  controls.update(dt);

  hazeColor.setHSL(0.6, 0.35, THREE.MathUtils.clamp(0.02 + (sunAltitude + 10) / 90, 0.02, 0.5));
  skydome.update(sunDirection, sunAltitude);
  ground.update(sunAltitude, hazeColor);

  hud.textContent =
    `Bakis: ${controls.azimuth.toFixed(0)}° ${compassLabel(controls.azimuth)} · ` +
    `${controls.altitude.toFixed(0)}° · Sürükle: bak, tekerlek: yakınlaştır`;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
