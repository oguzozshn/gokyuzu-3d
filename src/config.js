/** Sahne olcekleri ve varsayilan degerler tek yerden. */

export const EYE_HEIGHT = 1.7;      // gozlemcinin goz yuksekligi (sahne birimi)
export const CELESTIAL_RADIUS = 1000; // Gunes / Ay / gezegenlerin yerlestigi yaricap
export const STAR_RADIUS = 1200;      // yildizlar biraz daha uzakta
export const CONSTELLATION_RADIUS = 1190;
export const GROUND_RADIUS = 4800;    // ufuk duzlemi (gok kubbesinden kucuk olmali)
export const SKY_RADIUS = 5000;       // gok kubbesi
export const CAMERA_FAR = 12000;

/** Izin verilmezse / hata olursa kullanilacak varsayilan konum: Istanbul. */
export const DEFAULT_LOCATION = {
  name: 'Istanbul',
  latitude: 41.0082,
  longitude: 28.9784,
  elevation: 40,
};

export const PRESET_LOCATIONS = [
  { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, elevation: 40 },
  { name: 'Ankara', latitude: 39.9334, longitude: 32.8597, elevation: 938 },
  { name: 'Izmir', latitude: 38.4237, longitude: 27.1428, elevation: 25 },
  { name: 'Erzurum', latitude: 39.9043, longitude: 41.2679, elevation: 1890 },
  { name: 'Antalya', latitude: 36.8969, longitude: 30.7133, elevation: 30 },
  { name: 'Londra', latitude: 51.5074, longitude: -0.1278, elevation: 11 },
  { name: 'New York', latitude: 40.7128, longitude: -74.006, elevation: 10 },
  { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, elevation: 40 },
  { name: 'Sidney', latitude: -33.8688, longitude: 151.2093, elevation: 58 },
  { name: 'Kuzey Kutbu', latitude: 90, longitude: 0, elevation: 0 },
];
