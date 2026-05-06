import * as CANNON from 'cannon-es';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { Terrain } from '../world/Terrain';
import { eventBus } from '../core/EventBus';

export class HorsePhysics {
  body: CANNON.Body;
  terrain: Terrain;
  ragdollMode = false;
  ragdollTimer = 0;
  private physicsSystem: PhysicsSystem;
  onGround = true;
  private groundRayResult = new CANNON.RaycastResult();

  constructor(physicsSystem: PhysicsSystem, terrain: Terrain) {
    this.physicsSystem = physicsSystem;
    this.terrain = terrain;

    // Horse physics body - a capsule-like shape using a box + spheres
    const shape = new CANNON.Box(new CANNON.Vec3(0.8, 0.8, 1.5));
    this.body = new CANNON.Body({
      mass: 450,
      position: new CANNON.Vec3(0, 5, 0),
      shape: shape,
      linearDamping: 0.4,
      angularDamping: 0.99,
      fixedRotation: true,
    });
    this.body.material = new CANNON.Material('horse');

    physicsSystem.world.addBody(this.body);

    // Contact material for horse-ground
    const groundContact = new CANNON.ContactMaterial(
      this.body.material!,
      physicsSystem.groundMaterial,
      {
        friction: 0.5,
        restitution: 0.1,
      }
    );
    physicsSystem.world.addContactMaterial(groundContact);
  }

  update(dt: number): void {
    // Ground check via simple height comparison
    const terrainY = this.terrain.getHeightAt(
      this.body.position.x,
      this.body.position.z
    );

    const feetY = this.body.position.y - 0.8;
    this.onGround = feetY <= terrainY + 0.3;

    // Keep horse above terrain
    if (this.body.position.y < terrainY + 0.8) {
      this.body.position.y = terrainY + 0.8;
      if (this.body.velocity.y < 0) {
        this.body.velocity.y = 0;
      }
    }

    // Ragdoll mode
    if (this.ragdollMode) {
      this.ragdollTimer -= dt;
      // In ragdoll, let physics do its thing but add some comedy spin
      if (this.ragdollTimer <= 0) {
        this.ragdollMode = false;
        this.body.fixedRotation = true;
        this.body.angularVelocity.set(0, 0, 0);
        // Restore upright
        this.body.quaternion.setFromEuler(0, 0, 0);
      }
    }

    // World bounds - keep horse in the terrain area
    const bound = 240;
    if (this.body.position.x > bound) { this.body.position.x = bound; this.body.velocity.x = 0; }
    if (this.body.position.x < -bound) { this.body.position.x = -bound; this.body.velocity.x = 0; }
    if (this.body.position.z > bound) { this.body.position.z = bound; this.body.velocity.z = 0; }
    if (this.body.position.z < -bound) { this.body.position.z = -bound; this.body.velocity.z = 0; }
  }

  enterRagdoll(impactVelocity: CANNON.Vec3): void {
    if (this.ragdollMode) return;
    this.ragdollMode = true;
    this.ragdollTimer = 2.5;
    this.body.fixedRotation = false;

    // Launch the horse dramatically
    this.body.velocity.set(
      impactVelocity.x * 0.5,
      8 + Math.random() * 4,
      impactVelocity.z * 0.5
    );
    this.body.angularVelocity.set(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 8
    );

    eventBus.emit('object-crashed');
  }

  applyMoveForce(forceX: number, forceZ: number): void {
    if (this.ragdollMode) return;
    this.body.velocity.x = forceX;
    this.body.velocity.z = forceZ;
  }

  jump(strength: number): void {
    if (this.ragdollMode || !this.onGround) return;
    this.body.velocity.y = strength;
  }

  getSpeed(): number {
    return Math.sqrt(
      this.body.velocity.x * this.body.velocity.x +
      this.body.velocity.z * this.body.velocity.z
    );
  }
}
