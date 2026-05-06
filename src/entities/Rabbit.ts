import * as THREE from 'three';

export class Rabbit {
  group: THREE.Group;
  private hopTimer = 0;
  private hopCooldown = 0;
  private velocity = new THREE.Vector3();
  private grounded = true;
  private fleeing = false;
  private fleeAngle = 0;

  constructor(scene: THREE.Scene, x: number, y: number, z: number) {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xeeddcc });

    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.4),
      bodyMat
    );
    body.position.y = 0.2;
    this.group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      bodyMat
    );
    head.position.set(0, 0.3, 0.25);
    this.group.add(head);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.05, 0.25, 0.05);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-0.07, 0.5, 0.25);
    this.group.add(earL);

    const earR = new THREE.Mesh(earGeo, bodyMat);
    earR.position.set(0.07, 0.5, 0.25);
    this.group.add(earR);

    // Tail (little puff)
    const tail = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 4, 4),
      whiteMat
    );
    tail.position.set(0, 0.2, -0.25);
    this.group.add(tail);

    this.group.position.set(x, y, z);
    scene.add(this.group);
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    const myPos = this.group.position;
    const dist = myPos.distanceTo(playerPos);

    if (dist < 10 && !this.fleeing) {
      this.fleeing = true;
      const away = myPos.clone().sub(playerPos).normalize();
      this.fleeAngle = Math.atan2(away.x, away.z);
    }

    if (this.fleeing) {
      this.hopCooldown -= dt;
      if (this.hopCooldown <= 0 && this.grounded) {
        // Hop!
        this.velocity.set(
          Math.sin(this.fleeAngle) * 4,
          3,
          Math.cos(this.fleeAngle) * 4
        );
        this.grounded = false;
        this.hopCooldown = 0.3;
        this.fleeAngle += (Math.random() - 0.5) * 0.5;
      }

      if (dist > 20) {
        this.fleeing = false;
      }
    } else {
      // Idle: occasional hop
      this.hopTimer += dt;
      if (this.hopTimer > 3 + Math.random() * 5) {
        this.hopTimer = 0;
        this.velocity.set(
          (Math.random() - 0.5) * 2,
          2,
          (Math.random() - 0.5) * 2
        );
        this.grounded = false;
      }
    }

    // Physics (simple)
    if (!this.grounded) {
      this.velocity.y -= 12 * dt;
      myPos.add(this.velocity.clone().multiplyScalar(dt));
      if (myPos.y <= 0) {
        myPos.y = 0;
        this.velocity.set(0, 0, 0);
        this.grounded = true;
      }
    }

    // Face direction of movement
    if (this.velocity.lengthSq() > 0.1) {
      this.group.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    }

    // Squash and stretch during hop
    if (!this.grounded) {
      const vy = this.velocity.y;
      if (vy > 0) {
        this.group.scale.set(0.9, 1.2, 0.9);
      } else {
        this.group.scale.set(1.1, 0.85, 1.1);
      }
    } else {
      this.group.scale.set(1, 1, 1);
    }
  }
}
