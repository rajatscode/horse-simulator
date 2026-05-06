import * as THREE from 'three';

export class Horse {
  group: THREE.Group;

  // Body parts for animation
  body: THREE.Mesh;
  neck: THREE.Mesh;
  head: THREE.Mesh;
  snout: THREE.Mesh;
  earL: THREE.Mesh;
  earR: THREE.Mesh;
  legFL: THREE.Mesh;
  legFR: THREE.Mesh;
  legBL: THREE.Mesh;
  legBR: THREE.Mesh;
  hoofFL: THREE.Mesh;
  hoofFR: THREE.Mesh;
  hoofBL: THREE.Mesh;
  hoofBR: THREE.Mesh;
  tail: THREE.Mesh;
  mane: THREE.Mesh[];
  eyeL: THREE.Mesh;
  eyeR: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x3a1a0a });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const maneMat = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });

    // Body (main torso)
    this.body = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 4),
      bodyMat
    );
    this.body.position.set(0, 2.5, 0);
    this.body.castShadow = true;
    this.group.add(this.body);

    // Neck
    this.neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2.2, 1),
      bodyMat
    );
    this.neck.position.set(0, 3.8, 1.6);
    this.neck.rotation.x = -0.4;
    this.neck.castShadow = true;
    this.group.add(this.neck);

    // Head
    this.head = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 1.5),
      bodyMat
    );
    this.head.position.set(0, 4.8, 2.5);
    this.head.castShadow = true;
    this.group.add(this.head);

    // Snout
    this.snout = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xa0785a })
    );
    this.snout.position.set(0, 4.5, 3.2);
    this.group.add(this.snout);

    // Ears
    this.earL = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.5, 4),
      bodyMat
    );
    this.earL.position.set(-0.3, 5.4, 2.3);
    this.group.add(this.earL);

    this.earR = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.5, 4),
      bodyMat
    );
    this.earR.position.set(0.3, 5.4, 2.3);
    this.group.add(this.earR);

    // Eyes
    this.eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      eyeMat
    );
    this.eyeL.position.set(-0.45, 4.95, 2.8);
    this.group.add(this.eyeL);

    this.eyeR = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      eyeMat
    );
    this.eyeR.position.set(0.45, 4.95, 2.8);
    this.group.add(this.eyeR);

    // Legs - upper
    const legGeo = new THREE.BoxGeometry(0.4, 1.8, 0.4);

    this.legFL = new THREE.Mesh(legGeo, bodyMat);
    this.legFL.position.set(-0.6, 1.0, 1.4);
    this.legFL.castShadow = true;
    this.group.add(this.legFL);

    this.legFR = new THREE.Mesh(legGeo, bodyMat);
    this.legFR.position.set(0.6, 1.0, 1.4);
    this.legFR.castShadow = true;
    this.group.add(this.legFR);

    this.legBL = new THREE.Mesh(legGeo, bodyMat);
    this.legBL.position.set(-0.6, 1.0, -1.4);
    this.legBL.castShadow = true;
    this.group.add(this.legBL);

    this.legBR = new THREE.Mesh(legGeo, bodyMat);
    this.legBR.position.set(0.6, 1.0, -1.4);
    this.legBR.castShadow = true;
    this.group.add(this.legBR);

    // Hooves
    const hoofGeo = new THREE.BoxGeometry(0.45, 0.3, 0.45);

    this.hoofFL = new THREE.Mesh(hoofGeo, hoofMat);
    this.hoofFL.position.set(-0.6, 0.1, 1.4);
    this.group.add(this.hoofFL);

    this.hoofFR = new THREE.Mesh(hoofGeo, hoofMat);
    this.hoofFR.position.set(0.6, 0.1, 1.4);
    this.group.add(this.hoofFR);

    this.hoofBL = new THREE.Mesh(hoofGeo, hoofMat);
    this.hoofBL.position.set(-0.6, 0.1, -1.4);
    this.group.add(this.hoofBL);

    this.hoofBR = new THREE.Mesh(hoofGeo, hoofMat);
    this.hoofBR.position.set(0.6, 0.1, -1.4);
    this.group.add(this.hoofBR);

    // Tail (multiple segments for wobble)
    this.tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 1.8),
      darkMat
    );
    this.tail.position.set(0, 3.0, -2.6);
    this.tail.rotation.x = 0.5;
    this.group.add(this.tail);

    // Mane (several strips along neck)
    this.mane = [];
    for (let i = 0; i < 5; i++) {
      const maneSegment = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.6, 0.3),
        maneMat
      );
      const t = i / 4;
      maneSegment.position.set(
        0,
        3.5 + t * 1.4,
        1.2 + t * 1.0
      );
      this.mane.push(maneSegment);
      this.group.add(maneSegment);
    }

    scene.add(this.group);
  }
}
