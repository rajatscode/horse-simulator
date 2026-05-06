import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Terrain } from './Terrain';
import { Biome } from './Biome';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { HorsePhysics } from '../horse/HorsePhysics';
import { eventBus } from '../core/EventBus';

interface WorldObject {
  position: THREE.Vector3;
  radius: number;
  type: string;
}

export class World {
  private terrain: Terrain;
  private objects: WorldObject[] = [];
  waterPlane: THREE.Mesh;

  constructor(scene: THREE.Scene, terrain: Terrain, physicsSystem: PhysicsSystem) {
    this.terrain = terrain;

    // Water plane
    const waterGeo = new THREE.PlaneGeometry(500, 500);
    const waterMat = new THREE.MeshLambertMaterial({
      color: 0x2266aa,
      transparent: true,
      opacity: 0.6,
    });
    this.waterPlane = new THREE.Mesh(waterGeo, waterMat);
    this.waterPlane.rotation.x = -Math.PI / 2;
    this.waterPlane.position.y = 0.8;
    scene.add(this.waterPlane);

    // Populate the world
    this.populateWorld(scene);

    // Ambient light
    const ambient = new THREE.AmbientLight(0x445566, 0.6);
    scene.add(ambient);

    // Hemisphere light for nicer shading
    const hemi = new THREE.HemisphereLight(0x88bbff, 0x445522, 0.4);
    scene.add(hemi);
  }

  private populateWorld(scene: THREE.Scene): void {
    const rng = this.seededRandom(42);

    // Scatter objects based on biome
    for (let i = 0; i < 200; i++) {
      const x = (rng() - 0.5) * 460;
      const z = (rng() - 0.5) * 460;
      const y = this.terrain.getHeightAt(x, z);

      // Skip underwater
      if (y < 1.2) continue;

      // Skip spawn area
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;

      const biome = this.terrain.getBiome(x, z);

      if (biome === 'forest') {
        if (rng() < 0.7) {
          Biome.createTree(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 1.5, type: 'tree' });
        } else {
          Biome.createBush(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 0.8, type: 'bush' });
        }
      } else if (biome === 'desert') {
        if (rng() < 0.4) {
          Biome.createCactus(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 0.8, type: 'cactus' });
        } else if (rng() < 0.3) {
          Biome.createRock(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 1.2, type: 'rock' });
        }
      } else {
        // Prairie
        if (rng() < 0.2) {
          Biome.createTree(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 1.5, type: 'tree' });
        } else if (rng() < 0.15) {
          Biome.createFence(scene, x, y, z, rng() * Math.PI);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 2.5, type: 'fence' });
        } else if (rng() < 0.2) {
          Biome.createRock(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 1.2, type: 'rock' });
        } else if (rng() < 0.3) {
          Biome.createBush(scene, x, y, z);
          this.objects.push({ position: new THREE.Vector3(x, y, z), radius: 0.8, type: 'bush' });
        }
      }
    }
  }

  checkCollisions(horsePos: THREE.Vector3, horsePhysics: HorsePhysics, speed: number): void {
    if (horsePhysics.ragdollMode) return;

    for (const obj of this.objects) {
      const dist = horsePos.distanceTo(obj.position);
      if (dist < obj.radius + 1.5) {
        if (speed > 8) {
          // Crash!
          const impactDir = horsePos.clone().sub(obj.position).normalize();
          horsePhysics.enterRagdoll(
            new CANNON.Vec3(impactDir.x * speed, 5, impactDir.z * speed)
          );
        } else if (speed > 2) {
          // Bump - push back
          const pushDir = horsePos.clone().sub(obj.position).normalize();
          horsePhysics.body.velocity.x = pushDir.x * 3;
          horsePhysics.body.velocity.z = pushDir.z * 3;
        }
      }
    }
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }
}
