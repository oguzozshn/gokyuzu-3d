import * as THREE from 'three';
import { GROUND_RADIUS } from '../config.js';
import { altAzToXYZ } from '../astro/coords.js';

/**
 * Ufuk duzlemi: gozlemcinin ustunde durdugu zemin diski + kutupsal yon izgarasi
 * + K/D/G/B yon etiketleri. Ufuk altindaki cisimleri de dogal olarak gizler.
 */

const vertexShader = /* glsl */ `
  varying vec2 vXZ;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vXZ = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vXZ;
  uniform float uSunAlt;
  uniform vec3  uHaze;

  const float PI = 3.14159265359;

  // Anti-aliased izgara cizgisi.
  float gridLine(float coord, float spacing, float widthPx) {
    float f = abs(fract(coord / spacing - 0.5) - 0.5) * spacing;
    float w = fwidth(coord) * widthPx;
    return 1.0 - smoothstep(0.0, max(w, 1e-6), f);
  }

  void main() {
    float r = length(vXZ);
    float azimuth = degrees(atan(vXZ.x, -vXZ.y)); // Kuzey = 0, Dogu = 90

    float daylight = smoothstep(-8.0, 6.0, uSunAlt);
    vec3 nightGround = vec3(0.024, 0.031, 0.051);
    vec3 dayGround   = vec3(0.180, 0.192, 0.184);
    vec3 base = mix(nightGround, dayGround, daylight);

    // Merkezden disa dogru hafif kararma.
    base *= mix(1.25, 0.75, smoothstep(0.0, 1200.0, r));

    // Kutupsal izgara: her 15 derecede ince, her 90 derecede kalin isin.
    float hub = smoothstep(60.0, 400.0, r);
    float spokes = gridLine(azimuth, 15.0, 1.2) * 0.35;
    float cardinal = gridLine(azimuth, 90.0, 2.0) * 0.9;
    float rings = gridLine(r, 250.0, 1.2) * 0.16 * (1.0 - smoothstep(1500.0, 3000.0, r));

    vec3 gridTint = mix(vec3(0.42, 0.60, 0.95), vec3(0.75, 0.82, 0.95), daylight);
    vec3 color = base + gridTint * (spokes + cardinal) * hub * 0.28 + gridTint * rings;

    // Ufka dogru atmosfer pusu ile karis, boylece zemin/gokyuzu birlesimi
    // sert bir cizgi olarak gorunmez.
    color = mix(color, uHaze, smoothstep(700.0, 4200.0, r) * 0.75);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

function makeLabelSprite(text, { color = '#cfe0ff', size = 128, bold = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${bold ? '700' : '500'} ${size * 0.52}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = size * 0.12;
  ctx.fillStyle = color;
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  return new THREE.Sprite(material);
}

const CARDINALS = [
  { label: 'K', azimuth: 0, major: true },
  { label: 'KD', azimuth: 45, major: false },
  { label: 'D', azimuth: 90, major: true },
  { label: 'GD', azimuth: 135, major: false },
  { label: 'G', azimuth: 180, major: true },
  { label: 'GB', azimuth: 225, major: false },
  { label: 'B', azimuth: 270, major: true },
  { label: 'KB', azimuth: 315, major: false },
];

export function createGround() {
  const group = new THREE.Group();
  group.name = 'ground';

  const geometry = new THREE.CircleGeometry(GROUND_RADIUS, 192);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSunAlt: { value: 0 },
      uHaze: { value: new THREE.Color(0x0a1020) },
    },
    vertexShader,
    fragmentShader,
  });

  const disk = new THREE.Mesh(geometry, material);
  disk.renderOrder = -500;
  group.add(disk);

  // Ufuk cizgisini vurgulayan ince halka.
  const ringGeom = new THREE.RingGeometry(GROUND_RADIUS * 0.986, GROUND_RADIUS * 0.994, 192);
  ringGeom.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x5f7fb5, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false,
  });
  group.add(new THREE.Mesh(ringGeom, ringMat));

  const labels = [];
  for (const { label, azimuth, major } of CARDINALS) {
    const sprite = makeLabelSprite(label, {
      color: major ? '#ffe9b8' : '#9fb6dc',
      size: major ? 128 : 96,
    });
    const scale = major ? 150 : 100;
    sprite.scale.set(scale, scale, 1);
    const p = altAzToXYZ(azimuth, 1.5, GROUND_RADIUS * 0.62);
    sprite.position.set(p.x, p.y, p.z);
    sprite.renderOrder = 900;
    group.add(sprite);
    labels.push(sprite);
  }

  return {
    group,
    labels,
    /** @param {number} sunAltitude derece @param {THREE.Color} hazeColor ufuk rengi */
    update(sunAltitude, hazeColor) {
      material.uniforms.uSunAlt.value = sunAltitude;
      if (hazeColor) material.uniforms.uHaze.value.copy(hazeColor);
      const daylight = THREE.MathUtils.clamp((sunAltitude + 8) / 14, 0, 1);
      ringMat.opacity = 0.18 + 0.25 * daylight;
      for (const sprite of labels) sprite.material.opacity = 0.55 + 0.45 * daylight;
    },
  };
}
