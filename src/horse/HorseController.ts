import { InputManager } from '../core/InputManager';
import { HorsePhysics } from './HorsePhysics';
import { HorseAnimator } from './HorseAnimator';
import { HorseStats } from './HorseStats';
import { AudioManager } from '../audio/AudioManager';

export class HorseController {
  private input: InputManager;
  private physics: HorsePhysics;
  private animator: HorseAnimator;
  private stats: HorseStats;
  private audio: AudioManager;

  facing = 0; // yaw angle
  speed = 0;

  private clipClopTimer = 0;
  private rearCooldown = 0;

  // Speed settings
  private readonly WALK_SPEED = 6;
  private readonly TROT_SPEED = 12;
  private readonly GALLOP_SPEED = 18;
  private readonly SPRINT_SPEED = 26;

  constructor(
    input: InputManager,
    physics: HorsePhysics,
    animator: HorseAnimator,
    stats: HorseStats,
    audio: AudioManager
  ) {
    this.input = input;
    this.physics = physics;
    this.animator = animator;
    this.stats = stats;
    this.audio = audio;
  }

  update(dt: number): void {
    if (this.physics.ragdollMode) {
      this.speed = 0;
      return;
    }

    this.rearCooldown -= dt;

    // Determine target speed
    let targetSpeed = 0;
    let moveX = 0;
    let moveZ = 0;

    if (this.input.forward) moveZ += 1;
    if (this.input.backward) moveZ -= 0.5;
    if (this.input.left) moveX += 1;
    if (this.input.right) moveX -= 1;

    // Turn with A/D
    if (moveX !== 0) {
      this.facing += moveX * dt * 2.5;
    }

    if (moveZ > 0) {
      if (this.input.sprint && this.stats.stamina > 5) {
        targetSpeed = this.SPRINT_SPEED;
      } else {
        // Ramp up: walk -> trot -> gallop based on how long held
        targetSpeed = this.GALLOP_SPEED;
      }
    } else if (moveZ < 0) {
      targetSpeed = -this.WALK_SPEED * 0.7;
    }

    // Age affects speed
    if (this.stats.ageLabel === 'Foal') {
      targetSpeed *= 0.6;
    } else if (this.stats.ageLabel === 'Yearling') {
      targetSpeed *= 0.85;
    } else if (this.stats.ageLabel === 'Elder') {
      targetSpeed *= 0.75;
    }

    // Low stamina slows you down
    if (this.stats.stamina < 20) {
      targetSpeed *= 0.5;
    }

    // Smooth speed transition
    this.speed += (targetSpeed - this.speed) * dt * 3;
    if (Math.abs(this.speed) < 0.1) this.speed = 0;

    // Apply movement
    const forwardX = Math.sin(this.facing) * this.speed;
    const forwardZ = Math.cos(this.facing) * this.speed;
    this.physics.applyMoveForce(forwardX, forwardZ);

    // Clip-clop sounds
    if (Math.abs(this.speed) > 2) {
      const clopInterval = Math.max(0.1, 0.4 - Math.abs(this.speed) * 0.012);
      this.clipClopTimer -= dt;
      if (this.clipClopTimer <= 0) {
        this.audio.playClipClop();
        this.clipClopTimer = clopInterval;
      }
    }

    // Rear/jump with space
    if (this.input.consumeKey('Space') && this.rearCooldown <= 0) {
      if (Math.abs(this.speed) < 3) {
        // Standing still: dramatic rear
        this.animator.triggerRear();
        this.audio.playNeigh();
        this.audio.playDramaticSting();
        this.rearCooldown = 2;
      } else {
        // Moving: jump
        this.physics.jump(10);
        this.audio.playNeigh();
        this.rearCooldown = 0.5;
      }
    }

    // Slope stumble - get terrain slope
    const px = this.physics.body.position.x;
    const pz = this.physics.body.position.z;
    const h0 = this.physics.terrain.getHeightAt(px, pz);
    const h1 = this.physics.terrain.getHeightAt(px + 1, pz);
    const h2 = this.physics.terrain.getHeightAt(px, pz + 1);
    const slopeX = Math.abs(h1 - h0);
    const slopeZ = Math.abs(h2 - h0);
    const slope = Math.max(slopeX, slopeZ);

    if (slope > 3 && Math.abs(this.speed) > 10) {
      // Stumble!
      this.physics.enterRagdoll(this.physics.body.velocity);
      this.audio.playImpactBonk();
    }
  }
}
