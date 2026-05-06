import * as CANNON from 'cannon-es';

export class PhysicsSystem {
  world: CANNON.World;
  groundMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -20, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    (this.world.solver as CANNON.GSSolver).iterations = 5;

    this.groundMaterial = new CANNON.Material('ground');

    // Ground plane (backup for below-terrain)
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.groundMaterial,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.y = -5;
    this.world.addBody(groundBody);
  }

  update(dt: number): void {
    this.world.step(dt, dt, 3);
  }
}
