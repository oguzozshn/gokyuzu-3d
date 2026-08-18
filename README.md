# Gökyüzü 3D — Güneş, Ay ve Yıldız Konum Görselleştiricisi

Seçilen **tarih, saat ve konuma** göre Güneş'in, Ay'ın, gezegenlerin ve parlak
yıldızların gökyüzündeki gerçek konumunu (azimut / yükseklik) hesaplayıp
interaktif bir 3D sahnede gösteren tarayıcı uygulaması.

## Kurulum

```bash
npm install
npm run dev
```

## Teknolojiler

- **Three.js** — WebGL tabanlı 3D sahne
- **Vite** — geliştirme ortamı ve build
- **astronomy-engine** — yüksek hassasiyetli efemeris ve koordinat dönüşümleri

## Veri kaynakları

- Yıldız kataloğu: [Yale Bright Star Catalog, 5. revizyon](http://tdc-www.harvard.edu/catalogs/bsc5.html) (kamu malı)
- Yıldız özel adları: [IAU Catalog of Star Names (IAU-CSN)](https://www.iau.org/science/scientific_bodies/working_groups/280/), IAU WGSN
- Takımyıldız çizgileri: [d3-celestial](https://github.com/ofrohn/d3-celestial) (BSD-3)

## Durum

Milestone'lar sırayla işleniyor; her aşama çalışır halde bırakılır.
