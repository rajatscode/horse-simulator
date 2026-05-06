import * as THREE from 'three';
import { HorsePhysics } from '../horse/HorsePhysics';

interface Particle {
  mesh: THREE.Mesh | THREE.Sprite;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private dustTimer = 0;
  private splashTimer = 0;
  private breathTimer = 0;

  // Reusable materials
  private dustMat: THREE.MeshBasicMaterial;
  private splashMat: THREE.MeshBasicMaterial;
  private starMat: THREE.MeshBasicMaterial;
  private sparkMat: THREE.MeshBasicMaterial;
  private breathMat: THREE.SpriteMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.dustMat = new THREE.MeshBasicMaterial({
      color: 0xaa9977,
      transparent: true,
      opacity: 0.5,
    });
    this.splashMat = new THREE.MeshBasicMaterial({
      color: 0x5599dd,
      transparent: true,
      opacity: 0.6,
    });
    this.starMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    this.sparkMat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.7,
    });
    this.breathMat = new THREE.SpriteMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.3,
    });
  }

  update(dt: number, horsePos: THREE.Vector3, speed: number, horsePhysics: HorsePhysics): void {
    // Spawn dust when galloping
    if (speed > 8 && !horsePhysics.ragdollMode) {
      this.dustTimer -= dt;
      if (this.dustTimer <= 0) {
        this.dustTimer = 0.05;
        this.spawnDust(horsePos);
      }
    }

    // Splash when in water
    const terrainH = horsePhysics.terrain.getHeightAt(horsePos.x, horsePos.z);
    if (terrainH < 1.0 && speed > 2) {
      this.splashTimer -= dt;
      if (this.splashTimer <= 0) {
        this.splashTimer = 0.1;
        this.spawnSplash(horsePos);
      }
    }

    // Impact stars on ragdoll
    if (horsePhysics.ragdollMode && horsePhysics.ragdollTimer > 2) {
      for (let i = 0; i < 3; i++) {
        this.spawnImpactStar(horsePos);
      }
    }

    // Breath vapor (subtle)
    this.breathTimer -= dt;
    if (this.breathTimer <= 0 && speed > 3) {
      this.breathTimer = 0.5;
      this.spawnBreath(horsePos);
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh instanceof THREE.Mesh) {
          p.mesh.geometry.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Move
      p.mesh.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.y -= 5 * dt; // gravity

      // Fade
      const alpha = p.life / p.maxLife;
      if (p.mesh instanceof THREE.Mesh) {
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.5;
      } else {
        (p.mesh.material as THREE.SpriteMaterial).opacity = alpha * 0.3;
      }

      // Scale up slightly
      const scale = 1 + (1 - alpha) * 0.5;
      p.mesh.scale.setScalar(scale);
    }

    // Limit particle count
    while (this.particles.length > 100) {
      const old = this.particles.shift()!;
      this.scene.remove(old.mesh);
      if (old.mesh instanceof THREE.Mesh) {
        old.mesh.geometry.dispose();
      }
    }
  }

  private spawnDust(pos: THREE.Vector3): void {
    const geo = new THREE.SphereGeometry(0.2, 4, 4);
    const mesh = new THREE.Mesh(geo, this.dustMat.clone());
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 2,
      pos.y + 0.2,
      pos.z + (Math.random() - 0.5) * 2
    );
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      ),
      life: 0.8,
      maxLife: 0.8,
    });
  }

  private spawnSplash(pos: THREE.Vector3): void {
    const geo = new THREE.SphereGeometry(0.15, 4, 4);
    const mesh = new THREE.Mesh(geo, this.splashMat.clone());
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 1.5,
      0.8,
      pos.z + (Math.random() - 0.5) * 1.5
    );
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        3 + Math.random() * 3,
        (Math.random() - 0.5) * 3
      ),
      life: 0.6,
      maxLife: 0.6,
    });
  }

  private spawnImpactStar(pos: THREE.Vector3): void {
    const geo = new THREE.OctahedronGeometry(0.2, 0);
    const mesh = new THREE.Mesh(geo, this.starMat.clone());
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 2,
      pos.y + 2 + Math.random() * 2,
      pos.z + (Math.random() - 0.5) * 2
    );
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 5
      ),
      life: 1,
      maxLife: 1,
    });
  }

  spawnGrazingSparkle(pos: THREE.Vector3): void {
    const geo = new THREE.SphereGeometry(0.1, 4, 4);
    const mesh = new THREE.Mesh(geo, this.sparkMat.clone());
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 1,
      pos.y + 1,
      pos.z + (Math.random() - 0.5) * 1
    );
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(0, 1.5, 0),
      life: 1,
      maxLife: 1,
    });
  }

  private spawnBreath(pos: THREE.Vector3): void {
    const sprite = new THREE.Sprite(this.breathMat.clone());
    sprite.position.set(
      pos.x,
      pos.y + 4.5,
      pos.z + 2
    );
    sprite.scale.setScalar(0.3);
    this.scene.add(sprite);
    this.particles.push({
      mesh: sprite,
      velocity: new THREE.Vector3(0, 0.5, 0.5),
      life: 0.8,
      maxLife: 0.8,
    });
  }
}
