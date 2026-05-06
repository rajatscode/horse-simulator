import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { Terrain } from '../world/Terrain';

type AIState = 'wander' | 'alert' | 'charge' | 'ragdoll';

export class RivalStallion {
  group: THREE.Group;
  body: CANNON.Body;
  health = 80;
  state: AIState = 'wander';
  private wanderAngle: number;
  private wanderTimer = 0;
  private chargeDir = new THREE.Vector3();
  ragdollTimer = 0;
  private legPhase = 0;
  private legs: THREE.Mesh[] = [];
  private head: THREE.Mesh;
  private tail: THREE.Mesh;
  speed = 0;

  private detectionRange = 40;
  private chargeRange = 35;

  constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem, x: number, y: number, z: number) {
    this.group = new THREE.Group();
    this.wanderAngle = Math.random() * Math.PI * 2;

    // Build a slightly different colored horse
    const bodyMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0.3 + Math.random() * 0.3, 0.15, 0.05),
    });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 3.2), bodyMat);
    body.position.y = 2.2;
    body.castShadow = true;
    this.group.add(body);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.8), bodyMat);
    neck.position.set(0, 3.3, 1.3);
    neck.rotation.x = -0.4;
    this.group.add(neck);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), bodyMat);
    this.head.position.set(0, 4.2, 2);
    this.group.add(this.head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.35, 1.6, 0.35);
    const positions = [
      [-0.5, 0.8, 1.1],
      [0.5, 0.8, 1.1],
      [-0.5, 0.8, -1.1],
      [0.5, 0.8, -1.1],
    ];
    for (const [lx, ly, lz] of positions) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      this.legs.push(leg);
      this.group.add(leg);
    }

    // Tail
    this.tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), darkMat);
    this.tail.position.set(0, 2.6, -2.2);
    this.tail.rotation.x = 0.5;
    this.group.add(this.tail);

    this.group.position.set(x, y, z);
    scene.add(this.group);

    // Physics body
    this.body = new CANNON.Body({
      mass: 400,
      position: new CANNON.Vec3(x, y + 1, z),
      shape: new CANNON.Box(new CANNON.Vec3(0.7, 0.7, 1.2)),
      linearDamping: 0.5,
      angularDamping: 0.99,
      fixedRotation: true,
    });
    physicsSystem.world.addBody(this.body);
  }

  update(dt: number, playerPos: THREE.Vector3, terrain: Terrain): void {
    const myPos = new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    const distToPlayer = myPos.distanceTo(playerPos);

    // Terrain following
    const terrainY = terrain.getHeightAt(this.body.position.x, this.body.position.z);
    if (this.body.position.y < terrainY + 0.7) {
      this.body.position.y = terrainY + 0.7;
      if (this.body.velocity.y < 0) this.body.velocity.y = 0;
    }

    if (this.state === 'ragdoll') {
      this.ragdollTimer -= dt;
      if (this.ragdollTimer <= 0) {
        this.state = 'wander';
        this.body.fixedRotation = true;
        this.body.angularVelocity.set(0, 0, 0);
        this.body.quaternion.setFromEuler(0, 0, 0);
      }
      this.animateRagdoll(dt);
      this.syncMesh();
      return;
    }

    switch (this.state) {
      case 'wander':
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderAngle += (Math.random() - 0.5) * 1.5;
          this.wanderTimer = 2 + Math.random() * 3;
        }
        this.speed = 3;
        this.body.velocity.x = Math.sin(this.wanderAngle) * this.speed;
        this.body.velocity.z = Math.cos(this.wanderAngle) * this.speed;

        // Detect player
        if (distToPlayer < this.detectionRange) {
          this.state = 'alert';
        }

        // Stay in bounds
        if (Math.abs(this.body.position.x) > 220 || Math.abs(this.body.position.z) > 220) {
          this.wanderAngle = Math.atan2(-this.body.position.x, -this.body.position.z);
        }
        break;

      case 'alert':
        // Rear up and face player
        this.speed = 0;
        this.body.velocity.x *= 0.9;
        this.body.velocity.z *= 0.9;

        // Face player
        this.chargeDir.copy(playerPos).sub(myPos).normalize();
        this.wanderAngle = Math.atan2(this.chargeDir.x, this.chargeDir.z);

        if (distToPlayer < this.chargeRange) {
          this.state = 'charge';
        } else if (distToPlayer > this.detectionRange * 1.5) {
          this.state = 'wander';
        }
        break;

      case 'charge':
        this.chargeDir.copy(playerPos).sub(myPos).normalize();
        this.speed = 14;
        this.body.velocity.x = this.chargeDir.x * this.speed;
        this.body.velocity.z = this.chargeDir.z * this.speed;
        this.wanderAngle = Math.atan2(this.chargeDir.x, this.chargeDir.z);

        if (distToPlayer > this.detectionRange * 2) {
          this.state = 'wander';
        }
        break;
    }

    this.animate(dt);
    this.syncMesh();
  }

  private syncMesh(): void {
    this.group.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    if (this.state !== 'ragdoll') {
      this.group.rotation.y = this.wanderAngle;
    }
  }

  private animate(dt: number): void {
    this.legPhase += dt * this.speed * 0.8;
    const swing = Math.min(this.speed * 0.06, 0.5);

    this.legs[0].rotation.x = Math.sin(this.legPhase) * swing;
    this.legs[1].rotation.x = Math.sin(this.legPhase + Math.PI) * swing;
    this.legs[2].rotation.x = Math.sin(this.legPhase + Math.PI) * swing;
    this.legs[3].rotation.x = Math.sin(this.legPhase) * swing;

    // Head bob
    this.head.position.y = 4.2 + Math.sin(this.legPhase * 0.5) * 0.1;

    // Tail
    this.tail.rotation.y = Math.sin(this.legPhase * 0.5) * 0.3;

    // Rearing animation in alert state
    if (this.state === 'alert') {
      const rearBob = Math.sin(dt * 10) * 0.3;
      this.legs[0].rotation.x = -1 + rearBob;
      this.legs[1].rotation.x = -1 - rearBob;
    }
  }

  private animateRagdoll(dt: number): void {
    this.legPhase += dt * 15;
    for (let i = 0; i < this.legs.length; i++) {
      this.legs[i].rotation.x = Math.sin(this.legPhase + i * 1.5) * 1.5;
      this.legs[i].rotation.z = Math.sin(this.legPhase * 0.7 + i) * 0.8;
    }
    this.head.rotation.z = Math.sin(this.legPhase * 1.3) * 0.5;
    this.tail.rotation.y = Math.sin(this.legPhase * 2) * 1.0;
  }

  enterRagdoll(impactVelocity: THREE.Vector3): void {
    this.state = 'ragdoll';
    this.ragdollTimer = 3;
    this.body.fixedRotation = false;
    this.body.velocity.set(
      impactVelocity.x * 0.4,
      6 + Math.random() * 3,
      impactVelocity.z * 0.4
    );
    this.body.angularVelocity.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 6
    );
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
}
