import * as THREE from 'three';

export class DayNight {
  private scene: THREE.Scene;
  private sunLight: THREE.DirectionalLight;
  private timeOfDay = 0.25; // 0-1, starts at morning
  private cycleDuration = 300; // seconds for a full day cycle (5 minutes)

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Sun
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -80;
    this.sunLight.shadow.camera.right = 80;
    this.sunLight.shadow.camera.top = 80;
    this.sunLight.shadow.camera.bottom = -80;
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);
  }

  update(dt: number): void {
    this.timeOfDay = (this.timeOfDay + dt / this.cycleDuration) % 1;

    // Sun position (rotates around scene)
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunDist = 100;
    this.sunLight.position.set(
      Math.cos(angle) * sunDist,
      Math.sin(angle) * sunDist,
      50
    );
    this.sunLight.target.position.set(0, 0, 0);

    // Sun intensity based on height
    const sunHeight = Math.sin(angle);
    const intensity = Math.max(0, sunHeight) * 1.2;
    this.sunLight.intensity = intensity;

    // Sky/fog color based on time of day
    let skyColor: THREE.Color;
    if (sunHeight > 0.3) {
      // Day
      skyColor = new THREE.Color(0.5, 0.7, 0.9);
      this.sunLight.color.set(0xffffff);
    } else if (sunHeight > 0) {
      // Sunrise/sunset
      const t = sunHeight / 0.3;
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0.9, 0.4, 0.15),
        new THREE.Color(0.5, 0.7, 0.9),
        t
      );
      this.sunLight.color.lerpColors(
        new THREE.Color(0xff8844),
        new THREE.Color(0xffffff),
        t
      );
    } else {
      // Night
      const nightDepth = Math.min(1, -sunHeight * 2);
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0.2, 0.1, 0.15),
        new THREE.Color(0.05, 0.05, 0.15),
        nightDepth
      );
    }

    this.scene.background = skyColor;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(skyColor);
    }
  }
}
