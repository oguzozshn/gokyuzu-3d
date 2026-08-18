/**
 * Ufuk koordinatlari (azimut/yukseklik) <-> sahne koordinatlari (x, y, z).
 *
 * Sahne yonelimi (Three.js, Y yukari):
 *   +Y  = zenit (yukari)
 *   -Z  = Kuzey    (azimut   0 derece)
 *   +X  = Dogu     (azimut  90 derece)
 *   +Z  = Guney    (azimut 180 derece)
 *   -X  = Bati     (azimut 270 derece)
 *
 * Azimut kuzeyden baslar ve doguya dogru artar (astronomik gelenek,
 * astronomy-engine'in Horizon() fonksiyonuyla ayni).
 */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

/**
 * @param {number} azimuthDeg  Kuzeyden doguya, derece.
 * @param {number} altitudeDeg Ufuktan yukari, derece (negatif = ufuk alti).
 * @param {number} radius      Gok kuresi yaricapi (sahne birimi).
 * @param {{x:number,y:number,z:number}} [out] Tekrar kullanilabilir hedef (THREE.Vector3 de olur).
 */
export function altAzToXYZ(azimuthDeg, altitudeDeg, radius, out = { x: 0, y: 0, z: 0 }) {
  const az = azimuthDeg * DEG;
  const alt = altitudeDeg * DEG;
  const cosAlt = Math.cos(alt);
  out.x = radius * cosAlt * Math.sin(az);
  out.y = radius * Math.sin(alt);
  out.z = -radius * cosAlt * Math.cos(az);
  return out;
}

/** Sahne yonunden azimut/yukseklik geri hesabi (birim vektor sart degil). */
export function xyzToAltAz(x, y, z) {
  const horiz = Math.hypot(x, z);
  const altitude = Math.atan2(y, horiz) * RAD;
  let azimuth = Math.atan2(x, -z) * RAD;
  if (azimuth < 0) azimuth += 360;
  return { azimuth, altitude };
}

/** Azimutu 0..360 araligina indirger. */
export function normalizeAzimuth(deg) {
  const a = deg % 360;
  return a < 0 ? a + 360 : a;
}

/** Azimut icin Turkce yon kisaltmasi (K, KKD, KD, ...). */
const COMPASS_TR = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
export function compassLabel(azimuthDeg) {
  const i = Math.round(normalizeAzimuth(azimuthDeg) / 22.5) % 16;
  return COMPASS_TR[i];
}
