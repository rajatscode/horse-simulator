import * as THREE from 'three';
import { PhysicsSystem } from '../systems/PhysicsSystem';

// Simple noise implementation (value noise with smoothing)
class SimpleNoise {
  private perm: number[];

  constructor(seed = 42) {
    this.perm = [];
    for (let i = 0; i < 256; i++) this.perm[i] = i;
    // Fisher-Yates shuffle with seed
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
    }
    // Double the table
    for (let i = 0; i < 256; i++) this.perm[256 + i] = this.perm[i];
  }

  private hash(x: number, y: number): number {
    return this.perm[(this.perm[x & 255] + y) & 511];
  }

  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }

  noise2D(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const sx = this.smoothstep(xf);
    const sy = this.smoothstep(yf);

    const n00 = this.hash(xi, yi) / 255;
    const n10 = this.hash(xi + 1, yi) / 255;
    const n01 = this.hash(xi, yi + 1) / 255;
    const n11 = this.hash(xi + 1, yi + 1) / 255;

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;

    return nx0 * (1 - sy) + nx1 * sy;
  }

  fbm(x: number, y: number, octaves: number, persistence: number, scale: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

export class Terrain {
  mesh: THREE.Mesh;
  private heightData: Float32Array;
  private size = 500;
  private segments = 128;
  private noise: SimpleNoise;
  private maxHeight = 30;

  constructor(scene: THREE.Scene, physicsSystem: PhysicsSystem) {
    this.noise = new SimpleNoise(123);
    this.heightData = new Float32Array((this.segments + 1) * (this.segments + 1));

    // Generate heightmap
    this.generateHeightData();

    // Create geometry
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    for (let i = 0; i < (this.segments + 1) * (this.segments + 1); i++) {
      const y = this.heightData[i];
      positions[i * 3 + 1] = y;

      // Color based on height and biome
      const wx = positions[i * 3];
      const wz = positions[i * 3 + 2];
      const color = this.getBiomeColor(wx, wz, y);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({
      vertexColors: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);
  }

  private generateHeightData(): void {
    const halfSize = this.size / 2;
    const step = this.size / this.segments;

    for (let iz = 0; iz <= this.segments; iz++) {
      for (let ix = 0; ix <= this.segments; ix++) {
        const wx = -halfSize + ix * step;
        const wz = -halfSize + iz * step;

        let height = 0;

        // Large-scale hills
        height += this.noise.fbm(wx, wz, 4, 0.5, 0.005) * this.maxHeight;

        // Medium detail
        height += this.noise.fbm(wx + 100, wz + 100, 3, 0.5, 0.02) * 5;

        // Small bumps
        height += this.noise.fbm(wx + 200, wz + 200, 2, 0.5, 0.08) * 1;

        // Flatten the center spawn area
        const distFromCenter = Math.sqrt(wx * wx + wz * wz);
        if (distFromCenter < 30) {
          const flattenFactor = 1 - Math.max(0, (30 - distFromCenter) / 30);
          height *= flattenFactor;
          height += (1 - flattenFactor) * 1;
        }

        // Edge falloff
        const edgeDist = Math.max(
          Math.abs(wx) / halfSize,
          Math.abs(wz) / halfSize
        );
        if (edgeDist > 0.8) {
          const falloff = (edgeDist - 0.8) / 0.2;
          height = height * (1 - falloff) + falloff * 2;
        }

        this.heightData[iz * (this.segments + 1) + ix] = height;
      }
    }
  }

  getHeightAt(x: number, z: number): number {
    const halfSize = this.size / 2;
    const step = this.size / this.segments;

    // Convert world coords to grid coords
    const gx = (x + halfSize) / step;
    const gz = (z + halfSize) / step;

    const ix = Math.floor(gx);
    const iz = Math.floor(gz);

    if (ix < 0 || ix >= this.segments || iz < 0 || iz >= this.segments) {
      return 0;
    }

    const fx = gx - ix;
    const fz = gz - iz;

    const w = this.segments + 1;
    const h00 = this.heightData[iz * w + ix];
    const h10 = this.heightData[iz * w + ix + 1];
    const h01 = this.heightData[(iz + 1) * w + ix];
    const h11 = this.heightData[(iz + 1) * w + ix + 1];

    // Bilinear interpolation
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fz) + h1 * fz;
  }

  getBiomeColor(x: number, z: number, height: number): THREE.Color {
    const biome = this.getBiome(x, z);

    if (biome === 'desert') {
      if (height > 20) return new THREE.Color(0.9, 0.85, 0.75);
      return new THREE.Color(0.85, 0.75, 0.5);
    } else if (biome === 'forest') {
      if (height > 20) return new THREE.Color(0.6, 0.6, 0.5);
      return new THREE.Color(0.15, 0.45, 0.12);
    } else {
      // Prairie
      if (height > 25) return new THREE.Color(0.95, 0.95, 0.98); // Snow
      if (height > 18) return new THREE.Color(0.55, 0.5, 0.4); // Rocky
      return new THREE.Color(0.3, 0.65, 0.2); // Grass
    }
  }

  getBiome(x: number, z: number): 'prairie' | 'forest' | 'desert' {
    // Use noise to determine biome zones
    const biomeVal = this.noise.fbm(x + 500, z + 500, 2, 0.5, 0.003);
    if (biomeVal < 0.35) return 'desert';
    if (biomeVal > 0.6) return 'forest';
    return 'prairie';
  }

  isWater(x: number, z: number): boolean {
    return this.getHeightAt(x, z) < 1.0;
  }

  isGrass(x: number, z: number): boolean {
    const biome = this.getBiome(x, z);
    return biome === 'prairie' || biome === 'forest';
  }
}
