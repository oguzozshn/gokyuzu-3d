import * as THREE from 'three';
import { DEG, RAD, normalizeAzimuth } from '../astro/coords.js';

/**
 * Gozlemci yerde duruyormus gibi "etrafa bakma" kontrolu.
 *
 * OrbitControls yerine bunu yazdim: OrbitControls kamerayi bir hedefin
 * *etrafinda* dondurur, bizim kamera ise gok kuresinin *merkezinde* duruyor
 * (yaricap ~0 => dejenere durum). Burada dogrudan kameranin yaw/pitch acisini
 * suruyoruz; yatay eksen serbest, dikey eksen istenen sinirlarla kisitli.
 */
export class LookControls {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.dom = domElement;

    this.minPitch = (options.minPitch ?? -10) * DEG;
    this.maxPitch = (options.maxPitch ?? 90) * DEG;
    this.minFov = options.minFov ?? 22;
    this.maxFov = options.maxFov ?? 95;
    this.damping = options.damping ?? 0.12;
    this.rotateSpeed = options.rotateSpeed ?? 0.0022;

    // Kamera varsayilan olarak -Z'ye (Kuzey) bakar. yaw pozitifken -Z, -X'e
    // (Bati) doner; bu yuzden azimut = -yaw.
    this.yaw = 0;
    this.pitch = 20 * DEG;
    this._targetYaw = this.yaw;
    this._targetPitch = this.pitch;
    this._targetFov = camera.fov;

    this._pointers = new Map();
    this._pinchDist = 0;
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.enabled = true;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onWheel = this._onWheel.bind(this);

    this.dom.addEventListener('pointerdown', this._onPointerDown);
    this.dom.addEventListener('pointermove', this._onPointerMove);
    this.dom.addEventListener('pointerup', this._onPointerUp);
    this.dom.addEventListener('pointercancel', this._onPointerUp);
    this.dom.addEventListener('pointerleave', this._onPointerUp);
    this.dom.addEventListener('wheel', this._onWheel, { passive: false });

    this.update(1);
  }

  /** Bakis yonunu azimut (derece) olarak ayarlar. */
  lookAtAzimuth(azimuthDeg, altitudeDeg = this.pitch * RAD) {
    this._targetYaw = -azimuthDeg * DEG;
    this._targetPitch = THREE.MathUtils.clamp(altitudeDeg * DEG, this.minPitch, this.maxPitch);
  }

  get azimuth() { return normalizeAzimuth(-this.yaw * RAD); }
  get altitude() { return this.pitch * RAD; }

  _onPointerDown(e) {
    if (!this.enabled) return;
    this.dom.setPointerCapture?.(e.pointerId);
    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this._pointers.size === 2) this._pinchDist = this._distance();
  }

  _onPointerMove(e) {
    if (!this.enabled) return;
    const prev = this._pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (this._pointers.size >= 2) {
      // Iki parmak: pinch ile yakinlastirma.
      const d = this._distance();
      if (this._pinchDist > 0) {
        this._targetFov = THREE.MathUtils.clamp(
          this._targetFov * (this._pinchDist / d), this.minFov, this.maxFov,
        );
      }
      this._pinchDist = d;
      return;
    }

    // "Gokyuzunu tut ve surukle" hissi: saga surukle => bati'ya bak.
    const speed = this.rotateSpeed * (this.camera.fov / 60);
    this._targetYaw += dx * speed;
    this._targetPitch = THREE.MathUtils.clamp(
      this._targetPitch + dy * speed, this.minPitch, this.maxPitch,
    );
  }

  _onPointerUp(e) {
    this._pointers.delete(e.pointerId);
    if (this._pointers.size < 2) this._pinchDist = 0;
    this.dom.releasePointerCapture?.(e.pointerId);
  }

  _onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.0012);
    this._targetFov = THREE.MathUtils.clamp(this._targetFov * factor, this.minFov, this.maxFov);
  }

  _distance() {
    const [a, b] = [...this._pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  update(dt = 1 / 60) {
    // Kare hizindan bagimsiz yumusatma.
    const k = 1 - Math.pow(this.damping, dt * 60);
    this.yaw += (this._targetYaw - this.yaw) * k;
    this.pitch += (this._targetPitch - this.pitch) * k;

    const fov = this.camera.fov + (this._targetFov - this.camera.fov) * k;
    if (Math.abs(fov - this.camera.fov) > 1e-4) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    this._euler.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._euler);
  }

  dispose() {
    this.dom.removeEventListener('pointerdown', this._onPointerDown);
    this.dom.removeEventListener('pointermove', this._onPointerMove);
    this.dom.removeEventListener('pointerup', this._onPointerUp);
    this.dom.removeEventListener('pointercancel', this._onPointerUp);
    this.dom.removeEventListener('pointerleave', this._onPointerUp);
    this.dom.removeEventListener('wheel', this._onWheel);
  }
}
