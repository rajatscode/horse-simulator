import * as THREE from 'three';

export class Weather {
  private particles: THREE.Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private particleCount = 500;
  private active = false;
  private type: 'rain' | 'snow' = 'rain';
  private timer = 0;
  private nextToggle = 60 + Math.random() * 120;
  private transitionAlpha = 0;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.visible = false;
    scene.add(this.particles);

    this.initParticles();
  }

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, true);
    }
  }

  private resetParticle(i: number, randomY: boolean): void {
    this.positions[i * 3] = (Math.random() - 0.5) * 80;
    this.positions[i * 3 + 1] = randomY ? Math.random() * 40 : 30 + Math.random() * 10;
    this.positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

    if (this.type === 'rain') {
      this.velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      this.velocities[i * 3 + 1] = -15 - Math.random() * 10;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    } else {
      this.velocities[i * 3] = (Math.random() - 0.5) * 2;
      this.velocities[i * 3 + 1] = -2 - Math.random() * 2;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    this.timer += dt;

    // Toggle weather
    if (this.timer > this.nextToggle) {
      this.timer = 0;
      this.nextToggle = 60 + Math.random() * 120;
      this.active = !this.active;
      if (this.active) {
        this.type = Math.random() > 0.5 ? 'rain' : 'snow';
        const mat = this.particles.material as THREE.PointsMaterial;
        if (this.type === 'rain') {
          mat.color.set(0xaaccff);
          mat.size = 0.3;
        } else {
          mat.color.set(0xffffff);
          mat.size = 0.5;
        }
        this.initParticles();
      }
    }

    // Transition
    if (this.active) {
      this.transitionAlpha = Math.min(1, this.transitionAlpha + dt * 0.5);
    } else {
      this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 0.5);
    }

    this.particles.visible = this.transitionAlpha > 0.01;
    (this.particles.material as THREE.PointsMaterial).opacity = this.transitionAlpha * 0.6;

    if (!this.particles.visible) return;

    // Center around player
    this.particles.position.set(playerPos.x, 0, playerPos.z);

    // Update particles
    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;

      // Wind sway for snow
      if (this.type === 'snow') {
        this.velocities[i * 3] += (Math.random() - 0.5) * dt * 3;
      }

      // Reset if below ground
      if (this.positions[i * 3 + 1] < -2) {
        this.resetParticle(i, false);
      }
    }

    (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
