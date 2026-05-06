import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { HorsePhysics } from '../horse/HorsePhysics';
import { HorseStats } from '../horse/HorseStats';
import { RivalStallion } from '../entities/RivalStallion';
import { AudioManager } from '../audio/AudioManager';
import { eventBus } from '../core/EventBus';

export class CombatSystem {
  private audio: AudioManager;
  private combatCooldown = 0;

  constructor(audio: AudioManager) {
    this.audio = audio;
  }

  checkCollision(
    horsePhysics: HorsePhysics,
    horseStats: HorseStats,
    rival: RivalStallion,
    horseSpeed: number
  ): void {
    this.combatCooldown -= 1 / 60;
    if (this.combatCooldown > 0) return;

    if (horsePhysics.ragdollMode || rival.state === 'ragdoll') return;

    const hx = horsePhysics.body.position.x;
    const hy = horsePhysics.body.position.y;
    const hz = horsePhysics.body.position.z;
    const rx = rival.body.position.x;
    const ry = rival.body.position.y;
    const rz = rival.body.position.z;

    const dist = Math.sqrt((hx - rx) ** 2 + (hy - ry) ** 2 + (hz - rz) ** 2);

    if (dist < 3.5) {
      const totalSpeed = horseSpeed + rival.speed;

      if (totalSpeed > 8) {
        // High-speed collision - both ragdoll!
        this.combatCooldown = 3;

        const impactDir = new THREE.Vector3(rx - hx, 0, rz - hz).normalize();

        // Determine winner by speed
        if (horseSpeed > rival.speed) {
          // Player wins
          rival.takeDamage(20);
          rival.enterRagdoll(impactDir.clone().multiplyScalar(horseSpeed));
          horsePhysics.enterRagdoll(
            new CANNON.Vec3(-impactDir.x * 5, 3, -impactDir.z * 5)
          );
          horseStats.takeDamage(5);
          eventBus.emit('fight-won');
        } else {
          // Rival wins
          horseStats.takeDamage(15);
          horsePhysics.enterRagdoll(
            new CANNON.Vec3(-impactDir.x * totalSpeed, 5, -impactDir.z * totalSpeed)
          );
          rival.takeDamage(5);
        }

        this.audio.playImpactBonk();
        this.audio.playNeigh();
      } else if (totalSpeed > 2) {
        // Low-speed bump
        this.combatCooldown = 1;
        const pushDir = new THREE.Vector3(hx - rx, 0, hz - rz).normalize();
        horsePhysics.body.velocity.x += pushDir.x * 5;
        horsePhysics.body.velocity.z += pushDir.z * 5;
        rival.body.velocity.x -= pushDir.x * 5;
        rival.body.velocity.z -= pushDir.z * 5;
      }
    }
  }
}
