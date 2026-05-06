import { Horse } from './Horse';

export class HorseAnimator {
  private horse: Horse;
  private legPhase = 0;
  private headBob = 0;
  private tailWag = 0;
  private maneWobble = 0;
  private rearProgress = 0;
  isRearing = false;
  private breathTimer = 0;

  // Ragdoll limb flail
  private ragdollPhase = 0;

  constructor(horse: Horse) {
    this.horse = horse;
  }

  triggerRear(): void {
    this.isRearing = true;
    this.rearProgress = 0;
  }

  update(dt: number, speed: number, ragdoll: boolean): void {
    if (ragdoll) {
      this.updateRagdoll(dt);
      return;
    }

    const h = this.horse;

    // Leg animation based on speed
    const legSpeed = speed * 0.8;
    this.legPhase += dt * legSpeed;

    const legSwing = Math.min(speed * 0.08, 0.7);

    // Walking gait: diagonal pairs move together
    h.legFL.position.y = 1.0 + Math.sin(this.legPhase) * legSwing * 0.5;
    h.legFL.rotation.x = Math.sin(this.legPhase) * legSwing;
    h.hoofFL.position.y = 0.1 + Math.max(0, Math.sin(this.legPhase) * legSwing * 0.6);
    h.hoofFL.position.z = 1.4 + Math.sin(this.legPhase) * legSwing * 0.5;

    h.legBR.position.y = 1.0 + Math.sin(this.legPhase) * legSwing * 0.5;
    h.legBR.rotation.x = Math.sin(this.legPhase) * legSwing;
    h.hoofBR.position.y = 0.1 + Math.max(0, Math.sin(this.legPhase) * legSwing * 0.6);
    h.hoofBR.position.z = -1.4 + Math.sin(this.legPhase) * legSwing * 0.5;

    h.legFR.position.y = 1.0 + Math.sin(this.legPhase + Math.PI) * legSwing * 0.5;
    h.legFR.rotation.x = Math.sin(this.legPhase + Math.PI) * legSwing;
    h.hoofFR.position.y = 0.1 + Math.max(0, Math.sin(this.legPhase + Math.PI) * legSwing * 0.6);
    h.hoofFR.position.z = 1.4 + Math.sin(this.legPhase + Math.PI) * legSwing * 0.5;

    h.legBL.position.y = 1.0 + Math.sin(this.legPhase + Math.PI) * legSwing * 0.5;
    h.legBL.rotation.x = Math.sin(this.legPhase + Math.PI) * legSwing;
    h.hoofBL.position.y = 0.1 + Math.max(0, Math.sin(this.legPhase + Math.PI) * legSwing * 0.6);
    h.hoofBL.position.z = -1.4 + Math.sin(this.legPhase + Math.PI) * legSwing * 0.5;

    // Head bob
    this.headBob += dt * legSpeed * 0.5;
    const headBobAmt = Math.min(speed * 0.01, 0.15);
    h.head.position.y = 4.8 + Math.sin(this.headBob * 2) * headBobAmt;
    h.snout.position.y = 4.5 + Math.sin(this.headBob * 2) * headBobAmt;
    h.neck.position.y = 3.8 + Math.sin(this.headBob * 2) * headBobAmt * 0.5;

    // Neck angle changes with speed
    const neckAngle = -0.4 - speed * 0.01;
    h.neck.rotation.x = neckAngle;

    // Body tilt when galloping
    h.body.rotation.x = Math.sin(this.legPhase * 0.5) * speed * 0.003;

    // Tail wagging
    this.tailWag += dt * (3 + speed * 0.5);
    h.tail.rotation.y = Math.sin(this.tailWag) * 0.3;
    h.tail.rotation.x = 0.5 + Math.sin(this.tailWag * 0.7) * 0.1;

    // Mane wobble
    this.maneWobble += dt * (2 + speed * 0.3);
    for (let i = 0; i < h.mane.length; i++) {
      const phase = this.maneWobble + i * 0.5;
      h.mane[i].rotation.z = Math.sin(phase) * 0.2 * (1 + speed * 0.02);
      h.mane[i].position.x = Math.sin(phase) * 0.1;
    }

    // Ear wiggle
    h.earL.rotation.z = Math.sin(this.tailWag * 0.3) * 0.15 - 0.1;
    h.earR.rotation.z = Math.sin(this.tailWag * 0.3 + 1) * 0.15 + 0.1;

    // Rearing animation
    if (this.isRearing) {
      this.rearProgress += dt * 2;
      if (this.rearProgress < 1) {
        // Rising up
        const t = this.rearProgress;
        const rearAngle = Math.sin(t * Math.PI * 0.5) * -0.6;
        h.body.rotation.x = rearAngle;
        h.legFL.rotation.x = -1.2 * t;
        h.legFR.rotation.x = -1.2 * t;
        h.hoofFL.position.y = 0.1 + t * 2;
        h.hoofFR.position.y = 0.1 + t * 2;
        h.neck.rotation.x = -0.4 - t * 0.5;
        h.head.position.y = 4.8 + t * 1;
        h.snout.position.y = 4.5 + t * 1;
      } else if (this.rearProgress < 1.8) {
        // Hold pose dramatically
        h.body.rotation.x = -0.6;
        h.legFL.rotation.x = -1.2;
        h.legFR.rotation.x = -1.2;
        h.hoofFL.position.y = 2.1;
        h.hoofFR.position.y = 2.1;
        // Front legs kick animation
        const kickPhase = (this.rearProgress - 1) * 8;
        h.legFL.rotation.x = -1.2 + Math.sin(kickPhase) * 0.3;
        h.legFR.rotation.x = -1.2 + Math.sin(kickPhase + Math.PI) * 0.3;
      } else {
        // Coming down
        this.isRearing = false;
        this.rearProgress = 0;
      }
    }

    // Breathing (subtle body scale)
    this.breathTimer += dt;
    const breath = 1 + Math.sin(this.breathTimer * 2) * 0.01;
    h.body.scale.y = breath;
  }

  private updateRagdoll(dt: number): void {
    this.ragdollPhase += dt * 12;
    const h = this.horse;

    // Flail all limbs wildly
    h.legFL.rotation.x = Math.sin(this.ragdollPhase) * 1.5;
    h.legFR.rotation.x = Math.sin(this.ragdollPhase + 1) * 1.5;
    h.legBL.rotation.x = Math.sin(this.ragdollPhase + 2) * 1.5;
    h.legBR.rotation.x = Math.sin(this.ragdollPhase + 3) * 1.5;

    h.legFL.rotation.z = Math.sin(this.ragdollPhase * 0.7) * 0.8;
    h.legFR.rotation.z = Math.sin(this.ragdollPhase * 0.7 + 1) * 0.8;
    h.legBL.rotation.z = Math.sin(this.ragdollPhase * 0.7 + 2) * 0.8;
    h.legBR.rotation.z = Math.sin(this.ragdollPhase * 0.7 + 3) * 0.8;

    // Head wobbles
    h.head.rotation.z = Math.sin(this.ragdollPhase * 1.3) * 0.5;
    h.head.rotation.x = Math.sin(this.ragdollPhase * 0.9) * 0.3;

    // Neck wobbles
    h.neck.rotation.z = Math.sin(this.ragdollPhase * 1.1) * 0.4;

    // Tail goes wild
    h.tail.rotation.y = Math.sin(this.ragdollPhase * 2) * 1.0;
    h.tail.rotation.z = Math.sin(this.ragdollPhase * 1.5) * 0.8;

    // Body tumble
    h.body.rotation.z = Math.sin(this.ragdollPhase * 0.5) * 0.3;
  }
}
