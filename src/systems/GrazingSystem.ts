import * as THREE from 'three';
import { Terrain } from '../world/Terrain';
import { HorseStats } from '../horse/HorseStats';
import { HorseAnimator } from '../horse/HorseAnimator';
import { AudioManager } from '../audio/AudioManager';

export class GrazingSystem {
  private terrain: Terrain;
  private grazeTimer = 0;
  private animator: HorseAnimator | null = null;
  private audio: AudioManager | null = null;
  private munchTimer = 0;

  constructor(terrain: Terrain) {
    this.terrain = terrain;
  }

  setAnimator(animator: HorseAnimator): void {
    this.animator = animator;
  }

  setAudio(audio: AudioManager): void {
    this.audio = audio;
  }

  update(dt: number, horsePos: THREE.Vector3, stats: HorseStats, speed: number): void {
    // Horse must be mostly still to graze/drink
    if (speed > 1) {
      this.grazeTimer = 0;
      if (this.animator) {
        this.animator.stopGraze();
      }
      return;
    }

    this.grazeTimer += dt;

    // Start grazing animation after 0.5 seconds
    if (this.grazeTimer >= 0.5 && this.animator && !this.animator.isGrazing) {
      this.animator.startGraze();
    }

    // Need to stand still for at least 1 second for actual feeding
    if (this.grazeTimer < 1) return;

    const x = horsePos.x;
    const z = horsePos.z;

    // Check for water
    if (this.terrain.isWater(x, z)) {
      stats.feedThirst(dt * 15);
      // Play drinking sounds less frequently
      if (this.audio && Math.random() < 0.02) {
        this.audio.playMunching(); // Reuse as drinking sound
      }
    }

    // Check for grass
    if (this.terrain.isGrass(x, z)) {
      stats.feedHunger(dt * 10);
      // Play munching sounds
      this.munchTimer += dt;
      if (this.munchTimer > 0.3 && this.audio) {
        this.audio.playMunching();
        this.munchTimer = 0;
      }
    }
  }
}
