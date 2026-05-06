import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { HorseStats } from '../horse/HorseStats';

export class GrazingSystem {
  private terrain: Terrain;
  private grazeTimer = 0;

  constructor(terrain: Terrain) {
    this.terrain = terrain;
  }

  update(dt: number, horsePos: THREE.Vector3, stats: HorseStats, speed: number): void {
    // Horse must be mostly still to graze/drink
    if (speed > 1) {
      this.grazeTimer = 0;
      return;
    }

    this.grazeTimer += dt;

    // Need to stand still for at least 1 second
    if (this.grazeTimer < 1) return;

    const x = horsePos.x;
    const z = horsePos.z;

    // Check for water
    if (this.terrain.isWater(x, z)) {
      stats.feedThirst(dt * 15);
    }

    // Check for grass
    if (this.terrain.isGrass(x, z)) {
      stats.feedHunger(dt * 10);
    }
  }
}
