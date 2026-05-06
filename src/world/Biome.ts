import * as THREE from 'three';

export type BiomeType = 'prairie' | 'forest' | 'desert';

export class Biome {
  static createTree(scene: THREE.Scene, x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage (stacked cones)
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2a6a2a });

    const cone1 = new THREE.Mesh(
      new THREE.ConeGeometry(3, 4, 6),
      leafMat
    );
    cone1.position.y = 5.5;
    cone1.castShadow = true;
    group.add(cone1);

    const cone2 = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 3, 6),
      leafMat
    );
    cone2.position.y = 7.5;
    cone2.castShadow = true;
    group.add(cone2);

    const cone3 = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 2, 6),
      leafMat
    );
    cone3.position.y = 9;
    cone3.castShadow = true;
    group.add(cone3);

    group.position.set(x, y, z);
    scene.add(group);
    return group;
  }

  static createRock(scene: THREE.Scene, x: number, y: number, z: number): THREE.Mesh {
    const scale = 0.5 + Math.random() * 2;
    const geo = new THREE.DodecahedronGeometry(scale, 0);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0.4 + Math.random() * 0.1, 0.38 + Math.random() * 0.1, 0.35),
    });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, y + scale * 0.3, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    scene.add(rock);
    return rock;
  }

  static createCactus(scene: THREE.Scene, x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    const cactusMat = new THREE.MeshLambertMaterial({ color: 0x3a7a3a });

    // Main stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 3, 6),
      cactusMat
    );
    stem.position.y = 1.5;
    stem.castShadow = true;
    group.add(stem);

    // Arm left
    const armL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 1.5, 5),
      cactusMat
    );
    armL.position.set(-0.7, 2, 0);
    armL.rotation.z = Math.PI / 4;
    group.add(armL);

    // Arm right
    const armR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 1, 5),
      cactusMat
    );
    armR.position.set(0.6, 2.5, 0);
    armR.rotation.z = -Math.PI / 3;
    group.add(armR);

    group.position.set(x, y, z);
    scene.add(group);
    return group;
  }

  static createFence(scene: THREE.Scene, x: number, y: number, z: number, rotation: number): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3a });

    // Posts
    for (let i = 0; i < 3; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1.5, 0.2),
        woodMat
      );
      post.position.set(0, 0.75, i * 2.5 - 2.5);
      post.castShadow = true;
      group.add(post);
    }

    // Rails
    for (let r = 0; r < 2; r++) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 5),
        woodMat
      );
      rail.position.set(0, 0.5 + r * 0.6, 0);
      group.add(rail);
    }

    group.position.set(x, y, z);
    group.rotation.y = rotation;
    scene.add(group);
    return group;
  }

  static createBush(scene: THREE.Scene, x: number, y: number, z: number): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.5, 1);
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0.2 + Math.random() * 0.1, 0.5 + Math.random() * 0.1, 0.15),
    });
    const bush = new THREE.Mesh(geo, mat);
    bush.position.set(x, y + 0.5, z);
    bush.scale.y = 0.6;
    bush.castShadow = true;
    scene.add(bush);
    return bush;
  }
}
