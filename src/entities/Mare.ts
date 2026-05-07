import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { Terrain } from '../world/Terrain';

export class Mare {
  group: THREE.Group;
  body: CANNON.Body;
  private wanderAngle: number;
  private wanderTimer = 0;
  private legPhase = 0;
  private legs: THREE.Mesh[] = [];
  private head: THREE.Mesh;
  private tail: THREE.Mesh;
  private speed = 0;
  private fleeTimer = 0;

  constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem, x: number, y: number, z: number) {
    this.group = new THREE.Group();
    this.wanderAngle = Math.random() * Math.PI * 2;

    // Lighter colored horse
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xc4956a });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });

    // Body (slightly smaller)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2.8), bodyMat);
    body.position.y = 2;
    body.castShadow = true;
    this.group.add(body);

    // Neck
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.7), bodyMat);
    neck.position.set(0, 3, 1.1);
    neck.rotation.x = -0.35;
    this.group.add(neck);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 1.1), bodyMat);
    this.head.position.set(0, 3.8, 1.8);
    this.group.add(this.head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 1.4, 0.3);
    const positions = [
      [-0.45, 0.7, 0.9],
      [0.45, 0.7, 0.9],
      [-0.45, 0.7, -0.9],
      [0.45, 0.7, -0.9],
    ];
    for (const [lx, ly, lz] of positions) {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(lx, ly, lz);
      this.legs.push(leg);
      this.group.add(leg);
    }

    // Tail
    this.tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), darkMat);
    this.tail.position.set(0, 2.3, -1.9);
    this.tail.rotation.x = 0.5;
    this.group.add(this.tail);

    this.group.position.set(x, y, z);
    scene.add(this.group);

    // Physics
    this.body = new CANNON.Body({
      mass: 350,
      position: new CANNON.Vec3(x, y + 1, z),
      shape: new CANNON.Box(new CANNON.Vec3(0.6, 0.6, 1)),
      linearDamping: 0.5,
      angularDamping: 0.99,
      fixedRotation: true,
    });
    physicsSystem.world.addBody(this.body);
  }

  update(dt: number, playerPos: THREE.Vector3, terrain: Terrain, predatorPositions: THREE.Vector3[] = []): void {
    // Terrain following
    const terrainY = terrain.getHeightAt(this.body.position.x, this.body.position.z);
    if (this.body.position.y < terrainY + 0.6) {
      this.body.position.y = terrainY + 0.6;
      if (this.body.velocity.y < 0) this.body.velocity.y = 0;
    }

    const myPos = new THREE.Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
    const distToPlayer = myPos.distanceTo(playerPos);

    this.fleeTimer -= dt;

    // Check for predators nearby
    for (const predPos of predatorPositions) {
      const distToPred = myPos.distanceTo(predPos);
      if (distToPred < 40 && this.fleeTimer <= 0) {
        // Flee from predator
        const awayDir = myPos.clone().sub(predPos).normalize();
        this.wanderAngle = Math.atan2(awayDir.x, awayDir.z);
        this.fleeTimer = 3; // Flee longer than from player
        break;
      }
    }

    if (distToPlayer < 8 && this.fleeTimer <= 0) {
      // Startled - move away from player briefly
      const awayDir = myPos.clone().sub(playerPos).normalize();
      this.wanderAngle = Math.atan2(awayDir.x, awayDir.z);
      this.fleeTimer = 2;
    }

    // Wander
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0 && this.fleeTimer <= 0) {
      this.wanderAngle += (Math.random() - 0.5) * 0.8;
      this.wanderTimer = 3 + Math.random() * 4;
    }

    this.speed = this.fleeTimer > 0 ? 6 : 2;
    this.body.velocity.x = Math.sin(this.wanderAngle) * this.speed;
    this.body.velocity.z = Math.cos(this.wanderAngle) * this.speed;

    // Stay in bounds
    if (Math.abs(this.body.position.x) > 220 || Math.abs(this.body.position.z) > 220) {
      this.wanderAngle = Math.atan2(-this.body.position.x, -this.body.position.z);
    }

    // Animate
    this.legPhase += dt * this.speed * 0.8;
    const swing = this.speed * 0.05;
    this.legs[0].rotation.x = Math.sin(this.legPhase) * swing;
    this.legs[1].rotation.x = Math.sin(this.legPhase + Math.PI) * swing;
    this.legs[2].rotation.x = Math.sin(this.legPhase + Math.PI) * swing;
    this.legs[3].rotation.x = Math.sin(this.legPhase) * swing;

    this.head.position.y = 3.8 + Math.sin(this.legPhase * 0.5) * 0.05;
    this.tail.rotation.y = Math.sin(this.legPhase * 0.5) * 0.2;

    // Sync mesh
    this.group.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
    this.group.rotation.y = this.wanderAngle;
  }
}
