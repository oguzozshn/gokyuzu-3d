import * as THREE from 'three';
import { SKY_RADIUS } from '../config.js';

/**
 * Gok kubbesi: Gunes'in yuksekligine gore gece <-> tan <-> gunduz
 * renklerini yumusak gecisle harmanlayan bir gradient + Gunes parlamasi.
 */
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec3 vDir;

  uniform vec3  uSunDir;   // birim vektor, sahne uzayinda
  uniform float uSunAlt;   // derece
  uniform float uMoonGlow; // 0..1, dolunayda gece gogunu hafif aydinlatir

  // Zenit ve ufuk renkleri (gunduz / tan / gece)
  const vec3 DAY_ZENITH   = vec3(0.129, 0.353, 0.702);
  const vec3 DAY_HORIZON  = vec3(0.639, 0.788, 0.933);
  const vec3 DUSK_ZENITH  = vec3(0.106, 0.145, 0.310);
  const vec3 DUSK_HORIZON = vec3(0.933, 0.427, 0.184);
  const vec3 NIGHT_ZENITH = vec3(0.008, 0.012, 0.035);
  const vec3 NIGHT_HORIZON= vec3(0.043, 0.071, 0.145);

  vec3 gradient(vec3 zenith, vec3 horizon, float h) {
    // h: -1 (nadir) .. 1 (zenit)
    float t = pow(clamp(1.0 - abs(h), 0.0, 1.0), 2.2);
    return mix(zenith, horizon, t);
  }

  void main() {
    float h = clamp(vDir.y, -1.0, 1.0);

    vec3 night = gradient(NIGHT_ZENITH, NIGHT_HORIZON, h);
    vec3 dusk  = gradient(DUSK_ZENITH,  DUSK_HORIZON,  h);
    vec3 day   = gradient(DAY_ZENITH,   DAY_HORIZON,   h);

    // Astronomik alacakaranliktan (-18) tan kizilligina, oradan tam gunduze.
    float twilight = smoothstep(-18.0, -1.0, uSunAlt);
    float daylight = smoothstep(-1.0, 9.0, uSunAlt);

    vec3 color = mix(night, dusk, twilight);
    color = mix(color, day, daylight);

    // Gunes cevresindeki parlama: ufka yakinken genis ve turuncu,
    // yuksekteyken dar ve beyaz.
    float sunDot = max(dot(normalize(vDir), uSunDir), 0.0);
    float lowSun = 1.0 - smoothstep(0.0, 25.0, uSunAlt);
    vec3  glowTint = mix(vec3(1.0, 0.98, 0.92), vec3(1.0, 0.52, 0.20), lowSun);
    float tight = pow(sunDot, 220.0) * 1.4;
    float broad = pow(sunDot, mix(24.0, 5.0, lowSun)) * mix(0.35, 0.85, lowSun);
    float glowVisible = smoothstep(-12.0, 2.0, uSunAlt);
    color += glowTint * (tight + broad) * glowVisible;

    // Dolunay gecelerinde gokyuzu tamamen siyah olmaz.
    color += vec3(0.030, 0.043, 0.078) * uMoonGlow * (1.0 - daylight);

    // Ufuk altina bakildiginda (zemin diskinin disinda kalan ince serit)
    // zemin tonuna karis.
    color = mix(color, color * 0.18, smoothstep(0.0, -0.05, h));

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function createSkydome() {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 64, 40);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uSunAlt: { value: 0 },
      uMoonGlow: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  mesh.name = 'skydome';

  return {
    mesh,
    /** @param {THREE.Vector3} sunDirection birim vektor @param {number} sunAltitude derece */
    update(sunDirection, sunAltitude, moonGlow = 0) {
      material.uniforms.uSunDir.value.copy(sunDirection).normalize();
      material.uniforms.uSunAlt.value = sunAltitude;
      material.uniforms.uMoonGlow.value = moonGlow;
    },
  };
}
