import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { Terrain } from '../world/Terrain';

type WolfState = 'wander' | 'stalk' | 'chase';

export class Predator {
  group: THREE.Group;
  body: CANNON.Body;
  private state: WolfState = 'wander';
  private wanderAngle: number;
  private wanderTimer = 0;
  private legPhase = 0;
  private legs: THREE.Mesh[] = [];
  private head: THREE.Mesh;
  private tail: THREE.Mesh;
  private jaw: THREE.Mesh;
  private speed = 0;

  constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem, x: number, y: number, z: number) {
    this.group = new THREE.Group();
    this.wanderAngle = Math.random() * Math.PI * 2;

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });

    // Body (low and lean)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.8), bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    this.group.add(body);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), bodyMat);
    this.head.position.set(0, 1.2, 1.2);
    this.group.add(this.head);

    // Snout/jaw
    this.jaw = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.5), darkMat);
    this.jaw.position.set(0, 1.0, 1.5);
    this.group.add(this.jaw);

    // Ears (pointy)
    const earGeo = new THREE.ConeGeometry(0.1, 0.3, 4);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-0.2, 1.6, 1.1);
    this.group.add(earL);

    const earR = new THREE.Mesh(earGeo, bodyMat);
    earR.position.set(0.2, 1.6, 1.1);
    this.group.add(earR);

    // Eyes (glowing)
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
    eyeL.position.set(-0.2, 1.3, 1.4);
    this.group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 4), eyeMat);
    eyeR.position.set(0.2, 1.3, 1.4);
    this.group.add(eyeR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const lpositions = [
      [-0.25, 0.4, 0.6],
      [0.25, 0.4, 0.6],
      [-0.25, 0.4, -0.6],
      [0.25, 0.4, -0.6],
    ];
    for (const [lx, ly, lz] of lpositions) {
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(lx, ly, lz);
      this.legs.push(leg);
      this.group.add(leg);
    }

    // Tail
    this.tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), bodyMat);
    this.tail.position.set(0, 1.1, -1.2);
    this.tail.rotation.x = 0.3;
    this.group.add(this.tail);

    this.group.position.set(x, y, z);
    scene.add(this.group);

    // Physics
    this.body = new CANNON.Body({
      mass: 50,
      position: new CANNON.Vec3(x, y + 1, z),
      shape: new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.6)),
      linearDamping: 0.4,
      angularDamping: 0.99,
      fixedRotation: true,
    });
    physicsSystem.world.addBody(this.body);
  }

  update(dt: number, playerPos: THREE.Vector3, terrain: Terrain): void {
    // Terrain following
    const terrainY = terrain.getHeightAt(this.body.position.x, this.body.position.z);
    if (this.body.position.y < terrainY + 0.3) {
      this.body.position.y = terrainY + 0.3;
      if (this.body.velocity.y < 0) this.body.velocity.y = 0;
    }

    const myPos = new THREE.Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
    const distToPlayer = myPos.distanceTo(playerPos);

    switch (this.state) {
      case 'wander':
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
          this.wanderAngle += (Math.random() - 0.5) * 1.5;
          this.wanderTimer = 2 + Math.random() * 4;
        }
        this.speed = 2;

        if (distToPlayer < 60) {
          this.state = 'stalk';
        }
        break;

      case 'stalk':
        // Slowly approach player
        {
          const dir = playerPos.clone().sub(myPos).normalize();
          this.wanderAngle = Math.atan2(dir.x, dir.z);
          this.speed = 4;

          if (distToPlayer < 20) {
            this.state = 'chase';
          } else if (distToPlayer > 80) {
            this.state = 'wander';
          }
        }
        break;

      case 'chase':
        // Run at player (but horse is faster)
        {
          const dir = playerPos.clone().sub(myPos).normalize();
          this.wanderAngle = Math.atan2(dir.x, dir.z);
          this.speed = 10; // Horse sprints at 26, so wolf can never catch a sprinting horse
        }

        if (distToPlayer > 50) {
          this.state = 'stalk';
        }
        break;
    }

    this.body.velocity.x = Math.sin(this.wanderAngle) * this.speed;
    this.body.velocity.z = Math.cos(this.wanderAngle) * this.speed;

    // Stay in bounds
    if (Math.abs(this.body.position.x) > 220 || Math.abs(this.body.position.z) > 220) {
      this.wanderAngle = Math.atan2(-this.body.position.x, -this.body.position.z);
    }

    // Animate
    this.legPhase += dt * this.speed * 1.2;
    const swing = this.speed * 0.08;
    this.legs[0].rotation.x = Math.sin(this.legPhase) * swing;
    this.legs[1].rotation.x = Math.sin(this.legPhase + Math.PI) * swing;
    this.legs[2].rotation.x = Math.sin(this.legPhase + Math.PI) * swing;
    this.legs[3].rotation.x = Math.sin(this.legPhase) * swing;

    this.head.position.y = 1.2 + Math.sin(this.legPhase * 0.5) * 0.05;
    this.tail.rotation.y = Math.sin(this.legPhase * 0.5) * 0.4;

    // Jaw snapping when chasing
    if (this.state === 'chase') {
      this.jaw.rotation.x = Math.sin(this.legPhase * 3) * 0.15;
    } else {
      this.jaw.rotation.x = 0;
    }

    // Sync mesh
    this.group.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
    this.group.rotation.y = this.wanderAngle;
  }
}
